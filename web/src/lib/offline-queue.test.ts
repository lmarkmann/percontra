import "fake-indexeddb/auto";
import { afterEach, expect, test, vi } from "vitest";

import {
	clearChatQueue,
	dequeueChatSend,
	enqueueChatSend,
	listChatQueue,
} from "@/lib/offline-queue";

afterEach(async () => {
	await clearChatQueue();
	vi.unstubAllGlobals();
});

test("enqueue and list preserves FIFO order", async () => {
	await enqueueChatSend({ id: "a", text: "first", createdAt: 1 });
	await enqueueChatSend({ id: "b", text: "second", createdAt: 2 });

	const queue = await listChatQueue();
	expect(queue.map((entry) => entry.id)).toEqual(["a", "b"]);
});

test("dequeue removes a single entry", async () => {
	await enqueueChatSend({ id: "a", text: "first" });
	await enqueueChatSend({ id: "b", text: "second" });
	await dequeueChatSend("a");

	const queue = await listChatQueue();
	expect(queue).toHaveLength(1);
	expect(queue[0]?.id).toBe("b");
});

test("falls back to memory when indexedDB is unavailable", async () => {
	vi.stubGlobal("indexedDB", undefined);

	await enqueueChatSend({ id: "mem", text: "offline", createdAt: 3 });
	const queue = await listChatQueue();
	expect(queue).toEqual([
		{ id: "mem", text: "offline", createdAt: 3, attachment: undefined },
	]);

	await dequeueChatSend("mem");
	expect(await listChatQueue()).toEqual([]);
});

test("list filters corrupt rows out of the IndexedDB store", async () => {
	await enqueueChatSend({ id: "ok", text: "valid", createdAt: 1 });
	await putRaw({ id: "corrupt", createdAt: "not-a-number" });

	const queue = await listChatQueue();
	expect(queue.map((entry) => entry.id)).toEqual(["ok"]);
});

test("entries written during a transient IDB failure stay visible after recovery", async () => {
	vi.stubGlobal("indexedDB", failingFactory());

	await enqueueChatSend({
		id: "outage",
		text: "written mid-outage",
		createdAt: 5,
	});
	vi.unstubAllGlobals();

	const queue = await listChatQueue();
	expect(queue.map((entry) => entry.id)).toContain("outage");

	await dequeueChatSend("outage");
	expect(await listChatQueue()).toEqual([]);
});

test("enqueue settles when the transaction aborts after the request succeeds", async () => {
	const { factory, putRequest, tx } = abortAfterSuccessFactory();
	vi.stubGlobal("indexedDB", factory);

	const pending = enqueueChatSend({ id: "abort", text: "quota", createdAt: 7 });
	await vi.waitFor(() => {
		expect(putRequest.onsuccess).not.toBeNull();
	});
	putRequest.onsuccess?.();
	tx.onabort?.();

	const record = await pending;
	expect(record.id).toBe("abort");

	vi.unstubAllGlobals();
	expect((await listChatQueue()).map((entry) => entry.id)).toContain("abort");
});

function putRaw(row: Record<string, unknown>): Promise<void> {
	return new Promise((resolve, reject) => {
		const open = indexedDB.open("vite-template-offline", 1);
		open.onupgradeneeded = () => {
			open.result.createObjectStore("chat-queue", { keyPath: "id" });
		};
		open.onerror = () => reject(new Error("open failed"));
		open.onsuccess = () => {
			const db = open.result;
			const writeTx = db.transaction("chat-queue", "readwrite");
			writeTx.objectStore("chat-queue").put(row);
			writeTx.oncomplete = () => {
				db.close();
				resolve();
			};
			writeTx.onerror = () => {
				db.close();
				reject(new Error("raw put failed"));
			};
		};
	});
}

type Handler = (() => void) | null;

function failingFactory(): IDBFactory {
	const factory = {
		open: () => {
			const request = {
				onerror: null as Handler,
				onupgradeneeded: null as Handler,
				onsuccess: null as Handler,
			};
			queueMicrotask(() => request.onerror?.());
			return request;
		},
	};
	return factory as unknown as IDBFactory;
}

function abortAfterSuccessFactory() {
	const putRequest = {
		onerror: null as Handler,
		onsuccess: null as Handler,
		result: "abort",
	};
	const tx = {
		onabort: null as Handler,
		onerror: null as Handler,
		oncomplete: null as Handler,
		objectStore: () => ({ put: () => putRequest }),
	};
	const db = {
		transaction: () => tx,
		close: () => {},
	};
	const factory = {
		open: () => {
			const openRequest = {
				onerror: null as Handler,
				onupgradeneeded: null as Handler,
				onsuccess: null as Handler,
				result: db,
			};
			queueMicrotask(() => openRequest.onsuccess?.());
			return openRequest;
		},
	};
	return { factory: factory as unknown as IDBFactory, putRequest, tx };
}
