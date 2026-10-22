// 21st.dev demo for kokonutd/kokonut-ai-autocomplete (id 39877), kept for reference: how its author uses it.
"use client";
import {ThemeProvider as LibraryDemoThemeProvider} from "next-themes";
import AIAutocomplete from "@/components/ui/kokonut-ai-autocomplete";
function SourceSpecimen(){return <>

    <AIAutocomplete />

</>}
export default function LibraryRegistryPreview(){return <LibraryDemoThemeProvider defaultTheme="dark" enableSystem={false}><div data-component-demo data-demo-theme="dark" data-theme="dark" className="dark" style={{background:"var(--background)",color:"var(--foreground)"}}><div className="relative w-full min-w-0 max-w-5xl min-h-[400px] flex items-center justify-center"><SourceSpecimen/></div></div></LibraryDemoThemeProvider>}
