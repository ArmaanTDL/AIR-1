import axios from "axios";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({ baseURL });

// Attach JWT on every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("nexus_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surface backend errors (esp. ACID rollbacks) as readable toasts.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const detail = error?.response?.data?.detail;
    let message = "Request failed";
    if (typeof detail === "string") message = detail;
    else if (detail?.error) message = detail.error;
    else if (Array.isArray(detail)) message = detail[0]?.msg || message;

    if (error?.response?.status === 401) {
      localStorage.removeItem("nexus_token");
      if (!location.pathname.startsWith("/login")) location.assign("/login");
    } else {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default client;
