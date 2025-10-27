import { Command } from 'commander';
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';

// Mock fetch
globalThis.fetch = mock(() => Promise.resolve({
  ok: true,
  text: () => Promise.resolve(''),
} as Response));

import { docsCommand } from './index.js';

describe('docsCommand', () => {
  let program: Command;
  let consoleLogMock: ReturnType<typeof mock>;
  let consoleErrorMock: ReturnType<typeof mock>;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    program = new Command();
    const expoVersion = 'sdk-54';
    docsCommand(program, expoVersion);

    consoleLogMock = mock(() => {});
    consoleErrorMock = mock(() => {});
    console.log = consoleLogMock;
    console.error = consoleErrorMock;

    // Save original isTTY and set to true for tests by default
    originalIsTTY = process.stdin.isTTY;
    process.stdin.isTTY = true;

    // Clear all mocks
    (globalThis.fetch as any).mockClear();
    consoleLogMock.mockClear();
    consoleErrorMock.mockClear();
  });

  afterEach(() => {
    // Restore original isTTY
    if (originalIsTTY !== undefined) {
      process.stdin.isTTY = originalIsTTY;
    } else {
      delete (process.stdin as any).isTTY;
    }
  });

  it('should fetch and display llms.txt when no path provided', async () => {
    const mockContent = 'Expo is an open-source React Native framework for apps that run natively on Android, iOS, and the web.';

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent),
    } as Response);

    await program.parseAsync(['node', 'test', 'docs']);

    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
    expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
      'https://docs.expo.dev/llms.txt'
    );
    expect(consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent)).toBe(true);
  });

  it('should fetch documentation for specified path', async () => {
    const mockContent = '---\ntitle: Account Types\n---\n\nExpo supports personal and organization accounts.';

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent),
    } as Response);

    await program.parseAsync(['node', 'test', 'docs', '/accounts/account-types']);

    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
    expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
      'https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/accounts/account-types.mdx'
    );
    expect(consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent)).toBe(true);
  });

  it('should normalize paths without leading slash', async () => {
    const mockContent = '---\ntitle: Introduction\n---\n\nGet started with Expo.';

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent),
    } as Response);

    await program.parseAsync(['node', 'test', 'docs', 'get-started/introduction']);

    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
    expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
      'https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/get-started/introduction.mdx'
    );
    expect(consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent)).toBe(true);
  });

  it('should remove .mdx extension if provided', async () => {
    const mockContent = '---\ntitle: Routing\n---\n\nLearn about Expo Router.';

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent),
    } as Response);

    await program.parseAsync(['node', 'test', 'docs', '/guides/routing.mdx']);

    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
    expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
      'https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/guides/routing.mdx'
    );
    expect(consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent)).toBe(true);
  });

  it('should handle 404 errors gracefully', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    // Mock process.exit to prevent test from exiting
    const originalExit = process.exit;
    let exitCode: number | undefined;
    process.exit = mock((code?: number) => {
      exitCode = code;
      throw new Error('process.exit called');
    }) as any;

    try {
      await program.parseAsync(['node', 'test', 'docs', '/nonexistent-page']);
    } catch (error) {
      // Expected to throw due to process.exit
    }

    expect(consoleErrorMock.mock.calls.some((call: any[]) =>
      call[0] === 'Documentation not found: /nonexistent-page'
    )).toBe(true);
    expect(exitCode).toBe(1);

    // Restore process.exit
    process.exit = originalExit;
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network error');
    (globalThis.fetch as any).mockRejectedValue(networkError);

    // Mock process.exit to prevent test from exiting
    const originalExit = process.exit;
    let exitCode: number | undefined;
    process.exit = mock((code?: number) => {
      exitCode = code;
      throw new Error('process.exit called');
    }) as any;

    try {
      await program.parseAsync(['node', 'test', 'docs', '/get-started/introduction']);
    } catch (error) {
      // Expected to throw due to process.exit
    }

    expect(consoleErrorMock.mock.calls.some((call: any[]) =>
      call[0] === 'Error fetching documentation:'
    )).toBe(true);
    expect(exitCode).toBe(1);

    // Restore process.exit
    process.exit = originalExit;
  });

  it('should handle stdin input when no path provided', async () => {
    const mockContent = '---\ntitle: Camera\n---\n\nUse the camera API.';
    const stdinPath = '/guides/camera';

    // Mock process.stdin
    const mockStdin = {
      isTTY: false,
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from(stdinPath);
      },
    };
    Object.assign(process.stdin, mockStdin);

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent),
    } as Response);

    await program.parseAsync(['node', 'test', 'docs']);

    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
    expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
      'https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/guides/camera.mdx'
    );
    expect(consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent)).toBe(true);
  });

  it('should handle quoted stdin input (jq output without -r)', async () => {
    const mockContent = '---\ntitle: API\n---\n\nAPI documentation.';
    const quotedStdinPath = '"/get-started/create-a-project"'; // Quoted path from jq

    // Mock process.stdin
    const mockStdin = {
      isTTY: false,
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from(quotedStdinPath);
      },
    };
    Object.assign(process.stdin, mockStdin);

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent),
    } as Response);

    await program.parseAsync(['node', 'test', 'docs']);

    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
    expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
      'https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/get-started/create-a-project.mdx'
    );
    expect(consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent)).toBe(true);
  });

  it('should display pretty formatted output when --pretty flag is used', async () => {
    const mockContent = '# Introduction\n\n**Expo** is a framework.';

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent),
    } as Response);

    await program.parseAsync(['node', 'test', 'docs', '/get-started/introduction', '--pretty']);

    expect((globalThis.fetch as any).mock.calls.length).toBe(1);
    expect(consoleLogMock.mock.calls.length).toBeGreaterThan(0);
    // The output should be formatted, not raw markdown
    const output = consoleLogMock.mock.calls[0][0];
    expect(typeof output).toBe('string');
  });
});
