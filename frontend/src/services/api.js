import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to inject Authorization Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bre_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.message?.includes('invalid')) {
      localStorage.removeItem('bre_token');
      localStorage.removeItem('bre_user');
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error('API Error:', message, error);
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// Loan Applications Endpoints
export const applicationApi = {
  apply: async (payload) => {
    const res = await api.post('/applications/apply', payload);
    return res.data;
  },
  getAll: async (status) => {
    const url = status ? `/applications/all?status=${encodeURIComponent(status)}` : '/applications/all';
    const res = await api.get(url);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/applications/${encodeURIComponent(id)}`);
    return res.data;
  },
  evaluateVersion: async (id, targetVersion) => {
    const res = await api.get(`/applications/${encodeURIComponent(id)}/evaluate-version/${targetVersion}`);
    return res.data;
  },
  reRunAndSave: async (id, targetVersion) => {
    const res = await api.post(`/applications/${encodeURIComponent(id)}/rerun/${targetVersion}`);
    return res.data;
  },
  exceptionDecision: async (id, payload) => {
    const res = await api.post(`/applications/${encodeURIComponent(id)}/exception`, payload);
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/applications/audit-logs/all');
    return res.data;
  },
};

// Rules Engine Endpoints
export const rulesApi = {
  getActive: async () => {
    const res = await api.get('/rules/active');
    return res.data;
  },
  getVersions: async () => {
    const res = await api.get('/rules/versions');
    return res.data;
  },
  getByVersion: async (version) => {
    const res = await api.get(`/rules/version/${version}`);
    return res.data;
  },
  createVersion: async (payload) => {
    const res = await api.post('/rules/new-version', payload);
    return res.data;
  },
  patchVersion: async (payload) => {
    const res = await api.post('/rules/patch-version', payload);
    return res.data;
  },
};

// Synthetic Profiles Endpoints
export const syntheticApi = {
  getProfile: async (applicantId) => {
    const res = await api.get(`/synthetic/${encodeURIComponent(applicantId)}`);
    return res.data;
  },
  updateProfile: async (applicantId, payload) => {
    const res = await api.put(`/synthetic/${encodeURIComponent(applicantId)}`, payload);
    return res.data;
  },
};

// Bureau & KYC Gateway Endpoints
export const bureauApi = {
  fetchReport: async (identifier, name) => {
    const res = await api.post('/bureau/fetch-report', { identifier, name });
    return res.data;
  },
  getDemoProfiles: async () => {
    const res = await api.get('/bureau/demo-profiles');
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/bureau/all');
    return res.data;
  },
};

// Credit Exception Intelligence & Case Clustering Endpoints
export const exceptionsApi = {
  getClusters: async () => {
    const res = await api.get('/exceptions/clusters');
    return res.data;
  },
  getL2Queue: async () => {
    const res = await api.get('/exceptions/l2-queue');
    return res.data;
  },
  getArchetypes: async () => {
    const res = await api.get('/exceptions/archetypes');
    return res.data;
  },
  batchDecision: async (payload) => {
    const res = await api.post('/exceptions/batch-decision', payload);
    return res.data;
  },
  escalateToL2: async (id, payload) => {
    const res = await api.post(`/exceptions/escalate/${encodeURIComponent(id)}`, payload);
    return res.data;
  },
};

// AI Intelligence Suite Endpoints
export const aiApi = {
  copilotChat: async (payload) => {
    const res = await api.post('/ai/copilot/chat', payload);
    return res.data;
  },
  stressTestSimulate: async (payload) => {
    const res = await api.post('/ai/stress-test/simulate', payload);
    return res.data;
  },
  getFraudCases: async () => {
    const res = await api.get('/ai/fraud/cases');
    return res.data;
  },
  analyzeFraud: async (payload) => {
    const res = await api.post('/ai/fraud/analyze', payload);
    return res.data;
  },
  optimizePricing: async (payload) => {
    const res = await api.post('/ai/pricing/optimize', payload);
    return res.data;
  },
};

// Statement Extraction Endpoint
export const extractApi = {
  extractStatement: async (formDataObj) => {
    const res = await api.post('/extract-statement', formDataObj, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

// Health Check Endpoint
export const healthApi = {
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },
};

// Macroeconomic Market & RBI Repo Benchmark Endpoints
export const macroApi = {
  getCurrent: async () => {
    const res = await api.get('/macro/current');
    return res.data;
  },
  updateBenchmark: async (payload) => {
    const res = await api.post('/macro/update-benchmark', payload);
    return res.data;
  },
  reset: async () => {
    const res = await api.post('/macro/reset');
    return res.data;
  },
  calculateApr: async (payload) => {
    const res = await api.post('/macro/calculate-apr', payload);
    return res.data;
  }
};

export default api;
