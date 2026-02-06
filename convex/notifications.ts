import { internalAction, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Register or update push token for a user.
 */
export const registerPushToken = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    platform: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if token already exists for this user
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        token: args.token,
        platform: args.platform,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("pushTokens", {
        userId: args.userId,
        token: args.token,
        platform: args.platform,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Internal: send push notification to a user.
 */
export const sendPushToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the push token for this user
    const tokenDoc = await ctx.runQuery(
      internal.notifications.getPushToken,
      { userId: args.userId }
    );

    if (!tokenDoc || !tokenDoc.token) {
      // User has no push token registered, skip silently
      return null;
    }

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: tokenDoc.token,
          title: args.title,
          body: args.body,
          sound: "default",
        }),
      });

      if (!response.ok) {
        console.error(
          "Error al enviar push notification:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error al enviar push notification:", error);
    }

    return null;
  },
});

/**
 * Internal query to get push token for a user.
 */
export const getPushToken = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      token: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("pushTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!tokenDoc) return null;
    return { token: tokenDoc.token };
  },
});
