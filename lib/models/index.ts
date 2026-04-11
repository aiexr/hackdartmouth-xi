export { UserModel, type User } from "@/lib/models/User";
export { UserMetricsModel, type UserMetrics } from "@/lib/models/UserMetrics";
export { InterviewModel, type Interview } from "@/lib/models/Interview";

import { UserModel } from "@/lib/models/User";
import { UserMetricsModel } from "@/lib/models/UserMetrics";
import { InterviewModel } from "@/lib/models/Interview";

export async function initializeAllIndexes(): Promise<void> {
  try {
    await Promise.all([
      UserModel.ensureIndexes(),
      UserMetricsModel.ensureIndexes(),
      InterviewModel.ensureIndexes(),
    ]);
    console.log("✓ MongoDB indexes initialized");
  } catch (error) {
    console.error("Failed to initialize MongoDB indexes:", error);
    throw error;
  }
}
