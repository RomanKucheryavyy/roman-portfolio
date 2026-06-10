export default function Footer() {
  return (
    <footer className="border-t border-line px-5 py-10 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="font-mono text-[11px] text-cream/35">
          © {new Date().getFullYear()} Roman Kucheryavyy
        </p>
        <p className="font-mono text-[11px] text-cream/25">
          Next.js · Tailwind CSS · Netlify
        </p>
        <a
          href="#top"
          className="font-mono text-[11px] uppercase tracking-widest text-cream/35 transition-colors hover:text-amber"
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
