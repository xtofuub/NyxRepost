import { useEffect, useRef, useState } from 'react'

function numberWithCommas(x) {
  return x === undefined || x === null ? '0' : String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(ts) {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(ms) {
  if (!ms) return '-'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

function monthLabel(item) {
  const date = new Date(item.year, item.month - 1)
  return date.toLocaleDateString('en-US', { month: 'short' })
}

function fullMonthLabel(item) {
  const date = new Date(item.year, item.month - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function percent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'views', label: 'Most viewed' },
  { value: 'likes', label: 'Most liked' },
  { value: 'shares', label: 'Most shared' },
  { value: 'comments', label: 'Most commented' },
  { value: 'duration', label: 'Longest' },
]

const mediaFilters = [
  { value: 'all', label: 'All' },
  { value: 'video', label: 'Videos' },
  { value: 'photo', label: 'Photos' },
]

const dateFilters = [
  { value: 'all', label: 'All dates' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'year', label: 'This year' },
]

const engagementFilters = [
  { value: 'all', label: 'Any stats' },
  { value: 'likes', label: '10k+ likes' },
  { value: 'shares', label: '1k+ shares' },
]

function stat(item, key) {
  return Number(item?.stats?.[key]) || 0
}

function getTags(item) {
  const matches = String(item?.desc || '').match(/#[\p{L}\p{N}_]+/gu) || []
  return Array.from(new Set(matches))
}

function isPhoto(item) {
  return !item?.duration || String(item?.share_url || '').includes('/photo/')
}

function tiktokPlayerUrl(item) {
  if (!item?.id) return ''
  return `https://www.tiktok.com/player/v1/${item.id}?controls=1&description=1&music_info=1`
}

function thumbnailUrl(cover) {
  return cover ? `/api/thumbnail?url=${encodeURIComponent(cover)}` : ''
}

function itemKey(item, index = 0) {
  return String(item?.id || item?.share_url || `${item?.author?.unique_id || 'item'}-${item?.create_time || index}`)
}

function sameItem(a, b) {
  return itemKey(a) === itemKey(b)
}

function itemBlob(item) {
  return [
    item?.desc,
    item?.author?.nickname,
    item?.author?.unique_id,
    item?.id,
    getTags(item).join(' '),
  ].join(' ').toLowerCase()
}

function itemMatchesDate(item, filter) {
  if (filter === 'all' || !item?.create_time) return true

  const created = item.create_time * 1000
  const now = Date.now()

  if (filter === '30d') return now - created <= 30 * 24 * 60 * 60 * 1000
  if (filter === '90d') return now - created <= 90 * 24 * 60 * 60 * 1000
  if (filter === 'year') return new Date(created).getFullYear() === new Date().getFullYear()

  return true
}

function itemMatchesEngagement(item, filter) {
  if (filter === 'likes') return stat(item, 'digg_count') >= 10000
  if (filter === 'shares') return stat(item, 'share_count') >= 1000
  return true
}

function filterItems(items, filters) {
  const query = filters.query.trim().toLowerCase()
  const tag = filters.tag.toLowerCase()
  const author = filters.author.toLowerCase()

  return items.filter((item) => {
    if (query && !itemBlob(item).includes(query)) return false
    if (tag && !getTags(item).some(t => t.toLowerCase() === tag)) return false
    if (author && String(item?.author?.unique_id || '').toLowerCase() !== author) return false
    if (filters.media === 'video' && isPhoto(item)) return false
    if (filters.media === 'photo' && !isPhoto(item)) return false
    if (!itemMatchesDate(item, filters.date)) return false
    if (!itemMatchesEngagement(item, filters.engagement)) return false
    return true
  })
}

function sortItems(items, sortBy) {
  const sorted = [...items]
  const byNumber = (getter) => sorted.sort((a, b) => getter(b) - getter(a))

  if (sortBy === 'oldest') return sorted.sort((a, b) => (a.create_time || 0) - (b.create_time || 0))
  if (sortBy === 'views') return byNumber(item => stat(item, 'play_count'))
  if (sortBy === 'likes') return byNumber(item => stat(item, 'digg_count'))
  if (sortBy === 'shares') return byNumber(item => stat(item, 'share_count'))
  if (sortBy === 'comments') return byNumber(item => stat(item, 'comment_count'))
  if (sortBy === 'duration') return byNumber(item => Number(item?.duration) || 0)

  return sorted.sort((a, b) => (b.create_time || 0) - (a.create_time || 0))
}

function topVideos(items) {
  const categories = [
    { key: 'play_count', label: 'Most viewed', metric: 'plays' },
    { key: 'digg_count', label: 'Most liked', metric: 'likes' },
    { key: 'share_count', label: 'Most shared', metric: 'shares' },
    { key: 'comment_count', label: 'Most discussed', metric: 'comments' },
  ]

  return categories.map(category => ({
    ...category,
    item: sortItems(items, category.metric === 'plays' ? 'views' : category.metric)[0],
  })).filter(entry => entry.item)
}

function MiniStat({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] px-3 py-2.5">
      <div className="text-sm font-semibold text-white/85">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/25">{label}</div>
      {detail && <div className="mt-1 text-xs text-white/28">{detail}</div>}
    </div>
  )
}

function WordCloud({ words, activeTag, onSelectTag }) {
  if (!words?.length) return <p className="text-white/20 text-sm">No word data available</p>

  const vals = words.map(w => w.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = Math.max(1, max - min)

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <MiniStat label="Top tag" value={words[0]?.text || '-'} detail={`${words[0]?.value || 0} mentions`} />
        <MiniStat label="Terms" value={words.length} detail="detected" />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
      {words.slice(0, 25).map((w) => {
        const norm = (w.value - min) / range
        const size = Math.round(11 + norm * 9)

        return (
          <button
            type="button"
            key={w.text}
            onClick={() => onSelectTag?.(w.text)}
            className={`inline-flex items-baseline gap-2 px-3 py-1.5 rounded-lg text-left text-white bg-[#0a0a0a] border transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60 ${
              activeTag === w.text ? 'border-accent/45 bg-accent/10' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
            }`}
            style={{ fontSize: `${size}px` }}
            title={`${w.value} mentions`}
          >
            <span>{w.text}</span>
            <span className="text-[10px] text-white/25">{w.value}</span>
          </button>
        )
      })}
      </div>
    </div>
  )
}

function YearChart({ yearly }) {
  if (!yearly?.length) return <p className="text-white/20 text-sm">No yearly data</p>

  const sorted = [...yearly].sort((a, b) => a.year - b.year)
  const total = sorted.reduce((sum, item) => sum + item.count, 0)
  const max = Math.max(...sorted.map(item => item.count), 1)
  const peak = sorted.reduce((best, item) => item.count > best.count ? item : best, sorted[0])
  const latest = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]
  const change = previous ? latest.count - previous.count : 0

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 mb-5 sm:grid-cols-3">
        <MiniStat label="Peak" value={peak.year} detail={`${numberWithCommas(peak.count)} reposts`} />
        <MiniStat label="Latest" value={latest.year} detail={`${numberWithCommas(latest.count)} reposts`} />
        <MiniStat label="Change" value={previous ? `${change >= 0 ? '+' : ''}${numberWithCommas(change)}` : '-'} detail={previous ? `vs ${previous.year}` : 'first year'} />
      </div>

      <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
        <div className="space-y-3">
          {sorted.map((item) => {
            const width = Math.max(3, (item.count / max) * 100)
            const share = percent(item.count, total)
            const isPeak = item.year === peak.year

            return (
              <div key={item.year} className="rounded-lg border border-white/[0.04] bg-white/[0.018] p-3">
                <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white/80">{item.year}</div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/24">{share}%</div>
                  </div>
                  <div className="min-w-0">
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className={`h-full rounded-full ${isPeak ? 'bg-accent/60' : 'bg-white/18'}`}
                        style={{ width: `${width}%` }}
                        title={`${item.year}: ${item.count} reposts`}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${isPeak ? 'text-white' : 'text-white/70'}`}>
                      {numberWithCommas(item.count)}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/24">reposts</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-white/30">Each row shows the year&apos;s count and share of sampled reposts.</p>
      </div>
    </div>
  )
}

function MonthChart({ monthly }) {
  if (!monthly?.length) return <p className="text-white/20 text-sm">No monthly data</p>

  const sorted = [...monthly].sort((a, b) => a.year - b.year || a.month - b.month)
  const recent = sorted.slice(-12)
  const total = recent.reduce((sum, item) => sum + item.count, 0)
  const max = Math.max(...recent.map(item => item.count), 1)
  const peak = recent.reduce((best, item) => item.count > best.count ? item : best, recent[0])
  const latest = recent[recent.length - 1]
  const previous = recent[recent.length - 2]
  const average = Math.round(total / recent.length)
  const change = previous ? latest.count - previous.count : 0
  const chart = {
    width: 620,
    height: 180,
    left: 24,
    right: 24,
    top: 18,
    bottom: 34,
  }
  const plotHeight = chart.height - chart.top - chart.bottom
  const plotWidth = chart.width - chart.left - chart.right
  const points = recent.map((item, index) => {
    const x = chart.left + (recent.length === 1 ? 0 : (plotWidth / (recent.length - 1)) * index)
    const y = chart.top + (1 - item.count / max) * plotHeight

    return { item, x, y }
  })
  const linePoints = points.map(point => `${point.x},${point.y}`).join(' ')
  const baseY = chart.height - chart.bottom
  const areaPoints = `${chart.left},${baseY} ${linePoints} ${chart.width - chart.right},${baseY}`
  const labelForPoint = (point) => {
    const tooHigh = point.y < chart.top + 14
    return {
      y: tooHigh ? point.y + 18 : point.y - 10,
      anchor: tooHigh ? 'hanging' : 'auto',
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MiniStat label="Peak month" value={monthLabel(peak)} detail={`${numberWithCommas(peak.count)} in ${peak.year}`} />
        <MiniStat label="Latest" value={monthLabel(latest)} detail={`${numberWithCommas(latest.count)} reposts`} />
        <MiniStat label="Average" value={numberWithCommas(average)} detail={`${recent.length} months`} />
      </div>

      <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white/80">Last 12 active months</div>
            <div className="mt-1 text-xs text-white/30">{numberWithCommas(total)} reposts in this window</div>
          </div>
          <div className={`w-max rounded-full border px-2.5 py-1 text-xs font-semibold ${
            change >= 0 ? 'border-accent/20 bg-accent/10 text-accent/90' : 'border-white/[0.06] bg-white/[0.025] text-white/55'
          }`}>
            {previous ? `${change >= 0 ? '+' : ''}${numberWithCommas(change)} vs ${monthLabel(previous)}` : 'First month'}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/[0.04] bg-white/[0.018] px-3 py-2">
          <svg className="h-48 w-full overflow-visible" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Monthly repost trend">
            <defs>
              <linearGradient id="monthlyTrendArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(167,139,250,0.24)" />
                <stop offset="100%" stopColor="rgba(167,139,250,0)" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((ratio) => {
              const y = chart.top + ratio * plotHeight

              return (
                <line
                  key={ratio}
                  x1={chart.left}
                  x2={chart.width - chart.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.055)"
                  strokeWidth="1"
                />
              )
            })}
            <polygon points={areaPoints} fill="url(#monthlyTrendArea)" />
            <polyline
              points={linePoints}
              fill="none"
              stroke="rgba(167,139,250,0.78)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point) => {
              const { item, x, y } = point
              const isPeak = item.year === peak.year && item.month === peak.month
              const isLatest = item.year === latest.year && item.month === latest.month
              const valueLabel = labelForPoint(point)

              return (
                <g key={`${item.year}-${item.month}`} aria-label={`${fullMonthLabel(item)}: ${item.count} reposts`}>
                  <rect
                    x={x - 16}
                    y={valueLabel.y - 10}
                    width="32"
                    height="16"
                    rx="6"
                    fill={isPeak ? 'rgba(167,139,250,0.16)' : 'rgba(10,10,10,0.72)'}
                    stroke={isPeak ? 'rgba(167,139,250,0.28)' : 'rgba(255,255,255,0.06)'}
                  />
                  <text
                    x={x}
                    y={valueLabel.y + 1}
                    textAnchor="middle"
                    fill={isPeak ? '#a78bfa' : isLatest ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.58)'}
                    fontSize="10"
                    fontWeight={isPeak || isLatest ? '700' : '600'}
                  >
                    {numberWithCommas(item.count)}
                  </text>
                  <circle
                    cx={x}
                    cy={y}
                    r={isPeak || isLatest ? 5 : 3.5}
                    fill={isPeak ? '#a78bfa' : isLatest ? 'rgba(255,255,255,0.74)' : 'rgba(167,139,250,0.52)'}
                    stroke="rgba(10,10,10,0.9)"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={chart.height - 10}
                    textAnchor="middle"
                    fill={isPeak ? 'rgba(167,139,250,0.95)' : isLatest ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.32)'}
                    fontSize="10"
                    fontWeight={isPeak || isLatest ? '700' : '500'}
                  >
                    {monthLabel(item)}
                  </text>
                </g>
              )
            })}
          </svg>

          <div className="grid grid-cols-3 gap-1.5 border-t border-white/[0.05] pt-2 sm:grid-cols-6 xl:grid-cols-12">
            {recent.map((item) => {
              const isPeak = item.year === peak.year && item.month === peak.month
              const isLatest = item.year === latest.year && item.month === latest.month

              return (
                <div
                  key={`${item.year}-${item.month}-value`}
                  className={`rounded-md border px-2 py-1.5 ${
                    isPeak
                      ? 'border-accent/28 bg-accent/10'
                      : isLatest
                        ? 'border-white/[0.08] bg-white/[0.035]'
                        : 'border-white/[0.045] bg-black/16'
                  }`}
                >
                  <div className={`text-[10px] font-semibold ${isPeak ? 'text-accent/90' : 'text-white/48'}`}>
                    {monthLabel(item)}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-white/78">{numberWithCommas(item.count)}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-3 grid gap-3 border-t border-white/[0.04] pt-3 text-xs sm:grid-cols-3">
          <div>
            <div className="font-semibold text-white/72">{fullMonthLabel(peak)}</div>
            <div className="mt-1 text-white/28">Peak month</div>
          </div>
          <div>
            <div className="font-semibold text-white/72">{fullMonthLabel(latest)}</div>
            <div className="mt-1 text-white/28">Latest active month</div>
          </div>
          <div>
            <div className="font-semibold text-white/72">{numberWithCommas(total)}</div>
            <div className="mt-1 text-white/28">Recent reposts</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthorList({ authors, activeAuthor, availableAuthors, onSelectAuthor }) {
  if (!authors?.length) return <p className="text-white/20 text-sm">No author data</p>

  const top = authors[0]?.count || 1
  const total = authors.reduce((sum, author) => sum + author.count, 0)

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <MiniStat label="Top creator" value={authors[0]?.nickname || '-'} detail={`@${authors[0]?.unique_id || 'unknown'}`} />
        <MiniStat label="Creator reposts" value={numberWithCommas(total)} detail={`top ${authors.length}`} />
      </div>

      <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1 custom-scrollbar">
        {authors.map((a, i) => {
          const canFilter = !availableAuthors || availableAuthors.has(a.unique_id)

          return (
            <button
              type="button"
              key={a.unique_id || i}
              disabled={!canFilter}
              onClick={() => onSelectAuthor?.(a.unique_id)}
              title={canFilter ? `Filter history by @${a.unique_id}` : 'This author is in the full stats, but not in the loaded history preview.'}
              className={`w-full p-3 rounded-xl bg-white/[0.02] border text-left transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60 ${
                activeAuthor === a.unique_id ? 'border-accent/45 bg-accent/10' : 'border-white/[0.04]'
              } ${canFilter ? 'hover:bg-white/[0.04]' : 'cursor-not-allowed opacity-45'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white/80">{a.nickname}</div>
                  <div className="truncate text-xs text-white/30">
                    @{a.unique_id}
                    {!canFilter && <span className="ml-2 text-white/22">stats only</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white/90">{a.count}</div>
                  <div className="text-[10px] text-white/30">reposts</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-accent/50" style={{ width: `${Math.max(8, (a.count / top) * 100)}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ScanDetails({ data, totalReposts, itemCount }) {
  const quota = data.quota
  const sampled = data.statsSampled || totalReposts || itemCount
  const coverage = percent(itemCount, sampled)
  const quotaUsed = quota ? percent(quota.used, quota.limit) : 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Pages" value={data.pages || '-'} detail="scanned" />
        <MiniStat label="Items" value={itemCount} detail="shown" />
        <MiniStat label="Sampled" value={sampled || '-'} detail="for stats" />
        <MiniStat label="Hard cap" value={data.hardCap ?? '-'} detail={data.capped ? 'reached' : 'not reached'} />
        {quota && <MiniStat label="Quota left" value={quota.remaining} detail={`${quota.limit} daily`} />}
        <MiniStat label="Cache" value={data.cached ? 'Yes' : 'No'} detail={data.cached ? 'served fast' : 'fresh pull'} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/80">History preview</div>
              <div className="mt-1 text-xs text-white/30">{itemCount} shown from {numberWithCommas(sampled)} sampled reposts</div>
            </div>
            <div className="text-sm font-semibold text-white/70">{coverage}%</div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-accent/55" style={{ width: `${Math.max(4, Math.min(100, coverage))}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/80">{data.capped ? 'Scan reached the cap' : 'Scan completed under cap'}</div>
              <div className="mt-1 text-xs text-white/30">
                {quota ? `${quota.used}/${quota.limit} daily API calls used` : (data.cached ? 'Loaded from cache' : 'Fresh scan')}
              </div>
            </div>
            <div className="text-sm font-semibold text-white/70">{quota ? `${quotaUsed}%` : (data.cached ? 'Cached' : 'Fresh')}</div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-white/25" style={{ width: `${quota ? Math.max(4, Math.min(100, quotaUsed)) : 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent hover:from-white/[0.08] transition-all duration-500">
      <div className="rounded-[calc(2rem-1px)] bg-void-mid border border-white/[0.04] p-4 md:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
        <div className="text-xs text-white/30 mb-2 font-medium tracking-wide uppercase">{label}</div>
        <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</div>
      </div>
    </div>
  )
}


function RepostThumbnail({ cover }) {
  const [status, setStatus] = useState('loading')
  const fallback = !cover || status === 'error'
  const src = thumbnailUrl(cover)

  if (fallback) {
    return (
      <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <svg className="w-9 h-9 text-white/10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] relative">
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  )
}

function RepostMetric({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold text-white/75 leading-none">{numberWithCommas(value)}</div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/25 mt-1">{label}</div>
    </div>
  )
}

function AuthorBadge({ author }) {
  const handle = author?.unique_id || 'unknown'
  const name = author?.nickname && author.nickname !== handle ? author.nickname : null

  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-semibold text-white/75">@{handle}</div>
      {name && <div className="truncate text-xs text-white/30">{name}</div>}
    </div>
  )
}

function VideoPlayerFrame({ item }) {
  const [loaded, setLoaded] = useState(false)
  const playerUrl = tiktokPlayerUrl(item)
  const author = item?.author?.unique_id || 'unknown'

  useEffect(() => {
    setLoaded(false)
  }, [item?.id])

  if (!playerUrl) {
    return (
      <div className="flex h-full min-h-[460px] items-center justify-center p-8 text-center text-sm text-white/40">
        This repost does not include a playable post id.
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[460px] bg-black">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
          <div className="h-8 w-8 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
          <div className="text-sm text-white/35">Loading TikTok player...</div>
        </div>
      )}

      <iframe
        key={item.id}
        src={playerUrl}
        title={`TikTok preview by @${author}`}
        className="h-full min-h-[460px] w-full border-0"
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

function VideoPreviewModal({ item, items = [], onClose }) {
  const wheelLockRef = useRef(false)
  const wheelTimeoutRef = useRef(null)
  const touchStartYRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const feedItems = item && !items.some(entry => sameItem(entry, item)) ? [item, ...items] : items
  const selectedKey = item ? itemKey(item) : ''
  const selectedIndex = Math.max(0, feedItems.findIndex(entry => itemKey(entry) === selectedKey))
  const total = feedItems.length
  const activeItem = feedItems[activeIndex] || item
  const author = activeItem?.author?.unique_id || 'unknown'
  const canGoPrevious = activeIndex > 0
  const canGoNext = activeIndex < total - 1

  useEffect(() => {
    if (!item) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key)) {
        event.preventDefault()
        setActiveIndex(current => Math.min(total - 1, current + 1))
      }

      if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault()
        setActiveIndex(current => Math.max(0, current - 1))
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(wheelTimeoutRef.current)
    }
  }, [item, onClose, total])

  useEffect(() => {
    if (!selectedKey) return
    setActiveIndex(selectedIndex)
  }, [selectedKey, selectedIndex])

  const changeVideo = (direction) => {
    setActiveIndex(current => Math.max(0, Math.min(total - 1, current + direction)))
  }

  const handleWheel = (event) => {
    if (total < 2 || Math.abs(event.deltaY) < 40) return
    if (wheelLockRef.current) return

    wheelLockRef.current = true
    changeVideo(event.deltaY > 0 ? 1 : -1)
    window.clearTimeout(wheelTimeoutRef.current)
    wheelTimeoutRef.current = window.setTimeout(() => {
      wheelLockRef.current = false
    }, 520)
  }

  const handleTouchStart = (event) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null
  }

  const handleTouchEnd = (event) => {
    if (touchStartYRef.current === null) return
    const endY = event.changedTouches[0]?.clientY ?? touchStartYRef.current
    const diff = touchStartYRef.current - endY
    touchStartYRef.current = null
    if (Math.abs(diff) < 50) return
    changeVideo(diff > 0 ? 1 : -1)
  }

  if (!item || !feedItems.length) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="TikTok preview"
      onMouseDown={onClose}
      onWheel={handleWheel}
    >
      <div
        className="mx-auto flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-void-mid shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        onMouseDown={(event) => event.stopPropagation()}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 md:px-5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white/82">Video preview</div>
            <div className="mt-0.5 text-xs text-white/32">
              Scroll to change video - {activeIndex + 1} of {total}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/45 transition-colors duration-200 hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
          >
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto custom-scrollbar lg:grid-cols-[minmax(300px,420px)_minmax(0,1fr)] lg:overflow-hidden">
          <div className="relative min-h-[460px] bg-black">
            <VideoPlayerFrame key={itemKey(activeItem, activeIndex)} item={activeItem} />
            <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur">
              {activeIndex + 1} / {total}
            </span>
          </div>

          <aside className="flex min-h-0 flex-col p-5 md:p-6">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white/80">@{author}</div>
              <div className="mt-1 text-xs text-white/32">
                {formatDate(activeItem.create_time)}
                {activeItem.duration > 0 && ` - ${formatDuration(activeItem.duration)}`}
              </div>
            </div>

            <p className="mt-5 max-h-40 overflow-y-auto pr-1 text-sm leading-6 text-white/72 custom-scrollbar">
              {activeItem.desc || 'No description'}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat label="Plays" value={numberWithCommas(activeItem.stats?.play_count)} />
              <MiniStat label="Likes" value={numberWithCommas(activeItem.stats?.digg_count)} />
              <MiniStat label="Comments" value={numberWithCommas(activeItem.stats?.comment_count)} />
              <MiniStat label="Shares" value={numberWithCommas(activeItem.stats?.share_count)} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => changeVideo(-1)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/62 transition-colors duration-200 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => changeVideo(1)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/78 transition-colors duration-200 hover:border-accent/30 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
              >
                Next
              </button>
            </div>

            <div className="mt-auto pt-5">
              <a
                href={activeItem.share_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/78 transition-colors duration-200 hover:border-accent/30 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
              >
                Open on TikTok
              </a>
            </div>
          </aside>
        </div>

        <div className="border-t border-white/[0.06] px-4 py-3 text-xs leading-5 text-white/28 md:px-5">
          Only one player loads at a time. Use scroll, swipe, arrow keys, or the buttons to move through results.
        </div>
      </div>
    </div>
  )
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60 ${
        active
          ? 'border-accent/45 bg-accent/12 text-white'
          : 'border-white/[0.06] bg-white/[0.025] text-white/38 hover:border-white/[0.12] hover:text-white/65'
      }`}
    >
      {children}
    </button>
  )
}

function HistoryControls({
  query,
  sortBy,
  media,
  date,
  engagement,
  activeTag,
  activeAuthor,
  shown,
  total,
  onQueryChange,
  onSortChange,
  onMediaChange,
  onDateChange,
  onEngagementChange,
  onTagChange,
  onAuthorChange,
  onClear,
}) {
  const hasFilters = query || activeTag || activeAuthor || media !== 'all' || date !== 'all' || engagement !== 'all'

  return (
    <div className="mb-4 rounded-2xl border border-white/[0.06] bg-black/20 p-3 md:p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <label className="block">
          <span className="sr-only">Search repost history</span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search descriptions, creators, tags, ids..."
            className="h-11 w-full rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 text-sm text-white/80 outline-none placeholder:text-white/25 transition-colors duration-200 focus:border-accent/45"
          />
        </label>

        <label className="block">
          <span className="sr-only">Sort repost history</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/[0.06] bg-[#0a0a0a] px-3 text-sm text-white/75 outline-none transition-colors duration-200 focus:border-accent/45"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] uppercase tracking-[0.16em] text-white/22">Type</span>
        {mediaFilters.map(option => (
          <FilterChip key={option.value} active={media === option.value} onClick={() => onMediaChange(option.value)}>
            {option.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] uppercase tracking-[0.16em] text-white/22">Date</span>
        {dateFilters.map(option => (
          <FilterChip key={option.value} active={date === option.value} onClick={() => onDateChange(option.value)}>
            {option.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] uppercase tracking-[0.16em] text-white/22">Stats</span>
        {engagementFilters.map(option => (
          <FilterChip key={option.value} active={engagement === option.value} onClick={() => onEngagementChange(option.value)}>
            {option.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/35">{shown} of {total} shown</span>
          {activeTag && <FilterChip active onClick={() => onTagChange('')}>Tag: {activeTag} x</FilterChip>}
          {activeAuthor && <FilterChip active onClick={() => onAuthorChange('')}>Author: @{activeAuthor} x</FilterChip>}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-white/35 transition-colors duration-200 hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

function TopVideos({ items, onPreview, onSelectAuthor, onSelectTag }) {
  const highlights = topVideos(items)
  if (!highlights.length) return null

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white/78">Top videos</h4>
        <span className="text-[10px] uppercase tracking-[0.16em] text-white/22">Fast picks</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map(({ label, metric, key, item }) => {
          const tags = getTags(item)
          const firstTag = tags[0]
          const author = item?.author?.unique_id || 'unknown'

          return (
            <article key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
                <RepostThumbnail cover={item.cover} />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-white/25">{label}</div>
                  <div className="mt-1 text-lg font-bold text-white/88">{numberWithCommas(stat(item, key))}</div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/24">{metric}</div>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/70">{item.desc || 'No description'}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectAuthor?.(author)}
                  className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-xs text-white/40 transition-colors duration-200 hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
                >
                  @{author}
                </button>
                {firstTag && (
                  <button
                    type="button"
                    onClick={() => onSelectTag?.(firstTag)}
                    className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-xs text-white/40 transition-colors duration-200 hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
                  >
                    {firstTag}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onPreview?.(item)}
                  className="ml-auto text-xs font-medium text-accent/80 transition-colors duration-200 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
                >
                  Watch
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function RepostList({ items, onPreview }) {
  if (!items?.length) return <p className="text-white/20 text-sm py-8 text-center">No repost items found</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[88vh] overflow-y-auto pr-1 custom-scrollbar">
      {items.map((item, index) => (
        <button
          type="button"
          key={item.id || index}
          onClick={() => onPreview?.(item)}
          className="group block w-full rounded-2xl border border-white/[0.06] bg-white/[0.025] text-left transition-colors duration-200 hover:border-accent/25 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/60"
        >
          <article className="grid grid-cols-[116px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[132px_minmax(0,1fr)]">
            <div className="relative">
              <RepostThumbnail cover={item.cover} />
              <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur">
                #{index + 1}
              </span>
              <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-white/80 opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                Watch
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-start gap-3">
                  <AuthorBadge author={item.author} />
                </div>

                <div className="shrink-0 text-right text-xs text-white/30">
                  <div>{formatDate(item.create_time)}</div>
                  {item.duration > 0 && <div className="mt-1">{formatDuration(item.duration)}</div>}
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-sm md:text-[15px] leading-6 text-white/82 font-medium">
                {item.desc || 'No description'}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <RepostMetric label="plays" value={item.stats?.play_count} />
                <RepostMetric label="likes" value={item.stats?.digg_count} />
                <RepostMetric label="comments" value={item.stats?.comment_count} />
                <RepostMetric label="shares" value={item.stats?.share_count} />
              </div>
            </div>
          </article>
        </button>
      ))}
    </div>
  )
}

export default function Dashboard({ data, loading, error }) {
  const [historyQuery, setHistoryQuery] = useState('')
  const [historySort, setHistorySort] = useState('newest')
  const [mediaFilter, setMediaFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [engagementFilter, setEngagementFilter] = useState('all')
  const [activeTag, setActiveTag] = useState('')
  const [activeAuthor, setActiveAuthor] = useState('')
  const [previewItem, setPreviewItem] = useState(null)

  const openPreview = (item) => setPreviewItem(item)
  const closePreview = () => setPreviewItem(null)

  if (loading) {
    return (
      <section className="px-4 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              <span className="text-sm text-white/30">Fetching repost data...</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="px-4 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="p-[1px] rounded-2xl bg-gradient-to-b from-red-500/20 to-transparent max-w-lg mx-auto">
            <div className="rounded-[calc(2rem-1px)] bg-void-mid border border-red-500/10 p-8 text-center">
              <div className="text-red-400/80 text-lg font-medium mb-2">Error</div>
              <p className="text-white/40 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!data) return null
  const repostItems = Array.isArray(data.items) ? data.items : []
  const totalReposts = data.count ?? repostItems.length
  const historyAuthorIds = new Set(repostItems.map(item => item?.author?.unique_id).filter(Boolean))
  const filteredReposts = sortItems(filterItems(repostItems, {
    query: historyQuery,
    tag: activeTag,
    author: activeAuthor,
    media: mediaFilter,
    date: dateFilter,
    engagement: engagementFilter,
  }), historySort)

  const scrollToHistory = () => {
    window.requestAnimationFrame(() => {
      document.getElementById('repost-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const selectTag = (tag) => {
    setActiveTag(current => tag && current === tag ? '' : tag)
    scrollToHistory()
  }

  const selectAuthor = (author) => {
    setActiveAuthor(current => author && current === author ? '' : author)
    scrollToHistory()
  }

  const clearHistoryFilters = () => {
    setHistoryQuery('')
    setMediaFilter('all')
    setDateFilter('all')
    setEngagementFilter('all')
    setActiveTag('')
    setActiveAuthor('')
  }

  return (
    <section className="relative px-4 py-12 md:py-14">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <span className="inline-block rounded-full px-3.5 py-1 text-[10px] uppercase tracking-[0.25em] font-medium text-white/30 border border-white/10 bg-white/[0.03] mb-4">
            Insights for @{data.username}
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05]">
            {numberWithCommas(totalReposts)} reposts
            <br />
            <span className="text-white/40">across {data.pages || '-'} pages</span>
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-3 md:gap-4">
          <div className="col-span-12 md:col-span-4">
            <StatCard label="Total Reposts" value={numberWithCommas(totalReposts)} />
          </div>
          <div className="col-span-6 md:col-span-4">
            <StatCard label="Capped" value={data.capped ? 'Yes' : 'No'} />
          </div>
          <div className="col-span-6 md:col-span-4">
            <StatCard label="Hard Cap" value={data.hardCap ?? '-'} />
          </div>

          <div id="repost-history" className="col-span-12 scroll-mt-24">
            <div className="rounded-2xl bg-void-mid border border-white/[0.08] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div className="p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">Repost History</h3>
                    <p className="mt-2 text-sm text-white/35 max-w-2xl">
                      The fetched videos are listed first because this is where the useful inspection work happens.
                    </p>
                  </div>
                  <span className="w-max rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/35 font-medium">
                    {filteredReposts.length} of {repostItems.length} items
                  </span>
                </div>
                <TopVideos
                  items={repostItems}
                  onPreview={openPreview}
                  onSelectAuthor={selectAuthor}
                  onSelectTag={selectTag}
                />
                <HistoryControls
                  query={historyQuery}
                  sortBy={historySort}
                  media={mediaFilter}
                  date={dateFilter}
                  engagement={engagementFilter}
                  activeTag={activeTag}
                  activeAuthor={activeAuthor}
                  shown={filteredReposts.length}
                  total={repostItems.length}
                  onQueryChange={setHistoryQuery}
                  onSortChange={setHistorySort}
                  onMediaChange={setMediaFilter}
                  onDateChange={setDateFilter}
                  onEngagementChange={setEngagementFilter}
                  onTagChange={selectTag}
                  onAuthorChange={selectAuthor}
                  onClear={clearHistoryFilters}
                />
                <RepostList items={filteredReposts} onPreview={openPreview} />
              </div>
            </div>
          </div>

          <div className="col-span-12">
            <div className="rounded-2xl bg-void-mid border border-white/[0.08] p-4 md:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Activity Trends</h3>
                  <p className="mt-1 text-sm text-white/32">Year totals and recent monthly momentum, kept close to the history.</p>
                </div>
                <span className="w-max rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/35">
                  Time signals
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-white/75">Yearly Trend</h4>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/22">By year</span>
                  </div>
                  <YearChart yearly={data.timeStats?.yearly} />
                </div>

                <div className="min-w-0 lg:border-l lg:border-white/[0.06] lg:pl-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-white/75">Monthly Trend</h4>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/22">Recent</span>
                  </div>
                  <MonthChart monthly={data.timeStats?.monthly} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12">
            <div className="rounded-2xl bg-void-mid border border-white/[0.08] p-4 md:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Discovery Signals</h3>
                  <p className="mt-1 text-sm text-white/32">Tags and creators you can click to filter the repost history.</p>
                </div>
                <span className="w-max rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/35">
                  Filter helpers
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-white/75">Word Cloud</h4>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/22">Top tags</span>
                  </div>
                  <WordCloud words={data.wordCloud} activeTag={activeTag} onSelectTag={selectTag} />
                </div>

                <div className="min-w-0 lg:border-l lg:border-white/[0.06] lg:pl-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-white/75">Top Authors</h4>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/22">Most reposted</span>
                  </div>
                  <AuthorList
                    authors={data.topAuthors}
                    activeAuthor={activeAuthor}
                    availableAuthors={historyAuthorIds}
                    onSelectAuthor={selectAuthor}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12">
            <div className="rounded-2xl bg-void-mid border border-white/[0.08] p-4 md:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Scan Details</h3>
                  <p className="mt-1 text-sm text-white/32">Shows how much data was loaded, sampled, capped, or served from cache.</p>
                </div>
                <span className="w-max rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/35">
                  Context
                </span>
              </div>
              <ScanDetails data={data} totalReposts={totalReposts} itemCount={repostItems.length} />

              <details className="mt-4 border-t border-white/[0.05] pt-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                  <h4 className="text-sm font-semibold text-white/75">Raw JSON</h4>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/22 font-medium">Show debug</span>
                </summary>
                <pre className="text-xs text-emerald-400/80 font-mono bg-black/40 rounded-xl p-4 overflow-auto max-h-64 border border-white/[0.04] mt-4">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
      <VideoPreviewModal item={previewItem} items={filteredReposts} onClose={closePreview} />
    </section>
  )
}
