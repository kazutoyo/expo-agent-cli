import { describe, expect, test } from 'bun:test';
import {
  EXPO_ALGOLIA_APP_ID,
  EXPO_ALGOLIA_API_KEY,
  EXPO_ALGOLIA_INDEX_NAME,
  extractVersionFromPath,
  getExpoDocsUrl,
  getVersionForPath,
} from './constants';

describe('constants', () => {
  test('Algolia config is defined', () => {
    expect(EXPO_ALGOLIA_APP_ID).toBeTypeOf('string');
    expect(EXPO_ALGOLIA_API_KEY).toBeTypeOf('string');
    expect(EXPO_ALGOLIA_INDEX_NAME).toBe('expo');
  });

  describe('getExpoDocsUrl', () => {
    test('returns branch URL for explicit SDK version', () => {
      const url = getExpoDocsUrl('sdk-54');
      expect(url).toBe(
        'https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages',
      );
    });

    test('maps latest to main branch', () => {
      const url = getExpoDocsUrl('latest');
      expect(url).toBe(
        'https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages',
      );
    });
  });

  describe('extractVersionFromPath', () => {
    test('extracts sdk version from versioned path', () => {
      const version = extractVersionFromPath('/versions/v54.0.0/sdk/camera/');
      expect(version).toBe('sdk-54');
    });

    test('handles latest path', () => {
      const version = extractVersionFromPath('/versions/latest/sdk/camera/');
      expect(version).toBe('latest');
    });

    test('returns null when version not present', () => {
      const version = extractVersionFromPath('/guides/routing/');
      expect(version).toBeNull();
    });
  });

  describe('getVersionForPath', () => {
    test('returns extracted sdk version when available', () => {
      const version = getVersionForPath('/versions/v53.0.0/sdk/notifications/', 'sdk-54');
      expect(version).toBe('sdk-53');
    });

    test('falls back to default for latest keyword', () => {
      const version = getVersionForPath('/versions/latest/sdk/notifications/', 'sdk-54');
      expect(version).toBe('sdk-54');
    });

    test('falls back to default when version missing', () => {
      const version = getVersionForPath('/workflow/expo-cli/', 'sdk-54');
      expect(version).toBe('sdk-54');
    });
  });
});
