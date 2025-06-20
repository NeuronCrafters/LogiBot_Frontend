import { Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home/Home";
import { Signup } from "@/pages/Singup/Singup";
import { Signin } from "@/pages/Signin/Signin";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { Chat } from "@/pages/Chat/Chat";
import { Chart } from "@/pages/Chart/Chart";
import { CRUD } from "@/pages/CRUD/CRUD";
import { About } from "@/pages/About/About";
import { List } from "@/pages/List/List";
import ForgotPassword from "@/pages/ForgotPassword/ForgotPassword";
import ResetPassword from "@/pages/ForgotPassword/ResetPassword";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/about" element={<About />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chart" element={<Chart />} />
        <Route path="/crud" element={<CRUD />} />
        <Route path="/list" element={<List />} />
      </Route>
    </Routes>
  );
}
