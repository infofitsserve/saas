import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/lib/auth/validation";

describe("auth validation", () => {
  it("requires a valid email and long password at signup", () => {
    expect(signUpSchema.safeParse({ fullName: "Sam", email: "sam@example.com", password: "correct-horse-battery" }).success).toBe(true);
    expect(signUpSchema.safeParse({ fullName: "Sam", email: "not-an-email", password: "short" }).success).toBe(false);
  });

  it("rejects overlong names", () => {
    expect(signUpSchema.safeParse({ fullName: "x".repeat(121), email: "sam@example.com", password: "correct-horse-battery" }).success).toBe(false);
  });

  it("requires email and password for sign in", () => {
    expect(signInSchema.safeParse({ email: "sam@example.com", password: "password" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "sam@example.com", password: "" }).success).toBe(false);
  });
});
