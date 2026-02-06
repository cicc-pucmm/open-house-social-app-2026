import React, { memo } from "react";
import { View, Text } from "react-native";
import { Id } from "../../convex/_generated/dataModel";
import AdminMenu from "./AdminMenu";

interface CommentItemProps {
  _id: Id<"comments">;
  username: string;
  text: string;
  createdAt: number;
  isAdmin: boolean;
  currentUserId: Id<"users">;
  onDeleted?: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export default memo(function CommentItem({
  _id,
  username,
  text,
  createdAt,
  isAdmin,
  currentUserId,
  onDeleted,
}: CommentItemProps) {
  return (
    <View className="flex-row items-start gap-2 px-4 py-2">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-foreground">
            {username}
          </Text>
          <Text className="text-xs text-muted">{formatTimeAgo(createdAt)}</Text>
        </View>
        <Text className="text-sm text-foreground mt-0.5">{text}</Text>
      </View>
      <AdminMenu
        type="comment"
        itemId={_id}
        userId={currentUserId}
        isAdmin={isAdmin}
        onDeleted={onDeleted}
      />
    </View>
  );
});
