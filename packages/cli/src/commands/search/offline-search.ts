import FlexSearch from "flexsearch";
import type { DocMetadata } from "../../utils/doc-crawler.js";

export interface SearchResult {
	title: string;
	highlightedTitle: string;
	category: string;
	url: string;
	path: string;
	score?: number;
}

/**
 * Offline search engine using FlexSearch
 */
export class OfflineSearchEngine {
	private index: FlexSearch.Document<DocMetadata>;
	private documents: Map<string, DocMetadata> = new Map();

	constructor() {
		this.index = new FlexSearch.Document({
			tokenize: "full",
			optimize: true,
			resolution: 9,
			document: {
				id: "id",
				index: ["title", "content", "hierarchy:lvl0", "hierarchy:lvl1"],
				store: ["title", "url", "hierarchy", "path"],
			},
		});
	}

	/**
	 * Load and index documents
	 */
	async loadDocuments(docs: DocMetadata[]) {
		for (const doc of docs) {
			this.index.add(doc);
			this.documents.set(doc.id, doc);
		}
	}

	/**
	 * Search for documents
	 */
	async search(query: string, limit = 5): Promise<SearchResult[]> {
		const results = await this.index.search(query, {
			limit,
			enrich: true,
		});

		// FlexSearch returns results grouped by field
		const hits = new Map<string, { score: number; doc: DocMetadata }>();

		for (const fieldResult of results) {
			if (!Array.isArray(fieldResult.result)) continue;

			for (const item of fieldResult.result) {
				const id = String(item.id);
				const doc = item.doc as DocMetadata;

				// Combine scores from different fields
				if (hits.has(id)) {
					const existing = hits.get(id);
					if (existing) {
						existing.score += 1; // Simple score combination
					}
				} else {
					hits.set(id, { score: 1, doc });
				}
			}
		}

		// Sort by score and convert to SearchResult format
		const sortedHits = Array.from(hits.values())
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);

		return sortedHits.map((hit) => this.formatResult(hit.doc, query));
	}

	/**
	 * Format a document as a search result
	 */
	private formatResult(doc: DocMetadata, query: string): SearchResult {
		// Simple highlighting - wrap matching terms in <mark> tags
		const highlightedTitle = this.highlightText(doc.title, query);

		// Build hierarchy path
		const hierarchyParts: string[] = [];
		if (doc.hierarchy.lvl0 && doc.hierarchy.lvl0 !== "Documentation") {
			hierarchyParts.push(doc.hierarchy.lvl0);
		}
		if (doc.hierarchy.lvl1 && doc.hierarchy.lvl1 !== doc.title) {
			hierarchyParts.push(doc.hierarchy.lvl1);
		}
		if (doc.hierarchy.lvl2 && doc.hierarchy.lvl2 !== doc.title) {
			hierarchyParts.push(doc.hierarchy.lvl2);
		}

		const category =
			hierarchyParts.length > 0 ? hierarchyParts.join(" > ") : "";

		return {
			title: doc.title,
			highlightedTitle,
			category,
			url: doc.url,
			path: doc.path,
		};
	}

	/**
	 * Highlight matching terms in text
	 */
	private highlightText(text: string, query: string): string {
		const terms = query.toLowerCase().split(/\s+/);
		let highlighted = text;

		for (const term of terms) {
			if (term.length < 2) continue;

			const regex = new RegExp(`(${term})`, "gi");
			highlighted = highlighted.replace(regex, "<mark>$1</mark>");
		}

		return highlighted;
	}
}
