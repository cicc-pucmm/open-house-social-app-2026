import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface AdminMenuProps {
  type: "post" | "comment";
  itemId: Id<"posts"> | Id<"comments">;
  userId: Id<"users">;
  isAdmin: boolean;
  onDeleted?: () => void;
}

export default function AdminMenu({
  type,
  itemId,
  userId,
  isAdmin,
  onDeleted,
}: AdminMenuProps) {
  const deletePost = useMutation(api.posts.deletePost);
  const deleteComment = useMutation(api.comments.deleteComment);

  if (!isAdmin) return null;

  const handleDelete = () => {
    const label = type === "post" ? "publicación" : "comentario";
    Alert.alert(
      `Borrar ${label}`,
      `¿Estás seguro de que quieres borrar este ${label}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            try {
              if (type === "post") {
                await deletePost({
                  postId: itemId as Id<"posts">,
                  userId,
                });
              } else {
                await deleteComment({
                  commentId: itemId as Id<"comments">,
                  userId,
                });
              }
              onDeleted?.();
            } catch (error) {
              Alert.alert("Error", "No se pudo borrar. Intenta de nuevo.");
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable onPress={handleDelete} hitSlop={8}>
      <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
    </Pressable>
  );
}
