import { z } from "zod";

const password = z.string().min(12, "Use at least 12 characters.").max(128);

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password,
});

export const signInSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export type AuthFormState = { error?: string; success?: string };
