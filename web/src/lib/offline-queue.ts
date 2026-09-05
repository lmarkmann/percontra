/**
 * Durable offline queue for optimistic chat sends.
 * IndexedDB when available; in-memory fallback for SSR / private modes / tests.
 */

import type { ChatAttachment } from "@/lib/chat-transport";

import * as z from "zod/mini";

import { site } from "@/lib/site";

// Derived from site identity so two forks on the same localhost origin get
// isolated stores instead of flushing each other's queued sends.
const DB_NAME = `${site.name}-offline`;
const DB_VERSION = 1;
const STORE = "chat-queue";

export type QueuedChatSend = {
	id: string;
	text: string;
	attachment?: ChatAttachment;
	createdAt: number;
};

type MemoryStore = Map<string, QueuedChatSend>;

const memoryStore: MemoryStore = new Map();

function openDb(): Promise<IDBDatabase | null> {
	if (typeof indexedDB === "undefined") {
		return Promise.resolve(null);
	}

	return new Promise((resolve) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = () => resolve(null);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE, { keyPath: "id" });
			}
		};
		request.onsuccess = () => resolve(request.result);
	});
}

function runStore(
	mode: IDBTransactionMode,
	run: (store: IDBObjectStore) => IDBRequest,
): Promise<unknown> {
	return openDb().then(
		(db) =>
			new Promise((resolve) => {
				if (!db) {
					resolve(null);
					return;
				}
				const tx = db.transaction(STORE, mode);
				const settle = (value: unknown) => {
					db.close();
					resolve(value);
				};
				// A transaction can abort after request success (e.g. quota exhausted at commit); without these handlers the promise never settles.
				tx.onabort = () => settle(null);
				tx.onerror = () => settle(null);
				const store = tx.objectStore(STORE);
				const request = run(store);
				request.onerror = () => settle(null);
				request.onsuccess = () => {
					const value: unknown = request.result;
					tx.oncomplete = () => settle(value);
				};
			}),
	);
}

// The annotation keeps the schema in lockstep with QueuedChatSend; IDB rows are
// untrusted input (other tabs, older builds), same rule as the wire boundary.
const queuedChatSendSchema: z.ZodMiniType<QueuedChatSend> = z.object({
	id: z.string(),
	text: z.string(),
	attachment: z.optional(z.object({ name: z.string(), sizeLabel: z.string() })),
	createdAt: z.number(),
});

function isQueuedChatSend(value: unknown): value is QueuedChatSend {
	return queuedChatSendSchema.safeParse(value).success;
}

/** @public */
export async function enqueueChatSend(
	entry: Omit<QueuedChatSend, "createdAt"> & { createdAt?: number },
): Promise<QueuedChatSend> {
	const record: QueuedChatSend = {
		id: entry.id,
		text: entry.text,
		attachment: entry.attachment,
		createdAt: entry.createdAt ?? Date.now(),
	};

	const persisted = await runStore("readwrite", (store) => store.put(record));
	if (persisted === null) {
		// IDB unavailable or the write failed; keep memory fallback so reconnect still works.
		memoryStore.set(record.id, record);
	}

	return record;
}

/** @public */
export async function listChatQueue(): Promise<QueuedChatSend[]> {
	const rows = await runStore("readonly", (store) => store.getAll());
	if (!Array.isArray(rows)) {
		return [...memoryStore.values()].toSorted(
			(a, b) => a.createdAt - b.createdAt,
		);
	}
	// Merge the memory fallback: entries written while IDB was transiently failing must stay visible after it recovers, not only while it is still down.
	const merged = new Map<string, QueuedChatSend>();
	for (const row of rows.filter(isQueuedChatSend)) {
		merged.set(row.id, row);
	}
	for (const entry of memoryStore.values()) {
		if (!merged.has(entry.id)) {
			merged.set(entry.id, entry);
		}
	}
	return [...merged.values()].toSorted((a, b) => a.createdAt - b.createdAt);
}

/** @public */
export async function dequeueChatSend(id: string): Promise<void> {
	await runStore("readwrite", (store) => store.delete(id));
	// Always drop the memory copy too: an entry can live in the fallback while IDB has recovered, and a successful IDB delete must not resurrect it.
	memoryStore.delete(id);
}

/** @public - tests / cleanup */
export async function clearChatQueue(): Promise<void> {
	memoryStore.clear();
	const db = await openDb();
	if (!db) {
		return;
	}
	await new Promise<void>((resolve) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).clear();
		const settle = () => {
			db.close();
			resolve();
		};
		tx.oncomplete = settle;
		tx.onabort = settle;
		tx.onerror = settle;
	});
}
