import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Auth from "./pages/Auth";
import ServerNotice from "./components/ServerNotice";
import Courses from "./pages/Courses";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ScheduleView from "./pages/ScheduleView";

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <span className="brand">Course Schedule</span>
        {user && (
          <div className="topbar-right">
            <nav>
              <NavLink to="/" end>Courses</NavLink>
              <NavLink to="/schedule">Weekly schedule</NavLink>
            </nav>
            <span className="user">{user.username}</span>
            <button onClick={logout}>Log out</button>
          </div>
        )}
      </header>
      <ServerNotice />
      <main>
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Protected><Courses /></Protected>} />
          <Route path="/schedule" element={<Protected><ScheduleView /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
