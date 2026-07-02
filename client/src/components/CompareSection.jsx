import { useState } from 'react'
import { normalizeRepostData } from '../lib/reposts'

function numberWithCommas(value) {
  return value === undefined || value === null ? '0' : String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function stat(item, key) {
  return Number(item?.stats?.[key]) || 0
}

function topBy(items, key) {
  return [...items].sort((a, b) => stat(b, key) - stat(a, key))[0]
}

function peakYear(data) {
  const yearly = data?.timeStats?.yearly || []
  if (!yearly.length) return '-'
  const peak = yearly.reduce((best, item) => item.count > best.count ? item : best, yearly[0])
  return `${peak.year} (${numberWithCommas(peak.count)})`
}

function summarize(data) {
  const items = data?.items || []
  const topVideo = topBy(items, 'play_count')

  return {
    username: data?.username || '-',
    total: data?.count ?? items.length,
    loaded: items.length,
    pages: data?.pages || '-',
    topTag: data?.wordCloud?.[0]?.text || '-',
    topTagCount: data?.wordCloud?.[0]?.value || 0,
    topAuthor: data?.topAuthors?.[0]?.nickname || data?.topAuthors?.[0]?.unique_id || '-',
    topAuthorCount: data?.topAuthors?.[0]?.count || 0,
    peakYear: peakYear(data),
    topVideoPlays: stat(topVideo, 'play_count'),
    topVideoAuthor: topVideo?.author?.unique_id || '-',
  }
}

function CompareInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-white/35">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 text-sm text-white/80 outline-none placeholder:text-white/25 transition-colors duration-200 focus:border-accent/45"
      />
    </label>
  )
}

function CompareColumn({ summary }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="mb-4">
        <div className="text-lg font-bold text-white">@{summary.username}</div>
        <div className="text-xs text-white/30">{numberWithCommas(summary.loaded)} loaded items from {summary.pages} pages</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Candidates" value={numberWithCommas(summary.total)} />
        <Metric label="Peak year" value={summary.peakYear} />
        <Metric label="Top tag" value={summary.topTag} detail={`${numberWithCommas(summary.topTagCount)} mentions`} />
        <Metric label="Top creator" value={summary.topAuthor} detail={`${numberWithCommas(summary.topAuthorCount)} reposts`} />
        <Metric label="Top video" value={numberWithCommas(summary.topVideoPlays)} detail={`@${summary.topVideoAuthor}`} wide />
      </div>
    </div>
  )
}

function Metric({ label, value, detail, wide }) {
  return (
    <div className={`min-w-0 rounded-lg border border-white/[0.04] bg-black/18 p-3 ${wide ? 'col-span-2' : ''}`}>
      <div className="truncate text-sm font-semibold text-white/82">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/24">{label}</div>
      {detail && <div className="mt-1 truncate text-xs text-white/30">{detail}</div>}
    </div>
  )
}

export default function CompareSection() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchProfile = async (username) => {
    const clean = username.trim().replace(/^@/, '')
    const response = await fetch(`/api/reposts/${encodeURIComponent(clean)}`)
    const text = await response.text()
    const json = text ? JSON.parse(text) : {}

    if (!response.ok || json.success === false) {
      throw new Error(json.error || `Could not fetch @${clean}`)
    }

    return normalizeRepostData(json, clean)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!left.trim() || !right.trim()) {
      setError('Enter two usernames to compare.')
      return
    }

    setLoading(true)
    try {
      const [leftData, rightData] = await Promise.all([fetchProfile(left), fetchProfile(right)])
      setResults([summarize(leftData), summarize(rightData)])
    } catch (err) {
      setError(err.message || 'Compare failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="compare" className="relative px-4 py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-white/[0.08] bg-void-mid p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] md:p-7">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">Compare Profiles</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">
                Put two TikTok usernames side by side and compare returned repost candidates, top tags, creators, peak activity, and strongest video.
              </p>
            </div>
            <span className="w-max rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/35">
              Side by side
            </span>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
            <CompareInput label="First username" value={left} onChange={setLeft} placeholder="m4x1malist" />
            <CompareInput label="Second username" value={right} onChange={setRight} placeholder="another account" />
            <button
              type="submit"
              disabled={loading}
              className="mt-6 h-12 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-all duration-200 hover:bg-white/88 disabled:cursor-not-allowed disabled:opacity-50 lg:mt-7"
            >
              {loading ? 'Comparing...' : 'Compare'}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300/85">
              {error}
            </div>
          )}

          {results ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <CompareColumn summary={results[0]} />
              <CompareColumn summary={results[1]} />
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-white/[0.05] bg-black/18 px-4 py-5 text-sm leading-6 text-white/32">
              Compare uses the same API data as the dashboard, so the numbers stay consistent with the repost history view.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
