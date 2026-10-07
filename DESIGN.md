# 栞 Shiori — Design System

## Direction

Toko Bunbougu (文房具店) — Japanese stationery shop counter. Warm, crafted, approachable. Japanese-Indonesian fusion identity.

## Palette

| Token | Value | Role |
|---|---|---|
| `--lp-sakura` | `#C4727E` | Primary accent, CTAs, brand energy |
| `--lp-sakura-soft` | `rgba(196, 114, 126, 0.12)` | Light sakura for backgrounds |
| `--lp-kinari` | `#C9A96E` | Secondary warm accent |
| `--lp-kraft` | `#B89B7A` | Borders, fixtures, secondary borders |
| `--lp-sumi` | `#2C2420` | Primary text |
| `--lp-ground` | `#F4EDE3` | Page ground (warm cream) |
| `--lp-ground-warm` | `#F0E6D8` | Warmer ground variant |
| `--lp-paper` | `#FAF6F0` | Card/surface white |
| Text secondary | `#6B5A4E` | Subtext, descriptions |
| Text muted | `#A09080` | Labels, counts, meta |

### Jenjang Colors

Each jenjang has a fixed washi tape tab color:

| Jenjang | Color |
|---|---|
| SD | `#D4808A` |
| SMP | `#7BA8C4` |
| SMA | `#E8D070` |
| SMK | `#C94C4C` |
| MADRASAH | `#B0A0C8` |
| AKM & P5 | `#7BA784` |
| PROD | `#E89668` |
| TKA | `#D4A86A` |
| ASAJ UM | `#8BAAB0` |
| JURNAL & TK | `#C4A0B0` |

## Typography

| Role | Family | Weight | Size |
|---|---|---|---|
| Display headlines | Shippori Mincho B1 | 700 | clamp(2rem, 4vw, 2.8rem) |
| Section titles | Shippori Mincho B1 | 700 | 26px |
| Body text | Source Sans 3 + Noto Sans JP | 400 | 16px |
| Buttons/labels | Source Sans 3 | 600 | 14-15px |
| Stats numbers | Shippori Mincho B1 | 700 | 32px |

## Surface Treatment

- **Ground:** Flat warm cream, no texture
- **Cards:** Paper-white (`#FAF6F0`) with 1px border `rgba(180, 155, 130, 0.2)`, 10px radius
- **Washi tape tabs:** 6px colored strips on top of jenjang cards
- **Washi accent:** Repeating gradient strip (sakura + kinari segments, 50% opacity)
- **Borders:** Kraft-colored (`#B89B7A`), 1.5px for interactive, 1px for decorative
- **Shadows:** Only on hover — `0 8px 24px rgba(44, 36, 32, 0.08)`
- **Corner radius:** 6-8px for buttons, 10px for cards, 12-16px for sections

## Motion

- **Ease:** `cubic-bezier(0.4, 0, 0.2, 1)`
- **Signature:** Jenjang cards lift on hover (`translateY(-4px)` + shadow)
- **CTA:** Primary button lifts on hover (`translateY(-2px)` + deeper shadow)
- **Washi tape tabs:** Opacity increase on hover (0.85 → 1)
- **Reduced motion:** All transitions disabled

## Voice

Indonesian. Direct, warm, practical. Controls name their action. "Masuk" not "Login". "Pesan Buku Pelajaran" not "Order Textbooks".

## Brand Elements

- **栞** kanji in sakura pink, always paired with "Shiori" in Shippori Mincho
- **Mascot:** `/assets/Screenshot 2026-09-28 234611.png`, mix-blend-mode: multiply
- **CV Putra Nugraha** in footer as the trusted business entity
