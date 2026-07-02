import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import heicConvert from 'heic-convert'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

const CACHE_TTL = 60 * 60 * 1000
const CACHE_FILE = path.join(__dirname, '.api-cache.json')
const THUMBNAIL_CACHE_TTL = 6 * 60 * 60 * 1000
const THUMBNAIL_CACHE_MAX = 200

let cache = new Map()
let thumbnailCache = new Map()
try {
  const raw = fs.readFileSync(CACHE_FILE, 'utf-8')
  const parsed = JSON.parse(raw)
  Object.entries(parsed).forEach(([k, v]) => cache.set(k, v))
  console.log(`Loaded ${cache.size} cached entries`)
} catch { }

function persistCache() {
  try {
    const obj = Object.fromEntries(cache.entries())
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), 'utf-8')
  } catch { }
}

app.use(cors())

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))

app.get('/api/thumbnail', async (req, res) => {
  const source = String(req.query.url || '')
  if (!source) {
    return res.status(400).json({ error: 'Missing thumbnail URL' })
  }

  let parsed
  try {
    parsed = new URL(source)
  } catch {
    return res.status(400).json({ error: 'Invalid thumbnail URL' })
  }

  const allowedHost = parsed.hostname.includes('tiktokcdn') || parsed.hostname.includes('byteimg')
  if (!['http:', 'https:'].includes(parsed.protocol) || !allowedHost) {
    return res.status(400).json({ error: 'Unsupported thumbnail URL' })
  }

  const cached = thumbnailCache.get(source)
  if (cached && Date.now() - cached.timestamp < THUMBNAIL_CACHE_TTL) {
    res.set('Content-Type', cached.contentType)
    res.set('Cache-Control', 'public, max-age=86400')
    return res.send(cached.buffer)
  }

  try {
    const response = await fetch(source, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NyxRepost/2.0)',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Thumbnail fetch failed: ${response.status}` })
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

    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(buffer)
  } catch (err) {
    console.error('Thumbnail proxy error:', err.message)
    res.status(502).json({ error: `Failed to load thumbnail: ${err.message}` })
  }
})

app.get('/api/reposts/:username', async (req, res) => {
  const { username } = req.params
  const clean = username.replace(/^@/, '').toLowerCase()
  const cached = cache.get(clean)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for @${clean}`)
    return res.json({ ...cached.data, cached: true, fromCache: true })
  }

  const api = `https://api.tiktokrepostremover.com/insights/reposts/count?username=${encodeURIComponent(clean)}&all=1`

  try {
    const response = await fetch(api, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NyxRepost/2.0)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream API error: ${response.status} ${response.statusText}`,
      })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('json')) {
      const text = await response.text()
      return res.status(502).json({
        error: 'Upstream returned non-JSON response. The API may have changed or rate limit is exhausted.',
        raw: text.slice(0, 500),
      })
    }

    const data = await response.json()
    cache.set(clean, { data, timestamp: Date.now() })
    persistCache()
    res.json(data)
  } catch (err) {
    console.error('Proxy error:', err.message)
    res.status(502).json({ error: `Failed to fetch repost data: ${err.message}` })
  }
})

app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, '..', 'client', 'dist', 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
      return
    }
  }
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`NyxRepost server running on http://localhost:${PORT}`)
})
