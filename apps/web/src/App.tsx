import { Navigate, Route, Routes } from "react-router-dom";
import { GoalCreatePage } from "./pages/GoalCreatePage";
import { GoalDetailPage } from "./pages/GoalDetailPage";
import { GoalEditPage } from "./pages/GoalEditPage";
import { GoalsPage } from "./pages/GoalsPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ActivityPage } from "./pages/ActivityPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SessionsPage } from "./pages/SessionsPage";
import { AppShell } from "./shell/AppShell";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/new" element={<GoalCreatePage />} />
        <Route path="/goals/:id" element={<GoalDetailPage />} />
        <Route path="/goals/:id/edit" element={<GoalEditPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
