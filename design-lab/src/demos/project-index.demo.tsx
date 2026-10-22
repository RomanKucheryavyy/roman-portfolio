// 21st.dev demo for ssychui/project-index (id 30554), kept for reference: how its author uses it.
import { useEffect } from "react"
import { Demo } from "@/components/ui/project-index"

export default function DemoOne() {
  // open the preview in dark by default; the sandbox theme toggle still works
  useEffect(() => { document.documentElement.classList.add("dark") }, [])
  return (
    <div className="w-full">
      <Demo />
    </div>
  )
}
