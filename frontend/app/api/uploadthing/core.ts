import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      return { userId: "instructor" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Thumbnail upload complete:", file.url);
    }),

  chapterVideo: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      return { userId: "instructor" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Video upload complete:", file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;