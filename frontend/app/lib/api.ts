const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ApiResponse<T = any> = {
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
};

// Base fetch with cookie credentials
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    credentials: 'include', // Send cookies for sessions
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || {
          message: `Request failed with status ${response.status}`,
        },
      };
    }

    return { data };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

// Auth endpoints
export const authApi = {
  register: async (email: string, password: string) => {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login: async (email: string, password: string) => {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    return apiFetch('/api/auth/logout', {
      method: 'POST',
    });
  },

  me: async () => {
    return apiFetch('/api/auth/me');
  },

  verifyEmail: async (token: string) => {
    return apiFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  requestPasswordReset: async (email: string) => {
    return apiFetch('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    return apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
};

// Lab endpoints
export const labApi = {
  passwordComparison: async (password: string) => {
    return apiFetch('/api/lab/password-comparison', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  tokenAnalysis: async (count?: number) => {
    return apiFetch('/api/lab/token-analysis', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  },

  sessionDemo: async (demoType?: string) => {
    return apiFetch('/api/lab/session-demo', {
      method: 'POST',
      body: JSON.stringify({ demo_type: demoType }),
    });
  },

  attackSimulation: async (attackType?: string) => {
    return apiFetch('/api/lab/attack-simulation', {
      method: 'POST',
      body: JSON.stringify({ attack_type: attackType }),
    });
  },
};

export const healthCheck = async () => {
  return apiFetch('/api/health');
};
