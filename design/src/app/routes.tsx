import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/root-layout";
import { Dashboard } from "./components/dashboard";
import { PracticeSession } from "./components/practice-session";
import { ReviewFeedback } from "./components/review-feedback";
import { ProfilePage } from "./components/profile-page";
import { CoachPage } from "./components/coach-page";
import { SettingsPage } from "./components/settings-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "profile", Component: ProfilePage },
      { path: "coach", Component: CoachPage },
      { path: "settings", Component: SettingsPage },
      { path: "*", Component: Dashboard },
    ],
  },
  { path: "/practice/:scenarioId", Component: PracticeSession },
  { path: "/review/:scenarioId", Component: ReviewFeedback },
]);