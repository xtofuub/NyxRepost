export function normalizeRepostData(json, fallbackUsername) {
  const payload = json?.data && typeof json.data === 'object' ? json.data : (json || {})
  const items = payload.items || payload.reposts || payload.videos || []
  const count = payload.count ?? payload.total ?? payload.totalReposts ?? items.length

  return {
    ...payload,
    success: payload.success ?? true,
    username: payload.username || fallbackUsername,
    count,
    pages: payload.pages ?? payload.pageCount,
    items: Array.isArray(items) ? items : [],
    timeStats: payload.timeStats || {},
    wordCloud: Array.isArray(payload.wordCloud) ? payload.wordCloud : [],
    topAuthors: Array.isArray(payload.topAuthors) ? payload.topAuthors : [],
  }
}
