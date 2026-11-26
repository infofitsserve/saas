import { describe, expect, it } from "vitest";
import { businessSchema, employeeSchema, importRowSchema } from "@/lib/shiftpilot/validation";

describe("ShiftPilot validation", () => {
  it("validates workspace input", () => {
    expect(businessSchema.safeParse({ name: "Northwind", timezone: "UTC" }).success).toBe(true);
    expect(businessSchema.safeParse({ name: " ", timezone: "UTC" }).success).toBe(false);
  });
  it("requires employee ID and name", () => {
    expect(employeeSchema.safeParse({ employeeCode: "E-01", fullName: "Sam", email: "", department: "Ops" }).success).toBe(true);
    expect(employeeSchema.safeParse({ employeeCode: "", fullName: "Sam", email: "", department: "" }).success).toBe(false);
  });
  it("rejects malformed imported source rows", () => {
    expect(importRowSchema.safeParse({ rowNumber: 2, raw: {}, employeeCode: "E-01", workDate: "2026-04-15", clockIn: "08:00", clockOut: "17:00", shift: "Day" }).success).toBe(true);
    expect(importRowSchema.safeParse({ rowNumber: 0, raw: {}, employeeCode: "", workDate: "", clockIn: "", clockOut: "", shift: "" }).success).toBe(false);
  });
});
