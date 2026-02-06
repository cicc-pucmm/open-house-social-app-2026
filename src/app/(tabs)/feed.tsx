import React, { useState, useCallback } from "react";
import { View, FlatList, RefreshControl, Text } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tabs as HeroTabs } from "heroui-native";
import PostCard from "../../components/PostCard";
import LoadingFeed from "../../components/LoadingFeed";
import EmptyState from "../../components/EmptyState";
import AppHeader from "../../components/AppHeader";
import { useSession } from "../../hooks/useSession";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { Id } from "../../../convex/_generated/dataModel";

type FeedOrder = "recent" | "popular";

export default function FeedScreen() {
  const [feedOrder, setFeedOrder] = useState<FeedOrder>("recent");
  const [refreshing, setRefreshing] = useState(false);
  const { session, userId, isAdmin } = useSession();

  // Register push notifications
  usePushNotifications(userId);

  const recentPosts = useQuery(
    api.posts.listPostsRecent,
    feedOrder === "recent" ? {} : "skip"
  );
  const popularPosts = useQuery(
    api.posts.listPostsPopular,
    feedOrder === "popular" ? {} : "skip"
  );

  const posts = feedOrder === "recent" ? recentPosts : popularPosts;
  const isLoading = posts === undefined;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex queries auto-refresh, just show the indicator briefly
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  if (!userId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted">Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader />

      {/* Order Toggle */}
      <View className="px-4 pt-3 pb-1">
        <HeroTabs
          value={feedOrder}
          onValueChange={(v) => setFeedOrder(v as FeedOrder)}
          variant="primary"
        >
          <HeroTabs.List>
            <HeroTabs.Indicator />
            <HeroTabs.Trigger value="recent" className="flex-1">
              <HeroTabs.Label>Más Recientes</HeroTabs.Label>
            </HeroTabs.Trigger>
            <HeroTabs.Trigger value="popular" className="flex-1">
              <HeroTabs.Label>Más Populares</HeroTabs.Label>
            </HeroTabs.Trigger>
          </HeroTabs.List>
        </HeroTabs>
      </View>

      {/* Feed */}
      {isLoading ? (
        <LoadingFeed />
      ) : !posts || posts.length === 0 ? (
        <EmptyState
          title="No hay publicaciones aún"
          subtitle="¡Sé el primero en compartir una foto!"
          icon="camera-outline"
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              _id={item._id}
              authorUserId={item.authorUserId}
              authorUsername={item.authorUsername}
              caption={item.caption}
              imageUrls={item.imageUrls}
              likeCount={item.likeCount}
              commentCount={item.commentCount}
              createdAt={item.createdAt}
              currentUserId={userId}
              isAdmin={isAdmin}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
