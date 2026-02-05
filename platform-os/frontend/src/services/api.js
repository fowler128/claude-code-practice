/**
 * API service for BizDeedz Platform OS
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth token (if needed)
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const api = {
  // ============================================================================
  // MATTERS
  // ============================================================================

  getMatters: async (params = {}) => {
    const response = await apiClient.get('/matters', { params });
    return response.data;
  },

  getMatterById: async (id) => {
    const response = await apiClient.get(`/matters/${id}`);
    return response.data;
  },

  createMatter: async (matterData) => {
    const response = await apiClient.post('/matters', matterData);
    return response.data;
  },

  updateMatterStatus: async (id, statusData) => {
    const response = await apiClient.patch(`/matters/${id}/status`, statusData);
    return response.data;
  },

  getMatterTimeline: async (id) => {
    const response = await apiClient.get(`/matters/${id}/timeline`);
    return response.data;
  },

  // ============================================================================
  // TASKS
  // ============================================================================

  getMatterTasks: async (matterId, params = {}) => {
    const response = await apiClient.get(`/matters/${matterId}/tasks`, { params });
    return response.data;
  },

  createTask: async (matterId, taskData) => {
    const response = await apiClient.post(`/matters/${matterId}/tasks`, taskData);
    return response.data;
  },

  updateTask: async (taskId, taskData) => {
    const response = await apiClient.patch(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // ============================================================================
  // ARTIFACTS
  // ============================================================================

  getMatterArtifacts: async (matterId) => {
    const response = await apiClient.get(`/matters/${matterId}/artifacts`);
    return response.data;
  },

  uploadArtifact: async (matterId, artifactData) => {
    const response = await apiClient.post(`/matters/${matterId}/artifacts`, artifactData);
    return response.data;
  },

  updateArtifact: async (artifactId, artifactData) => {
    const response = await apiClient.patch(`/artifacts/${artifactId}`, artifactData);
    return response.data;
  },

  // ============================================================================
  // AI RUNS
  // ============================================================================

  getMatterAIRuns: async (matterId) => {
    const response = await apiClient.get(`/matters/${matterId}/ai-runs`);
    return response.data;
  },

  createAIRun: async (matterId, aiRunData) => {
    const response = await apiClient.post(`/matters/${matterId}/ai-runs`, aiRunData);
    return response.data;
  },

  approveAIRun: async (aiRunId, approvalData) => {
    const response = await apiClient.post(`/ai-runs/${aiRunId}/approve`, approvalData);
    return response.data;
  },

  rejectAIRun: async (aiRunId, rejectionData) => {
    const response = await apiClient.post(`/ai-runs/${aiRunId}/reject`, rejectionData);
    return response.data;
  },

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  getAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics', { params });
    return response.data;
  },

  getCycleTimeData: async (params = {}) => {
    const response = await apiClient.get('/analytics/cycle-time', { params });
    return response.data;
  },

  getDefectData: async (params = {}) => {
    const response = await apiClient.get('/analytics/defects', { params });
    return response.data;
  },

  getSLAComplianceData: async (params = {}) => {
    const response = await apiClient.get('/analytics/sla-compliance', { params });
    return response.data;
  },

  getWeeklyOpsBrief: async () => {
    const response = await apiClient.get('/analytics/ops-brief');
    return response.data;
  },

  // ============================================================================
  // CONTROLLED LISTS
  // ============================================================================

  getPracticeAreas: async () => {
    const response = await apiClient.get('/practice-areas');
    return response.data;
  },

  getMatterTypes: async (practiceAreaId = null) => {
    const params = practiceAreaId ? { practice_area_id: practiceAreaId } : {};
    const response = await apiClient.get('/matter-types', { params });
    return response.data;
  },

  getDefectReasons: async () => {
    const response = await apiClient.get('/defect-reasons');
    return response.data;
  },

  getArtifactTypes: async () => {
    const response = await apiClient.get('/artifact-types');
    return response.data;
  }
};

export default api;
