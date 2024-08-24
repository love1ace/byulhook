import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { execSync } from 'child_process';
import { getHooksPath } from './utils.js';

export function installHooks() {
  try {
    const hooksDir = getHooksPath();
    const configPath = path.resolve(process.cwd(), 'byulhook.yml');

    if (!fs.existsSync(configPath)) {
      console.error('Error: byulhook.yml not found.');
      process.exit(1);
    }

    const config = loadConfig(configPath);
    const hooks = Object.keys(config);

    hooks.forEach(hook => {
      const hookPath = path.join(hooksDir, hook);
      const samplePath = `${hookPath}.sample`;

      if (fs.existsSync(samplePath)) {
        try {
          fs.unlinkSync(samplePath);
        } catch (err) {
          console.error(`Failed to delete sample hook: ${err}`);
        }
      }

      let script = `#!/bin/sh\n`;

      let existingScript = '';
      if (fs.existsSync(hookPath)) {
        try {
          existingScript = fs.readFileSync(hookPath, 'utf8');

          if (existingScript.includes(`# byulhook\nnpx byulhook ${hook}\n# byulhook\n`)) {
            console.log(`Hook ${hook} already contains byulhook script, skipping...`);
            return;
          }

          script += `${existingScript}\n`;
        } catch (err) {
          console.error(`Failed to read existing hook: ${err}`);
        }
      }

      script += `\n# byulhook\nnpx byulhook ${hook}\n# byulhook\n`;

      try {
        fs.writeFileSync(hookPath, script, { mode: 0o755 });
      } catch (err) {
        console.error(`Failed to write hook: ${err}`);
      }
    });
  } catch (err) {
    console.error(`Failed to install hooks: ${err}`);
  }
}

function runHookCommand(hookName: string) {
  const configPath = path.resolve(process.cwd(), 'byulhook.yml');

  if (!fs.existsSync(configPath)) {
    console.error('Error: byulhook.yml not found.');
    process.exit(1);
  }

  const config = loadConfig(configPath);
  if (config && config[hookName] && config[hookName].commands) {
    const commands = config[hookName].commands;

    for (const commandName in commands) {
      const command = commands[commandName].run;
      if (command) {
        console.log(`Running ${hookName} command: ${command}`);
        execSync(command, { stdio: 'inherit' });
      }
    }
  } else {
    console.log(`No commands found for ${hookName}`);
  }
}

function loadConfig(configPath: string) {
  try {
    if (!fs.existsSync(configPath)) {
      console.error(`Error: Configuration file not found at ${configPath}`);
      return null;
    }
    const fileContent = fs.readFileSync(configPath, 'utf8');
    return YAML.parse(fileContent);
  } catch (err) {
    console.error(`Failed to load configuration: ${err}`);
    return null;
  }
}

const command = process.argv[2];

if (command === 'install' || command === 'add') {
  installHooks();
} else if (command === 'commit-msg' || command === 'pre-commit') {
  runHookCommand(command);
}