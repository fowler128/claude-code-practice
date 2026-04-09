import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  Matter,
  Task,
  CreateMatterRequest,
  CreateTaskRequest,
  PracticeArea,
  MatterType,
  ArtifactType,
  DefectReason,
  Event,
  ContentIdea,
  ContentDraft,
  ContentCalendarEntry,
  ContentPerformance,
  CreateContentIdeaRequest,
  UpdateContentIdeaRequest,
  CreateContentDraftRequest,
  UpdateContentDraftRequest,
  UpdateContentDraftQARequest,
  CreateContentCalendarRequest,
  CreateContentPerformanceRequest,
  ContentOpsDashboard,
  ContentReviewQueueItem,
} from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: any): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Matters API
export const mattersApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/matters', { params });
    return response.data;
  },

  getById: async (matterId: string): Promise<Matter> => {
    const response = await api.get(`/matters/${matterId}`);
    return response.data;
  },

  create: async (data: CreateMatterRequest): Promise<Matter> => {
    const response = await api.post('/matters', data);
    return response.data;
  },

  update: async (matterId: string, data: Partial<Matter>): Promise<Matter> => {
    const response = await api.put(`/matters/${matterId}`, data);
    return response.data;
  },

  delete: async (matterId: string) => {
    const response = await api.delete(`/matters/${matterId}`);
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  getByMatter: async (matterId: string): Promise<Task[]> => {
    const response = await api.get(`/matters/${matterId}/tasks`);
    return response.data;
  },

  getMyTasks: async (status?: string): Promise<Task[]> => {
    const response = await api.get('/tasks/my', { params: { status } });
    return response.data;
  },

  create: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (taskId: string, data: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data;
  },

  delete: async (taskId: string) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
};

// Controlled Lists API
export const controlledListsApi = {
  getPracticeAreas: async (): Promise<PracticeArea[]> => {
    const response = await api.get('/practice-areas');
    return response.data;
  },

  getMatterTypes: async (practiceAreaId?: string): Promise<MatterType[]> => {
    const response = await api.get('/matter-types', {
      params: practiceAreaId ? { practice_area_id: practiceAreaId } : {},
    });
    return response.data;
  },

  getArtifactTypes: async (): Promise<ArtifactType[]> => {
    const response = await api.get('/artifact-types');
    return response.data;
  },

  getDefectReasons: async (): Promise<DefectReason[]> => {
    const response = await api.get('/defect-reasons');
    return response.data;
  },
};

// Events API
export const eventsApi = {
  getAll: async (limit?: number): Promise<Event[]> => {
    const response = await api.get('/events', { params: { limit } });
    return response.data;
  },

  getByMatter: async (matterId: string, limit?: number): Promise<Event[]> => {
    const response = await api.get('/events', { params: { matter_id: matterId, limit } });
    return response.data;
  },
};

// Work Orders API
export const workOrdersApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/work-orders', { params });
    return response.data;
  },

  getById: async (workOrderId: string) => {
    const response = await api.get(`/work-orders/${workOrderId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/work-orders/stats');
    return response.data;
  },

  updateStatus: async (workOrderId: string, status: string) => {
    const response = await api.put(`/work-orders/${workOrderId}/status`, { status });
    return response.data;
  },
};

// Mission Control API
export const missionControlApi = {
  getDashboard: async () => {
    const response = await api.get('/mission-control/dashboard');
    return response.data;
  },

  getAnalytics: async (days?: number) => {
    const response = await api.get('/mission-control/analytics', { params: { days } });
    return response.data;
  },

  getCronJobs: async () => {
    const response = await api.get('/mission-control/cron-jobs');
    return response.data;
  },

  runPreflight: async (workOrderId: string) => {
    const response = await api.post(`/work-orders/${workOrderId}/preflight`);
    return response.data;
  },

  executeWorkOrder: async (workOrderId: string) => {
    const response = await api.post(`/work-orders/${workOrderId}/execute`);
    return response.data;
  },

  approveWorkOrder: async (workOrderId: string) => {
    const response = await api.post(`/work-orders/${workOrderId}/approve`);
    return response.data;
  },
};

// Content Ops API
export const contentOpsApi = {
  // Dashboard & Analytics
  getDashboard: async (): Promise<ContentOpsDashboard> => {
    const response = await api.get('/content/dashboard');
    return response.data;
  },

  getReviewQueue: async (): Promise<ContentReviewQueueItem[]> => {
    const response = await api.get('/content/review-queue');
    return response.data;
  },

  getTopPerforming: async (limit?: number) => {
    const response = await api.get('/content/top-performing', { params: { limit } });
    return response.data;
  },

  // Content Ideas
  getIdeas: async (params?: any): Promise<ContentIdea[]> => {
    const response = await api.get('/content/ideas', { params });
    return response.data;
  },

  getIdeaById: async (id: string): Promise<ContentIdea> => {
    const response = await api.get(`/content/ideas/${id}`);
    return response.data;
  },

  createIdea: async (data: CreateContentIdeaRequest): Promise<ContentIdea> => {
    const response = await api.post('/content/ideas', data);
    return response.data;
  },

  updateIdea: async (id: string, data: UpdateContentIdeaRequest): Promise<ContentIdea> => {
    const response = await api.put(`/content/ideas/${id}`, data);
    return response.data;
  },

  approveIdea: async (id: string): Promise<ContentIdea> => {
    const response = await api.post(`/content/ideas/${id}/approve`);
    return response.data;
  },

  deleteIdea: async (id: string) => {
    const response = await api.delete(`/content/ideas/${id}`);
    return response.data;
  },

  // Content Drafts
  getDrafts: async (params?: any): Promise<ContentDraft[]> => {
    const response = await api.get('/content/drafts', { params });
    return response.data;
  },

  getDraftById: async (id: string): Promise<ContentDraft> => {
    const response = await api.get(`/content/drafts/${id}`);
    return response.data;
  },

  createDraft: async (data: CreateContentDraftRequest): Promise<ContentDraft> => {
    const response = await api.post('/content/drafts', data);
    return response.data;
  },

  updateDraft: async (id: string, data: UpdateContentDraftRequest): Promise<ContentDraft> => {
    const response = await api.put(`/content/drafts/${id}`, data);
    return response.data;
  },

  updateDraftQA: async (id: string, data: UpdateContentDraftQARequest): Promise<ContentDraft> => {
    const response = await api.put(`/content/drafts/${id}/qa`, data);
    return response.data;
  },

  deleteDraft: async (id: string) => {
    const response = await api.delete(`/content/drafts/${id}`);
    return response.data;
  },

  // Content Calendar
  getCalendar: async (params?: any): Promise<ContentCalendarEntry[]> => {
    const response = await api.get('/content/calendar', { params });
    return response.data;
  },

  createCalendarEntry: async (data: CreateContentCalendarRequest): Promise<ContentCalendarEntry> => {
    const response = await api.post('/content/calendar', data);
    return response.data;
  },

  updateCalendarEntry: async (id: string, data: any): Promise<ContentCalendarEntry> => {
    const response = await api.put(`/content/calendar/${id}`, data);
    return response.data;
  },

  deleteCalendarEntry: async (id: string) => {
    const response = await api.delete(`/content/calendar/${id}`);
    return response.data;
  },

  // Content Performance
  getPerformance: async (params?: any): Promise<ContentPerformance[]> => {
    const response = await api.get('/content/performance', { params });
    return response.data;
  },

  createPerformance: async (data: CreateContentPerformanceRequest): Promise<ContentPerformance> => {
    const response = await api.post('/content/performance', data);
    return response.data;
  },
};

export default api;
