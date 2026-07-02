import { useReveal } from '../hooks/useReveal'

export default function Hero({ onFetch, username, setUsername, loading, error }) {
  const [ref, revealed] = useReveal({ threshold: 0.2 })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim()) onFetch(username.trim())
  }

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-28 pb-24 md:pb-40">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto text-center w-full transition-all duration-[1000ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          revealed ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-16 opacity-0 blur-md'
        }`}
      >
        <span className="inline-block rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-medium text-white/40 border border-white/10 bg-white/[0.03] mb-8">
          TikTok Repost Analytics
        </span>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[0.92] tracking-tight text-white mb-8">
          Uncover repost
          <br />
          <span className="bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent">patterns</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-lg text-white/30 leading-relaxed mb-12">
          Dive into your TikTok repost ecosystem. Word clouds, creator insights, trends, and full repost histories - all at your fingertips.
        </p>

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto w-full relative z-50">
          <div className="p-[1px] rounded-full bg-gradient-to-r from-white/[0.08] via-white/[0.12] to-white/[0.08]">
            <div className="rounded-[calc(9999px-1px)] bg-void-mid px-1.5 py-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:pr-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter TikTok username..."
                className="flex-1 bg-transparent px-5 py-3 text-sm text-white/80 placeholder:text-white/20 outline-none rounded-full border border-white/[0.06] sm:border-none focus:border-white/20 sm:focus:border-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              />
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="group inline-flex items-center gap-3 rounded-full px-7 py-3 bg-white text-black text-sm font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] shrink-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>{loading ? 'Fetching...' : 'Fetch reposts'}</span>
                <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                  <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="19" x2="19" y2="5" />
                    <polyline points="12 5 19 5 19 12" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400/90">
              {error}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/15 font-medium">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent animate-pulse" />
      </div>
    </section>
  )
}
