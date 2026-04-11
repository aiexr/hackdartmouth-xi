"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, Chrome, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SignInCard() {
  return (
    <Card className="w-full max-w-xl overflow-hidden bg-white/90">
      <div className="bg-linear-to-r from-primary to-indigo-500 px-6 py-5 text-primary-foreground">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
          <ShieldCheck className="size-3.5" />
          Secure sign-in
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Sign in to start your next interview loop
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-primary-foreground/85">
          Sign in with Google to save your progress, track scores, and get
          personalized interview feedback.
        </p>
      </div>

      <CardContent className="space-y-4 p-6">
        <Button
          className="w-full justify-between"
          variant="outline"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <span className="inline-flex items-center gap-2">
            <Chrome className="size-4" />
            Continue with Google
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
