import { Command } from 'commander';

export const versionCommand = (program: Command, _cliVersion: string, expoVersion: string) => {
  program
    .command('version')
    .description('Show Expo SDK version')
    .action(async () => {
      try {
        console.log(expoVersion);
      } catch (error) {
        console.error('Error displaying version information:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
};
