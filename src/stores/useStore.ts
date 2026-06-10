import { create } from 'zustand'

interface PortfolioState {
  isLoaded: boolean
  cursorVariant: 'default' | 'hover' | 'text' | 'hidden'
  activeSection: string
  activeProject: number
  mousePosition: { x: number; y: number }
  mouseVelocity: { x: number; y: number }
  scrollVelocity: number
  scrollProgress: number

  setLoaded: (loaded: boolean) => void
  setCursorVariant: (variant: PortfolioState['cursorVariant']) => void
  setActiveSection: (section: string) => void
  setActiveProject: (index: number) => void
  setMousePosition: (pos: { x: number; y: number }) => void
  setMouseVelocity: (vel: { x: number; y: number }) => void
  setScrollVelocity: (v: number) => void
  setScrollProgress: (v: number) => void
}

export const useStore = create<PortfolioState>((set) => ({
  isLoaded: false,
  cursorVariant: 'default',
  activeSection: 'hero',
  activeProject: 0,
  mousePosition: { x: 0, y: 0 },
  mouseVelocity: { x: 0, y: 0 },
  scrollVelocity: 0,
  scrollProgress: 0,

  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setCursorVariant: (variant) => set({ cursorVariant: variant }),
  setActiveSection: (section) => set({ activeSection: section }),
  setActiveProject: (index) => set({ activeProject: index }),
  setMousePosition: (pos) => set({ mousePosition: pos }),
  setMouseVelocity: (vel) => set({ mouseVelocity: vel }),
  setScrollVelocity: (v) => set({ scrollVelocity: v }),
  setScrollProgress: (v) => set({ scrollProgress: v }),
}))
