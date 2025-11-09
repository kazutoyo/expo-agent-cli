/**
 * Parse permission component tags from MDX content and replace with permission documentation
 */

import type {
	AndroidPermission,
	AndroidPermissionsData,
	IOSPermission,
	IOSPermissionsData,
} from "../types/permission-types.js";

// Cache for permission data
let iosPermissionsCache: IOSPermissionsData | null = null;
let androidPermissionsCache: AndroidPermissionsData | null = null;

/**
 * Fetch iOS permissions data
 */
async function fetchIOSPermissions(): Promise<IOSPermissionsData | null> {
	if (iosPermissionsCache) {
		return iosPermissionsCache;
	}

	const url =
		"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/components/plugins/permissions/data/ios.json";

	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(
				`Failed to fetch iOS permissions data: ${response.statusText}`,
			);
			return null;
		}
		iosPermissionsCache = (await response.json()) as IOSPermissionsData;
		return iosPermissionsCache;
	} catch (error) {
		console.error("Error fetching iOS permissions data:", error);
		return null;
	}
}

/**
 * Fetch Android permissions data
 */
async function fetchAndroidPermissions(): Promise<AndroidPermissionsData | null> {
	if (androidPermissionsCache) {
		return androidPermissionsCache;
	}

	const url =
		"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/components/plugins/permissions/data/android.json";

	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(
				`Failed to fetch Android permissions data: ${response.statusText}`,
			);
			return null;
		}
		androidPermissionsCache = (await response.json()) as AndroidPermissionsData;
		return androidPermissionsCache;
	} catch (error) {
		console.error("Error fetching Android permissions data:", error);
		return null;
	}
}

/**
 * Format iOS permission to markdown
 */
function formatIOSPermission(permission: IOSPermission): string {
	const lines: string[] = [];

	lines.push(`#### \`${permission.name}\``);
	lines.push("");
	lines.push(`**Description:** ${permission.description}`);
	lines.push("");

	if (permission.framework) {
		lines.push(`**Framework:** ${permission.framework}`);
		lines.push("");
	}

	if (permission.apiAdded) {
		lines.push(`**Availability:** ${permission.apiAdded}`);
		lines.push("");
	}

	if (permission.warning) {
		lines.push(`> **Warning:** ${permission.warning}`);
		lines.push("");
	}

	return lines.join("\n");
}

/**
 * Format Android permission to markdown
 */
function formatAndroidPermission(permission: AndroidPermission): string {
	const lines: string[] = [];

	lines.push(`#### \`${permission.name}\``);
	lines.push("");
	lines.push(`**Constant:** \`${permission.constant}\``);
	lines.push("");
	lines.push(`**Description:** ${permission.description}`);
	lines.push("");

	if (permission.explanation) {
		lines.push(permission.explanation);
		lines.push("");
	}

	if (permission.protection) {
		lines.push(`**Protection level:** \`${permission.protection}\``);
		lines.push("");
	}

	if (permission.apiAdded) {
		lines.push(`**Added in API level:** ${permission.apiAdded}`);
		lines.push("");
	}

	if (permission.warning) {
		lines.push(`> **Warning:** ${permission.warning}`);
		lines.push("");
	}

	return lines.join("\n");
}

/**
 * Parse permissions attribute from a tag
 * Handles: permissions={['CAMERA', 'RECORD_AUDIO']} or permissions=['CAMERA']
 */
function parsePermissionsAttribute(tag: string): string[] | null {
	// Match permissions={[...]} or permissions={...}
	const match = tag.match(/permissions=\{(\[.*?\])\}/);
	if (!match || !match[1]) return null;

	try {
		// Parse the array string as JSON
		const permissionsStr = match[1];
		// Replace single quotes with double quotes for valid JSON
		const jsonStr = permissionsStr.replace(/'/g, '"');
		return JSON.parse(jsonStr) as string[];
	} catch (error) {
		console.error("Error parsing permissions attribute:", error);
		return null;
	}
}

/**
 * Process IOSPermissions tags
 */
async function processIOSPermissionsTags(content: string): Promise<string> {
	const tagRegex = /<IOSPermissions[^>]*\/>/g;
	const matches = content.match(tagRegex);

	if (!matches || matches.length === 0) {
		return content;
	}

	const permissionsData = await fetchIOSPermissions();
	if (!permissionsData) {
		return content;
	}

	let processedContent = content;

	for (const match of matches) {
		const permissions = parsePermissionsAttribute(match);
		if (!permissions) {
			console.warn(`Failed to parse IOSPermissions tag: ${match}`);
			continue;
		}

		const markdown: string[] = [];

		for (const permName of permissions) {
			const permission = permissionsData.data[permName];
			if (permission) {
				markdown.push(formatIOSPermission(permission));
			} else {
				markdown.push(
					`#### \`${permName}\`\n\n> **Note:** Permission details not available.\n\n`,
				);
			}
		}

		processedContent = processedContent.replace(
			match,
			`\n${markdown.join("")}`,
		);
	}

	return processedContent;
}

/**
 * Process AndroidPermissions tags
 */
async function processAndroidPermissionsTags(content: string): Promise<string> {
	const tagRegex = /<AndroidPermissions[^>]*\/>/g;
	const matches = content.match(tagRegex);

	if (!matches || matches.length === 0) {
		return content;
	}

	const permissionsData = await fetchAndroidPermissions();
	if (!permissionsData) {
		return content;
	}

	let processedContent = content;

	for (const match of matches) {
		const permissions = parsePermissionsAttribute(match);
		if (!permissions) {
			console.warn(`Failed to parse AndroidPermissions tag: ${match}`);
			continue;
		}

		const markdown: string[] = [];

		for (const permName of permissions) {
			const permission = permissionsData.data[permName];
			if (permission) {
				markdown.push(formatAndroidPermission(permission));
			} else {
				markdown.push(
					`#### \`${permName}\`\n\n> **Note:** Permission details not available.\n\n`,
				);
			}
		}

		processedContent = processedContent.replace(
			match,
			`\n${markdown.join("")}`,
		);
	}

	return processedContent;
}

/**
 * Process all permission tags in MDX content
 */
export async function processPermissionSections(
	mdxContent: string,
): Promise<string> {
	let content = mdxContent;

	// Process iOS permissions
	content = await processIOSPermissionsTags(content);

	// Process Android permissions
	content = await processAndroidPermissionsTags(content);

	return content;
}
