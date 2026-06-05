const dotenv = require("dotenv");
dotenv.config();
const appJson = require("./app.json");

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  appJson.expo?.android?.config?.googleMaps?.apiKey;

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo?.android,
      config: {
        ...(appJson.expo?.android?.config || {}),
        ...(googleMapsApiKey
          ? {
              googleMaps: {
                ...(appJson.expo?.android?.config?.googleMaps || {}),
                apiKey: googleMapsApiKey,
              },
            }
          : {}),
      },
    },
    extra: {
      ...(appJson.expo?.extra || {}),
      eas: {
        projectId: "d7cf26a5-2d78-4e01-a049-f7366c510ab2",
      },
      faydaUrl:
        process.env.EXPO_PUBLIC_FAYDA_URL ?? appJson.expo?.extra?.faydaUrl,
      authUrl:
        process.env.EXPO_PUBLIC_AUTH_URL ??
        process.env.NEXT_PUBLIC_AUTH_URL ??
        appJson.expo?.extra?.authUrl,
      authBaseUrl:
        process.env.EXPO_PUBLIC_AUTH_BASE_URL ??
        process.env.NEXT_PUBLIC_AUTH_BASE_URL ??
        appJson.expo?.extra?.authBaseUrl,
      marketUrl:
        process.env.EXPO_PUBLIC_MARKET_URL ??
        process.env.NEXT_PUBLIC_MARKET_URL ??
        appJson.expo?.extra?.marketUrl,
      paymentUrl:
        process.env.EXPO_PUBLIC_PAYMENT_URL ?? appJson.expo?.extra?.paymentUrl,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ??
        process.env.NEXT_PUBLIC_API_BASE_URL ??
        appJson.expo?.extra?.apiBaseUrl,
      appsWebUrl:
        process.env.EXPO_PUBLIC_APPS_WEB_URL ?? appJson.expo?.extra?.appsWebUrl,
      creditUrl:
        process.env.EXPO_PUBLIC_CREDIT_URL ?? appJson.expo?.extra?.creditUrl,
      creditPaymentUrl:
        process.env.EXPO_PUBLIC_CREDIT_PAYMENT_URL ??
        appJson.expo?.extra?.creditPaymentUrl,
    },
  },
};
