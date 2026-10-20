// 21st.dev demo for evilrabbit/lifeline (id 32658), kept for reference: how its author uses it.
"use client";

import Lifeline from "@/components/ui/lifeline";
import type { LifelineMarker } from "@/components/ui/lifeline-utils/types";

const BIRTH_YEAR = 1990;
const CURRENT_YEAR = 2026;

const MILESTONES: Record<number, Omit<LifelineMarker, "year">> = {
  1990: {
    id: "born",
    events: ["Born somewhere worth mentioning."],
  },
  2008: {
    id: "school",
    events: ["Finished school. Started something else."],
  },
  2014: {
    id: "first-job",
    companies: [{ id: "acme", name: "Acme" }],
    events: [
      [
        { type: "text", value: "Joined " },
        { type: "link", value: "Acme", href: "https://example.com" },
        { type: "text", value: " and shipped the first real thing." },
      ],
    ],
  },
  2019: {
    id: "the-move",
    events: [{ text: "Moved across the world." }],
  },
  2023: {
    id: "the-project",
    events: ["Started the project everything since has grown from."],
  },
  2026: {
    id: "today",
    events: [{ text: "Still going. 🎆", effect: "fireworks" }],
  },
};

const markers: LifelineMarker[] = [];
for (let year = BIRTH_YEAR; year <= CURRENT_YEAR; year++) {
  const milestone = MILESTONES[year];
  markers.push(
    milestone
      ? { year, ...milestone }
      : { id: `year-${year}`, year, events: [] },
  );
}

export default function LifelineDemo() {
  return (
    <div className="h-screen w-full">
      <Lifeline markers={markers} birthYear={BIRTH_YEAR} />
    </div>
  );
}
