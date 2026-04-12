import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

export interface UserMetrics {
  _id?: ObjectId;
  userId?: ObjectId | null;
  email: string;
  totalSessions: number;
  completedSessions: number;
  gradedSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  weeklyCompleted: number;
  weeklyTarget: number;
  lastWeekReset: Date;
  streakDays: number;
  lastSessionDate: Date | null;
  byTrack: Array<{
    trackId: string;
    trackName: string;
    completed: number;
    total: number;
    sessions: number;
    averageScore: number | null;
  }>;
  improvements: Array<{
    id: string;
    title: string;
    tag: string;
    source: string;
    description: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    unlockedAt: Date;
  }>;
  lastUpdated: Date;
}

export class UserMetricsModel {
  private static indexesPromise: Promise<void> | null = null;

  static async initializeMetrics(email: string, userId?: ObjectId): Promise<UserMetrics> {
    await this.ensureIndexes();

    const db = await getMongoDb();
    if (!db) throw new Error("MongoDB not connected");

    const metricsCollection = db.collection<UserMetrics>("userMetrics");
    const now = new Date();
    const metrics = await metricsCollection.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          userId: userId || null,
          email,
          totalSessions: 0,
          completedSessions: 0,
          gradedSessions: 0,
          averageScore: null,
          bestScore: null,
          weeklyCompleted: 0,
          weeklyTarget: 4,
          lastWeekReset: now,
          streakDays: 0,
          lastSessionDate: null,
          byTrack: [],
          improvements: [],
          achievements: [],
          lastUpdated: now,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (!metrics) {
      throw new Error(`Failed to initialize metrics for ${email}`);
    }

    return metrics;
  }

  static async getMetricsByEmail(email: string): Promise<UserMetrics | null> {
    const db = await getMongoDb();
    if (!db) return null;

    const metricsCollection = db.collection<UserMetrics>("userMetrics");
    return await metricsCollection.findOne({ email });
  }

  static async ensureIndexes(): Promise<void> {
    if (!this.indexesPromise) {
      this.indexesPromise = (async () => {
        const db = await getMongoDb();
        if (!db) return;

        const metricsCollection = db.collection<UserMetrics>("userMetrics");
        await metricsCollection.createIndex({ email: 1 }, { unique: true });
      })().catch((error) => {
        this.indexesPromise = null;
        throw error;
      });
    }

    await this.indexesPromise;
  }
}
