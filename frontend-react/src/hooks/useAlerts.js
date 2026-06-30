import { useEffect, useState, useCallback } from "react";
import client from "../api/client";

// Polls active low-stock alerts so the sidebar/topbar badges stay live.
export function useAlerts(pollMs = 15000) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await client.get("/alerts", { params: { status: "ACTIVE" } });
      setAlerts(data);
    } catch {
      /* interceptor already toasted */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) return;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { alerts, count: alerts.length, loading, refresh };
}
