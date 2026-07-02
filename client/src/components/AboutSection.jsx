const featureRows = [
  {
    title: 'Track repost habits',
    body: 'See the videos, creators, dates, captions, and engagement behind a profile\'s repost activity.',
  },
  {
    title: 'Spot repeat signals',
    body: 'Top tags, authors, monthly trends, and strongest videos show what keeps coming up again and again.',
  },
  {
    title: 'Open the receipts',
    body: 'Preview videos inline and keep scan details plus raw JSON nearby when the API results look suspicious.',
  },
]

const workflow = ['Search', 'Scan', 'Watch', 'Compare']

export default function AboutSection() {
  return (
    <section id="about" className="relative px-4 py-10 md:py-12 scroll-mt-24">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-void-mid shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="border-b border-white/[0.06] p-5 md:p-6 lg:border-b-0 lg:border-r">
              <div className="mb-4 w-max rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/35">
                TikTok repost insights
              </div>
              <h2 className="max-w-md text-2xl font-bold leading-tight text-white md:text-3xl">
                See what a TikTok account keeps reposting.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">
                Drop in a username and get a focused look at repost history, repeat creators, top tags, engagement spikes, and videos you can preview on the fly. NyxRepost keeps the history front and center, then adds the context for deeper digging.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <AboutStat value="History" label="front and center" />
                <AboutStat value="Inline" label="video preview" />
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="grid gap-3">
                {featureRows.map(row => (
                  <AboutRow key={row.title} title={row.title} body={row.body} />
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-white/[0.055] bg-black/18 p-3">
                <div className="mb-3 text-xs font-semibold text-white/46">Workflow</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {workflow.map((item, index) => (
                    <div key={item} className="rounded-lg border border-white/[0.05] bg-white/[0.025] px-3 py-2">
                      <div className="text-[10px] font-semibold text-white/25">0{index + 1}</div>
                      <div className="mt-1 text-sm font-semibold text-white/76">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutRow({ title, body }) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-white/[0.025] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent/70" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/84">{title}</div>
          <p className="mt-1.5 text-xs leading-5 text-white/36">{body}</p>
        </div>
      </div>
    </div>
  )
}

function AboutStat({ value, label }) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-black/18 p-3">
      <div className="text-lg font-bold text-white/86">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/26">{label}</div>
    </div>
  )
}
