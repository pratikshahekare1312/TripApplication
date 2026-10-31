export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trip-planner-backend-6fp4.onrender.com';
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}/api/generate-plan`;

export default {
  API_BASE_URL,
  API_URL
};

