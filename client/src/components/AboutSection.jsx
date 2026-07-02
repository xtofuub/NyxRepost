export default function AboutSection() {
  return (
    <section id="about" className="relative px-4 py-10 md:py-12 scroll-mt-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">About NyxRepost</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/38">
              NyxRepost turns a raw repost API response into a focused review surface. The history stays first, while charts, tags, authors, and scan details explain what is inside the returned media.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <AboutTile title="History first" body="The main workflow is scanning videos, creators, captions, thumbnails, and engagement." />
            <AboutTile title="Transparent data" body="Raw JSON and scan details stay available so odd API responses are easier to verify." />
            <AboutTile title="Built for review" body="Filters, sort options, and the single-player preview keep inspection quick and clean." />
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutTile({ title, body }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="text-sm font-semibold text-white/82">{title}</div>
      <p className="mt-2 text-xs leading-5 text-white/34">{body}</p>
    </div>
  )
}
