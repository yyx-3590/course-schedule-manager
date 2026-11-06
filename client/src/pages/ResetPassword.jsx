import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errorMessages } from "../api/client";
import ErrorList from "../components/ErrorList";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState([]);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setErrors(["The two passwords do not match"]);
      return;
    }
    setErrors([]);
    setBusy(true);
    try {
      await api.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setErrors(errorMessages(err));
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="panel stack auth">
        <h1>Reset link is incomplete</h1>
        <p>This link is missing its token. Ask for a new one.</p>
        <Link to="/forgot-password">Send a new reset link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="panel stack auth">
        <h1>Password updated</h1>
        <p>You can log in with your new password now.</p>
        <Link to="/login">Go to log in</Link>
      </div>
    );
  }

  return (
    <form className="panel stack auth" onSubmit={submit}>
      <h1>Choose a new password</h1>
      <label>New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <label>Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
      <ErrorList errors={errors} />
      <button className="primary" disabled={busy}>Update password</button>
    </form>
  );
}
