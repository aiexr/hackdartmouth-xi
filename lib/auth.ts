import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { UserModel, UserMetricsModel } from "@/lib/models";

const googleAuthReady = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const authOptions: NextAuthOptions = {
  providers: googleAuthReady
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // Create or retrieve user in MongoDB
        const dbUser = await UserModel.findOrCreateUser(
          user.email,
          user.name || "User",
          user.image || "",
          account?.provider || "unknown"
        );

        // Initialize metrics if new user
        await UserMetricsModel.initializeMetrics(user.email, dbUser._id);

        return true;
      } catch (error) {
        console.error("Failed to create user on signin:", error);
        // Allow signin even if DB fails (graceful degradation)
        return true;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
};

export async function getOptionalServerSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    console.error("Failed to resolve NextAuth server session.", error);
    return null;
  }
}
