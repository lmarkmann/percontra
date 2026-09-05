import * as z from "zod/mini";

export interface Session {
	userId: string;
	email?: string;
}

/** Wire contract for GET /api/session. zod/mini: this module rides the entry graph via session.ts and require-auth (ADR 031). */
export const sessionSchema = z.object({
	userId: z.string(),
	email: z.optional(z.string()),
});
