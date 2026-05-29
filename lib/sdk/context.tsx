import { createContext, useContext } from "react";

type SdkContextType = {
  token: string | null;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
  // indicates initial token load from secure storage has completed
  initialized: boolean;
};

export const SdkContext = createContext<SdkContextType>({
  token: null,
  refreshToken: async () => {},
  logout: async () => {},
  initialized: false,
});

export const useSdk = () => useContext(SdkContext);

export default SdkContext;