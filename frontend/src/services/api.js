// API service for WhatsApp Clone
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

// Generic fetch wrapper with error handling
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    console.log(`🌐 API Request: ${finalOptions.method || 'GET'} ${url}`);
    
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    console.log(`✅ API Response: ${finalOptions.method || 'GET'} ${url}`, data);
    
    return data;
  } catch (error) {
    console.error(`❌ API Error: ${finalOptions.method || 'GET'} ${url}`, error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      { originalError: error }
    );
  }
};

// API methods
export const api = {
  // Health check
  async health() {
    return apiFetch('/api/health');
  },

  // Get all conversations
  async getConversations() {
    const response = await apiFetch('/api/conversations');
    return response.conversations || response;
  },

  // Get messages for a specific conversation
  async getMessages(waId, page = 1, limit = 50) {
    const response = await apiFetch(`/api/conversations/${waId}/messages?page=${page}&limit=${limit}`);
    return response.messages || response;
  },

  // Send a new message
  async sendMessage(waId, text) {
    if (!text || !text.trim()) {
      throw new Error('Message text is required');
    }

    return apiFetch(`/api/conversations/${waId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: text.trim() }),
    });
  },

  // Process webhook payload (for testing)
  async processWebhook(payload) {
    return apiFetch('/api/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Delete conversation
  async deleteConversation(waId) {
    return apiFetch(`/api/conversations/${waId}`, {
      method: 'DELETE',
    });
  },
};

// Utility functions for API responses
export const handleApiError = (error) => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'You are not authorized to perform this action.';
      case 403:
        return 'Access forbidden.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 0:
        return 'Network error. Please check your internet connection.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return error.message || 'An unexpected error occurred.';
};

// Mock data for development/demo purposes
export const mockData = {
  conversations: [
    {
      _id: "919937320320",
      lastMessage: {
        contactName: "Ravi Kumar",
        waId: "919937320320",
        text: "Hi, I'd like to know more about your services.",
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        status: "read",
        isIncoming: true
      },
      messageCount: 2,
      unreadCount: 0
    },
    {
      _id: "929967673820",
      lastMessage: {
        contactName: "Neha Joshi",
        waId: "929967673820",
        text: "Hi Neha! Absolutely. We offer curated home decor pieces—are you looking for nameplates, wall art, or something else?",
        timestamp: Math.floor(Date.now() / 1000) - 1800,
        status: "delivered",
        isIncoming: false
      },
      messageCount: 2,
      unreadCount: 0
    }
  ],

  messages: {
    "919937320320": [
      {
        messageId: "msg1",
        text: "Hi, I'd like to know more about your services.",
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        isIncoming: true,
        status: "read",
        contactName: "Ravi Kumar"
      },
      {
        messageId: "msg2",
        text: "Hi Ravi! Sure, I'd be happy to help you with that. Could you tell me what you're looking for?",
        timestamp: Math.floor(Date.now() / 1000) - 3540,
        isIncoming: false,
        status: "read",
        contactName: "Ravi Kumar"
      }
    ],
    "929967673820": [
      {
        messageId: "msg3",
        text: "Hi, I saw your ad. Can you share more details?",
        timestamp: Math.floor(Date.now() / 1000) - 1800,
        isIncoming: true,
        status: "read",
        contactName: "Neha Joshi"
      },
      {
        messageId: "msg4",
        text: "Hi Neha! Absolutely. We offer curated home decor pieces—are you looking for nameplates, wall art, or something else?",
        timestamp: Math.floor(Date.now() / 1000) - 1770,
        isIncoming: false,
        status: "delivered",
        contactName: "Neha Joshi"
      }
    ]
  }
};

// Environment check utility
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;