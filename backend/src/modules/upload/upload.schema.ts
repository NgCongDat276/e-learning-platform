import { z } from "zod";

export const uploadFolderEnum = z.enum([
  "courses/thumbnails",
  "lessons/videos",
  "lessons/documents",
  "users/avatars",
]);

export type UploadFolder = z.infer<typeof uploadFolderEnum>;

export const getPresignedUrlSchema = z.object({
  fileName: z
    .string({
      error: "File name is required",
    })
    .trim()
    .min(1, "File name cannot be empty")
    .max(255, "File name cannot exceed 255 characters"),
  contentType: z
    .string({
      error: "Content type (MIME type) is required",
    })
    .trim()
    .min(1, "Content type cannot be empty")
    .refine(
      (type) =>
        type.startsWith("image/") ||
        type.startsWith("video/") ||
        type === "application/pdf",
      "Unsupported file format. Only images, videos, and PDF documents are allowed.",
    ),
  folder: uploadFolderEnum.default("lessons/videos"),
  fileSize: z.number().positive("File size must be greater than 0").optional(),
});

export type GetPresignedUrlInput = z.infer<typeof getPresignedUrlSchema>;
