// MongoDB ObjectIds are 24 hex characters. Prisma throws (→ 500) on anything else,
// so validate route/body IDs up front and return a clean 400 instead.
export const isValidObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

// ── Input rules (shared by create/update so they can't drift apart) ──
export const LIMITS = {
  title: 120,
  description: 3000,
  comment: 1000,
  name: 60,
  skills: 20,
  skill: 30,
  passwordMin: 6,
  passwordMax: 128,
};
export const DOMAINS = ["Web", "AI", "Mobile", "Game"];
export const STATUSES = ["Open", "Closed"];

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

// Trims, de-duplicates and caps a skills array. Returns { skills } or { error }.
export const cleanSkills = (skills) => {
  if (!Array.isArray(skills) || !skills.every((s) => typeof s === "string")) {
    return { error: "Skills must be a list of text values" };
  }
  const cleaned = skills.map((s) => s.trim()).filter(Boolean);
  if (cleaned.some((s) => s.length > LIMITS.skill)) {
    return { error: `Each skill must be ${LIMITS.skill} characters or less` };
  }
  return { skills: [...new Set(cleaned)].slice(0, LIMITS.skills) };
};

// Validates a post body. With partial=true (updates) every field is optional,
// but any field that is sent must be valid. Returns { data } or { error }.
export const validatePostInput = (body = {}, { partial = false } = {}) => {
  const data = {};
  const has = (k) => body[k] !== undefined;

  for (const [field, max, label] of [["title", LIMITS.title, "Title"], ["description", LIMITS.description, "Description"]]) {
    if (has(field) || !partial) {
      if (!isNonEmptyString(body[field])) return { error: `${label} is required` };
      const value = body[field].trim();
      if (value.length > max) return { error: `${label} must be ${max} characters or less` };
      data[field] = value;
    }
  }

  if (has("domain") || !partial) {
    if (!DOMAINS.includes(body.domain)) return { error: `Domain must be one of: ${DOMAINS.join(", ")}` };
    data.domain = body.domain;
  }

  if (has("skills")) {
    const { skills, error } = cleanSkills(body.skills);
    if (error) return { error };
    data.skills = skills;
  } else if (!partial) {
    data.skills = [];
  }

  if (has("status")) {
    if (!STATUSES.includes(body.status)) return { error: `Status must be one of: ${STATUSES.join(", ")}` };
    data.status = body.status;
  }

  if (partial && Object.keys(data).length === 0) return { error: "Nothing to update" };
  return { data };
};
