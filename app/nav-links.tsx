'use client'

import { useEffect, useState } from 'react'

const SECTIONS = ['lp-hero', 'lp-jenjang', 'lp-how'] as const
const LABELS: Record<string, string> = {
  'lp-hero': 'Beranda',
  'lp-jenjang': 'Rak Buku',
  'lp-how': 'Cara Pesan',
}

export function NavLinks() {
  const [active, setActive] = useState('lp-hero')

  useEffect(() => {
    const els = SECTIONS.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return

    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(e.target.id)
            break
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )

    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="lp-nav-links">
      {SECTIONS.map(id => (
        <a
          key={id}
          href={`#${id}`}
          className={`lp-nav-link${active === id ? ' lp-nav-link--active' : ''}`}
        >
          {LABELS[id]}
        </a>
      ))}
    </div>
  )
}
