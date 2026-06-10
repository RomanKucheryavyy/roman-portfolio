import { NAV_ITEMS } from '@/lib/constants'

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 md:px-8"
      >
        <a href="#top" className="font-display font-semibold tracking-tight text-cream">
          <span className="sm:hidden" aria-hidden="true">RK</span>
          <span className="hidden sm:inline">Roman Kucheryavyy</span>
          <span className="sr-only sm:hidden">Roman Kucheryavyy</span>
        </a>
        <ul className="flex items-center gap-4 sm:gap-7">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-cream/55 transition-colors hover:text-amber"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
