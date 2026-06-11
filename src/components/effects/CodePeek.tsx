'use client'
import { useEffect, useState } from 'react'
import { CodeXml } from 'lucide-react'
import { useStore } from '@/stores/useStore'

const SNIPPETS: Record<string, { title: string; code: string }> = {
  hero: {
    title: 'KineticText.tsx',
    code: `// Repulsion physics for each letter
const dx = centerX - mousePosition.x;
const dy = centerY - mousePosition.y;
const dist = Math.sqrt(dx*dx + dy*dy);

if (dist < repulsionRadius) {
  const force = (1 - dist/radius) * 8;
  velocity.x += (dx/dist) * force;
  velocity.y += (dy/dist) * force;
}

// Spring back to origin
velocity.x += -pos.x * 0.12;
velocity.y += -pos.y * 0.12;`,
  },
  measures: {
    title: 'DNAHelix.tsx',
    code: `// Double helix via CSS 3D transforms
const angle = (i / count) * 360 * 2;
const radians = (angle * PI) / 180;
const x1 = cos(radians) * 40;
const z1 = sin(radians) * 40;

// Mirror strand
const x2 = cos(radians + PI) * 40;
const z2 = sin(radians + PI) * 40;

transform: translate3d(\${x1}px, \${y}px, \${z1}px)`,
  },
  symphony: {
    title: 'BootUpAnimation.css',
    code: `/* CRT boot-up sequence */
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
@keyframes loadingBar {
  0% { width: 0; }
  80% { width: 100%; }
  100% { width: 100%; opacity: 0; }
}

.boot-screen { background: #000; }
.boot-scanline {
  animation: scanline 0.8s linear;
}`,
  },
  compositions: {
    title: 'InvestorCouncil.ts',
    code: `// 18 personas debate every position
const votes = await Promise.all(
  COUNCIL.map(persona =>
    persona.evaluate(ticker, thesis)
  )
);

const conviction = votes
  .filter(v => v.action === 'buy')
  .reduce((sum, v) => sum + v.weight, 0);

// The PM gets the final word
if (conviction > 0.8) {
  portfolioManager.propose(ticker, size);
}`,
  },
  conductor: {
    title: 'SectionReveal.tsx',
    code: `// clipPath mask animation
const getClipPaths = (dir) => ({
  left:   { from: 'inset(0 100% 0 0)',
            to:   'inset(0 0% 0 0)' },
  center: { from: 'inset(50% 50% 50% 50%)',
            to:   'inset(0% 0% 0% 0%)' },
});

gsap.to(el, {
  clipPath: paths.to,
  duration: 1.2,
  ease: 'power3.inOut',
});`,
  },
  compose: {
    title: 'useSoundEffect.ts',
    code: `// Synthesized micro-interaction sounds
const SOUNDS = {
  tick:  { freq: 800,  dur: 0.05, type: 'square' },
  pop:   { freq: 400,  dur: 0.08, type: 'sine' },
  whoosh:{ freq: 200,  dur: 0.15, type: 'sawtooth' },
  ding:  { freq: 1200, dur: 0.20, type: 'sine' },
};

const osc = ctx.createOscillator();
osc.frequency.value = config.freq;
gain.gain.linearRampToValueAtTime(0, end);`,
  },
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const highlight = (code: string) =>
  escapeHtml(code)
    .replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|import|export|from|new|this)\b/g, '<span class="code-keyword">$1</span>')
    .replace(/(&#39;.*?&#39;|'.*?'|".*?"|`.*?`)/g, '<span class="code-string">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')

/** Fixed right-edge panel that shows a source snippet for the active section. */
export default function CodePeek() {
  const [open, setOpen] = useState(false)
  const activeSection = useStore((s) => s.activeSection)
  const setCursorVariant = useStore((s) => s.setCursorVariant)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const snippet = SNIPPETS[activeSection] || SNIPPETS.hero

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setCursorVariant('hover')}
        onMouseLeave={() => setCursorVariant('default')}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] px-1.5 py-4 bg-white/5 border border-white/10 border-r-0 rounded-l-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-all duration-300 cursor-pointer hidden md:flex flex-col items-center gap-1"
        aria-label="Toggle code panel"
      >
        <CodeXml size={14} />
        <span className="font-mono text-[8px] tracking-widest" style={{ writingMode: 'vertical-rl' }}>
          {'</>'}
        </span>
      </button>

      <div
        className="fixed right-0 top-0 h-full w-80 z-[89] bg-[#0a0a0a]/95 border-l border-white/5 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden hidden md:block"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="font-mono text-[10px] text-white/20">{snippet.title}</span>
          </div>
          <div className="flex-1 overflow-auto">
            <pre className="font-mono text-[11px] leading-relaxed text-white/60">
              <code dangerouslySetInnerHTML={{ __html: highlight(snippet.code) }} />
            </pre>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="font-mono text-[9px] text-white/20 uppercase tracking-wider">
              Current section: {activeSection}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
