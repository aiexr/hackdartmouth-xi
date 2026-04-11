import Link from "next/link";
import { ArrowRight, Chrome, Mail, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { envFlags } from "@/lib/env";

export function SignInCard() {
  return (
    <Card className="w-full max-w-xl overflow-hidden bg-white/90">
      <div className="bg-gradient-to-r from-primary to-indigo-500 px-6 py-5 text-primary-foreground">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
          <ShieldCheck className="size-3.5" />
          Firebase auth foundation
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Sign in to start your next interview loop
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-primary-foreground/85">
          The auth UI is wired for Firebase configuration. The buttons are deliberately non-destructive until project credentials are added.
        </p>
      </div>

      <CardContent className="space-y-4 p-6">
        <div className="rounded-[1.5rem] border border-border bg-muted/55 p-4">
          <CardTitle className="text-base">Current auth readiness</CardTitle>
          <CardDescription className="mt-1">
            {envFlags.firebaseReady
              ? "Firebase public config is present. You can connect real sign-in handlers next."
              : "Firebase env vars are still missing. Add them in `.dev.vars` and `.dev.vars.example` values."}
          </CardDescription>
        </div>

        <Button className="w-full justify-between" variant="outline">
          <span className="inline-flex items-center gap-2">
            <Chrome className="size-4" />
            Continue with Google
          </span>
          <ArrowRight className="size-4" />
        </Button>

        <Button className="w-full justify-between" variant="secondary">
          <span className="inline-flex items-center gap-2">
            <Mail className="size-4" />
            Continue with Email
          </span>
          <ArrowRight className="size-4" />
        </Button>

        <p className="text-sm leading-6 text-muted-foreground">
          Prefer to explore first? Head back to the{" "}
          <Link href="/" className="font-semibold text-primary">
            product dashboard
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
