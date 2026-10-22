// 21st.dev demo for kuratlielia/text-reveal (id 35037), kept for reference: how its author uses it.
import TextReveal from "@/components/ui/text-reveal";

export default function TextRevealDemo() {
  return (
    <div className="flex min-h-[220px] w-full items-center justify-center bg-background p-10">
      <TextReveal
        text="Reveal a short piece of content with restrained motion."
        as="h2"
        className="text-center text-3xl font-medium tracking-tight"
      />
    </div>
  );
}
