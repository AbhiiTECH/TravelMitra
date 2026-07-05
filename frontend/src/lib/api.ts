const API_BASE_URL = "http://localhost:4000/api";

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("travelmitra_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, mergedOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      return data as T;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth APIs
  login(body: any) {
    return this.request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  register(body: any) {
    return this.request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getMe() {
    return this.request<{ user: any }>("/auth/me");
  }

  // Trips APIs
  generateTrip(body: any) {
    return this.request<{ trip: any }>("/trips/generate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getTrips() {
    return this.request<{ trips: any[] }>("/trips");
  }

  getTripById(id: string) {
    return this.request<{ trip: any }>(`/trips/${id}`);
  }

  deleteTrip(id: string) {
    return this.request<{ message: string }>(`/trips/${id}`, {
      method: "DELETE",
    });
  }

  adaptWeather(id: string, body: { dayNumber: number; condition: string }) {
    return this.request<{ message: string; updatedDay: any }>(`/trips/${id}/weather-adapt`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Chat APIs
  sendChatMessage(message: string, tripId?: string) {
    return this.request<{ chatLog: any }>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, tripId }),
    });
  }

  getChatHistory() {
    return this.request<{ history: any[] }>("/chat/history");
  }

  // Expenses APIs
  addExpense(tripId: string, body: any) {
    return this.request<{ message: string; expense: any }>(`/expenses/${tripId}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getExpenses(tripId: string) {
    return this.request<{ expenses: any[] }>(`/expenses/${tripId}`);
  }

  getExpensesSummary(tripId: string) {
    return this.request<{
      totalSpent: number;
      budgetLimit: number;
      remainingBudget: number;
      costPerPerson: number;
      categoryBreakdown: any[];
    }>(`/expenses/${tripId}/summary`);
  }

  // Group APIs
  shareTrip(tripId: string, email: string, role: string = "Viewer") {
    return this.request<{ message: string; sharedTrip: any }>(`/trips/${tripId}/share`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }

  voteOnItem(tripId: string, body: { itemType: string; itemId: string; voteValue: number }) {
    return this.request<{ message: string; vote: any }>(`/trips/${tripId}/vote`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Notifications APIs
  getNotifications() {
    return this.request<{ notifications: any[] }>("/notifications");
  }

  markNotificationRead(id: string) {
    return this.request<{ message: string; notification: any }>(`/notifications/${id}/read`, {
      method: "PUT",
    });
  }
}

export const api = new ApiClient();
export default api;
