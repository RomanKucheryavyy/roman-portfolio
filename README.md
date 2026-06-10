# romankucheryavyy.com

Personal portfolio of Roman Kucheryavyy. Built with Next.js (App Router), Tailwind CSS v4, and TypeScript. Deployed on Netlify.

## Design principles

- **Fast and boring on purpose** — no WebGL, no scroll hijacking, no custom cursor. Native scrolling, system-friendly, works on any phone.
- **One accent color** (amber, a nod to [Alongside Coffee](https://www.alongsidecoffee.com)) on a warm near-black base.
- **Progressive enhancement** — scroll reveals use a tiny IntersectionObserver and degrade to fully visible content without JS; `prefers-reduced-motion` is respected throughout.

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
```

## Contact form

The contact form persists to Supabase when `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are set (see `.env.local.example` and the schema
comment in `src/lib/supabase.ts`). Without them it no-ops gracefully. Set the
variables in Netlify → Site settings → Environment variables.
