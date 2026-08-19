const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("codex_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { 
    "Content-Type": "application/json",
    "x-daytona-preview-token": "h4ofuiw3i3briy2l634cohckoe0jl0cd"
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = data?.detail || "حصل خطأ غير متوقع، حاول تاني";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data;
}

export const api = {
  // ---------------- Auth ----------------
  register: (username, email, password) =>
    request("/api/v1/auth/register", {
      method: "POST",
      auth: false,
      body: { username, email, password },
    }),

  login: async (username, password) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "x-daytona-preview-token": "h4ofuiw3i3briy2l634cohckoe0jl0cd"
      },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "بيانات الدخول غلط");
    return data;
  },

  me: () => request("/api/v1/auth/me"),

  updateMe: (payload) => request("/api/v1/auth/me", { method: "PUT", body: payload }),

  // ---------------- Projects ----------------
  listProjects: () => request("/api/v1/projects"),

  createProject: (payload) => request("/api/v1/projects", { method: "POST", body: payload }),

  getProject: (projectId) => request(`/api/v1/projects/${projectId}`),

  // ---------------- Documents (system-owned sources — admin only) ----------------
  listDocuments: (projectId) => request(`/api/v1/projects/${projectId}/documents`),

  registerDocument: (projectId, payload) =>
    request(`/api/v1/projects/${projectId}/documents`, { method: "POST", body: payload }),

  ingestDocument: (documentId, reset = false) =>
    request(`/api/v1/documents/${documentId}/ingest`, { method: "POST", body: { reset } }),

  documentStatus: (documentId) => request(`/api/v1/documents/${documentId}/status`),

  getJob: (jobId) => request(`/api/v1/jobs/${jobId}`),

  // ---------------- Conversations / Messages ----------------
  listConversations: (projectId) => request(`/api/v1/projects/${projectId}/conversations`),

  createConversation: (projectId, title) =>
    request(`/api/v1/projects/${projectId}/conversations`, { method: "POST", body: { title } }),

  listMessages: (conversationId) => request(`/api/v1/conversations/${conversationId}/messages`),

  sendMessage: (conversationId, query, topK = 5) =>
    request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { query, top_k: topK },
    }),

  // ---------------- Debug retrieve ----------------
  debugRetrieve: (projectId, query, topK = 5) =>
    request(`/api/v1/projects/${projectId}/retrieve`, {
      method: "POST",
      body: { query, top_k: topK },
    }),

  // ---------------- Evaluations ----------------
  runEvaluation: (projectId, cases, topK = 5) =>
    request(`/api/v1/projects/${projectId}/evaluations`, {
      method: "POST",
      body: { cases, top_k: topK },
    }),
};

export { getToken };
