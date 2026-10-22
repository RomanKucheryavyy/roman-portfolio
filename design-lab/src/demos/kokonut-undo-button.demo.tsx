// 21st.dev demo for kokonutd/kokonut-undo-button (id 39884), kept for reference: how its author uses it.
"use client";
import {ThemeProvider as LibraryDemoThemeProvider} from "next-themes";
import UndoButton from "@/components/ui/kokonut-undo-button";
function SourceSpecimen(){return <>

    <UndoButton />

</>}
export default function LibraryRegistryPreview(){return <LibraryDemoThemeProvider defaultTheme="dark" enableSystem={false}><div data-component-demo data-demo-theme="dark" data-theme="dark" className="dark" style={{background:"var(--background)",color:"var(--foreground)"}}><div className="relative w-full min-w-0 max-w-5xl min-h-[400px] flex items-center justify-center"><SourceSpecimen/></div></div></LibraryDemoThemeProvider>}
