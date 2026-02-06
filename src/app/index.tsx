import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { getSession } from "../lib/session";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      setHasSession(!!session?.userId);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#00599D" />
      </View>
    );
  }

  if (!hasSession) {
    return <Redirect href="/session" />;
  }

  return <Redirect href="/(tabs)/feed" />;
}
