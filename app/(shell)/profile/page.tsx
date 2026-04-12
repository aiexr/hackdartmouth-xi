import { ProfilePageClient } from "@/components/app/profile-page-client";
import type { Interview } from "@/lib/models";
import type { User } from "@/lib/models/User";
import { getOptionalServerSession } from "@/lib/auth";
import { getUserInterviewMetrics } from "@/lib/interview-metrics";
import { InterviewModel, UserModel } from "@/lib/models";

export const dynamic = "force-dynamic";

type ClientProfile = {
  email: string;
  name: string;
  image: string;
  bio: string | null;
  hasResumeContext: boolean;
};

type ClientInterviewRecord = {
  _id?: string;
  scenarioId?: string | null;
  status?: string | null;
  transcript?: unknown[];
  overallScore?: number | null;
  letterGrade?: string | null;
  gradingError?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializeProfile(
  email: string,
  user: User | null,
  fallbackName: string,
  fallbackImage: string,
): ClientProfile {
  return {
    email,
    name: user?.name ?? fallbackName,
    image: user?.image ?? fallbackImage,
    bio: user?.bio ?? null,
    hasResumeContext: Boolean(user?.resumeExtractedText?.trim()),
  };
}

function serializeInterview(interview: Interview): ClientInterviewRecord {
  const gradingError =
    typeof (interview as Interview & { gradingError?: unknown }).gradingError === "string"
      ? ((interview as Interview & { gradingError?: string }).gradingError ?? null)
      : null;

  return {
    _id: interview._id ? String(interview._id) : undefined,
    scenarioId: interview.scenarioId ?? null,
    status: interview.status ?? null,
    transcript: Array.isArray(interview.transcript) ? interview.transcript : [],
    overallScore: typeof interview.overallScore === "number" ? interview.overallScore : null,
    letterGrade: typeof interview.letterGrade === "string" ? interview.letterGrade : null,
    gradingError,
    createdAt: toIsoString(interview.createdAt),
    completedAt: toIsoString(interview.completedAt),
  };
}

export default async function ProfilePage() {
  const session = await getOptionalServerSession().catch(() => null);

  if (!session?.user?.email) {
    const metrics = await getUserInterviewMetrics();

    return (
      <ProfilePageClient
        initialData={{
          isAuthenticated: false,
          profile: null,
          metrics,
          interviews: [],
        }}
      />
    );
  }

  const email = session.user.email;
  const fallbackName = session.user.name ?? "Guest user";
  const fallbackImage = session.user.image ?? "";

  const [metrics, user, interviews] = await Promise.all([
    getUserInterviewMetrics(email),
    UserModel.findOrCreateUser(
      email,
      session.user.name ?? "",
      session.user.image ?? "",
      "google",
    ).catch(() => UserModel.getUserByEmail(email).catch(() => null)),
    InterviewModel.getInterviewsByUser(email).catch(() => []),
  ]);

  return (
    <ProfilePageClient
      initialData={{
        isAuthenticated: true,
        profile: serializeProfile(email, user, fallbackName, fallbackImage),
        metrics,
        interviews: interviews.map(serializeInterview),
      }}
    />
  );
}
