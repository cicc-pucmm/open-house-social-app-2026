import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export default function EmptyState({
  icon = "images-outline",
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <Ionicons name={icon} size={64} color="#9CA3AF" />
      <Text className="text-lg font-semibold text-muted mt-4 text-center">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-sm text-muted mt-2 text-center">{subtitle}</Text>
      ) : null}
    </View>
  );
}
