import axios from "axios";

const api = axios.create({
  baseURL: `${window.location.protocol}//${
    window.location.hostname === "localhost"
      ? "localhost"
      : window.location.hostname
  }:5001/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
