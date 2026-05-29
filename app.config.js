const dotenv = require("dotenv");
dotenv.config();
const appJson = require("./app.json");

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo?.extra || {}),
      faydaUrl:
        process.env.EXPO_PUBLIC_FAYDA_URL ?? appJson.expo?.extra?.faydaUrl,
      authUrl: process.env.EXPO_PUBLIC_AUTH_URL ?? appJson.expo?.extra?.authUrl,
      marketUrl:
        process.env.EXPO_PUBLIC_MARKET_URL ?? appJson.expo?.extra?.marketUrl,
      paymentUrl:
        process.env.EXPO_PUBLIC_PAYMENT_URL ?? appJson.expo?.extra?.paymentUrl,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ?? appJson.expo?.extra?.apiBaseUrl,
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
