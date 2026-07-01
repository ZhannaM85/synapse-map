import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const CLAUDE_SETTINGS_PATH = join(homedir(), '.claude', 'settings.json');

const HOOK_COMMAND = 'synapse-map scan';

interface HookEntry {
  type: string;
  command: string;
}

interface HookMatcher {
  matcher: string;
  hooks: HookEntry[];
}

interface ClaudeSettings {
  hooks?: {
    Stop?: HookMatcher[];
    [event: string]: HookMatcher[] | undefined;
  };
  [key: string]: unknown;
}

function readSettings(): ClaudeSettings {
  if (!existsSync(CLAUDE_SETTINGS_PATH)) return {};

  try {
    return JSON.parse(readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8')) as ClaudeSettings;
  } catch {
    throw new Error(
      `Could not parse ${CLAUDE_SETTINGS_PATH} — fix or remove the invalid JSON before running this command.`,
    );
  }
}

function writeSettings(settings: ClaudeSettings): void {
  const dir = dirname(CLAUDE_SETTINGS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
}

export function runHookInstall(): void {
  const settings = readSettings();
  settings.hooks ??= {};
  settings.hooks.Stop ??= [];

  const stopHooks = settings.hooks.Stop;
  const alreadyInstalled = stopHooks.some((matcher) =>
    matcher.hooks.some((h) => h.command === HOOK_COMMAND),
  );

  if (alreadyInstalled) {
    console.log('Stop hook is already installed.');
    return;
  }

  // Merge into an existing empty-matcher entry (runs on every Stop event)
  // rather than creating a duplicate matcher block.
  const catchAllMatcher = stopHooks.find((matcher) => matcher.matcher === '');
  if (catchAllMatcher) {
    catchAllMatcher.hooks.push({ type: 'command', command: HOOK_COMMAND });
  } else {
    stopHooks.push({ matcher: '', hooks: [{ type: 'command', command: HOOK_COMMAND }] });
  }

  writeSettings(settings);
  console.log(`Stop hook installed in ${CLAUDE_SETTINGS_PATH}`);
  console.log('Your graph will now refresh automatically after every Claude Code conversation.');
}

export function runHookUninstall(): void {
  if (!existsSync(CLAUDE_SETTINGS_PATH)) {
    console.log('No Claude settings found. Nothing to uninstall.');
    return;
  }

  const settings = readSettings();
  const stopHooks = settings.hooks?.Stop;

  if (!stopHooks) {
    console.log('Stop hook is not installed.');
    return;
  }

  let removed = false;
  for (const matcher of stopHooks) {
    const before = matcher.hooks.length;
    matcher.hooks = matcher.hooks.filter((h) => h.command !== HOOK_COMMAND);
    if (matcher.hooks.length !== before) removed = true;
  }

  if (!removed) {
    console.log('Stop hook is not installed.');
    return;
  }

  settings.hooks!.Stop = stopHooks.filter((matcher) => matcher.hooks.length > 0);
  if (settings.hooks!.Stop.length === 0) delete settings.hooks!.Stop;
  if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;

  writeSettings(settings);
  console.log(`Stop hook removed from ${CLAUDE_SETTINGS_PATH}`);
}
