import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

/**
 * Public action to trigger email sending for post photos.
 * This is called from the client after publishing a post.
 */
export const requestPostPhotosEmail = action({
  args: {
    postId: v.id("posts"),
    toEmail: v.string(),
    username: v.string(),
    caption: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Fetch the post to get real storage image URLs
    const post = await ctx.runQuery(api.posts.getPost, {
      postId: args.postId,
    });

    if (!post) {
      throw new Error("Publicación no encontrada");
    }

    const validUrls = post.imageUrls.filter(
      (url): url is string => url !== null
    );

    if (validUrls.length === 0) {
      throw new Error("No hay imágenes para enviar");
    }

    await ctx.runAction(internal.email.sendPostPhotosByEmail, {
      toEmail: args.toEmail,
      username: args.username,
      caption: args.caption,
      imageUrls: validUrls,
      postId: args.postId as string,
    });

    return null;
  },
});
