import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/** Maximum caption length (same as Instagram) */
const MAX_CAPTION_LENGTH = 2200;
/** Maximum images per post */
const MAX_IMAGES_PER_POST = 10;

/**
 * Generate an upload URL for file storage.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a new post.
 */
export const createPost = mutation({
  args: {
    authorUserId: v.id("users"),
    caption: v.string(),
    imageFileIds: v.array(v.id("_storage")),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.authorUserId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (args.caption.length > MAX_CAPTION_LENGTH) {
      throw new Error(
        `El caption no puede exceder ${MAX_CAPTION_LENGTH} caracteres`
      );
    }
    if (args.imageFileIds.length === 0) {
      throw new Error("Debes agregar al menos una foto");
    }
    if (args.imageFileIds.length > MAX_IMAGES_PER_POST) {
      throw new Error(`Máximo ${MAX_IMAGES_PER_POST} fotos por post`);
    }

    return await ctx.db.insert("posts", {
      authorUserId: args.authorUserId,
      caption: args.caption,
      imageFileIds: args.imageFileIds,
      likeCount: 0,
      commentCount: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * List posts ordered by most recent.
 */
export const listPostsRecent = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      authorUserId: v.id("users"),
      authorUsername: v.string(),
      caption: v.string(),
      imageUrls: v.array(v.union(v.string(), v.null())),
      likeCount: v.number(),
      commentCount: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);

    const results = [];
    for (const post of posts) {
      const author = await ctx.db.get(post.authorUserId);
      const imageUrls = await Promise.all(
        post.imageFileIds.map((fileId) => ctx.storage.getUrl(fileId))
      );
      results.push({
        _id: post._id,
        _creationTime: post._creationTime,
        authorUserId: post.authorUserId,
        authorUsername: author?.username ?? "Desconocido",
        caption: post.caption,
        imageUrls,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt,
      });
    }
    return results;
  },
});

/**
 * List posts ordered by most popular (likes desc, then recency desc).
 */
export const listPostsPopular = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      authorUserId: v.id("users"),
      authorUsername: v.string(),
      caption: v.string(),
      imageUrls: v.array(v.union(v.string(), v.null())),
      likeCount: v.number(),
      commentCount: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    // Fetch all posts and sort by likeCount desc, then createdAt desc
    const posts = await ctx.db.query("posts").order("desc").take(200);

    const sorted = posts.sort((a, b) => {
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      return b.createdAt - a.createdAt;
    });

    const top50 = sorted.slice(0, 50);

    const results = [];
    for (const post of top50) {
      const author = await ctx.db.get(post.authorUserId);
      const imageUrls = await Promise.all(
        post.imageFileIds.map((fileId) => ctx.storage.getUrl(fileId))
      );
      results.push({
        _id: post._id,
        _creationTime: post._creationTime,
        authorUserId: post.authorUserId,
        authorUsername: author?.username ?? "Desconocido",
        caption: post.caption,
        imageUrls,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt,
      });
    }
    return results;
  },
});

/**
 * Get a single post by ID with full details.
 */
export const getPost = query({
  args: { postId: v.id("posts") },
  returns: v.union(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      authorUserId: v.id("users"),
      authorUsername: v.string(),
      caption: v.string(),
      imageUrls: v.array(v.union(v.string(), v.null())),
      likeCount: v.number(),
      commentCount: v.number(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const author = await ctx.db.get(post.authorUserId);
    const imageUrls = await Promise.all(
      post.imageFileIds.map((fileId) => ctx.storage.getUrl(fileId))
    );

    return {
      _id: post._id,
      _creationTime: post._creationTime,
      authorUserId: post.authorUserId,
      authorUsername: author?.username ?? "Desconocido",
      caption: post.caption,
      imageUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
    };
  },
});

/**
 * Delete a post (ADMIN ONLY).
 */
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.isAdmin) {
      throw new Error("Solo el administrador puede borrar posts");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post no encontrado");
    }

    // Delete associated likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete associated comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete storage files
    for (const fileId of post.imageFileIds) {
      await ctx.storage.delete(fileId);
    }

    await ctx.db.delete(args.postId);
    return null;
  },
});
