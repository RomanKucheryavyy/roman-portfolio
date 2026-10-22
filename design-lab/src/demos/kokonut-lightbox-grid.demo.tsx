// 21st.dev demo for kokonutd/kokonut-lightbox-grid (id 39859), kept for reference: how its author uses it.
"use client";
import {ThemeProvider as LibraryDemoThemeProvider} from "next-themes";
import LightboxGrid from "@/components/ui/kokonut-lightbox-grid";
function SourceSpecimen(){return <>

    <LightboxGrid />

</>}
export default function LibraryRegistryPreview(){return <LibraryDemoThemeProvider defaultTheme="dark" enableSystem={false}><div data-component-demo data-demo-theme="dark" data-theme="dark" className="dark" style={{background:"var(--background)",color:"var(--foreground)"}}><div className="relative w-full min-w-0 max-w-5xl min-h-[400px] flex items-center justify-center"><SourceSpecimen/></div></div></LibraryDemoThemeProvider>}
