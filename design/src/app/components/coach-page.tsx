import {
  Sparkles,
  Send,
  FileText,
  Linkedin,
  Target,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

const suggestions = [
  { icon: Linkedin, label: "Analyze my LinkedIn", desc: "Get feedback on how your profile aligns with target roles" },
  { icon: FileText, label: "Resume review", desc: "Identify strengths and gaps in your resume" },
  { icon: Target, label: "Set interview goals", desc: "Create a personalized practice plan" },
];

const chatHistory = [
  { role: "coach" as const, text: "Hi Alex! Based on your recent sessions, I noticed your STAR responses are improving — especially the Situation and Task parts. Let's work on making your Results more quantifiable. Ready for a quick exercise?" },
  { role: "user" as const, text: "Yes! I've been struggling with that. How do I make results more concrete?" },
  { role: "coach" as const, text: "Great question. Try the 'So what?' test: after stating a result, ask yourself 'so what?' until you reach a number. For example:\n\n• 'I improved the process' → So what? → 'It saved 10 hours/week'\n• 'The team liked it' → So what? → 'Adoption went from 30% to 85%'\n\nWant to practice this with your 'Tell me about yourself' response?" },
];

export function CoachPage() {
  const [message, setMessage] = useState("");

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Coach
        </h1>
        <p className="text-muted-foreground mt-1">
          Your personal interview coach — get feedback, set goals, and analyze your profile.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {suggestions.map((s) => (
          <button
            key={s.label}
            className="bg-card rounded-2xl border border-border p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <s.icon className="w-5 h-5 text-primary mb-3" />
            <h4>{s.label}</h4>
            <p className="text-[0.8125rem] text-muted-foreground mt-1">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-[0.875rem]" style={{ fontWeight: 500 }}>Coaching Chat</span>
        </div>
        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[0.75rem] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-gradient-to-br from-violet-500 to-indigo-500 text-white"
              }`} style={{ fontWeight: 600 }}>
                {msg.role === "user" ? "A" : "C"}
              </div>
              <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-[0.875rem] whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border flex gap-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask your coach anything..."
            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-[0.875rem] outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
