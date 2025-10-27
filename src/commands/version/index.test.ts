import { Command } from 'commander';
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { versionCommand } from './index.js';

describe('versionCommand', () => {
  let program: Command;
  let consoleLogSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should register version command with correct description', () => {
    const cliVersion = '0.1.0';
    const expoVersion = 'sdk-54';
    versionCommand(program, cliVersion, expoVersion);

    const commands = program.commands;
    const versionCmd = commands.find(cmd => cmd.name() === 'version');

    expect(versionCmd).toBeDefined();
    expect(versionCmd?.description()).toBe('Show Expo SDK version');
  });

  it('should output expoVersion when executed', async () => {
    const cliVersion = '0.1.0';
    const expoVersion = 'sdk-54';
    versionCommand(program, cliVersion, expoVersion);

    await program.parseAsync(['node', 'test', 'version']);

    expect(consoleLogSpy.mock.calls.length).toBe(1);
    expect(consoleLogSpy.mock.calls[0][0]).toBe('sdk-54');
  });

  it('should output different expoVersion based on parameter', async () => {
    const cliVersion = '0.1.0';
    const expoVersion = 'sdk-53';
    versionCommand(program, cliVersion, expoVersion);

    await program.parseAsync(['node', 'test', 'version']);

    expect(consoleLogSpy.mock.calls.length).toBe(1);
    expect(consoleLogSpy.mock.calls[0][0]).toBe('sdk-53');
  });

  it('should handle main branch version', async () => {
    const cliVersion = '0.1.0';
    const expoVersion = 'main';
    versionCommand(program, cliVersion, expoVersion);

    await program.parseAsync(['node', 'test', 'version']);

    expect(consoleLogSpy.mock.calls.length).toBe(1);
    expect(consoleLogSpy.mock.calls[0][0]).toBe('main');
  });

  it('should not call console.error on successful execution', async () => {
    const cliVersion = '0.1.0';
    const expoVersion = 'sdk-54';
    versionCommand(program, cliVersion, expoVersion);

    await program.parseAsync(['node', 'test', 'version']);

    expect(consoleErrorSpy.mock.calls.length).toBe(0);
  });

  it('should output only expoVersion (not cliVersion)', async () => {
    const cliVersion = '1.2.3';
    const expoVersion = 'sdk-54';
    versionCommand(program, cliVersion, expoVersion);

    await program.parseAsync(['node', 'test', 'version']);

    expect(consoleLogSpy.mock.calls.length).toBe(1);
    const output = consoleLogSpy.mock.calls[0][0];

    // Should only output expoVersion
    expect(output).toBe('sdk-54');
    expect(output).not.toContain('1.2.3');
  });

  it('should work with custom version string format', async () => {
    const cliVersion = '0.1.0';
    const expoVersion = 'sdk-52.0.0';
    versionCommand(program, cliVersion, expoVersion);

    await program.parseAsync(['node', 'test', 'version']);

    expect(consoleLogSpy.mock.calls.length).toBe(1);
    expect(consoleLogSpy.mock.calls[0][0]).toBe('sdk-52.0.0');
  });

  it('should be invocable multiple times', async () => {
    const cliVersion = '0.1.0';
    const expoVersion = 'sdk-54';
    versionCommand(program, cliVersion, expoVersion);

    // First invocation
    await program.parseAsync(['node', 'test', 'version']);
    expect(consoleLogSpy.mock.calls.length).toBe(1);
    expect(consoleLogSpy.mock.calls[0][0]).toBe('sdk-54');

    // Reset spy
    consoleLogSpy.mockClear();

    // Second invocation
    await program.parseAsync(['node', 'test', 'version']);
    expect(consoleLogSpy.mock.calls.length).toBe(1);
    expect(consoleLogSpy.mock.calls[0][0]).toBe('sdk-54');
  });
});
