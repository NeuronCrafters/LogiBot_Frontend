import { Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home/Home";
import { Signup } from "@/pages/Singup/Singup";
import { Signin } from "@/pages/Signin/Signin";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { Chat } from "@/pages/Chat/Chat";
import { Chart } from "@/pages/Chart/Chart";
import { CRUD } from "@/pages/CRUD/CRUD";
import { About } from "@/pages/About/About";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/about" element={<About />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chart" element={<Chart />} />
        <Route path="/crud" element={<CRUD />} />
      </Route>
    </Routes>
  );
}
