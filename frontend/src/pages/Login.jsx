import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Boxes, LogIn } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Welcome to TrackOS");
      navigate("/");
    } catch {
      /* interceptor toasts */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass w-full max-w-md rounded-3xl p-8 shadow-glow-violet"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-violet shadow-glow">
            <Boxes size={28} className="text-white" />
          </div>
          <h1 className="gradient-text text-3xl font-extrabold">TRACKOS</h1>
          <p className="mt-1 text-sm text-slate-400">
            Intelligent Inventory &amp; Supply Chain Platform
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet py-3 font-semibold text-white shadow-glow disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Demo credentials: <span className="text-cyan">admin / admin123</span>
        </p>
      </motion.div>
    </div>
  );
}
