import { create } from 'zustand'

// Only state something reads lives here. Three write-only fields (the scroll
// velocity and progress, and an active-project index) used to be set on every
// scroll frame and never read, so each frame re-ran every subscriber for nothing.
interface PortfolioState {
  isLoaded: boolean
  cursorVariant: 'default' | 'hover' | 'text' | 'hidden'
  activeSection: string
  mousePosition: { x: number; y: number }
  mouseVelocity: { x: number; y: number }

  setLoaded: (loaded: boolean) => void
  setCursorVariant: (variant: PortfolioState['cursorVariant']) => void
  setActiveSection: (section: string) => void
  setMousePosition: (pos: { x: number; y: number }) => void
  setMouseVelocity: (vel: { x: number; y: number }) => void
}

export const useStore = create<PortfolioState>((set) => ({
  isLoaded: false,
  cursorVariant: 'default',
  activeSection: 'hero',
  mousePosition: { x: 0, y: 0 },
  mouseVelocity: { x: 0, y: 0 },

  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setCursorVariant: (variant) => set({ cursorVariant: variant }),
  setActiveSection: (section) => set({ activeSection: section }),
  setMousePosition: (pos) => set({ mousePosition: pos }),
  setMouseVelocity: (vel) => set({ mouseVelocity: vel }),
}))
