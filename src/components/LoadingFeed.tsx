import React from "react";
import { View } from "react-native";
import { Skeleton } from "heroui-native";

export default function LoadingFeed() {
  return (
    <View className="gap-4 p-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="gap-3">
          {/* Avatar + name */}
          <View className="flex-row items-center gap-3 px-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </View>
          {/* Image */}
          <Skeleton className="w-full h-80 rounded-none" />
          {/* Actions */}
          <View className="flex-row gap-4 px-4">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </View>
          {/* Caption */}
          <View className="px-4 gap-1">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-3/4 rounded-md" />
          </View>
        </View>
      ))}
    </View>
  );
}
