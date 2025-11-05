import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface Worker {
  id: string;
  handle: string;
  displayName: string;
  photoUrl?: string;
  country: string;
  currency: string;
  connectAccountId?: string;
  kycStatus: "pending" | "verified" | "restricted";
  tipsEnabled: boolean;
  suspended: boolean;
  createdAt: string;
}

export interface Tip {
  id: string;
  workerId: string;
  amountGrossCents: number;
  amountNetCents: number;
  currency: string;
  status: "succeeded" | "refunded" | "disputed" | "failed" | "pending";
  payerEmail?: string;
  note?: string;
  paymentIntentId: string;
  createdAt: string;
}

export const api = {
  auth: {
    sendOTP: (email: string) =>
      apiRequest("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    verifyOTP: (email: string, code: string) =>
      apiRequest<{ success: boolean; userId: string }>("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      }),

    logout: () =>
      apiRequest("/api/auth/logout", {
        method: "POST",
      }),
  },

  user: {
    getMe: () =>
      apiRequest<{ user: User; worker: Worker | null }>("/api/me"),
  },

  worker: {
    create: (data: {
      handle: string;
      displayName: string;
      photoUrl?: string;
      country?: string;
      currency?: string;
    }) =>
      apiRequest<{ worker: Worker; onboardingUrl: string }>("/api/worker", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    get: () =>
      apiRequest<{
        worker: Worker;
        stripeAccount: {
          chargesEnabled: boolean;
          payoutsEnabled: boolean;
          detailsSubmitted: boolean;
        } | null;
      }>("/api/worker"),

    refreshConnectLink: () =>
      apiRequest<{ onboardingUrl: string }>("/api/worker/connect/refresh", {
        method: "POST",
      }),

    getByHandle: (handle: string) =>
      apiRequest<{
        displayName: string;
        photoUrl?: string;
        currency: string;
        tipsEnabled: boolean;
      }>(`/api/qr/${handle}`),
  },

  tips: {
    createIntent: (data: {
      handle: string;
      amountCents: number;
      currency?: string;
      note?: string;
      payerEmail?: string;
    }) =>
      apiRequest<{ clientSecret: string }>("/api/tip-intent", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getMyTips: (params?: { limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.limit) query.set("limit", params.limit.toString());
      if (params?.offset) query.set("offset", params.offset.toString());
      const queryString = query.toString();
      return apiRequest<{ tips: Tip[] }>(
        `/api/me/tips${queryString ? `?${queryString}` : ""}`
      );
    },

    getMyStats: () =>
      apiRequest<{ today: number; week: number; month: number }>("/api/me/stats"),
  },

  admin: {
    getWorkers: () =>
      apiRequest<{ workers: Worker[] }>("/api/admin/workers"),

    updateWorker: (id: string, data: { suspended: boolean }) =>
      apiRequest<{ worker: Worker }>(`/api/admin/workers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    getSettings: () =>
      apiRequest<{ platformFeeBps: number }>("/api/admin/settings"),

    updateSettings: (data: { platformFeeBps: number }) =>
      apiRequest<{ platformFeeBps: number }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
};
