/**
 * Convert TypeDoc API JSON data to Markdown format
 */

import type {
	ApiDeclaration,
	Comment,
	CommentText,
	Signature,
	TypeInfo,
} from "../types/api-types.js";

/**
 * Format comment text to markdown
 */
function formatCommentText(texts: CommentText[] | undefined): string {
	if (!texts || texts.length === 0) return "";
	return texts
		.map((t) => {
			if (t.kind === "code") {
				// If the code already has backticks, use it as-is
				if (t.text.startsWith("`") || t.text.startsWith("```")) {
					return t.text;
				}
				return `\`${t.text}\``;
			}
			return t.text;
		})
		.join("");
}

/**
 * Format comment to markdown
 * @param skipTags - Tags to skip (e.g., '@returns' for function signatures)
 */
function formatComment(
	comment: Comment | undefined,
	indent = "",
	skipTags: string[] = [],
): string {
	if (!comment) return "";

	const parts: string[] = [];

	// Summary
	if (comment.summary) {
		parts.push(formatCommentText(comment.summary));
	}

	// Block tags (e.g., @param, @returns, @example, @platform)
	if (comment.blockTags) {
		for (const tag of comment.blockTags) {
			if (skipTags.includes(tag.tag)) continue;

			const content = formatCommentText(tag.content);
			if (tag.tag === "@example") {
				parts.push(`\n${indent}**Example:**\n${indent}${content}`);
			} else if (tag.tag === "@platform") {
				parts.push(`\n${indent}**Platform:** ${content}`);
			} else if (tag.tag === "@deprecated") {
				parts.push(`\n${indent}**Deprecated:** ${content}`);
			} else if (tag.tag === "@returns") {
			} else {
				parts.push(`\n${indent}**${tag.tag}:** ${content}`);
			}
		}
	}

	return parts.join("");
}

/**
 * Format type information to markdown
 */
function formatType(type: TypeInfo | undefined): string {
	if (!type) return "unknown";

	switch (type.type) {
		case "intrinsic":
			return type.name;
		case "literal":
			return typeof type.value === "string"
				? `"${type.value}"`
				: String(type.value);
		case "reference":
			return type.name;
		case "array":
			return `${formatType(type.elementType)}[]`;
		case "union":
			return type.types.map((t) => formatType(t)).join(" | ");
		case "reflection":
			// For inline object types
			return "object";
		default:
			return "unknown";
	}
}

/**
 * Format a signature (function/method signature)
 */
function formatSignature(sig: Signature, name: string, indent = ""): string[] {
	const lines: string[] = [];

	// Function signature
	const params = sig.parameters
		?.map((p) => {
			const optionalMark = p.type ? "" : "?";
			return `${p.name}${optionalMark}: ${formatType(p.type)}`;
		})
		.join(", ");

	const returnType = formatType(sig.type);
	lines.push(`${indent}#### \`${name}(${params || ""})\``);
	lines.push("");

	// Description (skip @returns tag, we'll handle it separately)
	const description = formatComment(sig.comment, indent, ["@returns"]);
	if (description) {
		lines.push(`${indent}${description}`);
		lines.push("");
	}

	// Parameters documentation
	if (sig.parameters && sig.parameters.length > 0) {
		const hasDocumentedParams = sig.parameters.some((p) => p.comment);
		if (hasDocumentedParams) {
			lines.push(`${indent}**Parameters:**`);
			lines.push("");
			for (const param of sig.parameters) {
				const paramDoc = param.comment
					? formatComment(param.comment, indent)
					: "";
				const description = paramDoc || "(no description)";
				lines.push(
					`${indent}- **\`${param.name}\`**: \`${formatType(param.type)}\` - ${description}`,
				);
			}
			lines.push("");
		}
	}

	// Return value with description from @returns tag
	const returnsTag = sig.comment?.blockTags?.find(
		(tag) => tag.tag === "@returns",
	);
	const returnsDesc = returnsTag
		? ` - ${formatCommentText(returnsTag.content)}`
		: "";
	lines.push(`${indent}**Returns:** \`${returnType}\`${returnsDesc}`);
	lines.push("");

	return lines;
}

/**
 * Convert API declaration to markdown
 */
function convertDeclarationToMarkdown(
	decl: ApiDeclaration,
	level = 3,
	_parentKind?: number,
): string[] {
	const lines: string[] = [];
	const indent = "";
	const heading = "#".repeat(level);

	const kind = decl.kind;

	// Enum (8)
	if (kind === 8) {
		lines.push(`${heading} ${decl.name}`);
		lines.push("");
		if (decl.comment) {
			lines.push(formatComment(decl.comment, indent));
			lines.push("");
		}

		// Enum members
		if (decl.children) {
			for (const member of decl.children) {
				if (member.kind === 16) {
					// EnumMember
					const value = formatType(member.type);
					lines.push(`- **${member.name}**: \`${value}\``);
					if (member.comment) {
						const desc = formatComment(member.comment, "  ");
						if (desc) {
							lines.push(`  ${desc}`);
						}
					}
				}
			}
			lines.push("");
		}
	}
	// Class (128)
	else if (kind === 128) {
		lines.push(`${heading} ${decl.name}`);
		lines.push("");
		if (decl.comment) {
			lines.push(formatComment(decl.comment, indent));
			lines.push("");
		}

		// Properties and methods
		if (decl.children) {
			// Properties
			const properties = decl.children.filter((c) => c.kind === 1024);
			if (properties.length > 0) {
				lines.push(`${heading}# Properties`);
				lines.push("");
				for (const prop of properties) {
					const optional = prop.flags?.isOptional ? "?" : "";
					const readonly = prop.flags?.isReadonly ? "readonly " : "";
					lines.push(
						`- **${readonly}${prop.name}${optional}**: \`${formatType(prop.type)}\``,
					);
					if (prop.comment) {
						const desc = formatComment(prop.comment, "  ");
						if (desc) {
							lines.push(`  ${desc}`);
						}
					}
				}
				lines.push("");
			}

			// Methods
			const methods = decl.children.filter((c) => c.kind === 2048);
			if (methods.length > 0) {
				lines.push(`${heading}# Methods`);
				lines.push("");
				for (const method of methods) {
					if (method.signatures && method.signatures.length > 0) {
						const sig = method.signatures[0];
						if (sig) {
							lines.push(...formatSignature(sig, method.name, indent));
						}
					}
				}
			}
		}
	}
	// Interface (256) or Type Alias (2097152)
	else if (kind === 256 || kind === 2097152) {
		lines.push(`${heading} ${decl.name}`);
		lines.push("");
		if (decl.comment) {
			lines.push(formatComment(decl.comment, indent));
			lines.push("");
		}

		// Properties
		if (decl.children) {
			for (const prop of decl.children) {
				if (prop.kind === 1024) {
					// Property
					const optional = prop.flags?.isOptional ? "?" : "";
					const readonly = prop.flags?.isReadonly ? "readonly " : "";
					lines.push(
						`- **${readonly}${prop.name}${optional}**: \`${formatType(prop.type)}\``,
					);
					if (prop.comment) {
						const desc = formatComment(prop.comment, "  ");
						if (desc) {
							lines.push(`  ${desc}`);
						}
					}
				}
			}
			lines.push("");
		}

		// Type
		if (decl.type) {
			lines.push(`**Type:** \`${formatType(decl.type)}\``);
			lines.push("");
		}
	}
	// Function (64) or Variable (32)
	else if (kind === 64 || kind === 32) {
		if (decl.signatures && decl.signatures.length > 0) {
			const sig = decl.signatures[0];
			if (sig) {
				lines.push(`${heading} ${decl.name}()`);
				lines.push("");
				lines.push(...formatSignature(sig, decl.name, indent));
			}
		} else {
			lines.push(`${heading} ${decl.name}`);
			lines.push("");
			if (decl.comment) {
				lines.push(formatComment(decl.comment, indent));
				lines.push("");
			}
			if (decl.type) {
				lines.push(`**Type:** \`${formatType(decl.type)}\``);
				lines.push("");
			}
		}
	}

	return lines;
}

/**
 * Convert API JSON data to Markdown
 */
export function convertApiToMarkdown(
	apiData: ApiDeclaration,
	apiName?: string,
): string {
	const lines: string[] = [];

	// Title
	if (apiName) {
		lines.push(`## ${apiName} API`);
		lines.push("");
	}

	// Process top-level exports
	if (apiData.children) {
		for (const child of apiData.children) {
			const childLines = convertDeclarationToMarkdown(child, 3);
			lines.push(...childLines);
		}
	}

	return lines.join("\n");
}
