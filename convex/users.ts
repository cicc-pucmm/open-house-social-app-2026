import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Admin credentials
const ADMIN_USERNAME = "@cicc";
const ADMIN_EMAIL = "cicc-csti@ce.pucmm.edu.do";
const ADMIN_PHONE = "000-000-0000";

/**
 * Upsert a user from a temporary session.
 * If a user with the same email exists, update it; otherwise create a new one.
 */
export const upsertUserFromSession = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    const isAdmin =
      args.username === ADMIN_USERNAME &&
      args.email === ADMIN_EMAIL &&
      args.phone === ADMIN_PHONE;

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        phone: args.phone,
        isAdmin,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      phone: args.phone,
      isAdmin,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get a user by ID.
 */
export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      username: v.string(),
      email: v.string(),
      phone: v.string(),
      isAdmin: v.boolean(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get a user by email.
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      username: v.string(),
      email: v.string(),
      phone: v.string(),
      isAdmin: v.boolean(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});
