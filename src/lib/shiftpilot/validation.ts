import { z } from "zod";

export const businessSchema = z.object({
  name: z.string().trim().min(1).max(160),
  timezone: z.string().min(1).max(100),
});

export const employeeSchema = z.object({
  employeeCode: z.string().trim().min(1).max(80),
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254).or(z.literal("")),
  department: z.string().trim().max(120),
});

export const importRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  raw: z.record(z.string(), z.unknown()),
  employeeCode: z.string().max(80),
  workDate: z.string().max(100),
  clockIn: z.string().max(80),
  clockOut: z.string().max(80),
  shift: z.string().max(120),
});

export const attendanceImportSchema = z.object({
  fileName: z.string().min(1).max(255),
  rows: z.array(importRowSchema).min(1).max(5000),
});
