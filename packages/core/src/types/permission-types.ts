/**
 * Permission data types for iOS and Android
 */

export type IOSPermission = {
	apiAdded: string;
	apiDeprecated: boolean;
	framework: string;
	name: string;
	description: string;
	warning?: string;
};

export type IOSPermissionsData = {
	meta: {
		source: string;
		scrapedAt: string;
	};
	data: Record<string, IOSPermission>;
};

export type AndroidPermission = {
	apiAdded: number;
	apiDeprecated: number | null;
	apiReplaced: string | null;
	name: string;
	description: string;
	explanation: string | null;
	constant: string;
	protection: string;
	warning: string | null;
};

export type AndroidPermissionsData = {
	meta: {
		source: string;
		scrapedAt: string;
	};
	data: Record<string, AndroidPermission>;
};
