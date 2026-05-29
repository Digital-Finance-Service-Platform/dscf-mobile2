import React, { useState, useCallback, ReactNode, useEffect } from "react";
import { getItemAsync } from "../secureStore";
import {
  setAuthClient,
  setMarketClient,
  authLogout,
  clearTokens,
} from "../api/clients";
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

  const refreshToken = useCallback(async () => {
    const storedToken = await getItemAsync("access_token");
    setToken(storedToken ?? null);

    await Promise.all([
      setAuthClient(config.authUrl, storedToken ?? undefined),
      setMarketClient(config.marketUrl, storedToken ?? undefined),
    ]);

    // mark that initial token load and client configuration has completed
    setInitialized(true);
  }, [config]);

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

  return (
    <SdkContext.Provider value={{ token, refreshToken, initialized, logout }}>
      {children}
    </SdkContext.Provider>
  );
}

export default SdkProvider;