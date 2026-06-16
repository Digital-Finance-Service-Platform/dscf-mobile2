import { createContext, useContext } from "react";

type SdkContextType = {
  token: string | null;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
  // indicates initial token load from secure storage has completed
  initialized: boolean;
  // increments each time clients are (re)configured
  refreshKey: number;
  // current user profile from /core/auth/me
  user: any | null;
  // re-fetch user profile
  fetchUser: () => Promise<void>;
};

export const SdkContext = createContext<SdkContextType>({
  token: null,
  refreshToken: async () => {},
  logout: async () => {},
  initialized: false,
  refreshKey: 0,
  user: null,
  fetchUser: async () => {},
});

export const useSdk = () => useContext(SdkContext);

export default SdkContext;