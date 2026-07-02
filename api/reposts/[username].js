const CACHE_TTL = 60 * 60 * 1000

const repostCache = globalThis.__nyxRepostCache || new Map()
globalThis.__nyxRepostCache = repostCache

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  res.end(JSON.stringify(body))
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const username = String(req.query.username || '')
  const clean = username.replace(/^@/, '').toLowerCase().trim()

  if (!clean) {
    return sendJson(res, 400, { error: 'Missing username' })
  }

  const cached = repostCache.get(clean)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return sendJson(res, 200, { ...cached.data, cached: true, fromCache: true })
  }

  const api = `https://api.tiktokrepostremover.com/insights/reposts/count?username=${encodeURIComponent(clean)}&all=1`

  try {
    const response = await fetch(api, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NyxRepost/2.0)',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return sendJson(res, response.status, {
        error: `Upstream API error: ${response.status} ${response.statusText}`,
      })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('json')) {
      const text = await response.text()
      return sendJson(res, 502, {
        error: 'Upstream returned non-JSON response. The API may have changed or rate limit is exhausted.',
        raw: text.slice(0, 500),
      })
    }

    const data = await response.json()
    repostCache.set(clean, { data, timestamp: Date.now() })
    return sendJson(res, 200, data)
  } catch (err) {
    return sendJson(res, 502, { error: `Failed to fetch repost data: ${err.message}` })
  }
}
