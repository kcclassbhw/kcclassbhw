# 04. UI & BRAND

## 1. UI Design Philosophy
The visual language of **KC Class BHW** blends academic credibility with sleek, modern software aesthetics. It avoids plain, outdated educational website cliches in favor of tailored HSL dark modes, glassmorphism cards, refined micro-borders, and vibrant emerald/gold accents that reflect academic excellence.

## 2. Design System Tokens
Implemented in `apps/learn/src/index.css` via modern CSS custom properties and Tailwind utilities:

```css
:root {
  --background: 215 28% 97%;
  --foreground: 222 47% 11%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.75rem;
}

.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --card: 224 71% 6%;
  --card-foreground: 213 31% 91%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --accent: 217.2 32.6% 17.5%;
  --border: 217.2 32.6% 17.5%;
}
```

## 3. Brand Guidelines
- **Brand Name:** KC Class BHW (Bhairahawa)
- **Tagline:** Empowering Nepal's Future English Educators.
- **Brand Personality:** Authoritative yet approachable, academic, modern, and student-focused.
- **Voice & Tone:** Encouraging, clear, structured, and exam-oriented.

## 4. Typography
- **Primary Body Font:** `Inter`, system-ui, -apple-system, sans-serif. Highly readable at 14px–16px across varied mobile screens.
- **Display / Heading Font:** `Outfit` / `Inter Display` for punchy titles with tight letter-spacing (`tracking-tight`).
- **Hierarchy:**
  - `H1` (Page Title): `text-4xl md:text-5xl font-bold tracking-tight`
  - `H2` (Section Title): `text-2xl md:text-3xl font-bold`
  - `H3` (Card / Unit Title): `text-lg md:text-xl font-semibold`
  - `Body`: `text-sm md:text-base text-foreground/80 leading-relaxed`
  - `Caption`: `text-xs text-muted-foreground`

## 5. Color System
- **Deep Navy / Slate Base (`bg-background`):** Premium, fatigue-reducing backdrop for prolonged study sessions.
- **Royal Blue Accent (`hsl(221, 83%, 53%)`):** Represents institutional confidence, navigation links, and primary action buttons.
- **YouTube Red (`#FF0000` / `hsl(0, 100%, 50%)`):** Reserved for video tags, YouTube channel indicators, and play triggers.
- **Emerald Green (`hsl(142, 76%, 36%)`):** Course completion badges, free enrollment confirmation, and active subscription status.
- **Amber / Gold (`hsl(38, 92%, 50%)`):** Premium lesson lock indicators and model question highlights.

## 6. Icon Guidelines
- **Icon Library:** Lucide React icons.
- **Standard Sizing:**
  - In-line text: `h-4 w-4`
  - Form action / Button: `h-4 w-4` or `h-5 w-5`
  - Feature badges / Hero highlights: `h-8 w-8` or `h-10 w-10`
- **Stroke Width:** Default `2px` or `1.75px` for a clean, consistent outline look.

## 7. Component Specifications
- **Button Component:** Primary (solid blue with hover brightness), Secondary (glass-card border), Ghost (subtle hover), Destructive (crimson red).
- **Cards (`.glass-card`):** Translucent backdrop filter with subtle border (`border-white/10` in dark mode) and soft multi-layer shadow.
- **Badges:** Pill-shaped (`rounded-full px-3 py-1 text-xs font-semibold`) for status flags ("Free", "Pro", "Year 2", "TU Syllabus").
- **Video Embed Container:** Responsive 16:9 box (`aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10`).

## 8. Responsive Design Grid
- 12-column flexible grid system on desktop (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
- Max-width content boundaries (`max-w-7xl mx-auto px-4 md:px-6`).
- Optimized viewport scaling (`<meta name="viewport" content="width=device-width, initial-scale=1.0">`).

## 9. Animation & Motion Guidelines
- **Motion Engine:** Framer Motion (`framer-motion`) and CSS hardware-accelerated transitions.
- **Duration & Easing:**
  - Micro-interactions (hover, focus): `150ms-200ms ease-out`
  - Modal dialogues & Sheet drawers: `300ms cubic-bezier(0.16, 1, 0.3, 1)`
  - Page entry fade-in: `250ms ease-in`
- **Respect Reduced Motion:** `@media (prefers-reduced-motion: reduce)` disables scale transforms and parallax effects.

## 10. Design Assets
- Custom SVG brand mark combining an open book with graduation cap and play icon.
- High-resolution OpenGraph preview images in `dist/public/` for social sharing on Facebook and Viber groups.
