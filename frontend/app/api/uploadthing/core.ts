import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      return { userId: "instructor" };
    })
    .onUploadComplete(async ({ file }) => {
      const url = file.ufsUrl || file.url;
      console.log("Thumbnail upload complete:", url);
      return { url };
    }),

  chapterVideo: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      return { userId: "instructor" };
    })
    .onUploadComplete(async ({ file }) => {
      const url = file.ufsUrl || file.url;
      console.log("Video upload complete:", url);
      return { url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;