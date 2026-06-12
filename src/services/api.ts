import axios from "axios";

// Create automated axios instance for backend coordination
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Auto inject JWT token inside request authorization headers if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("resume_analyzer_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
