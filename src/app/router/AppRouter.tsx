import React, { Suspense } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { Home } from "@/features/home/pages/HomePage";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import ProtectedRoute from "@/app/router/ProtectedRoute";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { Start } from "@/features/home/pages/StartPage";

const Chat = React.lazy(() =>
  import("@/features/chat/pages/ChatPage").then((m) => ({ default: m.Chat })),
);
const Dashboard = React.lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((m) => ({ default: m.Dashboard })),
);
const CreateEntities = React.lazy(() =>
  import("@/features/admin/pages/CreateEntitiesPage").then((m) => ({
    default: m.CreateEntities,
  })),
);
const ManageEntities = React.lazy(() =>
  import("@/features/admin/pages/ManageEntitiesPage").then((m) => ({
    default: m.ManageEntities,
  })),
);
const Profile = React.lazy(() =>
  import("@/features/account/pages/ProfilePage").then((m) => ({ default: m.Profile })),
);
const EntityList = React.lazy(() =>
  import("@/features/admin/pages/EntityListPage").then((m) => ({
    default: m.EntityList,
  })),
);
const Feedback = React.lazy(() =>
  import("@/features/feedback/pages/FeedbackPage").then((m) => ({ default: m.Feedback })),
);
const Quiz = React.lazy(() =>
  import("@/features/quiz/pages/QuizPage").then((m) => ({ default: m.Quiz })),
);
const QuizAttempt = React.lazy(() =>
  import("@/features/quiz/pages/QuizAttemptPage").then((m) => ({ default: m.QuizAttempt })),
);
const ProfessorQuizPage = React.lazy(() =>
  import("@/features/quiz/pages/ProfessorQuizPage").then((m) => ({ default: m.ProfessorQuizPage })),
);
const RagManagementPage = React.lazy(() =>
  import("@/features/rag/pages/RagManagementPage").then((m) => ({ default: m.RagManagementPage })),
);
const FeedbackManagement = React.lazy(() =>
  import("@/features/feedback/pages/FeedbackManagementPage").then((m) => ({ default: m.FeedbackManagementPage })),
);

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-900">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<AuthPage mode="signin" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Start />} />
          <Route
            path="/chat"
            element={
              <Suspense fallback={<PageLoader />}>
                <Chat />
              </Suspense>
            }
          />
          <Route
            path="/quiz"
            element={
              <Suspense fallback={<PageLoader />}>
                <Quiz />
              </Suspense>
            }
          />
          <Route
            path="/quiz/manage"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfessorQuizPage />
              </Suspense>
            }
          />
          <Route
            path="/rag"
            element={
              <Suspense fallback={<PageLoader />}>
                <RagManagementPage />
              </Suspense>
            }
          />
          <Route
            path="/quiz/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <QuizAttempt />
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/entities/create"
            element={<Navigate to="/entities/manage" replace />}
          />
          <Route
            path="/entities/manage"
            element={
              <Suspense fallback={<PageLoader />}>
                <ManageEntities />
              </Suspense>
            }
          />
          <Route
            path="/entities/links/class-disciplines"
            element={<Navigate to="/entities/manage" replace />}
          />
          <Route
            path="/entities/links/professor-disciplines"
            element={<Navigate to="/entities/manage" replace />}
          />
          <Route
            path="/entities/create/:entityType"
            element={
              <Suspense fallback={<PageLoader />}>
                <CreateEntities />
              </Suspense>
            }
          />
          <Route
            path="/entities/edit/:entityType/:id"
            element={<Navigate to="/entities/manage" replace />}
          />
          <Route
            path="/entities"
            element={
              <Suspense fallback={<PageLoader />}>
                <EntityList />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            }
          />
          <Route
            path="/feedback"
            element={
              <Suspense fallback={<PageLoader />}>
                <Feedback />
              </Suspense>
            }
          />
          <Route
            path="/admin/feedbacks"
            element={
              <Suspense fallback={<PageLoader />}>
                <FeedbackManagement />
              </Suspense>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
