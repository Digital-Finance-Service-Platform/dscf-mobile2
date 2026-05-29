import { getItemAsync, setItemAsync, deleteItemAsync } from "../secureStore";
import Constants from "expo-constants";
import axios, { AxiosInstance } from "axios";

const AUTH_URL =
  process.env.EXPO_PUBLIC_AUTH_URL ??
  (Constants.expoConfig?.extra as any)?.authUrl ??
  "http://localhost:3000";
const MARKET_URL =
  process.env.EXPO_PUBLIC_MARKET_URL ??
  (Constants.expoConfig?.extra as any)?.marketUrl ??
  "http://localhost:3000/api/marketplace";

export function getAuthUrl() {
  return AUTH_URL;
}

export function getMarketUrl() {
  return MARKET_URL;
}

export async function setAccessToken(
  accessToken: string,
  refreshToken?: string,
): Promise<void> {
  if (!accessToken) return;
  await setItemAsync("access_token", accessToken);
  if (refreshToken) await setItemAsync("refresh_token", refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return getItemAsync("access_token");
}

export async function clearTokens(): Promise<void> {
  await deleteItemAsync("access_token");
  await deleteItemAsync("refresh_token");
}

// Axios clients that can be configured by a provider
export let authClient: AxiosInstance | null = null;
export let marketClient: AxiosInstance | null = null;

export function setAuthClient(baseURL: string, token?: string) {
  authClient = axios.create({ baseURL });
  if (token)
    authClient.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function setMarketClient(baseURL: string, token?: string) {
  marketClient = axios.create({ baseURL });
  if (token)
    marketClient.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export async function authLogin(payload: Record<string, any>): Promise<any> {
  const url = `${AUTH_URL}/auth/login`;
  try {
    // Build request body and map legacy keys to what the server expects
    const requestBody: Record<string, any> = {
      ...payload,
      email_or_phone:
        payload.email_or_phone ??
        payload.phone_number ??
        payload.phone ??
        payload.email,
    };
    // don't log passwords
    console.log("[authLogin] POST", url, {
      email_or_phone: requestBody.email_or_phone,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        json?.message || json?.error || `Login failed (status ${res.status})`;
      throw new Error(msg);
    }
    const accessToken =
      json?.data?.access_token ??
      json?.access_token ??
      json?.data?.token ??
      null;
    const refreshToken =
      json?.data?.refresh_token ?? json?.refresh_token ?? null;
    if (accessToken) {
      await setAccessToken(accessToken, refreshToken ?? undefined);
    }
    return json;
  } catch (err: any) {
    // Surface network errors with helpful context
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error: could not reach auth server at ${AUTH_URL} — ${message}`,
      );
    }
    throw err;
  }
}

export async function authMe(): Promise<any> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${AUTH_URL}/auth/me`;
  try {
    const res = await fetch(url, { method: "GET", headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(
        json?.message || `Failed to fetch profile (status ${res.status})`,
      );
    return json;
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error: could not reach auth server at ${AUTH_URL} — ${message}`,
      );
    }
    throw err;
  }
}

export async function marketFetch(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  const token = await getAccessToken();
  const headers = new Headers((options.headers as HeadersInit) || {});
  if (!headers.get("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const url = path.startsWith("http") ? path : `${MARKET_URL}${path}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.message || `Request failed (status ${res.status})`;
      throw new Error(msg);
    }
    return json;
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error: could not reach market server at ${MARKET_URL} — ${message}`,
      );
    }
    throw err;
  }
}

export async function authLogout(): Promise<void> {
  try {
    try {
      console.log("[authLogout] start");
    } catch (e) {}

    const token = await getAccessToken();
    try {
      console.log("[authLogout] token present:", !!token);
    } catch (e) {}

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = `${AUTH_URL}/auth/logout`;

    try {
      try {
        console.log("[authLogout] POST", url);
      } catch (e) {}
      const res = await fetch(url, { method: "POST", headers });
      try {
        console.log("[authLogout] fetch completed", res.status);
      } catch (e) {}
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn(
          "[authLogout] logout returned",
          res.status,
          json?.error || json?.message,
        );
      } else {
        try {
          console.log("[authLogout] logout response ok", res.status);
        } catch (e) {}
      }
    } catch (err: any) {
      console.warn(
        "[authLogout] network error while logging out",
        err?.message ?? err,
      );
    } finally {
      try {
        console.log("[authLogout] finally - clearing tokens and resetting clients");
      } catch (e) {}
      // clear local tokens and reset axios clients
      await clearTokens();
      if (authClient) {
        try {
          delete (authClient.defaults.headers as any).common.Authorization;
        } catch {}
      }
      if (marketClient) {
        try {
          delete (marketClient.defaults.headers as any).common.Authorization;
        } catch {}
      }
      authClient = null;
      marketClient = null;
    }
  } catch (e) {
    try {
      console.log("[authLogout] unexpected error", e);
    } catch (e) {}
  }
}

export async function authSignup(payload: Record<string, any>): Promise<any> {
  const url = `${AUTH_URL}/auth/signup`;
  try {
    const userSrc = payload.user ?? payload;
    const firstName =
      userSrc.user_profile_attributes?.first_name ??
      userSrc.first_name ??
      userSrc.name ??
      null;
    const lastName =
      userSrc.user_profile_attributes?.last_name ?? userSrc.last_name ?? null;

    const userBody: Record<string, any> = {
      email: userSrc.email ?? null,
      phone: userSrc.phone ?? userSrc.phone_number ?? null,
      password: userSrc.password ?? null,
      password_confirmation:
        userSrc.password_confirmation ??
        userSrc.confirm ??
        userSrc.password ??
        null,
      user_profile_attributes: {
        first_name: firstName,
        last_name: lastName,
      },
    };

    const requestBody = { user: userBody };

    // Don't log passwords
    console.log("[authSignup] POST", url, {
      email: requestBody.user.email,
      phone: requestBody.user.phone,
      first_name: requestBody.user.user_profile_attributes?.first_name,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        json?.message ||
        (json?.errors
          ? Array.isArray(json.errors)
            ? json.errors.join("; ")
            : JSON.stringify(json.errors)
          : `Signup failed (status ${res.status})`);
      throw new Error(msg);
    }

    return json;
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error: could not reach auth server at ${AUTH_URL} — ${message}`,
      );
    }
    throw err;
  }
}
