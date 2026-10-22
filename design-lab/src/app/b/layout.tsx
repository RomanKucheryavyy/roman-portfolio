import { ThemeProvider } from 'next-themes'

// Direction B is light. next-themes puts the class on <html>, which is what
// the components' dark: variants (and lifeline's useTheme) read.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
