import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PriorWork {
  title: string;
  url: string;
}

interface FormData {
  // Section 1: Identity
  displayName: string;
  email: string;
  profileUrl: string;

  // Section 2: Organization
  organization: string;
  orgRole: string;
  orgWebsite: string;

  // Section 3: Prior Work
  priorWork: PriorWork[];

  // Section 4: Investigation Purpose
  investigationProject: string;
  geographicFocus: string;
  outputType: string;

  // Section 5: Support & Attribution
  supportLink: string;
  agreesToCredit: boolean;

  // Section 6: Safety & Risk
  underThreats: "yes" | "no" | "prefer_not" | "";
  useOpSec: boolean;
  opSecTools: string;
  previouslyDoxxed: "yes" | "no" | "prefer_not" | "";
  emergencyContact: string;
  consentSafetyOutreach: boolean;

  // Section 7: Terms
  referralSource: string;
  willShareRawData: boolean;
  agreesToTerms: boolean;
  agreesToPrivacy: boolean;
}

const INITIAL_FORM: FormData = {
  displayName: "",
  email: "",
  profileUrl: "",
  organization: "",
  orgRole: "",
  orgWebsite: "",
  priorWork: [{ title: "", url: "" }],
  investigationProject: "",
  geographicFocus: "",
  outputType: "",
  supportLink: "",
  agreesToCredit: false,
  underThreats: "",
  useOpSec: false,
  opSecTools: "",
  previouslyDoxxed: "",
  emergencyContact: "",
  consentSafetyOutreach: false,
  referralSource: "",
  willShareRawData: false,
  agreesToTerms: false,
  agreesToPrivacy: false,
};

const SECTIONS = [
  { num: "I", title: "Identity & Contact" },
  { num: "II", title: "Organization" },
  { num: "III", title: "Prior Work" },
  { num: "IV", title: "Investigation Purpose" },
  { num: "V", title: "Support & Attribution" },
  { num: "VI", title: "Safety & Risk" },
  { num: "VII", title: "Terms & Consent" },
];

const OUTPUT_TYPES = [
  "News article / investigative report",
  "Documentary / film",
  "Academic research / paper",
  "Podcast / audio journalism",
  "Book / long-form writing",
  "Legal filing / advocacy",
  "Policy brief / government report",
  "Personal / whistleblower disclosure",
  "Other",
];

const GEO_FOCUSES = [
  "Local (city/county level)",
  "State / regional",
  "National (USA)",
  "International",
  "Multiple jurisdictions",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Label({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label
      className="block text-xs font-medium tracking-widest uppercase mb-1.5"
      style={{ color: "var(--vault-gold)" }}
    >
      {children}
      {required && <span style={{ color: "#e74c3c" }}> *</span>}
      {optional && (
        <span
          className="ml-1.5 normal-case tracking-normal"
          style={{ color: "var(--vault-muted)", fontSize: "11px", fontFamily: "Inter, sans-serif" }}
        >
          (optional)
        </span>
      )}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mt-1 italic" style={{ color: "var(--vault-muted)" }}>
      {children}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs mt-1" style={{ color: "#e74c3c" }}>{message}</p>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2.5 text-sm transition-colors"
      style={{
        background: "var(--vault-surface)",
        border: "1px solid var(--vault-border)",
        borderRadius: "3px",
        color: "var(--vault-text)",
        outline: "none",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--vault-gold)";
        e.target.style.boxShadow = "0 0 0 2px rgba(201,168,76,0.12)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--vault-border)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 text-sm resize-y transition-colors"
      style={{
        background: "var(--vault-surface)",
        border: "1px solid var(--vault-border)",
        borderRadius: "3px",
        color: "var(--vault-text)",
        outline: "none",
        fontFamily: "Inter, sans-serif",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--vault-gold)";
        e.target.style.boxShadow = "0 0 0 2px rgba(201,168,76,0.12)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--vault-border)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-sm"
      style={{
        background: "var(--vault-surface)",
        border: "1px solid var(--vault-border)",
        borderRadius: "3px",
        color: value ? "var(--vault-text)" : "var(--vault-muted)",
        outline: "none",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt} style={{ background: "#111", color: "var(--vault-text)" }}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-3 flex-wrap">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border transition-colors"
          style={{
            background: value === opt.value ? "rgba(201,168,76,0.08)" : "var(--vault-surface)",
            borderColor: value === opt.value ? "var(--vault-gold)" : "var(--vault-border)",
            borderRadius: "3px",
            color: "var(--vault-text)",
          }}
        >
          <input
            type="radio"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ accentColor: "var(--vault-gold)" }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className="flex items-start gap-3 p-3 border cursor-pointer transition-colors"
      style={{
        background: checked ? "rgba(201,168,76,0.06)" : "transparent",
        borderColor: checked ? "rgba(201,168,76,0.3)" : "var(--vault-border)",
        borderRadius: "3px",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 flex-shrink-0"
        style={{ accentColor: "var(--vault-gold)", width: "16px", height: "16px" }}
      />
      <span className="text-sm leading-relaxed" style={{ color: "var(--vault-text)" }}>
        {children}
      </span>
    </label>
  );
}

// ─── Section Components ───────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div
      className="flex items-center gap-3 mb-5 pb-4"
      style={{ borderBottom: "1px solid var(--vault-border)" }}
    >
      <div
        className="w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: "var(--vault-gold)",
          color: "#050505",
          fontFamily: "Cinzel, serif",
          borderRadius: "2px",
        }}
      >
        {num}
      </div>
      <h2
        className="text-base tracking-wider"
        style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
      >
        {title}
      </h2>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Apply() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) setInviteToken(token);
  }, []);

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const submitMutation = trpc.vetting.submit.useMutation({
    onSuccess: (data, variables) => {
      // Store summary for the confirmation page
      const summary = {
        applicationId: data.applicationId,
        displayName: variables.displayName,
        email: variables.email,
        organization: variables.organization ?? null,
        orgRole: variables.orgRole ?? null,
        investigationProject: variables.investigationProject,
        geographicFocus: variables.geographicFocus,
        outputType: variables.outputType,
        priorWorkCount: variables.priorWork?.filter(p => p.title || p.url).length ?? 0,
        agreesToCredit: variables.agreesToCredit,
        useOpSec: variables.useOpSec,
        supportLink: variables.supportLink ?? null,
        submittedAt: new Date().toISOString(),
      };
      sessionStorage.setItem("vault_submission_summary", JSON.stringify(summary));
      navigate("/success");
    },
    onError: (err) => {
      toast.error(err.message || "Submission failed. Please try again.");
      setIsSubmitting(false);
    },
  });

  // Prior work helpers
  const addPriorWork = () => {
    set("priorWork", [...form.priorWork, { title: "", url: "" }]);
  };

  const removePriorWork = (idx: number) => {
    set("priorWork", form.priorWork.filter((_, i) => i !== idx));
  };

  const updatePriorWork = (idx: number, field: "title" | "url", value: string) => {
    const updated = form.priorWork.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    set("priorWork", updated);
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.displayName.trim()) newErrors.displayName = "Display name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Please enter a valid email address";
    if (!form.investigationProject.trim() || form.investigationProject.length < 10)
      newErrors.investigationProject = "Please describe your investigation in at least 10 characters";
    if (!form.geographicFocus) newErrors.geographicFocus = "Geographic focus is required";
    if (!form.outputType) newErrors.outputType = "Expected output type is required";
    if (!form.agreesToTerms) newErrors.agreesToTerms = "You must agree to the terms of use";
    if (!form.agreesToPrivacy) newErrors.agreesToPrivacy = "You must agree to the privacy policy";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please correct the errors below before submitting.");
      // Scroll to first error
      setTimeout(() => {
        const el = document.querySelector("[data-error]");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }

    setIsSubmitting(true);

    const cleanPriorWork = form.priorWork.filter((pw) => pw.title.trim() || pw.url.trim());

    submitMutation.mutate({
      displayName: form.displayName,
      email: form.email,
      profileUrl: form.profileUrl || undefined,
      organization: form.organization || undefined,
      orgRole: form.orgRole || undefined,
      orgWebsite: form.orgWebsite || undefined,
      priorWork: cleanPriorWork.length > 0 ? cleanPriorWork : undefined,
      investigationProject: form.investigationProject,
      geographicFocus: form.geographicFocus,
      outputType: form.outputType,
      supportLink: form.supportLink || undefined,
      agreesToCredit: form.agreesToCredit,
      underThreats: form.underThreats || undefined,
      useOpSec: form.useOpSec,
      opSecTools: form.opSecTools || undefined,
      previouslyDoxxed: form.previouslyDoxxed || undefined,
      emergencyContact: form.emergencyContact || undefined,
      consentSafetyOutreach: form.consentSafetyOutreach,
      referralSource: form.referralSource || undefined,
      willShareRawData: form.willShareRawData,
      agreesToTerms: form.agreesToTerms,
      agreesToPrivacy: form.agreesToPrivacy,
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--vault-black)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: "rgba(5,5,5,0.95)",
          borderColor: "var(--vault-border)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            style={{ color: "var(--vault-muted)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030563274/8pjFw3h3P7WVQwFs3j6pN5/vault-logo_1d096394.png"
              alt="The Vault Investigates"
              className="h-8 w-auto object-contain"
            />
          </button>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}
          >
            Access Application
          </span>
          <div style={{ width: "80px" }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-10">
          <h1
            className="text-2xl mb-2 tracking-wide"
            style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
          >
            Database Access Application
          </h1>
          <p className="text-sm" style={{ color: "var(--vault-muted)" }}>
            Complete all required fields. Your information is handled with strict confidentiality.
          </p>
          {inviteToken && (
            <div
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs"
              style={{
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.25)",
                borderRadius: "3px",
                color: "var(--vault-gold)",
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.08em",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5Z" fill="currentColor" />
              </svg>
              Invited Application
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Section I: Identity ── */}
          <div
            className="p-6 mb-6 border"
            style={{ background: "var(--vault-surface)", borderColor: "var(--vault-border)", borderRadius: "4px" }}
          >
            <SectionHeader num="I" title="Identity & Contact" />

            <div className="space-y-5">
              <div data-error={errors.displayName ? true : undefined}>
                <Label required>Display Name / Handle</Label>
                <Input
                  value={form.displayName}
                  onChange={(v) => set("displayName", v)}
                  placeholder="Your name, pseudonym, or journalist handle"
                />
                <Hint>You may use a pseudonym for safety. Legal name is not required.</Hint>
                <FieldError message={errors.displayName} />
              </div>

              <div data-error={errors.email ? true : undefined}>
                <Label required>Contact Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  placeholder="your@email.com (or a secure/anonymous email)"
                />
                <Hint>We recommend ProtonMail or Tutanota for enhanced privacy.</Hint>
                <FieldError message={errors.email} />
              </div>

              <div>
                <Label optional>Professional Profile URL</Label>
                <Input
                  value={form.profileUrl}
                  onChange={(v) => set("profileUrl", v)}
                  placeholder="https://yourwebsite.com, LinkedIn, MuckRack, etc."
                />
                <Hint>A link to your published work, professional bio, or portfolio.</Hint>
              </div>
            </div>
          </div>

          {/* ── Section II: Organization ── */}
          <div
            className="p-6 mb-6 border"
            style={{ background: "var(--vault-surface)", borderColor: "var(--vault-border)", borderRadius: "4px" }}
          >
            <SectionHeader num="II" title="Organization" />
            <p className="text-xs mb-5 italic" style={{ color: "var(--vault-muted)" }}>
              All fields in this section are optional. Independent journalists and freelancers are welcome to apply.
            </p>

            <div className="space-y-5">
              <div>
                <Label optional>Organization / Publication</Label>
                <Input
                  value={form.organization}
                  onChange={(v) => set("organization", v)}
                  placeholder="e.g., The Guardian, ProPublica, Independent, etc."
                />
              </div>

              <div>
                <Label optional>Your Role / Title</Label>
                <Input
                  value={form.orgRole}
                  onChange={(v) => set("orgRole", v)}
                  placeholder="e.g., Investigative Reporter, Editor, Researcher"
                />
              </div>

              <div>
                <Label optional>Organization Website</Label>
                <Input
                  value={form.orgWebsite}
                  onChange={(v) => set("orgWebsite", v)}
                  placeholder="https://yourorganization.com"
                />
              </div>
            </div>
          </div>

          {/* ── Section III: Prior Work ── */}
          <div
            className="p-6 mb-6 border"
            style={{ background: "var(--vault-surface)", borderColor: "var(--vault-border)", borderRadius: "4px" }}
          >
            <SectionHeader num="III" title="Prior Work" />
            <p className="text-xs mb-5 italic" style={{ color: "var(--vault-muted)" }}>
              Share links to published work, investigations, or other evidence of your journalism/research background.
              This section is optional but strongly recommended.
            </p>

            <div className="space-y-3">
              {form.priorWork.map((pw, idx) => (
                <div
                  key={idx}
                  className="p-4 border"
                  style={{ borderColor: "rgba(201,168,76,0.15)", borderRadius: "3px", background: "rgba(201,168,76,0.02)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs tracking-wider uppercase"
                      style={{ color: "var(--vault-gold-dim)", fontFamily: "Cinzel, serif" }}
                    >
                      Work Sample {idx + 1}
                    </span>
                    {form.priorWork.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePriorWork(idx)}
                        className="text-xs px-2 py-1 transition-colors"
                        style={{ color: "#c0392b", border: "1px solid rgba(192,57,43,0.3)", borderRadius: "2px" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label optional>Title / Description</Label>
                      <Input
                        value={pw.title}
                        onChange={(v) => updatePriorWork(idx, "title", v)}
                        placeholder="Article title or brief description"
                      />
                    </div>
                    <div>
                      <Label optional>URL</Label>
                      <Input
                        value={pw.url}
                        onChange={(v) => updatePriorWork(idx, "url", v)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPriorWork}
                className="w-full py-2.5 text-xs tracking-wider uppercase border border-dashed transition-colors"
                style={{
                  borderColor: "var(--vault-border)",
                  color: "var(--vault-muted)",
                  borderRadius: "3px",
                  fontFamily: "Cinzel, serif",
                }}
              >
                + Add Another Work Sample
              </button>
            </div>
          </div>

          {/* ── Section IV: Investigation Purpose ── */}
          <div
            className="p-6 mb-6 border"
            style={{ background: "var(--vault-surface)", borderColor: "var(--vault-border)", borderRadius: "4px" }}
          >
            <SectionHeader num="IV" title="Investigation Purpose" />

            <div className="space-y-5">
              <div data-error={errors.investigationProject ? true : undefined}>
                <Label required>Describe Your Investigation or Research Project</Label>
                <Textarea
                  value={form.investigationProject}
                  onChange={(v) => set("investigationProject", v)}
                  placeholder="Describe the investigation, research, or public interest matter you are working on. What records or data do you need, and why? Be as specific as you can — this is the most important part of your application."
                  rows={6}
                />
                <Hint>
                  Be specific about the subject matter, the public interest served, and how database
                  access will support your work. Vague descriptions may delay review.
                </Hint>
                <FieldError message={errors.investigationProject} />
              </div>

              <div data-error={errors.geographicFocus ? true : undefined}>
                <Label required>Geographic Focus</Label>
                <Select
                  value={form.geographicFocus}
                  onChange={(v) => set("geographicFocus", v)}
                  options={GEO_FOCUSES}
                  placeholder="Select geographic scope..."
                />
                <FieldError message={errors.geographicFocus} />
              </div>

              <div data-error={errors.outputType ? true : undefined}>
                <Label required>Expected Output / Format</Label>
                <Select
                  value={form.outputType}
                  onChange={(v) => set("outputType", v)}
                  options={OUTPUT_TYPES}
                  placeholder="Select expected output type..."
                />
                <Hint>What form will your final work take?</Hint>
                <FieldError message={errors.outputType} />
              </div>
            </div>
          </div>

          {/* ── Section V: Support & Attribution ── */}
          <div
            className="p-6 mb-6 border"
            style={{ background: "var(--vault-surface)", borderColor: "var(--vault-border)", borderRadius: "4px" }}
          >
            <SectionHeader num="V" title="Support & Attribution" />

            <div className="space-y-5">
              <div>
                <Label optional>Support Link (Ko-fi, Substack, Patreon, etc.)</Label>
                <Input
                  value={form.supportLink}
                  onChange={(v) => set("supportLink", v)}
                  placeholder="https://ko-fi.com/yourhandle or https://yourname.substack.com"
                />
                <Hint>
                  The Vault is a community-supported resource. Sharing a support link helps us
                  understand your public presence and supports the ecosystem.
                </Hint>
              </div>

              <div>
                <Label>Attribution Agreement</Label>
                <CheckboxRow
                  checked={form.agreesToCredit}
                  onChange={(v) => set("agreesToCredit", v)}
                >
                  I agree to credit The Vault as a data source in any published work that uses
                  records or data obtained through this database, where appropriate and safe to do so.
                </CheckboxRow>
              </div>
            </div>
          </div>

          {/* ── Section VI: Safety & Risk ── */}
          <div
            className="p-6 mb-6 border"
            style={{
              background: "var(--vault-surface)",
              borderColor: "rgba(201,168,76,0.2)",
              borderRadius: "4px",
            }}
          >
            <SectionHeader num="VI" title="Safety & Risk Assessment" />
            <div
              className="mb-5 p-3 border text-xs"
              style={{
                background: "rgba(201,168,76,0.05)",
                borderColor: "rgba(201,168,76,0.2)",
                borderRadius: "3px",
                color: "var(--vault-muted)",
                fontStyle: "italic",
              }}
            >
              This section is entirely optional and confidential. Your answers help us understand
              your safety needs so we can provide appropriate support. You may decline to answer any
              question.
            </div>

            <div className="space-y-5">
              <div>
                <Label optional>Are you currently under threats or surveillance?</Label>
                <RadioGroup
                  value={form.underThreats}
                  onChange={(v) => set("underThreats", v as FormData["underThreats"])}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "prefer_not", label: "Prefer not to say" },
                  ]}
                />
              </div>

              <div>
                <Label optional>Do you use operational security (OpSec) tools?</Label>
                <CheckboxRow
                  checked={form.useOpSec}
                  onChange={(v) => set("useOpSec", v)}
                >
                  Yes, I use OpSec tools (VPN, Tor, Signal, encrypted email, etc.)
                </CheckboxRow>
              </div>

              {form.useOpSec && (
                <div>
                  <Label optional>Which OpSec tools do you use?</Label>
                  <Input
                    value={form.opSecTools}
                    onChange={(v) => set("opSecTools", v)}
                    placeholder="e.g., Signal, ProtonMail, Tor Browser, VPN, Tails OS..."
                  />
                </div>
              )}

              <div>
                <Label optional>Have you previously been doxxed or had your identity exposed?</Label>
                <RadioGroup
                  value={form.previouslyDoxxed}
                  onChange={(v) => set("previouslyDoxxed", v as FormData["previouslyDoxxed"])}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "prefer_not", label: "Prefer not to say" },
                  ]}
                />
              </div>

              <div>
                <Label optional>Emergency Contact (for safety check-ins)</Label>
                <Input
                  value={form.emergencyContact}
                  onChange={(v) => set("emergencyContact", v)}
                  placeholder="Name and contact method (encrypted preferred)"
                />
                <Hint>
                  This is only used if we are unable to reach you and have reason to believe you
                  may be in danger. This information is stored separately and securely.
                </Hint>
              </div>

              <div>
                <Label optional>Safety Outreach Consent</Label>
                <CheckboxRow
                  checked={form.consentSafetyOutreach}
                  onChange={(v) => set("consentSafetyOutreach", v)}
                >
                  I consent to The Vault reaching out to me with safety resources, threat
                  intelligence, or check-ins if the team believes I may be at risk.
                </CheckboxRow>
              </div>
            </div>
          </div>

          {/* ── Section VII: Terms & Consent ── */}
          <div
            className="p-6 mb-8 border"
            style={{ background: "var(--vault-surface)", borderColor: "var(--vault-border)", borderRadius: "4px" }}
          >
            <SectionHeader num="VII" title="Terms & Consent" />

            <div className="space-y-5">
              <div>
                <Label optional>How did you hear about The Vault?</Label>
                <Input
                  value={form.referralSource}
                  onChange={(v) => set("referralSource", v)}
                  placeholder="e.g., colleague referral, social media, news article..."
                />
              </div>

              <div>
                <Label optional>Data Sharing</Label>
                <CheckboxRow
                  checked={form.willShareRawData}
                  onChange={(v) => set("willShareRawData", v)}
                >
                  I am willing to share relevant raw data, documents, or findings with The Vault
                  team to support the broader investigative community (voluntary, not required for access).
                </CheckboxRow>
              </div>

              <div
                className="p-4 border text-xs leading-relaxed"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderColor: "var(--vault-border)",
                  borderRadius: "3px",
                  color: "var(--vault-muted)",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              >
                <strong style={{ color: "var(--vault-text)" }}>Terms of Use Summary:</strong> Access
                to The Vault database is granted solely for legitimate investigative journalism,
                academic research, and public interest purposes. Users may not use the data for
                commercial purposes, harassment, or any activity that violates applicable law. The
                Vault reserves the right to revoke access at any time. All data obtained must be
                handled responsibly and in accordance with applicable privacy laws.
              </div>

              <div data-error={errors.agreesToTerms ? true : undefined}>
                <CheckboxRow
                  checked={form.agreesToTerms}
                  onChange={(v) => set("agreesToTerms", v)}
                >
                  <span>
                    I have read and agree to The Vault's{" "}
                    <strong style={{ color: "var(--vault-gold)" }}>Terms of Use</strong>
                    {" "}and understand that access may be revoked for misuse.{" "}
                    <span style={{ color: "#e74c3c" }}>*</span>
                  </span>
                </CheckboxRow>
                <FieldError message={errors.agreesToTerms} />
              </div>

              <div data-error={errors.agreesToPrivacy ? true : undefined}>
                <CheckboxRow
                  checked={form.agreesToPrivacy}
                  onChange={(v) => set("agreesToPrivacy", v)}
                >
                  <span>
                    I understand and agree to The Vault's{" "}
                    <strong style={{ color: "var(--vault-gold)" }}>Privacy Policy</strong>
                    {" "}regarding how my application data is stored and used.{" "}
                    <span style={{ color: "#e74c3c" }}>*</span>
                  </span>
                </CheckboxRow>
                <FieldError message={errors.agreesToPrivacy} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-4 text-sm tracking-widest uppercase font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isSubmitting ? "var(--vault-gold-dim)" : "var(--vault-gold)",
                color: "#050505",
                fontFamily: "Cinzel, serif",
                borderRadius: "2px",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
            <p className="mt-3 text-xs" style={{ color: "var(--vault-muted)" }}>
              By submitting, you confirm all information provided is accurate to the best of your knowledge.
            </p>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-16 py-8 text-center"
        style={{ borderColor: "var(--vault-border)" }}
      >
        <p className="text-xs" style={{ color: "var(--vault-muted)" }}>
          The Vault — Secure Investigative Database &nbsp;·&nbsp; All submissions are encrypted and confidential
        </p>
        <p className="text-xs mt-3" style={{ color: "var(--vault-muted)" }}>
          Have information to share?&nbsp;
          <a
            href="/tip"
            style={{
              color: "var(--vault-gold)",
              textDecoration: "none",
              opacity: 0.75,
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "1px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.75")}
          >
            Submit a tip securely
          </a>
        </p>
      </footer>
    </div>
  );
}
