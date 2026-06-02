import { Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home/Home";
import { Signup } from "@/pages/Signup/Signup";
import { Login } from "@/pages/Login/Login";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { Chat } from "@/pages/Chat/Chat";
import { Dashboard } from "@/pages/Dashboard/Dashboard";
import { CreateEntities } from "@/pages/CreateEntities/CreateEntities";
import { Profile } from "@/pages/Profile/Profile";
import { EntityList } from "@/pages/EntityList/EntityList";
import { Feedback } from "@/pages/Feedback/Feedback";
import { Quiz } from "@/pages/Quiz/Quiz";
import { Start } from "@/pages/Start/Start";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/about" element={<Profile />} />
          <Route path="/inicio" element={<Start />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chart" element={<Dashboard />} />
          <Route path="/crud" element={<CreateEntities />} />
          <Route path="/list" element={<EntityList />} />
          <Route path="/feedbacks/send" element={<Feedback />} />
          <Route path="/quiz" element={<Quiz />} />
        </Route>
      </Route>
    </Routes>
  );
}
