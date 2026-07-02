import { useEffect, useRef, useState } from 'react'

export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = {}) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const alreadyVisible = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      return rect.top < vh - 60 && rect.bottom > 0
    }

    if (alreadyVisible()) {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(el)

    const fallback = setTimeout(() => setRevealed(true), 1500)

    return () => {
      observer.disconnect()
      clearTimeout(fallback)
    }
  }, [threshold, rootMargin])

  return [ref, revealed]
}
