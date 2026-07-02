const heicConvert = require('heic-convert')

const THUMBNAIL_CACHE_TTL = 6 * 60 * 60 * 1000
const THUMBNAIL_CACHE_MAX = 200

const thumbnailCache = globalThis.__nyxThumbnailCache || new Map()
globalThis.__nyxThumbnailCache = thumbnailCache

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const source = String(req.query.url || '')
  if (!source) {
    return sendJson(res, 400, { error: 'Missing thumbnail URL' })
  }

  let parsed
  try {
    parsed = new URL(source)
  } catch {
    return sendJson(res, 400, { error: 'Invalid thumbnail URL' })
  }

  const allowedHost = parsed.hostname.includes('tiktokcdn') || parsed.hostname.includes('byteimg')
  if (!['http:', 'https:'].includes(parsed.protocol) || !allowedHost) {
    return sendJson(res, 400, { error: 'Unsupported thumbnail URL' })
  }

  const cached = thumbnailCache.get(source)
  if (cached && Date.now() - cached.timestamp < THUMBNAIL_CACHE_TTL) {
    res.statusCode = 200
    res.setHeader('Content-Type', cached.contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
    return res.end(cached.buffer)
  }

  try {
    const response = await fetch(source, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NyxRepost/2.0)',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return sendJson(res, response.status, { error: `Thumbnail fetch failed: ${response.status}` })
    }

    const input = Buffer.from(await response.arrayBuffer())
    const upstreamType = response.headers.get('content-type') || ''
    const isHeic = upstreamType.includes('heic') || /\.heic(?:\?|$)/i.test(source)
    const buffer = isHeic
      ? Buffer.from(await heicConvert({ buffer: input, format: 'JPEG', quality: 0.82 }))
      : input
    const contentType = isHeic ? 'image/jpeg' : (upstreamType || 'image/jpeg')

    if (thumbnailCache.size >= THUMBNAIL_CACHE_MAX) {
      thumbnailCache.delete(thumbnailCache.keys().next().value)
    }
    thumbnailCache.set(source, { buffer, contentType, timestamp: Date.now() })

    res.statusCode = 200
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
    return res.end(buffer)
  } catch (err) {
    return sendJson(res, 502, { error: `Failed to load thumbnail: ${err.message}` })
  }
}
