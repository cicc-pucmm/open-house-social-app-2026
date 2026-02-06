import React, { memo, useCallback } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import PostCarousel from "./PostCarousel";
import LikeButton from "./LikeButton";
import AdminMenu from "./AdminMenu";

interface PostCardProps {
  _id: Id<"posts">;
  authorUserId: Id<"users">;
  authorUsername: string;
  caption: string;
  imageUrls: Array<string | null>;
  likeCount: number;
  commentCount: number;
  createdAt: number;
  currentUserId: Id<"users">;
  isAdmin: boolean;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (minutes > 0) return `hace ${minutes}m`;
  return "ahora";
}

export default memo(function PostCard({
  _id,
  authorUserId,
  authorUsername,
  caption,
  imageUrls,
  likeCount,
  commentCount,
  createdAt,
  currentUserId,
  isAdmin,
}: PostCardProps) {
  const router = useRouter();
  const toggleLike = useMutation(api.likes.toggleLike);
  const likeStatus = useQuery(api.likes.getLikeStatus, { postId: _id, userId: currentUserId });

  const openDetail = useCallback(() => {
    router.push(`/post/${_id}`);
  }, [_id, router]);

  const handleDoubleTapLike = useCallback(async () => {
    // Only like if not already liked
    if (likeStatus?.liked) return;
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await toggleLike({ postId: _id, userId: currentUserId });
    } catch (error) {
      console.error("Error al dar like:", error);
    }
  }, [_id, currentUserId, toggleLike, likeStatus]);

  return (
    <View className="bg-background mb-2">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-full bg-accent items-center justify-center">
            <Text className="text-accent-foreground text-sm font-bold">
              {authorUsername.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-sm font-semibold text-foreground">
              {authorUsername}
            </Text>
            <Text className="text-xs text-muted">
              {formatTimeAgo(createdAt)}
            </Text>
          </View>
        </View>
        <AdminMenu
          type="post"
          itemId={_id}
          userId={currentUserId}
          isAdmin={isAdmin}
        />
      </View>

      {/* Image Carousel */}
      <PostCarousel imageUrls={imageUrls} onDoubleTap={handleDoubleTapLike} />

      {/* Actions */}
      <View className="flex-row items-center gap-4 px-4 py-2">
        <LikeButton
          postId={_id}
          userId={currentUserId}
          likeCount={likeCount}
        />
        <Pressable
          onPress={openDetail}
          className="flex-row items-center gap-1.5"
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
          <Text className="text-sm text-muted font-medium">{commentCount}</Text>
        </Pressable>
      </View>

      {/* Caption */}
      {caption.length > 0 ? (
        <Pressable onPress={openDetail} className="px-4 pb-3">
          <Text className="text-sm text-foreground" numberOfLines={3}>
            <Text className="font-semibold">{authorUsername} </Text>
            {caption}
          </Text>
        </Pressable>
      ) : null}

      {/* View comments link */}
      {commentCount > 0 ? (
        <Pressable onPress={openDetail} className="px-4 pb-3">
          <Text className="text-sm text-muted">
            Ver {commentCount === 1 ? "1 comentario" : `los ${commentCount} comentarios`}
          </Text>
        </Pressable>
      ) : null}

      {/* Divider */}
      <View className="h-px bg-separator" />
    </View>
  );
});
