import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessages } from "../api/client";
import ErrorList from "../components/ErrorList";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      await api.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setErrors(errorMessages(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="panel stack auth">
        <h1>Check your email</h1>
        <p>If {email} is registered, we sent a link to choose a new password. The link works for 30 minutes.</p>
        <Link to="/login">Back to log in</Link>
      </div>
    );
  }

  return (
    <form className="panel stack auth" onSubmit={submit}>
      <h1>Forgot your password?</h1>
      <p className="muted">Enter your email and we will send you a link to choose a new one.</p>
      <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <ErrorList errors={errors} />
      <button className="primary" disabled={busy}>Send reset link</button>
      <p><Link to="/login">Back to log in</Link></p>
    </form>
  );
}
