"use client";

import { signIn } from "next-auth/react";
import { Mic, Video, PhoneOff, Clock3 } from "lucide-react";
import { ThemeLogo } from "@/components/app/theme-logo";

function MockInterviewUI() {
  return (
    <div className="w-full max-w-md border border-border bg-base-100 select-none pointer-events-none overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tracking-widest text-base-content/40 uppercase">
            System Design
          </span>
          <span className="text-xs border border-violet-200 bg-violet-50 text-violet-700 px-2 py-0.5">
            Live
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-base-content/40">
          <Clock3 className="size-3" />
          <span className="text-xs tabular-nums">32:14</span>
        </div>
      </div>

      {/* Whiteboard area */}
      <div className="relative bg-base-200/30 px-5 py-6" style={{ minHeight: 220 }}>
        <svg
          viewBox="0 0 360 180"
          className="w-full h-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Client box */}
          <rect x="10" y="65" width="72" height="36" rx="2" className="stroke-primary/60 fill-primary/5" strokeWidth="1.5" />
          <text x="46" y="87" textAnchor="middle" className="fill-base-content/70" fontSize="11" fontFamily="sans-serif">Client</text>

          {/* Arrow: Client → API Gateway */}
          <line x1="82" y1="83" x2="128" y2="83" className="stroke-base-content/30" strokeWidth="1.2" markerEnd="url(#arrowhead)" />

          {/* API Gateway box */}
          <rect x="130" y="55" width="90" height="36" rx="2" className="stroke-primary/60 fill-primary/5" strokeWidth="1.5" />
          <text x="175" y="71" textAnchor="middle" className="fill-base-content/70" fontSize="10" fontFamily="sans-serif">API</text>
          <text x="175" y="83" textAnchor="middle" className="fill-base-content/70" fontSize="10" fontFamily="sans-serif">Gateway</text>

          {/* Arrow: API → Cache */}
          <line x1="175" y1="55" x2="175" y2="24" className="stroke-base-content/30" strokeWidth="1.2" markerEnd="url(#arrowhead)" />

          {/* Cache box */}
          <rect x="140" y="0" width="70" height="24" rx="2" className="stroke-amber-500/60 fill-amber-50" strokeWidth="1.2" />
          <text x="175" y="16" textAnchor="middle" className="fill-amber-700/70" fontSize="10" fontFamily="sans-serif">Cache</text>

          {/* Arrow: API → Service */}
          <line x1="220" y1="73" x2="258" y2="73" className="stroke-base-content/30" strokeWidth="1.2" markerEnd="url(#arrowhead)" />

          {/* Service box */}
          <rect x="260" y="55" width="90" height="36" rx="2" className="stroke-emerald-500/60 fill-emerald-50" strokeWidth="1.5" />
          <text x="305" y="71" textAnchor="middle" className="fill-emerald-700/70" fontSize="10" fontFamily="sans-serif">Worker</text>
          <text x="305" y="83" textAnchor="middle" className="fill-emerald-700/70" fontSize="10" fontFamily="sans-serif">Service</text>

          {/* Arrow: Service → DB */}
          <line x1="305" y1="91" x2="305" y2="126" className="stroke-base-content/30" strokeWidth="1.2" markerEnd="url(#arrowhead)" />

          {/* DB cylinder shape */}
          <ellipse cx="305" cy="132" rx="38" ry="8" className="stroke-base-content/30 fill-base-200/60" strokeWidth="1.2" />
          <rect x="267" y="132" width="76" height="28" className="fill-base-200/60" stroke="none" />
          <line x1="267" y1="132" x2="267" y2="160" className="stroke-base-content/30" strokeWidth="1.2" />
          <line x1="343" y1="132" x2="343" y2="160" className="stroke-base-content/30" strokeWidth="1.2" />
          <ellipse cx="305" cy="160" rx="38" ry="8" className="stroke-base-content/30 fill-base-200/60" strokeWidth="1.2" />
          <text x="305" y="151" textAnchor="middle" className="fill-base-content/50" fontSize="10" fontFamily="sans-serif">PostgreSQL</text>

          {/* Arrow: API → Queue */}
          <line x1="175" y1="91" x2="175" y2="126" className="stroke-base-content/30" strokeWidth="1.2" markerEnd="url(#arrowhead)" />

          {/* Queue box */}
          <rect x="130" y="128" width="90" height="28" rx="2" className="stroke-orange-500/50 fill-orange-50" strokeWidth="1.2" />
          <text x="175" y="146" textAnchor="middle" className="fill-orange-700/70" fontSize="10" fontFamily="sans-serif">Message Queue</text>

          {/* Arrowhead marker */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" className="fill-base-content/30" />
            </marker>
          </defs>
        </svg>

        {/* PiP avatar */}
        <div className="absolute bottom-3 right-3 w-20 h-14 rounded border border-border bg-base-300/80 flex items-center justify-center overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-primary/40" />
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-2.5">
        <div className="flex size-7 items-center justify-center rounded-full bg-base-200 text-base-content/50">
          <Mic className="size-3.5" />
        </div>
        <div className="flex size-7 items-center justify-center rounded-full bg-base-200 text-base-content/50">
          <Video className="size-3.5" />
        </div>
        <div className="flex size-7 items-center justify-center rounded-full bg-red-500/80 text-white">
          <PhoneOff className="size-3.5" />
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background px-8">
      <div className="grid w-full max-w-4xl items-center gap-16 lg:grid-cols-2">
        {/* Left: identity + CTA */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ThemeLogo alt="LeetSpeak" className="h-10 w-auto" />
              <h1 className="m-0">LeetSpeak</h1>
            </div>
            <p className="text-base text-base-content/60 max-w-sm leading-relaxed">
              Practice behavioral, technical, and system design interviews.
              Get scored after every round and track your progress over time.
            </p>
          </div>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex w-fit items-center gap-3 rounded-none border border-border bg-base-100 px-6 py-3 text-sm font-medium transition-colors hover:bg-base-200"
          >
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Right: mock system design interview UI */}
        <div className="hidden lg:flex justify-center">
          <MockInterviewUI />
        </div>
      </div>
    </div>
  );
}
