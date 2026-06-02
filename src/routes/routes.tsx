import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home/Home";
import { Signup } from "@/pages/Signup/Signup";
import { Login } from "@/pages/Login/Login";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { Start } from "@/pages/Start/Start";

const Chat         = React.lazy(() => import("@/pages/Chat/Chat").then(m => ({ default: m.Chat })));
const Dashboard    = React.lazy(() => import("@/pages/Dashboard/Dashboard").then(m => ({ default: m.Dashboard })));
const CreateEntities = React.lazy(() => import("@/pages/CreateEntities/CreateEntities").then(m => ({ default: m.CreateEntities })));
const Profile      = React.lazy(() => import("@/pages/Profile/Profile").then(m => ({ default: m.Profile })));
const EntityList   = React.lazy(() => import("@/pages/EntityList/EntityList").then(m => ({ default: m.EntityList })));
const Feedback     = React.lazy(() => import("@/pages/Feedback/Feedback").then(m => ({ default: m.Feedback })));
const Quiz         = React.lazy(() => import("@/pages/Quiz/Quiz").then(m => ({ default: m.Quiz })));

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-900">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/"       element={<Home />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/inicio"       element={<Start />} />
          <Route element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>}          path="/chat" />
          <Route element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>}     path="/chart" />
          <Route element={<Suspense fallback={<PageLoader />}><CreateEntities /></Suspense>} path="/crud" />
          <Route element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>}       path="/about" />
          <Route element={<Suspense fallback={<PageLoader />}><EntityList /></Suspense>}    path="/list" />
          <Route element={<Suspense fallback={<PageLoader />}><Feedback /></Suspense>}      path="/feedbacks/send" />
          <Route element={<Suspense fallback={<PageLoader />}><Quiz /></Suspense>}          path="/quiz" />
        </Route>
      </Route>
    </Routes>
  );
}
