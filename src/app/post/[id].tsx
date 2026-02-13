import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button, Input, Spinner } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { Id } from "../../../convex/_generated/dataModel";
import PostCarousel from "../../components/PostCarousel";
import LikeButton from "../../components/LikeButton";
import CommentItem from "../../components/CommentItem";
import AdminMenu from "../../components/AdminMenu";
import { useSession } from "../../hooks/useSession";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Isolated comment input ─── */
const CommentInputBar = memo(function CommentInputBar({
  postId,
  userId,
}: {
  postId: Id<"posts">;
  userId: Id<"users">;
}) {
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const addComment = useMutation(api.comments.addComment);
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#FFF' : '#000';

  const handleSend = useCallback(async () => {
    if (!commentText.trim() || isSending) return;
    setIsSending(true);
    try {
      await addComment({ postId, userId, text: commentText.trim() });
      setCommentText("");
    } catch (error) {
      console.error("Error al comentar:", error);
    } finally {
      setIsSending(false);
    }
  }, [commentText, isSending, postId, userId, addComment]);

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      className="flex-row items-center gap-2 px-4 py-3 bg-background border-t border-separator"
    >
      <Input
        placeholder="Escribe un comentario..."
        value={commentText}
        onChangeText={setCommentText}
        className="flex-1"
        placeholderTextColor="#9CA3AF"
        style={{ color: textColor }}
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />
      <Pressable
        onPress={handleSend}
        disabled={!commentText.trim() || isSending}
        className="p-2"
      >
        {isSending ? (
          <Spinner size="sm" />
        ) : (
          <Ionicons
            name="send"
            size={24}
            color={commentText.trim() ? "#00599D" : "#9CA3AF"}
          />
        )}
      </Pressable>
    </Animated.View>
  );
});

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId, isAdmin } = useSession();

  const postId = id as Id<"posts">;
  const post = useQuery(api.posts.getPost, { postId });
  const comments = useQuery(api.comments.listComments, { postId });

  const ListHeader = useMemo(() => {
    if (!post || !userId) return null;
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        {/* Author header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
              <Text className="text-accent-foreground text-sm font-bold">
                {post.authorUsername.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="text-base font-semibold text-foreground">
                {post.authorUsername}
              </Text>
              <Text className="text-xs text-muted">
                {formatDate(post.createdAt)}
              </Text>
            </View>
          </View>
          <AdminMenu
            type="post"
            itemId={post._id}
            userId={userId}
            isAdmin={isAdmin}
            onDeleted={() => router.back()}
          />
        </View>

        {/* Carousel */}
        <PostCarousel imageUrls={post.imageUrls} />

        {/* Actions */}
        <View className="flex-row items-center gap-4 px-4 py-2">
          <LikeButton
            postId={post._id}
            userId={userId}
            likeCount={post.likeCount}
          />
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
            <Text className="text-sm text-muted font-medium">
              {post.commentCount}
            </Text>
          </View>
        </View>

        {/* Caption */}
        {post.caption.length > 0 ? (
          <View className="px-4 pb-3">
            <Text className="text-sm text-foreground">
              <Text className="font-semibold">{post.authorUsername} </Text>
              {post.caption}
            </Text>
          </View>
        ) : null}

        {/* Divider */}
        <View className="h-px bg-separator mx-4 mb-2" />

        {/* Comments header */}
        <Text className="text-sm font-semibold text-foreground px-4 py-2">
          Comentarios ({comments?.length ?? 0})
        </Text>
      </Animated.View>
    );
  }, [post, comments?.length, userId, isAdmin, router]);

  if (!userId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (post === undefined || comments === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
        <Text className="text-muted mt-4">Cargando publicación...</Text>
      </View>
    );
  }

  if (post === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text className="text-lg font-semibold text-muted mt-4 text-center">
          Publicación no encontrada
        </Text>
        <Button
          variant="primary"
          onPress={() => router.back()}
          className="mt-4"
        >
          <Button.Label>Volver</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <CommentItem
            _id={item._id}
            username={item.username}
            text={item.text}
            createdAt={item.createdAt}
            isAdmin={isAdmin}
            currentUserId={userId}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-sm text-muted">
              No hay comentarios aún. ¡Sé el primero!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Comment input - isolated to prevent re-renders */}
      <CommentInputBar postId={postId} userId={userId} />
    </KeyboardAvoidingView>
  );
}
