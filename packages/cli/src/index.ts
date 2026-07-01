#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { Command } from 'commander';
import { runScan } from './commands/scan.js';
import { runServe } from './commands/serve.js';
import { runStatus } from './commands/status.js';
import { runReset } from './commands/reset.js';
import { runHookInstall, runHookUninstall } from './commands/hook.js';
import { DB_PATH } from './graph/store.js';

const program = new Command();

program
  .name('synapse')
  .description('Transform your Claude Code conversations into a living knowledge graph')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan Claude sessions and build the knowledge graph')
  .option('--force', 'Re-process all sessions, ignoring cache')
  .option('--dry-run', 'Show what would be processed without writing changes')
  .action((opts) => {
    runScan({ force: opts.force, dryRun: opts.dryRun });
  });

program
  .command('serve')
  .description('Start the web UI server')
  .option('-p, --port <number>', 'Port to listen on', '4242')
  .option('--no-open', 'Do not open the browser automatically')
  .action((opts) => {
    runServe({ port: Number(opts.port), open: opts.open });
  });

program
  .command('status')
  .description('Show knowledge graph statistics')
  .action(() => {
    runStatus();
  });

program
  .command('reset')
  .description('Delete the graph database')
  .action(() => {
    runReset();
  });

const hook = program
  .command('hook')
  .description('Manage the Claude Code Stop hook that keeps the graph updated automatically');

hook
  .command('install')
  .description('Add a Stop hook to ~/.claude/settings.json that runs synapse-map scan after each conversation')
  .action(() => {
    runHookInstall();
  });

hook
  .command('uninstall')
  .description('Remove the Stop hook from ~/.claude/settings.json')
  .action(() => {
    runHookUninstall();
  });

// Default behavior: no subcommand given
if (process.argv.length <= 2) {
  if (!existsSync(DB_PATH)) {
    runScan();
  }
  runServe();
} else {
  program.parse();
}
