import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Add a comment to a post.
 */
export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
    text: v.string(),
  },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post no encontrado");
    }
    if (args.text.trim().length === 0) {
      throw new Error("El comentario no puede estar vacío");
    }

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      userId: args.userId,
      text: args.text.trim(),
      createdAt: Date.now(),
    });

    // Update comment count on the post
    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    });

    // Send push notification to post owner (not to self)
    if (post.authorUserId !== args.userId) {
      const commenter = await ctx.db.get(args.userId);
      await ctx.scheduler.runAfter(0, internal.notifications.sendPushToUser, {
        userId: post.authorUserId,
        title: "💬 Nuevo Comentario",
        body: `${commenter?.username ?? "Alguien"} comentó: "${args.text.substring(0, 50)}${args.text.length > 50 ? "..." : ""}"`,
      });
    }

    return commentId;
  },
});

/**
 * List comments for a post.
 */
export const listComments = query({
  args: { postId: v.id("posts") },
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      postId: v.id("posts"),
      userId: v.id("users"),
      username: v.string(),
      text: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    const results = [];
    for (const comment of comments) {
      const user = await ctx.db.get(comment.userId);
      results.push({
        _id: comment._id,
        _creationTime: comment._creationTime,
        postId: comment.postId,
        userId: comment.userId,
        username: user?.username ?? "Desconocido",
        text: comment.text,
        createdAt: comment.createdAt,
      });
    }
    return results;
  },
});

/**
 * Delete a comment (ADMIN ONLY).
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.isAdmin) {
      throw new Error("Solo el administrador puede borrar comentarios");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comentario no encontrado");
    }

    // Update comment count on the post
    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, post.commentCount - 1),
      });
    }

    await ctx.db.delete(args.commentId);
    return null;
  },
});
