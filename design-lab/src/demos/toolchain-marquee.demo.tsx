// 21st.dev demo for johnmamanao/toolchain-marquee (id 35283), kept for reference: how its author uses it.
import ToolchainMarquee from "@/components/ui/toolchain-marquee";

export default function ToolchainMarqueeDemo() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--bg)] p-10">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] p-6 shadow-sm">
        <ToolchainMarquee showControl />
      </div>
    </div>
  );
}
