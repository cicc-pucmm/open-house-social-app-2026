import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";

// This will be set via EXPO_PUBLIC_CONVEX_URL env variable
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export { convex };
