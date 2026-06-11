import { ImageResponse } from 'next/og'

export const alt = 'Roman Kucheryavyy — Orchestrating Logic & Art'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const GRADIENT =
  'linear-gradient(135deg, #ff2d55, #ff6b35, #ffb800, #30d158, #00c7be, #5ac8fa, #af52de)'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000010',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* staff lines */}
        {[170, 210, 250, 290, 330].map((top) => (
          <div
            key={top}
            style={{
              position: 'absolute',
              top,
              left: 80,
              right: 80,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.07)',
            }}
          />
        ))}
        {/* spotlight glow */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            left: 400,
            width: 400,
            height: 500,
            background: 'radial-gradient(ellipse, rgba(124,145,182,0.25) 0%, transparent 70%)',
          }}
        />
        {/* notes */}
        <div style={{ position: 'absolute', top: 150, left: 200, color: 'rgba(255,255,255,0.25)', fontSize: 44 }}>♪</div>
        <div style={{ position: 'absolute', top: 230, right: 220, color: 'rgba(255,255,255,0.2)', fontSize: 36 }}>♫</div>
        <div style={{ position: 'absolute', top: 120, right: 380, color: 'rgba(255,255,255,0.14)', fontSize: 30 }}>♩</div>

        <div
          style={{
            fontSize: 34,
            letterSpacing: 10,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 18,
            textTransform: 'uppercase',
          }}
        >
          {'// Orchestrating Logic & Art'}
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: -2,
            display: 'flex',
          }}
        >
          Roman
          <span
            style={{
              marginLeft: 28,
              backgroundImage: GRADIENT,
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Kucheryavyy
          </span>
        </div>
        <div
          style={{
            fontSize: 30,
            color: 'rgba(255,255,255,0.55)',
            marginTop: 26,
            display: 'flex',
          }}
        >
          Salesforce engineer by day. Full-stack builder by nature. Conductor by calling.
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            fontSize: 24,
            letterSpacing: 4,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          romankucheryavyy.com
        </div>
      </div>
    ),
    { ...size }
  )
}
