import { useEffect, useState } from "react";
import { api } from "../api/client";
import "./ServerNotice.css";

// Free hosting puts the API to sleep when nobody uses it. This wakes it up as soon as
// the page opens, and explains the wait if it takes a while.
export default function ServerNotice() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const show = () => setSlow(true);
    const hide = () => setSlow(false);
    window.addEventListener("api:slow", show);
    window.addEventListener("api:idle", hide);
    api.health().catch(() => {});
    return () => {
      window.removeEventListener("api:slow", show);
      window.removeEventListener("api:idle", hide);
    };
  }, []);

  if (!slow) return null;
  return (
    <p className="server-notice" role="status">
      Waking up the server. The first visit can take up to a minute.
    </p>
  );
}
