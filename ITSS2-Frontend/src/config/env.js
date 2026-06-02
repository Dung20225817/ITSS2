export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

export const DEFAULT_USER_ID =
  import.meta.env.VITE_DEFAULT_USER_ID || "682b71380c69774bd1f056bd";
