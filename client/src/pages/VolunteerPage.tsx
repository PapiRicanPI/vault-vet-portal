import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const ROLES = [
  {
    id: "osint_research_trainee",
    title: "Junior OSINT Research Trainee",
    icon: "🔍",
    description:
      "Learn structured open-source intelligence research — public records, corporate filings, news archives. You will work on sanitized case summaries with no access to tip sources.",
    skills: ["Attention to detail", "Internet research", "Note-taking"],
    hours: "4–6 hrs/week",
  },
  {
    id: "data_verification_trainee",
    title: "Data Verification Trainee",
    icon: "📋",
    description:
      "Cross-reference public records, flag inconsistencies in documents, and format case entries into the database. Detail-oriented students excel at this role.",
    skills: ["Data entry", "Document review", "Accuracy"],
    hours: "2–4 hrs/week",
  },
  {
    id: "digital_journalism_apprentice",
    title: "Digital Journalism Apprentice",
    icon: "✍️",
    description:
      "Draft background summaries, timeline documents, and explainer sections under editorial review. Nothing publishes without approval. Ideal for journalism-track students.",
    skills: ["Writing", "Research", "English proficiency"],
    hours: "4–8 hrs/week",
  },
];

const STRANDS = ["STEM", "ABM", "HUMSS", "GAS", "TVL", "Sports", "Arts & Design", "Other"];
const GRADE_LEVELS = ["Grade 11", "Grade 12"];
const HOURS_OPTIONS = [2, 3, 4, 5, 6, 8, 10];

type Step = "landing" | "form" | "success";

export default function VolunteerPage() {
  const [step, setStep] = useState<Step>("landing");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    age: "",
    schoolName: "",
    gradeLevel: "",
    strand: "",
    city: "",
    role: "",
    teacherName: "",
    teacherEmail: "",
    teacherSubject: "",
    whyApply: "",
    relevantExperience: "",
    availabilityHoursPerWeek: "",
    parentalConsentGiven: false,
    parentName: "",
    parentEmail: "",
    agreesToTerms: false,
    agreesToConfidentiality: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitMutation = trpc.volunteer.submit.useMutation({
    onSuccess: () => setStep("success"),
    onError: (err) => setErrors({ submit: err.message }),
  });

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email is required";
    const age = parseInt(form.age);
    if (!form.age || isNaN(age) || age < 15 || age > 20) e.age = "Age must be between 15 and 20";
    if (!form.schoolName.trim()) e.schoolName = "School name is required";
    if (!form.gradeLevel) e.gradeLevel = "Grade level is required";
    if (!form.city.trim()) e.city = "City/district is required";
    if (!form.role) e.role = "Please select a role";
    if (!form.teacherName.trim()) e.teacherName = "Teacher name is required";
    if (!form.teacherEmail.trim() || !form.teacherEmail.includes("@")) e.teacherEmail = "Valid teacher email is required";
    if (!form.whyApply.trim() || form.whyApply.length < 50) e.whyApply = "Please write at least 50 characters";
    if (!form.availabilityHoursPerWeek) e.availabilityHoursPerWeek = "Please select availability";
    if (age < 18 && !form.parentalConsentGiven) e.parentalConsentGiven = "Parental consent is required for students under 18";
    if (age < 18 && !form.parentName.trim()) e.parentName = "Parent/guardian name is required";
    if (age < 18 && (!form.parentEmail.trim() || !form.parentEmail.includes("@"))) e.parentEmail = "Valid parent/guardian email is required";
    if (!form.agreesToTerms) e.agreesToTerms = "You must agree to the program terms";
    if (!form.agreesToConfidentiality) e.agreesToConfidentiality = "You must agree to the confidentiality agreement";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    submitMutation.mutate({
      fullName: form.fullName,
      email: form.email,
      age: parseInt(form.age),
      schoolName: form.schoolName,
      gradeLevel: form.gradeLevel,
      strand: form.strand || undefined,
      city: form.city,
      role: form.role as "osint_research_trainee" | "data_verification_trainee" | "digital_journalism_apprentice",
      teacherName: form.teacherName,
      teacherEmail: form.teacherEmail,
      teacherSubject: form.teacherSubject || undefined,
      whyApply: form.whyApply,
      relevantExperience: form.relevantExperience || undefined,
      availabilityHoursPerWeek: parseInt(form.availabilityHoursPerWeek),
      parentalConsentGiven: form.parentalConsentGiven ? 1 : 0,
      parentName: form.parentName || undefined,
      parentEmail: form.parentEmail || undefined,
      agreesToTerms: 1,
      agreesToConfidentiality: 1,
    });
  }

  const age = parseInt(form.age);
  const needsParentalConsent = !isNaN(age) && age < 18;

  if (step === "success") {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", color: "#e8d5a3", fontFamily: "'Georgia', serif" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎓</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#c9a84c", marginBottom: 16 }}>
            Application Received
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 24, color: "#b8c4cc" }}>
            Thank you for applying to The Vault Investigates Student Volunteer Program. Your application has been submitted and will be reviewed within 5–7 business days.
          </p>
          <div style={{ background: "#0d1117", border: "1px solid #2a3441", borderRadius: 12, padding: 24, marginBottom: 32, textAlign: "left" }}>
            <h3 style={{ color: "#c9a84c", marginBottom: 12, fontSize: 16 }}>What happens next:</h3>
            <ol style={{ color: "#b8c4cc", lineHeight: 2, paddingLeft: 20 }}>
              <li>We will contact your teacher to verify your recommendation</li>
              <li>If selected, you will receive an orientation email with program details</li>
              <li>You will be assigned tasks appropriate for your role and grade level</li>
              <li>Upon completion, a Certificate of Accomplishment will be issued in your name</li>
            </ol>
          </div>
          <Link href="/">
            <button style={{ background: "#c9a84c", color: "#050505", border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              ← Return to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", color: "#e8d5a3", fontFamily: "'Georgia', serif" }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid #1a2332", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setStep("landing")} style={{ background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontSize: 14 }}>
            ← Back
          </button>
          <span style={{ color: "#b8c4cc", fontSize: 14 }}>Student Volunteer Application</span>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#c9a84c", marginBottom: 8 }}>
            Volunteer Application
          </h1>
          <p style={{ color: "#b8c4cc", marginBottom: 32, lineHeight: 1.6 }}>
            All fields marked with * are required. Your information is kept confidential and used only for program administration.
          </p>

          {errors.submit && (
            <div style={{ background: "#2d1515", border: "1px solid #7f1d1d", borderRadius: 8, padding: 16, marginBottom: 24, color: "#fca5a5" }}>
              {errors.submit}
            </div>
          )}
          {Object.keys(errors).length > 0 && !errors.submit && (
            <div style={{ background: "#2d1515", border: "1px solid #7f1d1d", borderRadius: 8, padding: 16, marginBottom: 24, color: "#fca5a5" }}>
              Please fix the errors below before submitting.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section 1: Personal Info */}
            <Section title="1. Personal Information">
              <Field label="Full Name *" error={errors.fullName}>
                <input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Your full name" style={inputStyle} />
              </Field>
              <Field label="Email Address *" error={errors.email}>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your.email@example.com" style={inputStyle} />
              </Field>
              <Field label="Age *" error={errors.age}>
                <input type="number" min={15} max={20} value={form.age} onChange={e => set("age", e.target.value)} placeholder="e.g. 17" style={{ ...inputStyle, width: 120 }} />
              </Field>
            </Section>

            {/* Section 2: School Info */}
            <Section title="2. School Information">
              <Field label="School Name *" error={errors.schoolName}>
                <input value={form.schoolName} onChange={e => set("schoolName", e.target.value)} placeholder="e.g. Manila Science High School" style={inputStyle} />
              </Field>
              <Field label="Grade Level *" error={errors.gradeLevel}>
                <select value={form.gradeLevel} onChange={e => set("gradeLevel", e.target.value)} style={inputStyle}>
                  <option value="">Select grade level</option>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Academic Strand (optional)" error={errors.strand}>
                <select value={form.strand} onChange={e => set("strand", e.target.value)} style={inputStyle}>
                  <option value="">Select strand</option>
                  {STRANDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="City / District *" error={errors.city}>
                <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Quezon City, Makati, Manila" style={inputStyle} />
              </Field>
            </Section>

            {/* Section 3: Role */}
            <Section title="3. Role Selection">
              <p style={{ color: "#b8c4cc", marginBottom: 16, fontSize: 14 }}>Select the role you are applying for. You may only apply for one role at a time.</p>
              {errors.role && <p style={{ color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>{errors.role}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ROLES.map(r => (
                  <label key={r.id} style={{
                    display: "flex", gap: 16, padding: 16, borderRadius: 10,
                    border: `2px solid ${form.role === r.id ? "#c9a84c" : "#2a3441"}`,
                    background: form.role === r.id ? "#1a1500" : "#0d1117",
                    cursor: "pointer", transition: "all 0.2s"
                  }}>
                    <input type="radio" name="role" value={r.id} checked={form.role === r.id} onChange={() => set("role", r.id)} style={{ marginTop: 4, accentColor: "#c9a84c" }} />
                    <div>
                      <div style={{ fontWeight: 700, color: "#e8d5a3", marginBottom: 4 }}>{r.icon} {r.title}</div>
                      <div style={{ color: "#b8c4cc", fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>{r.description}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {r.skills.map(s => (
                          <span key={s} style={{ background: "#1a2332", color: "#93c5fd", fontSize: 12, padding: "2px 8px", borderRadius: 4 }}>{s}</span>
                        ))}
                        <span style={{ background: "#1a2332", color: "#6ee7b7", fontSize: 12, padding: "2px 8px", borderRadius: 4 }}>⏱ {r.hours}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Section>

            {/* Section 4: Teacher Recommendation */}
            <Section title="4. Teacher Recommendation">
              <p style={{ color: "#b8c4cc", marginBottom: 16, fontSize: 14 }}>
                We will contact your teacher to verify your recommendation. Please ensure they are aware you are applying.
              </p>
              <Field label="Teacher's Full Name *" error={errors.teacherName}>
                <input value={form.teacherName} onChange={e => set("teacherName", e.target.value)} placeholder="e.g. Ms. Maria Santos" style={inputStyle} />
              </Field>
              <Field label="Teacher's Email Address *" error={errors.teacherEmail}>
                <input type="email" value={form.teacherEmail} onChange={e => set("teacherEmail", e.target.value)} placeholder="teacher@school.edu.ph" style={inputStyle} />
              </Field>
              <Field label="Subject They Teach (optional)" error={errors.teacherSubject}>
                <input value={form.teacherSubject} onChange={e => set("teacherSubject", e.target.value)} placeholder="e.g. English, Social Studies, Journalism" style={inputStyle} />
              </Field>
            </Section>

            {/* Section 5: Application Essay */}
            <Section title="5. Application Questions">
              <Field label="Why do you want to join this program? *" error={errors.whyApply}>
                <textarea
                  value={form.whyApply}
                  onChange={e => set("whyApply", e.target.value)}
                  placeholder="Tell us why this work matters to you and what you hope to learn. Minimum 50 characters."
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
                <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>{form.whyApply.length} characters</div>
              </Field>
              <Field label="Relevant experience or skills (optional)" error={errors.relevantExperience}>
                <textarea
                  value={form.relevantExperience}
                  onChange={e => set("relevantExperience", e.target.value)}
                  placeholder="Any school projects, clubs, or skills relevant to the role you selected."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Hours available per week *" error={errors.availabilityHoursPerWeek}>
                <select value={form.availabilityHoursPerWeek} onChange={e => set("availabilityHoursPerWeek", e.target.value)} style={inputStyle}>
                  <option value="">Select hours</option>
                  {HOURS_OPTIONS.map(h => <option key={h} value={h}>{h} hours/week</option>)}
                </select>
              </Field>
            </Section>

            {/* Section 6: Parental Consent (if under 18) */}
            {needsParentalConsent && (
              <Section title="6. Parental / Guardian Consent">
                <p style={{ color: "#fbbf24", marginBottom: 16, fontSize: 14, background: "#1c1400", padding: 12, borderRadius: 8, border: "1px solid #78350f" }}>
                  ⚠️ Because you are under 18, parental or guardian consent is required to participate in this program.
                </p>
                <Field label="Parent / Guardian Full Name *" error={errors.parentName}>
                  <input value={form.parentName} onChange={e => set("parentName", e.target.value)} placeholder="Parent or guardian's full name" style={inputStyle} />
                </Field>
                <Field label="Parent / Guardian Email *" error={errors.parentEmail}>
                  <input type="email" value={form.parentEmail} onChange={e => set("parentEmail", e.target.value)} placeholder="parent@example.com" style={inputStyle} />
                </Field>
                <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.parentalConsentGiven} onChange={e => set("parentalConsentGiven", e.target.checked)} style={{ marginTop: 3, accentColor: "#c9a84c" }} />
                  <span style={{ color: "#b8c4cc", fontSize: 14, lineHeight: 1.6 }}>
                    I confirm that my parent or guardian is aware of and consents to my participation in The Vault Investigates Student Volunteer Program, including the confidentiality obligations involved.
                  </span>
                </label>
                {errors.parentalConsentGiven && <p style={{ color: "#fca5a5", fontSize: 13, marginTop: 8 }}>{errors.parentalConsentGiven}</p>}
              </Section>
            )}

            {/* Section 7: Terms */}
            <Section title={needsParentalConsent ? "7. Agreements" : "6. Agreements"}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.agreesToTerms} onChange={e => set("agreesToTerms", e.target.checked)} style={{ marginTop: 3, accentColor: "#c9a84c" }} />
                  <span style={{ color: "#b8c4cc", fontSize: 14, lineHeight: 1.6 }}>
                    I agree to the program terms: I will complete assigned tasks to the best of my ability, communicate promptly if I am unable to continue, and represent The Vault Investigates honestly in all work I produce. *
                  </span>
                </label>
                {errors.agreesToTerms && <p style={{ color: "#fca5a5", fontSize: 13 }}>{errors.agreesToTerms}</p>}

                <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.agreesToConfidentiality} onChange={e => set("agreesToConfidentiality", e.target.checked)} style={{ marginTop: 3, accentColor: "#c9a84c" }} />
                  <span style={{ color: "#b8c4cc", fontSize: 14, lineHeight: 1.6 }}>
                    I agree to the confidentiality agreement: I will not share, publish, or discuss any case information, source details, or internal materials I encounter during my volunteer work. This obligation continues after my participation ends. *
                  </span>
                </label>
                {errors.agreesToConfidentiality && <p style={{ color: "#fca5a5", fontSize: 13 }}>{errors.agreesToConfidentiality}</p>}
              </div>
            </Section>

            <button
              type="submit"
              disabled={submitMutation.isPending}
              style={{
                width: "100%", padding: "16px", background: submitMutation.isPending ? "#4a3a10" : "#c9a84c",
                color: "#050505", border: "none", borderRadius: 10, fontSize: 18, fontWeight: 700,
                cursor: submitMutation.isPending ? "not-allowed" : "pointer", marginTop: 8
              }}
            >
              {submitMutation.isPending ? "Submitting…" : "Submit Application →"}
            </button>
            <p style={{ color: "#6b7280", fontSize: 12, textAlign: "center", marginTop: 12 }}>
              Your application will be reviewed within 5–7 business days. We will contact you and your teacher by email.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Landing page
  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#e8d5a3", fontFamily: "'Georgia', serif" }}>
      {/* Nav */}
      <div style={{ borderBottom: "1px solid #1a2332", padding: "16px 24px" }}>
        <Link href="/">
          <span style={{ color: "#c9a84c", cursor: "pointer", fontSize: 14 }}>← The Vault Investigates</span>
        </Link>
      </div>

      {/* Donation Strip */}
      <div style={{ background: "linear-gradient(90deg, #1a1200, #0d0d00, #1a1200)", borderBottom: "1px solid rgba(201,168,76,0.25)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ color: "#b8a060", fontSize: 13, fontStyle: "italic" }}>This program is free. The investigation is reader-supported. Help keep it alive.</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="https://gofund.me/3a4e564d5" target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#00b964", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", cursor: "pointer" }}>
            💚 Support on GoFundMe
          </a>
          <a href="https://buymeacoffee.com/thevaultinvestigates" target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFDD00", color: "#000", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", cursor: "pointer" }}>
            ☕ Buy Me a Coffee
          </a>
          <a href={`https://x.com/intent/tweet?text=${encodeURIComponent("Support The Vault Investigates — independent journalism exposing how poverty is exploited. Every contribution keeps this work alive.")}&url=${encodeURIComponent("https://gofund.me/3a4e564d5")}`}
            target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", cursor: "pointer" }}>
            𝕏 Share
          </a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#1a1500", border: "1px solid #c9a84c", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#c9a84c", marginBottom: 24, letterSpacing: 1 }}>
          MANILA HIGH SCHOOL VOLUNTEER PROGRAM
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.2, marginBottom: 20 }}>
          Investigate. Verify. Expose.
          <br />
          <span style={{ color: "#c9a84c" }}>Earn a Certificate of Accomplishment.</span>
        </h1>
        <p style={{ fontSize: 18, color: "#b8c4cc", lineHeight: 1.7, maxWidth: 640, margin: "0 auto 32px" }}>
          The Vault Investigates is recruiting high school students from Metro Manila to join a real investigative journalism project documenting how poverty is exploited. No experience required — only curiosity, integrity, and commitment.
        </p>
        <button
          onClick={() => setStep("form")}
          style={{ background: "#c9a84c", color: "#050505", border: "none", borderRadius: 10, padding: "16px 40px", fontSize: 18, fontWeight: 700, cursor: "pointer" }}
        >
          Apply Now — Free Program →
        </button>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 12 }}>Applications reviewed within 5–7 business days</p>
      </div>

      {/* Certificate Preview */}
      <div style={{ background: "#0a0f14", borderTop: "1px solid #1a2332", borderBottom: "1px solid #1a2332", padding: "40px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 24, color: "#c9a84c", marginBottom: 16 }}>Certificate of Accomplishment</h2>
            <p style={{ color: "#b8c4cc", lineHeight: 1.7, marginBottom: 16 }}>
              Every student who completes the program receives a formal Certificate of Accomplishment issued by The Vault Investigates. The certificate includes:
            </p>
            <ul style={{ color: "#b8c4cc", lineHeight: 2, paddingLeft: 20 }}>
              <li>Your full name and role title</li>
              <li>Total hours contributed</li>
              <li>A brief description of your contribution</li>
              <li>Signed by the Lead Investigator</li>
              <li>Dated and uniquely numbered</li>
            </ul>
            <p style={{ color: "#b8c4cc", lineHeight: 1.7, marginTop: 16, fontSize: 14 }}>
              This certificate can be used for college applications, scholarship portfolios, and community service records.
            </p>
          </div>
          {/* Certificate mockup */}
          <div style={{
            background: "#0d1117", border: "2px solid #c9a84c", borderRadius: 12, padding: 32,
            textAlign: "center", position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, border: "1px solid #c9a84c33", borderRadius: 8, pointerEvents: "none" }} />
            <div style={{ fontSize: 12, letterSpacing: 3, color: "#c9a84c", marginBottom: 12 }}>THE VAULT INVESTIGATES</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e8d5a3", marginBottom: 8 }}>Certificate of Accomplishment</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 20 }}>This certifies that</div>
            <div style={{ fontSize: 22, color: "#c9a84c", fontStyle: "italic", marginBottom: 8 }}>Student Name</div>
            <div style={{ color: "#b8c4cc", fontSize: 13, marginBottom: 20 }}>has completed 40 hours as a<br /><strong>Junior OSINT Research Trainee</strong></div>
            <div style={{ borderTop: "1px solid #2a3441", paddingTop: 16, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280" }}>
              <span>Lead Investigator<br /><span style={{ color: "#c9a84c" }}>The Vault Archivist</span></span>
              <span>Date Issued<br /><span style={{ color: "#c9a84c" }}>2026</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
        <h2 style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>Available Roles</h2>
        <p style={{ color: "#b8c4cc", textAlign: "center", marginBottom: 40 }}>Choose the role that fits your skills and interests best.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {ROLES.map(r => (
            <div key={r.id} style={{ background: "#0d1117", border: "1px solid #2a3441", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{r.icon}</div>
              <h3 style={{ fontSize: 18, color: "#c9a84c", marginBottom: 8 }}>{r.title}</h3>
              <p style={{ color: "#b8c4cc", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{r.description}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {r.skills.map(s => (
                  <span key={s} style={{ background: "#1a2332", color: "#93c5fd", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>{s}</span>
                ))}
              </div>
              <div style={{ color: "#6ee7b7", fontSize: 13 }}>⏱ {r.hours}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: "#0a0f14", borderTop: "1px solid #1a2332", padding: "60px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, textAlign: "center", marginBottom: 40 }}>How the Program Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
            {[
              { step: "01", title: "Apply Online", desc: "Fill out the application form with your school details and a teacher recommendation." },
              { step: "02", title: "Get Vetted", desc: "We review your application and verify your teacher recommendation within 5–7 days." },
              { step: "03", title: "Complete Tasks", desc: "Receive assigned tasks appropriate for your role. Work asynchronously at your own pace." },
              { step: "04", title: "Earn Certificate", desc: "Complete your hours and receive a Certificate of Accomplishment signed by the Lead Investigator." },
            ].map(s => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#c9a84c", marginBottom: 8 }}>{s.step}</div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: "#b8c4cc", fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px" }}>
        <h2 style={{ fontSize: 28, textAlign: "center", marginBottom: 32 }}>Frequently Asked Questions</h2>
        {[
          { q: "Is this program free?", a: "Yes. There is no cost to apply or participate. All tasks are done remotely — you only need a device and internet access." },
          { q: "Do I need journalism experience?", a: "No. We are looking for students who are curious, reliable, and willing to learn. We will train you on the specific skills needed for your role." },
          { q: "How many hours per week is required?", a: "Between 2 and 10 hours per week depending on the role. You select your availability during the application." },
          { q: "Will my real name appear anywhere public?", a: "No. Your name appears only on your certificate and in our internal records. It is never published on the website or shared with third parties." },
          { q: "What if I need to stop participating?", a: "Life happens. If you need to stop, simply let us know by email. If you have completed enough hours, you may still qualify for a partial certificate." },
        ].map(f => (
          <div key={f.q} style={{ borderBottom: "1px solid #1a2332", paddingBottom: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, color: "#c9a84c", marginBottom: 8 }}>{f.q}</h3>
            <p style={{ color: "#b8c4cc", fontSize: 14, lineHeight: 1.6 }}>{f.a}</p>
          </div>
        ))}
      </div>

      {/* Program Documents */}
      <ProgramDocuments />

      {/* CTA */}
      <div style={{ background: "#0a0f14", borderTop: "1px solid #1a2332", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Ready to Apply?</h2>
        <p style={{ color: "#b8c4cc", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          Applications are reviewed on a rolling basis. The sooner you apply, the sooner you can start.
        </p>
        <button
          onClick={() => setStep("form")}
          style={{ background: "#c9a84c", color: "#050505", border: "none", borderRadius: 10, padding: "16px 40px", fontSize: 18, fontWeight: 700, cursor: "pointer" }}
        >
          Apply Now — Free Program →
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1a2332", padding: "24px", textAlign: "center", color: "#6b7280", fontSize: 13 }}>
        The Vault Investigates — Exposing How Poverty Is Exploited ·{" "}
        <Link href="/"><span style={{ color: "#c9a84c", cursor: "pointer" }}>Home</span></Link> ·{" "}
        <Link href="/tip"><span style={{ color: "#c9a84c", cursor: "pointer" }}>Submit a Tip</span></Link>
      </div>
    </div>
  );
}

// Program Documents Download Section
function ProgramDocuments() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generateDoc = trpc.volunteer.generateProgramDoc.useMutation({
    onError: (err) => { setError(err.message); setLoading(null); },
  });

  async function handleDownload(docType: "consent_form" | "confidentiality_agreement" | "release_of_liability" | "sample_research_task" | "program_summary", label: string) {
    setLoading(docType);
    setError(null);
    try {
      const result = await generateDoc.mutateAsync({ docType });
      // Open the PDF URL in a new tab for download
      window.open(result.url, "_blank");
    } catch {
      // error handled by onError
    } finally {
      setLoading(null);
    }
  }

  const docs = [
    { type: "program_summary" as const, label: "Program Summary (One Page)", icon: "📋", desc: "One-page overview of the fellowship program. Share with your principal, parents, or scholarship committee." },
    { type: "consent_form" as const, label: "Parental Consent Form", icon: "📝", desc: "Required for students under 18. Download, print, and have your parent/guardian sign before submitting." },
    { type: "release_of_liability" as const, label: "Release of Liability & Assumption of Risk", icon: "🛡️", desc: "Mandatory legal waiver for all student volunteers. Download, print, and have your parent/guardian co-sign." },
    { type: "confidentiality_agreement" as const, label: "Research Confidentiality Agreement & Strict NDA", icon: "🔒", desc: "Strict NDA regarding active investigations. Forbids discussing, copying, or taking any research leads or files outside of the secure Vault EcoSystem." },
    { type: "sample_research_task" as const, label: "Sample Research Task", icon: "🔍", desc: "See exactly what kind of work you will be doing. Sanitized example — safe to share with parents and teachers." },
  ];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px" }}>
      <h2 style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>Program Documents</h2>
      <p style={{ color: "#b8c4cc", textAlign: "center", marginBottom: 32, fontSize: 15 }}>
        All documents are watermarked with a unique Document ID and verifiable at{" "}
        <a href="/verify" style={{ color: "#c9a84c" }}>vet.thevaultinvestigates.cloud/verify</a>.
      </p>
      {error && (
        <div style={{ background: "#2d1515", border: "1px solid #7f1d1d", borderRadius: 8, padding: 12, marginBottom: 20, color: "#fca5a5", fontSize: 14 }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: 16 }}>
        {docs.map(doc => (
          <div key={doc.type} style={{ background: "#0d1117", border: "1px solid #2a3441", borderRadius: 12, padding: 20, display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ fontSize: 32, flexShrink: 0 }}>{doc.icon}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, color: "#c9a84c", marginBottom: 4 }}>{doc.label}</h3>
              <p style={{ color: "#b8c4cc", fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{doc.desc}</p>
              <button
                onClick={() => handleDownload(doc.type, doc.label)}
                disabled={loading === doc.type}
                style={{
                  background: loading === doc.type ? "#1a2332" : "transparent",
                  border: "1px solid #c9a84c",
                  color: "#c9a84c",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading === doc.type ? "not-allowed" : "pointer",
                }}
              >
                {loading === doc.type ? "Generating PDF..." : "⬇ Download Watermarked PDF"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helpers
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0d1117", border: "1px solid #2a3441", borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, color: "#c9a84c", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #1a2332" }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 14, color: "#e8d5a3", marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ color: "#fca5a5", fontSize: 13, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#050505",
  border: "1px solid #2a3441",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#e8d5a3",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};
