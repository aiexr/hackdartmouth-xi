import {
  User,
  Briefcase,
  Target,
  Award,
  Calendar,
  TrendingUp,
  Edit3,
} from "lucide-react";
import { Progress } from "./ui/progress";

const skills = [
  { name: "Behavioral", level: 65, sessions: 12 },
  { name: "Leadership", level: 30, sessions: 4 },
  { name: "Technical Communication", level: 45, sessions: 7 },
  { name: "Case Studies", level: 15, sessions: 2 },
];

const achievements = [
  { icon: "🔥", title: "7-Day Streak", desc: "Practiced 7 days in a row" },
  { icon: "🎯", title: "First Perfect Score", desc: "Scored 90+ on a scenario" },
  { icon: "📈", title: "Rapid Improver", desc: "+20 points in one week" },
  { icon: "💪", title: "10 Sessions", desc: "Completed 10 practice sessions" },
];

export function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      {/* Profile header */}
      <div className="bg-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1>Alex Thompson</h1>
          <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1">
            <Briefcase className="w-4 h-4" />
            Senior Software Engineer &middot; Targeting Staff roles
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-[0.875rem]">
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: "Sessions", value: "25", color: "text-primary" },
          { icon: TrendingUp, label: "Avg Score", value: "74", color: "text-emerald-500" },
          { icon: Target, label: "Goals Met", value: "8/12", color: "text-amber-500" },
          { icon: Award, label: "Best Score", value: "92", color: "text-violet-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-5 text-center">
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <div className="text-[1.5rem]" style={{ fontWeight: 700 }}>{stat.value}</div>
            <div className="text-[0.8125rem] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Skill mastery */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="mb-5">Skill Mastery</h2>
        <div className="space-y-5">
          {skills.map((skill) => (
            <div key={skill.name}>
              <div className="flex justify-between mb-1.5">
                <span>{skill.name}</span>
                <span className="text-[0.8125rem] text-muted-foreground">{skill.level}% &middot; {skill.sessions} sessions</span>
              </div>
              <Progress value={skill.level} className="h-2.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="mb-4">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((a) => (
            <div key={a.title} className="bg-card rounded-2xl border border-border p-4 text-center hover:shadow-sm transition-shadow">
              <div className="text-[2rem] mb-2">{a.icon}</div>
              <h4 className="text-[0.875rem]">{a.title}</h4>
              <p className="text-[0.75rem] text-muted-foreground mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
