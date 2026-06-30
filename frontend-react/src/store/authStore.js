import { create } from "zustand";
import client from "../api/client";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem("nexus_token") || null,
  username: localStorage.getItem("nexus_user") || null,

  async login(username, password) {
    const { data } = await client.post("/auth/login", { username, password });
    localStorage.setItem("nexus_token", data.access_token);
    localStorage.setItem("nexus_user", data.username);
    set({ token: data.access_token, username: data.username });
    return data;
  },

  logout() {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_user");
    set({ token: null, username: null });
  },
}));
