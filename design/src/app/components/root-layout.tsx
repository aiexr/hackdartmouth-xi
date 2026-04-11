import { Outlet, NavLink } from "react-router";
import {
  Home,
  User,
  Sparkles,
  Dumbbell,
  Settings,
  Flame,
  Trophy,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/coach", icon: Sparkles, label: "Coach" },
  { to: "/practice/behavioral", icon: Dumbbell, label: "Practice" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function RootLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-6 gap-2">
        <div className="flex items-center gap-2.5 mb-8 px-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-[1.125rem] tracking-tight" style={{ fontWeight: 600 }}>
            InterviewGym
          </span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Streak widget */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-4 mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-orange-700" style={{ fontWeight: 600 }}>7-day streak!</span>
          </div>
          <p className="text-[0.8125rem] text-orange-600/80">
            Keep practicing daily to maintain your momentum.
          </p>
          <div className="flex gap-1.5 mt-3">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div
                key={`${d}-${i}`}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[0.6875rem] ${
                  i < 5
                    ? "bg-orange-400 text-white"
                    : i === 5
                    ? "bg-orange-200 text-orange-600"
                    : "bg-orange-100 text-orange-400"
                }`}
                style={{ fontWeight: 500 }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around py-2 px-4">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[0.6875rem] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
