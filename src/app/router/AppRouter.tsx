import { PasswordRecoveryPage } from "@/features/auth/pages/PasswordRecoveryPage";
import React, { Suspense } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { Home } from "@/features/home/pages/HomePage";
import { NotFoundPage } from "@/features/home/pages/NotFoundPage";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import ProtectedRoute from "@/app/router/ProtectedRoute";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { Start } from "@/features/home/pages/StartPage";
import { NavigationTransition } from "@/shared/navigation/NavigationTransition";
import { preloadQuizAttemptPage } from "@/shared/navigation/preloadQuiz";
import { preloadPracticePage } from "@/shared/navigation/preloadPractice";

const Chat = React.lazy(() =>
  import("@/features/chat/pages/ChatPage").then((m) => ({ default: m.Chat })),
);
const Dashboard = React.lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((m) => ({ default: m.Dashboard })),
);
const InstitutionPage = React.lazy(() =>
  import("@/features/institutions/pages/InstitutionPage").then((m) => ({ default: m.InstitutionPage })),
);
const ConceptPanel = React.lazy(() =>
  import("@/features/concepts/pages/ConceptPanelPage").then((m) => ({ default: m.ConceptPanelPage })),
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
  preloadQuizAttemptPage().then((m) => ({ default: m.QuizAttempt })),
);
const ProfessorQuizPage = React.lazy(() =>
  import("@/features/quiz/pages/ProfessorQuizPage").then((m) => ({ default: m.ProfessorQuizPage })),
);
const RagManagementPage = React.lazy(() =>
  import("@/features/rag/pages/RagManagementPage").then((m) => ({ default: m.RagManagementPage })),
);
const PracticePage = React.lazy(() =>
  preloadPracticePage().then((m) => ({ default: m.PracticePage })),
);
const QuestionBankPage = React.lazy(() =>
  import("@/features/questions/pages/QuestionBankPage").then((m) => ({ default: m.QuestionBankPage })),
);
const QuestionEditorPage = React.lazy(() =>
  import("@/features/questions/pages/QuestionEditorPage").then((m) => ({ default: m.QuestionEditorPage })),
);
const StudentExamsPage = React.lazy(() =>
  import("@/features/exams/pages/StudentExamsPage").then((m) => ({ default: m.StudentExamsPage })),
);
const ExamTakePage = React.lazy(() =>
  import("@/features/exams/pages/ExamTakePage").then((m) => ({ default: m.ExamTakePage })),
);
const ExamManageListPage = React.lazy(() =>
  import("@/features/exams/pages/ExamManageListPage").then((m) => ({ default: m.ExamManageListPage })),
);
const ExamEditorPage = React.lazy(() =>
  import("@/features/exams/pages/ExamEditorPage").then((m) => ({ default: m.ExamEditorPage })),
);
const ExamManageDetailPage = React.lazy(() =>
  import("@/features/exams/pages/ExamManageDetailPage").then((m) => ({ default: m.ExamManageDetailPage })),
);
const BlindReviewPage = React.lazy(() =>
  import("@/features/exams/pages/BlindReviewPage").then((m) => ({ default: m.BlindReviewPage })),
);
const ExamResultsPage = React.lazy(() =>
  import("@/features/exams/pages/ExamResultsPage").then((m) => ({ default: m.ExamResultsPage })),
);
const DevPage = React.lazy(() =>
  import("@/features/dev/pages/DevPage").then((m) => ({ default: m.DevPage })),
);
const FeatureReleasePage = React.lazy(() =>
  import("@/features/release/pages/FeatureReleasePage").then((m) => ({ default: m.FeatureReleasePage })),
);
const ChatFeedbackAdminPage = React.lazy(() =>
  import("@/features/chat/pages/ChatFeedbackAdminPage").then((m) => ({ default: m.ChatFeedbackAdminPage })),
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
    <NavigationTransition>{location => <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<AuthPage mode="signin" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
      <Route path="/reset-password" element={<PasswordRecoveryPage reset />} />

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
            path="/practice"
            element={
              <Suspense fallback={<PageLoader />}>
                <PracticePage />
              </Suspense>
            }
          />
          <Route
            path="/practice/:exercise"
            element={
              <Suspense fallback={<PageLoader />}>
                <PracticePage />
              </Suspense>
            }
          />
          <Route
            path="/questions"
            element={
              <Suspense fallback={<PageLoader />}>
                <QuestionBankPage />
              </Suspense>
            }
          />
          <Route
            path="/questions/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <QuestionEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/questions/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <QuestionEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/exams"
            element={
              <Suspense fallback={<PageLoader />}>
                <StudentExamsPage />
              </Suspense>
            }
          />
          <Route
            path="/exams/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ExamTakePage />
              </Suspense>
            }
          />
          <Route
            path="/exams/manage"
            element={
              <Suspense fallback={<PageLoader />}>
                <ExamManageListPage />
              </Suspense>
            }
          />
          <Route
            path="/exams/manage/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <ExamEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/exams/manage/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ExamManageDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/exams/manage/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <ExamEditorPage />
              </Suspense>
            }
          />
          <Route
            path="/exams/manage/:id/review"
            element={
              <Suspense fallback={<PageLoader />}>
                <BlindReviewPage />
              </Suspense>
            }
          />
          <Route
            path="/exams/manage/:id/results"
            element={
              <Suspense fallback={<PageLoader />}>
                <ExamResultsPage />
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
            path="/institution"
            element={
              <Suspense fallback={<PageLoader />}>
                <InstitutionPage />
              </Suspense>
            }
          />
          <Route
            path="/institution/:institutionId"
            element={
              <Suspense fallback={<PageLoader />}>
                <InstitutionPage />
              </Suspense>
            }
          />
          <Route
            path="/concepts"
            element={
              <Suspense fallback={<PageLoader />}>
                <ConceptPanel />
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
            path="/dev"
            element={
              <Suspense fallback={<PageLoader />}>
                <DevPage />
              </Suspense>
            }
          />
          <Route
            path="/admin/features"
            element={
              <Suspense fallback={<PageLoader />}>
                <FeatureReleasePage />
              </Suspense>
            }
          />
          <Route
            path="/admin/chat-feedback"
            element={
              <Suspense fallback={<PageLoader />}>
                <ChatFeedbackAdminPage />
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>}</NavigationTransition>
  );
}
