import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";
import Constants from "expo-constants";

// Try env variable first, then fall back to app.json config
const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL ||
  Constants.expoConfig?.extra?.convexUrl;

if (!convexUrl) {
  throw new Error(
    "CONVEX_URL no configurada. Asegúrate de tener EXPO_PUBLIC_CONVEX_URL en .env.local o convexUrl en app.json"
  );
}

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export { convex };
