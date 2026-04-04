import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const signupSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8)
});

export const sessionTokenSchema = z.object({
  idToken: z.string().min(1),
  role: z.enum(["worker", "master", "admin"]).optional()
});
