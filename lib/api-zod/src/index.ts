export * from "./generated/api";
export * from "./generated/types";

import { z } from "zod";

export const RequestUploadUrlBody = z.object({
  name: z.string(),
  size: z.number(),
  contentType: z.string(),
});
export type RequestUploadUrlBody = z.infer<typeof RequestUploadUrlBody>;

export const RequestUploadUrlResponse = z.object({
  uploadURL: z.string(),
  objectPath: z.string(),
  metadata: z.object({
    name: z.string(),
    size: z.number(),
    contentType: z.string(),
  }),
});
export type RequestUploadUrlResponse = z.infer<typeof RequestUploadUrlResponse>;
