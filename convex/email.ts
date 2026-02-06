"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";

const resend = new Resend(components.resend, {
  testMode: false,
});

/**
 * Send post photos by email using Resend.
 * Called server-side after the user opts in to receive photos.
 */
export const sendPostPhotosByEmail = internalAction({
  args: {
    toEmail: v.string(),
    username: v.string(),
    caption: v.string(),
    imageUrls: v.array(v.string()),
    postId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const imageHtml = args.imageUrls
      .map(
        (url, i) =>
          `<div style="margin-bottom: 16px;">
            <img src="${url}" alt="Foto ${i + 1}" style="max-width: 100%; border-radius: 12px; display: block;" />
          </div>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; margin-top: 24px; margin-bottom: 24px;">
          <!-- Header -->
          <div style="background-color: #00599D; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📸 OpenHouse 2026</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">Tus fotos de la publicación</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 24px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 8px;">
              ¡Hola <strong>${args.username}</strong>! 👋
            </p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              Aquí están las fotos de tu publicación:
            </p>
            
            ${args.caption ? `<div style="background: #f0f0f0; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
              <p style="color: #333; font-size: 14px; margin: 0; font-style: italic;">"${args.caption}"</p>
            </div>` : ""}
            
            <!-- Photos -->
            ${imageHtml}
          </div>
          
          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              OpenHouse 2026 Social App — PUCMM
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.sendEmail(ctx, {
      from: "OpenHouse 2026 <noreply@openhouse-2026.o5d.dev>",
      to: args.toEmail,
      subject: "📸 Tus fotos de OpenHouse 2026",
      html,
    });

    return null;
  },
});
