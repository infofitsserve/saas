import { describe, expect, it } from "vitest";
import { applicationSchema, candidateSchema, clientSchema, jobSchema } from "@/lib/recruitflow/validation";

describe("RecruitFlow validation", () => {
  it("validates client and requisition input", () => {
    expect(clientSchema.safeParse({ name: "Acme", contactName: "", contactEmail: "", notes: "" }).success).toBe(true);
    expect(jobSchema.safeParse({ title: "Recruiter", location: "Remote", description: "", skills: "Hiring", clientId: "" }).success).toBe(true);
    expect(jobSchema.safeParse({ title: "", location: "", description: "", skills: "", clientId: "" }).success).toBe(false);
  });
  it("validates candidate records and optional consent", () => {
    const value = { fullName: "Sam", email: "", phone: "", location: "", skills: "", experienceSummary: "", resumeText: "", retentionUntil: "" };
    expect(candidateSchema.safeParse(value).success).toBe(true);
    expect(candidateSchema.safeParse({ ...value, email: "bad" }).success).toBe(false);
  });
  it("requires UUID references for applications", () => {
    expect(applicationSchema.safeParse({ candidateId: "not-id", jobId: "not-id" }).success).toBe(false);
  });
});
