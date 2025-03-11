import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { Signin } from "../pages/Signin/Signin";
import { Chat } from "../pages/Chat/Chat";
import { Home } from "../pages/Home/Home";
import { Signup } from "@/pages/Singup/Singup";
import { CRUD } from "@/pages/CRUD/CRUD";
import { About } from "@/pages/About/About";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/crud" element={<CRUD />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
