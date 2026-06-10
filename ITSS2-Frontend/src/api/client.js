import axios from "axios";
import { API_BASE_URL } from "../config/env";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshRequest = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";
    const isAuthEndpoint = url.includes("/api/v1/auth/login")
      || url.includes("/api/v1/auth/register")
      || url.includes("/api/v1/auth/refresh");

    if (status !== 401 || originalRequest?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshRequest = refreshRequest || apiClient.post("/api/v1/auth/refresh");

    try {
      await refreshRequest;
      return apiClient(originalRequest);
    } finally {
      refreshRequest = null;
    }
  }
);

export default apiClient;
