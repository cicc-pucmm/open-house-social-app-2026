import "../../global.css";

import React from "react";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ConvexClientProvider } from "../lib/convex";
import { PRIMARY_COLOR } from "../lib/constants";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexClientProvider>
        <HeroUINativeProvider>
          <RootStack />
        </HeroUINativeProvider>
      </ConvexClientProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: PRIMARY_COLOR },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: "#fff" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="session"
        options={{
          title: "Bienvenido",
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{
          title: "Publicación",
          headerBackTitle: "Atrás",
        }}
      />
    </Stack>
  );
}
