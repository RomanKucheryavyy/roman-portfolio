// 21st.dev demo for kokonutd/kokonut-scroll-index (id 39950), kept for reference: how its author uses it.
"use client";
import {ThemeProvider as LibraryDemoThemeProvider} from "next-themes";
import ScrollIndex from "@/components/ui/kokonut-scroll-index";
function SourceSpecimen(){return <>

    <ScrollIndex />

</>}
export default function LibraryRegistryPreview(){return <LibraryDemoThemeProvider defaultTheme="dark" enableSystem={false}><div data-component-demo data-demo-theme="dark" data-theme="dark" className="dark" style={{background:"var(--background)",color:"var(--foreground)"}}><div className="relative w-full min-w-0 max-w-5xl min-h-[400px] flex items-center justify-center"><SourceSpecimen/></div></div></LibraryDemoThemeProvider>}
