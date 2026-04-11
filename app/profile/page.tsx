import { Award, Briefcase, Edit3, User } from "lucide-react";
import { MainShell } from "@/components/app/main-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { profileMastery, profileStats } from "@/data/scenarios";

export default function ProfilePage() {
  return (
    <MainShell>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10 md:py-10">
        <Card className="bg-white/80">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <div className="flex size-[5.5rem] items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-10" />
            </div>
            <div className="min-w-0 flex-1">
              <h1>Alex Thompson</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="size-4" />
                Senior software engineer · preparing for staff and principal loops
              </p>
            </div>
            <Button variant="secondary">
              <Edit3 className="size-4" />
              Edit profile
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {profileStats.map((item) => (
            <Card key={item.label} className="bg-white/80">
              <CardContent className="p-5 text-center">
                <div className={`text-3xl font-semibold ${item.accent}`}>{item.value}</div>
                <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/85">
          <CardContent className="p-6">
            <h2>Skill mastery</h2>
            <div className="mt-5 space-y-5">
              {profileMastery.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">
                      {skill.level}% · {skill.sessions} sessions
                    </span>
                  </div>
                  <Progress value={skill.level} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <Award className="size-5 text-amber-500" />
            <h2>Achievements</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: "🔥", title: "7-day streak", description: "Practiced every day this week" },
              { icon: "🎯", title: "90+ clarity", description: "Hit elite pacing and structure once" },
              { icon: "📈", title: "Rapid improver", description: "Gained 18 points in six days" },
              { icon: "🧠", title: "Loop closer", description: "Finished four full mock loops" },
            ].map((achievement) => (
              <Card key={achievement.title} className="bg-white/80">
                <CardContent className="p-5 text-center">
                  <div className="text-4xl">{achievement.icon}</div>
                  <h3 className="mt-4 text-base">{achievement.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {achievement.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainShell>
  );
}
