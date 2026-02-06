import React, { useCallback } from "react";
import { Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface LikeButtonProps {
  postId: Id<"posts">;
  userId: Id<"users">;
  likeCount: number;
}

export default function LikeButton({
  postId,
  userId,
  likeCount,
}: LikeButtonProps) {
  const toggleLike = useMutation(api.likes.toggleLike);
  const likeStatus = useQuery(api.likes.getLikeStatus, { postId, userId });
  const scale = useSharedValue(1);

  const liked = likeStatus?.liked ?? false;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(async () => {
    // Bounce animation
    scale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 6, stiffness: 300 })
    );

    // Haptic feedback on iOS
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await toggleLike({ postId, userId });
    } catch (error) {
      console.error("Error al dar like:", error);
    }
  }, [postId, userId, toggleLike, scale]);

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-1.5"
      hitSlop={8}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={26}
          color={liked ? "#ef4444" : "#6B7280"}
        />
      </Animated.View>
      <Animated.Text className="text-sm text-muted font-medium">
        {likeCount}
      </Animated.Text>
    </Pressable>
  );
}
