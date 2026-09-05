/**
 * SPA document head upsert for route SEO.
 * TanStack `HeadContent` is also mounted; this keeps title/meta/link in sync on
 * client navigations when tags live only in the React tree.
 */
import type { SeoHeadResult } from "@/lib/seo";

function upsertMeta(selector: string, attrs: Record<string, string>): void {
	let el = document.head.querySelector(selector);
	if (!el) {
		el = document.createElement("meta");
		document.head.appendChild(el);
	}
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
}

function upsertLink(rel: string, href: string): void {
	const selector = `link[rel="${rel}"][data-seo="route"]`;
	const found = document.head.querySelector(selector);
	let el: HTMLLinkElement;
	if (found instanceof HTMLLinkElement) {
		el = found;
	} else {
		el = document.createElement("link");
		el.setAttribute("data-seo", "route");
		el.rel = rel;
		document.head.appendChild(el);
	}
	el.href = href;
}

function removeSeoLinks(): void {
	for (const el of document.head.querySelectorAll('link[data-seo="route"]')) {
		el.remove();
	}
}

function upsertJsonLd(json: string | undefined): void {
	const existing = document.head.querySelector(
		'script[type="application/ld+json"][data-seo="route"]',
	);
	if (!json) {
		existing?.remove();
		return;
	}
	let el: HTMLScriptElement;
	if (existing instanceof HTMLScriptElement) {
		el = existing;
	} else {
		el = document.createElement("script");
		el.type = "application/ld+json";
		el.setAttribute("data-seo", "route");
		document.head.appendChild(el);
	}
	el.textContent = json;
}

/** Apply a `seoHead()` result to `document.head`. */
export function applySeoHead(head: SeoHeadResult): void {
	if (typeof document === "undefined") return;

	for (const entry of head.meta) {
		if ("title" in entry) {
			document.title = entry.title;
			continue;
		}
		if ("name" in entry) {
			upsertMeta(`meta[name="${entry.name}"]`, {
				name: entry.name,
				content: entry.content,
			});
			continue;
		}
		if ("property" in entry) {
			upsertMeta(`meta[property="${entry.property}"]`, {
				property: entry.property,
				content: entry.content,
			});
		}
	}

	removeSeoLinks();
	for (const link of head.links ?? []) {
		if (link.rel === "canonical") {
			upsertLink("canonical", link.href);
		}
	}

	const jsonScript = head.scripts?.find(
		(s) => s.type === "application/ld+json",
	);
	upsertJsonLd(jsonScript?.children);
}
