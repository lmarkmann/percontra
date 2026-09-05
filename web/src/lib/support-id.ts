export function createSupportId(): string {
	return crypto.randomUUID().slice(0, 8);
}
