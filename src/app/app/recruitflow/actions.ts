"use server";

import { revalidatePath } from "next/cache";
import { clientSchema, jobSchema, candidateSchema, applicationSchema } from "@/lib/recruitflow/validation";
import { requireRecruitingWorkspace } from "@/lib/recruitflow/workspace";

export type RecruitActionState = { error?: string; success?: string };
const tokens = (value: string) => value.split(/[\s,;|]+/).map((token) => token.trim().toLowerCase()).filter(Boolean).slice(0, 100);

export async function createClientAction(_state: RecruitActionState, data: FormData): Promise<RecruitActionState> {
  const parsed = clientSchema.safeParse({ name: data.get("name"), contactName: data.get("contactName") ?? "", contactEmail: data.get("contactEmail") ?? "", notes: data.get("notes") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check client details." };
  const { supabase, tenantId } = await requireRecruitingWorkspace();
  const { error } = await supabase.from("recruit_clients").insert({ tenant_id: tenantId, name: parsed.data.name, contact_name: parsed.data.contactName || null, contact_email: parsed.data.contactEmail || null, notes: parsed.data.notes });
  if (error) return { error: "Could not save client. Please retry." };
  revalidatePath("/app/recruitflow"); return { success: "Client saved." };
}

export async function createJobAction(_state: RecruitActionState, data: FormData): Promise<RecruitActionState> {
  const parsed = jobSchema.safeParse({ title: data.get("title"), location: data.get("location") ?? "", description: data.get("description") ?? "", skills: data.get("skills") ?? "", clientId: data.get("clientId") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check job details." };
  const { supabase, tenantId, user } = await requireRecruitingWorkspace();
  const { error } = await supabase.from("recruit_jobs").insert({ tenant_id: tenantId, title: parsed.data.title, location: parsed.data.location, description: parsed.data.description, required_skills: tokens(parsed.data.skills), client_id: parsed.data.clientId || null, created_by: user.id });
  if (error) return { error: "Could not save vacancy. Please verify the client and retry." };
  revalidatePath("/app/recruitflow"); return { success: "Vacancy created." };
}

export async function createCandidateAction(_state: RecruitActionState, data: FormData): Promise<RecruitActionState> {
  const parsed = candidateSchema.safeParse({ fullName: data.get("fullName"), email: data.get("email") ?? "", phone: data.get("phone") ?? "", location: data.get("location") ?? "", skills: data.get("skills") ?? "", experienceSummary: data.get("experienceSummary") ?? "", resumeText: data.get("resumeText") ?? "", consent: data.get("consent") ?? undefined, retentionUntil: data.get("retentionUntil") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check candidate details." };
  const { supabase, tenantId, user } = await requireRecruitingWorkspace();
  const resume = data.get("resume");
  if (resume instanceof File && resume.size > 0) {
    if (!parsed.data.consent) return { error: "Record candidate consent before uploading a resume." };
    if (resume.size > 10 * 1024 * 1024) return { error: "Resume must be 10 MB or smaller." };
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain"];
    if (!allowed.includes(resume.type)) return { error: "Upload a PDF, DOC, DOCX, or TXT resume." };
  }
  let resumePath: string | null = null;
  if (resume instanceof File && resume.size > 0) {
    const extension = resume.name.split(".").pop()?.toLowerCase() ?? "bin";
    resumePath = `${tenantId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("recruit-resumes").upload(resumePath, resume, { contentType: resume.type, upsert: false });
    if (error) return { error: "Could not securely upload the resume." };
  }
  const { error } = await supabase.from("recruit_candidates").insert({ tenant_id: tenantId, full_name: parsed.data.fullName, email: parsed.data.email || null, phone: parsed.data.phone || null, location: parsed.data.location, skills: tokens(parsed.data.skills), experience_summary: parsed.data.experienceSummary, resume_text: parsed.data.resumeText, resume_path: resumePath, consent_recorded_at: parsed.data.consent ? new Date().toISOString() : null, retention_until: parsed.data.retentionUntil || null, created_by: user.id });
  if (error) {
    if (resumePath) await supabase.storage.from("recruit-resumes").remove([resumePath]);
    return { error: "Could not save candidate. Any uploaded file was removed; please retry." };
  }
  revalidatePath("/app/recruitflow"); return { success: "Candidate saved. Resume text extraction is not configured; review or enter extracted text manually." };
}

export async function createApplicationAction(_state: RecruitActionState, data: FormData): Promise<RecruitActionState> {
  const parsed = applicationSchema.safeParse({ candidateId: data.get("candidateId"), jobId: data.get("jobId") });
  if (!parsed.success) return { error: "Choose a valid candidate and vacancy." };
  const { supabase, tenantId, user } = await requireRecruitingWorkspace();
  const [{ data: job }, { data: candidate }, { data: stage }] = await Promise.all([
    supabase.from("recruit_jobs").select("id, required_skills, description").eq("tenant_id", tenantId).eq("id", parsed.data.jobId).single(),
    supabase.from("recruit_candidates").select("id, skills, experience_summary, resume_text").eq("tenant_id", tenantId).eq("id", parsed.data.candidateId).single(),
    supabase.from("recruit_stages").select("id").eq("tenant_id", tenantId).eq("name", "Applied").single(),
  ]);
  if (!job || !candidate || !stage) return { error: "Candidate, job, or default stage could not be found in this workspace." };
  const candidateEvidence = [...candidate.skills, ...tokens(`${candidate.experience_summary} ${candidate.resume_text}`)];
  const matched = job.required_skills.filter((skill: string) => candidateEvidence.includes(skill.toLowerCase()));
  const missing = job.required_skills.filter((skill: string) => !matched.includes(skill));
  const suggestion = { type: "keyword_overlap_suggestion", matched_skills: matched, missing_skills: missing, explanation: "A transparent keyword comparison of recruiter-entered skills and resume text. This is not an AI model, a suitability decision, or an automated screening result.", recruiter_questions: ["What recent work demonstrates the required skills?", "Which missing skills are learnable or transferable?"] };
  const { error } = await supabase.from("recruit_applications").insert({ tenant_id: tenantId, candidate_id: candidate.id, job_id: job.id, stage_id: stage.id, recruiter_id: user.id, match_suggestion: suggestion });
  if (error) return { error: error.code === "23505" ? "This candidate is already attached to this vacancy." : "Could not create application." };
  revalidatePath("/app/recruitflow"); return { success: "Application created in Applied. A recruiter must make all shortlist or rejection decisions." };
}

export async function updateCandidateConsentAction(_state: RecruitActionState, data: FormData): Promise<RecruitActionState> {
  const id = data.get("candidateId");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return { error: "Candidate ID is invalid." };
  const { supabase, tenantId } = await requireRecruitingWorkspace();
  const { data: candidate } = await supabase.from("recruit_candidates").select("id, resume_path").eq("tenant_id", tenantId).eq("id", id).single();
  if (!candidate) return { error: "Candidate not found." };
  if (candidate.resume_path) await supabase.storage.from("recruit-resumes").remove([candidate.resume_path]);
  const { error } = await supabase.from("recruit_candidates").update({ resume_path: null, resume_text: "", consent_recorded_at: null, deletion_requested_at: new Date().toISOString() }).eq("tenant_id", tenantId).eq("id", id);
  if (error) return { error: "Could not process candidate data deletion." };
  revalidatePath("/app/recruitflow"); return { success: "Resume and extracted text were removed; a deletion request was recorded." };
}
