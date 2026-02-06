import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Toggle like on a post. If already liked, remove it; otherwise add it.
 */
export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  returns: v.object({
    liked: v.boolean(),
    likeCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post no encontrado");
    }

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_postId_and_userId", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .unique();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      const newCount = Math.max(0, post.likeCount - 1);
      await ctx.db.patch(args.postId, { likeCount: newCount });
      return { liked: false, likeCount: newCount };
    } else {
      // Like
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: args.userId,
        createdAt: Date.now(),
      });
      const newCount = post.likeCount + 1;
      await ctx.db.patch(args.postId, { likeCount: newCount });

      // Send push notification to post owner (not to self)
      if (post.authorUserId !== args.userId) {
        const liker = await ctx.db.get(args.userId);
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendPushToUser,
          {
            userId: post.authorUserId,
            title: "❤️ Nuevo Like",
            body: `${liker?.username ?? "Alguien"} le dio like a tu publicación`,
          }
        );
      }

      return { liked: true, likeCount: newCount };
    }
  },
});

/**
 * Get like status for a user on a post.
 */
export const getLikeStatus = query({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  returns: v.object({
    liked: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_postId_and_userId", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .unique();

    return { liked: existingLike !== null };
  },
});
