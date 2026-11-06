import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { errorMessages } from "../api/client";
import ErrorList from "../components/ErrorList";
import { useAuth } from "../context/AuthContext";

export default function Auth({ mode }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      if (isRegister) await register(form.username, form.email, form.password);
      else await login(form.email, form.password);
    } catch (err) {
      setErrors(errorMessages(err));
      setBusy(false);
    }
  };

  return (
    <form className="panel stack auth" onSubmit={submit}>
      <h1>{isRegister ? "Create your account" : "Log in"}</h1>
      {isRegister && (
        <label>Username<input required minLength={2} autoComplete="username" value={form.username} onChange={set("username")} /></label>
      )}
      <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={set("email")} /></label>
      <label>
        Password
        <input type="password" required minLength={isRegister ? 8 : 1} autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={set("password")} />
      </label>
      {!isRegister && <Link to="/forgot-password">Forgot your password?</Link>}
      <ErrorList errors={errors} />
      <button className="primary" disabled={busy}>{isRegister ? "Create account" : "Log in"}</button>
      <p>
        {isRegister ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}
      </p>
    </form>
  );
}
