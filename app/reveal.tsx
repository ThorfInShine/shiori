'use client'

import { useEffect } from 'react'

/**
 * Adds `.lp-in-view` to elements with `[data-reveal]` when they enter viewport.
 * One observer, no libraries, one-shot (unobserves after triggering).
 */
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    if (!els.length) return

    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ; (e.target as HTMLElement).classList.add('lp-in-view')
            obs.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0 }
    )

    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return null
}
