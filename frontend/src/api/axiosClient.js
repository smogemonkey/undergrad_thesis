import axios from "axios";
const publicUrl = [
  "/auth/login",
]

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    if (publicUrl.includes(config.url)) {
      return config;
    }
    const token = localStorage.getItem("jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401 && !publicUrl.includes(error.config.url)) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;