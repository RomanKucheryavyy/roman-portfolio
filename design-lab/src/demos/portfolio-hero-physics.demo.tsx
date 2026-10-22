// 21st.dev demo for romanvasnev/portfolio-hero (id 39239), kept for reference: how its author uses it.
"use client";

import * as React from "react";
import { PortfolioTemplate, DEFAULT_BADGES } from "@/components/ui/portfolio-hero";

/* Live controls (21st Demo Controls). Any change drops the badges again. */
const settings = {
  /* on: phone frame · off: desktop browser frame */
  mobileView: true,
  darkMode: true,
  dragHint: true,
  badgeCount: 22,
  autoplaySeconds: 6,
};

export default function PortfolioHeroDemo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  const dark = s.darkMode;
  const theme = dark ? "dark" : "light";
  const count = Math.max(1, Math.min(DEFAULT_BADGES.length, Math.round(s.badgeCount)));
  const badges = React.useMemo(() => DEFAULT_BADGES.slice(0, count), [count]);
  const dropKey = React.useMemo(() => Math.random(), [s.mobileView, dark, s.dragHint, count, s.autoplaySeconds]);

  const template = (
    <PortfolioTemplate
      theme={theme}
      dropKey={dropKey}
      dragHint={s.dragHint}
      badges={badges}
      autoplay={Math.max(0, s.autoplaySeconds) * 1000}
    />
  );

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center py-8"
      style={{
        /* dot grid from the "work with AI" block of vasnev.art */
        backgroundColor: dark ? "#121212" : "#ececea",
        backgroundImage: `radial-gradient(circle, ${dark ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.06)"} 0 1px, transparent 1.4px)`,
        backgroundSize: "20px 13px",
        backgroundPosition: "-6px -1px",
      }}
    >
      {s.mobileView ? (
        <div
          className={`relative w-[390px] max-w-[calc(100%-16px)] rounded-[47px] border-[5px] shadow-2xl ${
            dark ? "border-[#1c1c1c] bg-[#060606]" : "border-[#d4d4d2] bg-[#f7f7f5]"
          }`}
        >
          <div className="h-[820px] overflow-y-auto overflow-x-hidden rounded-[42px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {template}
          </div>
        </div>
      ) : (
        <div
          className={`w-[min(1200px,calc(100%-32px))] overflow-hidden rounded-2xl border shadow-2xl ${
            dark ? "border-[#242424] bg-[#060606]" : "border-[#d4d4d2] bg-[#f7f7f5]"
          }`}
        >
          <div className={`flex h-10 items-center gap-2 border-b px-4 ${dark ? "border-[#1c1c1c] bg-[#141414]" : "border-[#e2e2e0] bg-[#ebebe9]"}`}>
            <i className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <i className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <i className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span
              className={`mx-auto flex h-6 w-[min(320px,50%)] items-center justify-center rounded-md text-xs ${
                dark ? "bg-[#0c0c0c] text-[#767676]" : "bg-white text-[#8a8a8a]"
              }`}
            >
              yourname.design
            </span>
            <span className="w-[52px]" />
          </div>
          <div className="h-[760px] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{template}</div>
        </div>
      )}
    </div>
  );
}
