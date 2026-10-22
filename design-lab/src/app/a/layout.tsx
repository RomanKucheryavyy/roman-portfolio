import { ThemeProvider } from 'next-themes'

// Direction A is dark. next-themes puts the class on <html>, which is what
// the components' dark: variants (and lifeline's useTheme) read.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
