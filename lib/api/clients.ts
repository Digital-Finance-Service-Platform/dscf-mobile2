import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";
import { deleteItemAsync, getItemAsync, setItemAsync } from "../secureStore";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra as any)?.apiBaseUrl ??
  "http://localhost:3000";

const AUTH_URL =
  process.env.EXPO_PUBLIC_AUTH_URL ??
  process.env.NEXT_PUBLIC_AUTH_URL ??
  (Constants.expoConfig?.extra as any)?.authUrl ??
  API_BASE;

// Optional explicit auth base (useful when auth lives under a sub-path
// e.g. https://domain.example/core/auth). If provided, callers should
// use this as the base and not append an extra `/auth` segment.
const AUTH_BASE =
  process.env.EXPO_PUBLIC_AUTH_BASE_URL ??
  process.env.NEXT_PUBLIC_AUTH_BASE_URL ??
  (Constants.expoConfig?.extra as any)?.authBaseUrl ??
  null;

try {
  console.log("[clients] AUTH_BASE:", AUTH_BASE, "AUTH_URL:", AUTH_URL);
} catch (e) {}

const MARKET_URL =
  process.env.EXPO_PUBLIC_MARKET_URL ??
  process.env.NEXT_PUBLIC_MARKET_URL ??
  (Constants.expoConfig?.extra as any)?.marketUrl ??
  `${API_BASE.replace(/\/$/, "")}/marketplace`;

// Core API base (non-auth core endpoints like businesses, fayda, etc.)
const CORE_URL =
  process.env.EXPO_PUBLIC_CORE_URL ??
  process.env.NEXT_PUBLIC_CORE_URL ??
  (Constants.expoConfig?.extra as any)?.coreUrl ??
  API_BASE;

try {
  console.log("[clients] MARKET_URL:", MARKET_URL, "CORE_URL:", CORE_URL);
} catch (e) {}

export function getAuthUrl() {
  return AUTH_BASE ?? AUTH_URL;
}

function authEndpoint(path: string) {
  const base = AUTH_BASE ?? AUTH_URL;
  const cleanBase = String(base).replace(/\/$/, "");
  // If AUTH_BASE is set it is expected to already point to the auth root
  // (e.g. https://.../core/auth). In that case we join the provided `path`
  // directly. Otherwise we append `/auth` and then the path.
  if (AUTH_BASE) return `${cleanBase}${path.startsWith("/") ? path : "/" + path}`;
  return `${cleanBase}/auth${path.startsWith("/") ? path : "/" + path}`;
}

export function getMarketUrl() {
  return MARKET_URL;
}

export function getCoreUrl() {
  return CORE_URL;
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
  const url = authEndpoint("/login");
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
      // Extract user-friendly message from backend response
      const msg = 
        json?.message || 
        json?.error || 
        (json?.errors && typeof json.errors === 'string' ? json.errors : null) ||
        `Login failed (status ${res.status})`;
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
      await setItemAsync("has_seen_welcome", "true");
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
  const url = authEndpoint("/me");
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
      // Provide detailed debug info for non-OK responses (helpful for 401)
      try {
        console.warn(
          `[clients] marketFetch error ${res.status} -> ${url}`,
          {
            status: res.status,
            statusText: res.statusText,
            url,
            tokenPresent: !!token,
            responseBody: json,
          },
        );
      } catch (e) {}
      const msg = json?.message || json?.error || json?.errors || `Failed to load order history. Please try again.`;
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
    const url = authEndpoint("/logout");

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
        console.log(
          "[authLogout] finally - clearing tokens and resetting clients",
        );
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
  const url = authEndpoint("/signup");
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

    const requestBody: Record<string, any> = { user: userBody };

    // Pass through agent/retailer blocks for atomic signup (per signup-agent-retailer.md)
    if (payload.agent) requestBody.agent = payload.agent;
    if (payload.retailer) requestBody.retailer = payload.retailer;

    // Don't log passwords
    console.log("[authSignup] POST", url, {
      email: requestBody.user.email,
      phone: requestBody.user.phone,
      first_name: requestBody.user.user_profile_attributes?.first_name,
      has_agent: !!requestBody.agent,
      has_retailer: !!requestBody.retailer,
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

export async function authRefresh(payload?: Record<string, any>): Promise<any> {
  const storedRefreshToken = await getItemAsync("refresh_token");
  const url = authEndpoint("/refresh");
  try {
    const requestBody = {
      refresh_token: payload?.refresh_token ?? storedRefreshToken,
    };
    console.log("[authRefresh] POST", url);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        json?.message || `Token refresh failed (status ${res.status})`,
      );
    }
    const accessToken =
      json?.data?.access_token ?? json?.access_token ?? null;
    const newRefreshToken =
      json?.data?.refresh_token ?? json?.refresh_token ?? null;
    if (accessToken) {
      await setAccessToken(accessToken, newRefreshToken ?? undefined);
    }
    return json;
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error during token refresh at ${url} — ${message}`,
      );
    }
    throw err;
  }
}

export async function coreFetch(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  const token = await getAccessToken();
  const headers = new Headers((options.headers as HeadersInit) || {});
  // Don't set Content-Type for FormData — let the runtime set multipart boundary
  if (!(options.body instanceof FormData)) {
    if (!headers.get("Content-Type"))
      headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const url = path.startsWith("http") ? path : `${CORE_URL}${path}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        json?.message ||
        (json?.errors
          ? Array.isArray(json.errors)
            ? json.errors.join("; ")
            : JSON.stringify(json.errors)
          : `Request failed (status ${res.status})`);
      throw new Error(msg);
    }
    return json;
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error: could not reach core server at ${CORE_URL} — ${message}`,
      );
    }
    throw err;
  }
}

export async function faydaVerify(faydaNumber: string, otp: string): Promise<any> {
  return coreFetch("/fayda/verify", {
    method: "POST",
    body: JSON.stringify({ fayda_number: faydaNumber, otp }),
  });
}

export async function marketGetVisibleListings(
  /**
   * Fetch visible listings.
   * Default: public (no bearer token). If a bearer token exists it will be
   * added automatically by `marketFetch`.
   */
  useAuth: boolean = false,
): Promise<any> {
  try {
    // Log what we're about to call so runtime logs show the exact URL
    try {
      console.log("[clients] marketGetVisibleListings -> MARKET_URL:", MARKET_URL);
    } catch (e) {}
    // Delegate to marketFetch which will add Authorization header if a token exists
    return await marketFetch(`/listings/visible`, { method: "GET" });
  } catch (err: any) {
    try {
      console.warn("[clients] marketGetVisibleListings error:", err?.message ?? err);
    } catch (e) {}
    throw err;
  }
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function marketGetCategories(): Promise<any> {
  return marketFetch("/categories", { method: "GET" });
}

export async function marketGetCategoryProducts(categoryId: number | string): Promise<any> {
  return marketFetch(`/categories/${categoryId}/products`, { method: "GET" });
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function marketGetProducts(query?: Record<string, string>): Promise<any> {
  const qs = query
    ? "?" +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    : "";
  return marketFetch(`/products${qs}`, { method: "GET" });
}

export async function marketGetUnits(): Promise<any> {
  return marketFetch("/units", { method: "GET" });
}

// ─── Aggregator Feed ─────────────────────────────────────────────────────────

export async function marketGetAggregatorListings(): Promise<any> {
  return marketFetch("/aggregator_listings/feed", { method: "GET" });
}

// ─── Business Management ─────────────────────────────────────────────────────

export async function coreGetMyBusiness(): Promise<any> {
  return coreFetch("/businesses/my_business", { method: "GET" });
}

export async function coreGetBusiness(id: number | string): Promise<any> {
  return coreFetch(`/businesses/${id}`, { method: "GET" });
}

export async function coreUpdateBusiness(
  id: number | string,
  payload: Record<string, any>,
): Promise<any> {
  return coreFetch(`/businesses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function coreGetAddresses(): Promise<any> {
  return coreFetch("/addresses", { method: "GET" });
}

export async function coreCreateAddress(
  payload: Record<string, any>,
): Promise<any> {
  return coreFetch("/addresses", {
    method: "POST",
    body: JSON.stringify({ address: payload }),
  });
}

export async function coreUpdateAddress(
  id: number | string,
  payload: Record<string, any>,
): Promise<any> {
  return coreFetch(`/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ address: payload }),
  });
}


// ─── Supplier Products & Listings ────────────────────────────────────────────

export async function publishSupplierProduct(
  payload: Record<string, any>,
): Promise<any> {
  return marketFetch("/supplier_products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function marketGetMyProducts(): Promise<any> {
  return marketFetch("/supplier_products/my_products", { method: "GET" });
}

export async function marketGetProductById(id: number | string): Promise<any> {
  return marketFetch(`/products/${id}`, { method: "GET" });
}

export async function marketCreateSupplierProduct(
  payload: Record<string, any>,
): Promise<any> {
  return marketFetch("/supplier_products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function marketUpdateSupplierProduct(
  id: number | string,
  payload: Record<string, any>,
): Promise<any> {
  return marketFetch(`/supplier_products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function marketApproveSupplierProduct(
  id: number | string,
): Promise<any> {
  return marketFetch(`/supplier_products/${id}/approve`, { method: "POST" });
}

export async function marketRejectSupplierProduct(
  id: number | string,
): Promise<any> {
  return marketFetch(`/supplier_products/${id}/reject`, { method: "POST" });
}

export async function marketDeleteSupplierProduct(
  id: number | string,
): Promise<any> {
  return marketFetch(`/supplier_products/${id}`, { method: "DELETE" });
}

export async function marketGetMyListings(): Promise<any> {
  return marketFetch("/listings/my_listings", { method: "GET" });
}

export async function marketCreateListing(
  payload: Record<string, any>,
): Promise<any> {
  return marketFetch("/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function marketUpdateListing(
  id: number | string,
  payload: Record<string, any>,
): Promise<any> {
  return marketFetch(`/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function marketPauseListing(id: number | string): Promise<any> {
  return marketFetch(`/listings/${id}/pause`, { method: "POST" });
}

export async function marketActivateListing(id: number | string): Promise<any> {
  return marketFetch(`/listings/${id}/activate`, { method: "POST" });
}

// ─── Product Inclusion Requests ──────────────────────────────────────────────

export async function marketCreateProductInclusionRequest(
  payload: Record<string, any>,
): Promise<any> {
  return marketFetch("/product_inclusion_requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function marketGetProductInclusionRequests(): Promise<any> {
  return marketFetch("/product_inclusion_requests", { method: "GET" });
}

// ─── Agent's Retailers ───────────────────────────────────────────────────────

export async function marketGetMyRetailers(agentId?: number | string): Promise<any> {
  const qs = agentId ? `?agent_id=${agentId}` : "";
  return marketFetch(`/retailers/my_retailers${qs}`, { method: "GET" });
}

export async function marketGetRetailer(id: number | string): Promise<any> {
  return marketFetch(`/retailers/${id}`, { method: "GET" });
}

// ─── Registration Endpoints ──────────────────────────────────────────────────

export async function marketRegisterSupplier(
  formData: FormData,
): Promise<any> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // Don't set Content-Type — let fetch set multipart boundary
  const url = `${MARKET_URL}/suppliers/register`;
  try {
    console.log("[marketRegisterSupplier] POST", url);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        json?.message ||
        (json?.errors
          ? Array.isArray(json.errors)
            ? json.errors.join("; ")
            : JSON.stringify(json.errors)
          : `Supplier registration failed (status ${res.status})`);
      throw new Error(msg);
    }
    return json;
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error during supplier registration — ${message}`,
      );
    }
    throw err;
  }
}

export async function marketRegisterAgent(
  payload: Record<string, any>,
): Promise<any> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${MARKET_URL}/agents/register`;
  try {
    console.log("[marketRegisterAgent] POST", url, payload);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ agent: payload }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        json?.message ||
        (json?.errors
          ? Array.isArray(json.errors)
            ? json.errors.join("; ")
            : JSON.stringify(json.errors)
          : `Agent registration failed (status ${res.status})`);
      throw new Error(msg);
    }
    return json;
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error during agent registration — ${message}`,
      );
    }
    throw err;
  }
}

export async function marketRegisterRetailer(
  payload: Record<string, any>,
): Promise<any> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${MARKET_URL}/retailers/register`;
  try {
    console.log("[marketRegisterRetailer] POST", url, payload);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ retailer: payload }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        json?.message ||
        (json?.errors
          ? Array.isArray(json.errors)
            ? json.errors.join("; ")
            : JSON.stringify(json.errors)
          : `Retailer registration failed (status ${res.status})`);
      throw new Error(msg);
    }
    return json;
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.toLowerCase().includes("network")) {
      throw new Error(
        `Network error during retailer registration — ${message}`,
      );
    }
    throw err;
  }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

/**
 * Create a new order on the marketplace.
 * POST /marketplace/orders
 */
export async function marketCreateOrder(
  payload: Record<string, any>,
): Promise<any> {
  return marketFetch("/orders", {
    method: "POST",
    body: JSON.stringify({ order: payload }),
  });
}

/**
 * Fetch current user's orders (ordered_by == current_user).
 * GET /marketplace/orders/my_orders
 */
export async function marketGetMyOrders(
  query?: Record<string, any>,
): Promise<any> {
  const qs = query
    ? "?" +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    : "";
  return marketFetch(`/orders/my_orders${qs}`, { method: "GET" });
}

/**
 * Fetch a specific order with full details.
 * GET /marketplace/orders/:id
 */
export async function marketGetOrder(id: number | string): Promise<any> {
  return marketFetch(`/orders/${id}`, { method: "GET" });
}

/**
 * Fetch received orders (for suppliers/agents/retailers).
 * GET /marketplace/orders/received
 */
export async function marketGetReceivedOrders(
  query?: Record<string, any>,
): Promise<any> {
  const qs = query
    ? "?" +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    : "";
  return marketFetch(`/orders/received${qs}`, { method: "GET" });
}

/**
 * Retailer confirms an order (final confirmation step).
 * POST /marketplace/orders/:id/retailer_confirm
 */
export async function marketRetailerConfirmOrder(
  id: number | string,
  payload?: { confirmed?: boolean; reason?: string },
): Promise<any> {
  const body: { confirmed: boolean; reason?: string } = {
    confirmed: payload?.confirmed ?? true,
  };
  if (payload?.reason) {
    body.reason = payload.reason;
  }
  return marketFetch(`/orders/${id}/retailer_confirm`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Supplier confirms an order.
 * POST /marketplace/orders/:id/supplier_confirm
 */
export async function marketSupplierConfirmOrder(
  id: number | string,
  payload: { confirmed: boolean; reason?: string },
): Promise<any> {
  return marketFetch(`/orders/${id}/supplier_confirm`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Cancel an order.
 * POST /marketplace/orders/:id/cancel
 */
export async function marketCancelOrder(
  id: number | string,
  reason?: string,
): Promise<any> {
  return marketFetch(`/orders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
  });
}
