import React, { ReactNode, useCallback, useEffect, useState } from "react";
import {
    authLogout,
    authMe,
    authRefresh,
    clearTokens,
    setAuthClient,
    setMarketClient,
} from "../api/clients";
import { getItemAsync } from "../secureStore";
import { SdkContext } from "./context";

type SdkProviderProps = {
  children: ReactNode;
  config: {
    authUrl: string;
    marketUrl: string;
  };
};

export function SdkProvider({ children, config }: SdkProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<any | null>(null);

  const refreshToken = useCallback(async () => {
    const storedToken = await getItemAsync("access_token");
    setToken(storedToken ?? null);

    await Promise.all([
      setAuthClient(config.authUrl, storedToken ?? undefined),
      setMarketClient(config.marketUrl, storedToken ?? undefined),
    ]);

    // mark that initial token load and client configuration has completed
    setInitialized(true);
    // bump refresh key so consumers can refetch data even when token didn't change
    setRefreshKey((k) => k + 1);
  }, [config]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await authMe();
      // Handle nested response: { data: { user: {...} } } or { data: {...} } or flat
      const userData = res?.data?.user ?? res?.data ?? res;
      setUser(userData);
    } catch (err) {
      console.warn("[SdkProvider] fetchUser failed:", err);
      // If 401, try refreshing token
      try {
        await authRefresh();
        const res = await authMe();
        const userData = res?.data?.user ?? res?.data ?? res;
        setUser(userData);
      } catch (refreshErr) {
        console.warn("[SdkProvider] fetchUser retry failed:", refreshErr);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      try {
        console.log("SdkProvider: logout invoked");
      } catch (e) {}

      // start server logout but don't block the UI on the network call
      try {
        // fire-and-forget remote logout to avoid hanging the flow
        authLogout()
          .then(() => {
            try {
              console.log("SdkProvider: authLogout completed (async)");
            } catch (e) {}
          })
          .catch((err) => {
            try {
              console.log("SdkProvider: authLogout failed (async)", err);
            } catch (e) {}
          });
      } catch (err) {
        try {
          console.log("SdkProvider: authLogout kick-off failed", err);
        } catch (e) {}
      }

      // ensure clients are reset and token cleared
      await Promise.all([
        setAuthClient(config.authUrl, undefined),
        setMarketClient(config.marketUrl, undefined),
      ]);
      await clearTokens();
      setToken(null);
      setUser(null);
      try {
        console.log("SdkProvider: logout finished");
      } catch (e) {}
    } catch (e) {
      try {
        console.log("SdkProvider: logout encountered error", e);
      } catch (e) {}
    }
  }, [config]);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  // Fetch user profile when token becomes available
  useEffect(() => {
    if (initialized && token) {
      fetchUser();
    } else if (!token) {
      setUser(null);
    }
  }, [initialized, token, fetchUser]);

  return (
    <SdkContext.Provider
      value={{ token, refreshToken, initialized, logout, refreshKey, user, fetchUser }}
    >
      {children}
    </SdkContext.Provider>
  );
}

export default SdkProvider;