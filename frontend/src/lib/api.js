import axios from "axios";

// Base URL for backend API.
// - In production (Render): set VITE_API_BASE_URL to your backend URL, e.g. https://your-backend.onrender.com
// - In local dev: default keeps current behavior
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
});


