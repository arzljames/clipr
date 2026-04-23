import axios from "axios";

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.defaults.withCredentials = false;

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = import.meta.env.VITE_TOKEN;

    if (token) config.headers["Authorization"] = `Bearer ${token}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const handleQueryErrorMessage = (error: Error): string => {
  let errorMessage = "";

  if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Use API error responses if applicable
  if ((error as any)?.response?.data?.error) {
    errorMessage = (error as any).response.data.error;
  }

  return errorMessage;
};

export { axiosInstance, handleQueryErrorMessage };
