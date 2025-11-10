import { describe, expect, test } from "bun:test";
import { processPermissionSections } from "./permission-section-parser.js";

describe("processPermissionSections", () => {
	test("should return content unchanged when no permission tags", async () => {
		const mdx = "# Hello\n\nThis is a test.";
		const result = await processPermissionSections(mdx);
		expect(result).toBe(mdx);
	});

	test("should process IOSPermissions tags", async () => {
		const mdx = `# Permissions

## iOS

<IOSPermissions permissions={['NSCameraUsageDescription']} />
`;

		const result = await processPermissionSections(mdx);

		// Should not contain the original tag
		expect(result).not.toContain("<IOSPermissions");

		// Should contain iOS permission documentation
		expect(result).toContain("#### `NSCameraUsageDescription`");
		expect(result).toContain("**Description:**");
		expect(result).toContain("camera");
	});

	test("should process AndroidPermissions tags", async () => {
		const mdx = `# Permissions

## Android

<AndroidPermissions permissions={['CAMERA', 'RECORD_AUDIO']} />
`;

		const result = await processPermissionSections(mdx);

		// Should not contain the original tag
		expect(result).not.toContain("<AndroidPermissions");

		// Should contain Android permission documentation
		expect(result).toContain("#### `CAMERA`");
		expect(result).toContain("**Constant:** `android.permission.CAMERA`");
		expect(result).toContain("**Description:**");

		expect(result).toContain("#### `RECORD_AUDIO`");
		expect(result).toContain("**Constant:** `android.permission.RECORD_AUDIO`");
	});

	test("should handle both iOS and Android permissions", async () => {
		const mdx = `# Permissions

## iOS

<IOSPermissions permissions={['NSCameraUsageDescription']} />

## Android

<AndroidPermissions permissions={['CAMERA']} />
`;

		const result = await processPermissionSections(mdx);

		// Should contain both iOS and Android permissions
		expect(result).toContain("#### `NSCameraUsageDescription`");
		expect(result).toContain("#### `CAMERA`");
		expect(result).toContain("android.permission.CAMERA");
	});

	test("should handle missing permission gracefully", async () => {
		const mdx = `<IOSPermissions permissions={['NonExistentPermission']} />`;

		const result = await processPermissionSections(mdx);

		// Should contain a note about unavailable permission
		expect(result).toContain("NonExistentPermission");
		expect(result).toContain("not available");
	});

	test("should handle single-quoted permission arrays", async () => {
		const mdx = `<IOSPermissions permissions={['NSCameraUsageDescription', 'NSMicrophoneUsageDescription']} />`;

		const result = await processPermissionSections(mdx);

		expect(result).toContain("NSCameraUsageDescription");
		expect(result).toContain("NSMicrophoneUsageDescription");
	});
});
