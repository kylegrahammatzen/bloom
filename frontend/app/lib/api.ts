import type { BloomResponse } from './bloom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<BloomResponse<T>> {
  const url = `${API_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    credentials: 'include',
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
        error: {
          message: data.error?.message || `Request failed with status ${response.status}`,
          status: response.status,
          statusText: response.statusText,
          details: data.error?.details,
        },
      };
    }

    return { data };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        status: 0,
        statusText: 'Network Error',
      },
    };
  }
}

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
