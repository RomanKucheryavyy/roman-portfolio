// 21st.dev demo for radiumcoders/shader-gradient (id 31145), kept for reference: how its author uses it.
"use client"

import { ShaderGradient } from "@/components/ui/shader-gradient"

const settings = {
  colors: ["#F7A48B", "#F9D78E", "#9FCBF0", "#BBA9EE"],
  speed: 0.14,
  blur: 0.7,
  intensity: 0.95,
  grain: 0.35,
  interactive: true,
}

// Unchanged colors are left unset so the component picks its own light/dark palette.
function sameColors(a: string[], b: string[]) {
  return a.length === b.length && a.every((c, i) => c.toLowerCase() === b[i]!.toLowerCase())
}

export default function ShaderGradientDemo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props }

  return (
    <div className="flex min-h-[520px] w-full items-center justify-center bg-background p-4">
      <div className="relative aspect-[16/9] min-h-[360px] w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-background">
        <ShaderGradient
          className="absolute inset-0"
          colors={sameColors(s.colors, settings.colors) ? undefined : s.colors}
          speed={s.speed}
          blur={s.blur}
          intensity={s.intensity}
          grain={s.grain}
          interactive={s.interactive}
        />
      </div>
    </div>
  )
}
