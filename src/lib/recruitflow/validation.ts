import { z } from "zod";

const shortText = (max: number) => z.string().trim().max(max);
export const clientSchema = z.object({
  name: shortText(160).min(1), contactName: shortText(120),
  contactEmail: z.union([z.literal(""), z.string().trim().email().max(254)]), notes: shortText(2000),
});
export const jobSchema = z.object({
  title: shortText(160).min(1), location: shortText(160), description: shortText(10000),
  skills: shortText(2000), clientId: z.union([z.literal(""), z.string().uuid()]),
});
export const candidateSchema = z.object({
  fullName: shortText(160).min(1), email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  phone: shortText(50), location: shortText(160), skills: shortText(2000),
  experienceSummary: shortText(4000), resumeText: shortText(20000),
  consent: z.literal("on").optional(), retentionUntil: z.union([z.literal(""), z.string().date()]),
});
export const applicationSchema = z.object({ candidateId: z.string().uuid(), jobId: z.string().uuid() });
