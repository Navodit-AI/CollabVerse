// MongoDB ObjectIds are 24 hex characters. Prisma throws (→ 500) on anything else,
// so validate route/body IDs up front and return a clean 400 instead.
export const isValidObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
