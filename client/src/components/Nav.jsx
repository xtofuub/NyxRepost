import { useState } from 'react'

const links = ['Dashboard', 'Compare', 'About']
const hrefs = {
  Dashboard: '#dashboard',
  Compare: '#dashboard',
  About: '#footer',
}

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="absolute md:fixed top-0 left-0 right-0 z-40 flex justify-center pt-6 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between px-5 py-2.5 rounded-full bg-[#0a0a0a]/90 backdrop-blur-2xl border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] w-max min-w-[260px] md:min-w-[420px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <span className="text-sm font-medium tracking-tight text-white/80 pl-1">
            NYX<span className="text-white/30">REPOST</span>
          </span>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l}
                href={hrefs[l]}
                className="text-sm text-white/40 hover:text-white/80 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                {l}
              </a>
            ))}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden relative w-7 h-7 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <span
              className={`absolute block h-px w-5 bg-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'rotate-45' : '-translate-y-1.5'}`}
            />
            <span
              className={`absolute block h-px w-5 bg-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'opacity-0' : 'opacity-100'}`}
            />
            <span
              className={`absolute block h-px w-5 bg-white/60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? '-rotate-45' : 'translate-y-1.5'}`}
            />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-30 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
          {links.map((l, i) => (
            <a
              key={l}
              href={hrefs[l]}
              className={`text-4xl md:text-5xl font-medium tracking-tight text-white/70 hover:text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                open ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-12 opacity-0 blur-sm'
              }`}
              style={{ transitionDelay: open ? `${150 + i * 80}ms` : '0ms' }}
              onClick={() => setOpen(false)}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
