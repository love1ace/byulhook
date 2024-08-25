import * as fs from "fs";
import * as path from "path";
import * as YAML from "yaml";
import { execSync } from "child_process";
import { getHooksPath } from "./utils.js";

const allGitHooks = [
  // Client-side hooks
  "applypatch-msg",       // Called after a patch message is prepared
  "pre-applypatch",       // Called before a patch is applied
  "post-applypatch",      // Called after a patch is applied
  "pre-commit",           // Called before a commit is made
  "prepare-commit-msg",   // Called before the commit message is prepared
  "commit-msg",           // Called after the commit message is entered
  "post-commit",          // Called after a commit is completed
  "pre-rebase",           // Called before a rebase
  "post-checkout",        // Called after a checkout
  "post-merge",           // Called after a merge
  "pre-push",             // Called before a push to a remote
  "fsmonitor-watchman",   // Called to monitor changes in the working directory
  "p4-changelist",        // Called before a changelist is created in Perforce (P4)
  "p4-prepare-changelist",// Called after a changelist is prepared in Perforce (P4)
  "p4-post-changelist",   // Called after a changelist is applied in Perforce (P4)
  "p4-pre-submit",        // Called before changes are submitted in Perforce (P4)
  "post-index-change",    // Called after the index file is changed

  // Server-side hooks
  "pre-receive",          // Called before processing pushed data
  "update",               // Called when updating each ref with pushed data
  "post-receive",         // Called after pushed data is processed
  "post-update",          // Called after pushed data is updated
  "reference-transaction",// Called at the beginning and end of a reference transaction
  "push-to-checkout",     // Called to handle updates to the working tree after a push
  "pre-auto-gc",          // Called before automatic garbage collection starts
  "post-rewrite",         // Called after `git commit --amend` and `git rebase`
  "sendemail-validate"    // Called to validate recipients in `git send-email`
];

export function installHooks() {
  try {
    const hooksDir = getHooksPath();
    const configPath = path.resolve(process.cwd(), "byulhook.yml");

    if (!fs.existsSync(configPath)) {
      console.error("Error: byulhook.yml not found.");
      process.exit(1);
    }

    const config = loadConfig(configPath) || {};

    const hooks = Object.keys(config);

    const allHooks = fs.readdirSync(hooksDir);
    allHooks.forEach((hookFile) => {
      const hookPath = path.join(hooksDir, hookFile);

      if (!hooks.includes(hookFile) && fs.existsSync(hookPath)) {
        let existingScript = fs.readFileSync(hookPath, "utf8");

        const hookPattern = new RegExp(`\\n?# byulhook\\nnpx byulhook ${hookFile}\\n# byulhook\\n?`, "g");
        const updatedScript = existingScript.replace(hookPattern, "");

        if (updatedScript !== existingScript) {
          fs.writeFileSync(hookPath, updatedScript, { mode: 0o755 });
          console.log(`┌─────────────────────────────────────────────────┐`);
          console.log(`│ ❌  (Removed) Hook: ${hookFile.padEnd(28)} │`);
          console.log(`└─────────────────────────────────────────────────┘`);
        }
      }
    });

    if (hooks.length === 0) {
      return;
    }

    hooks.forEach((hook) => {
      const hookPath = path.join(hooksDir, hook);
      const samplePath = `${hookPath}.sample`;

      if (fs.existsSync(samplePath)) {
        try {
          fs.unlinkSync(samplePath);
        } catch (err) {
          console.error(`Failed to delete sample hook: ${err}`);
        }
      }

      let script = "";
      const hookShebang = `#!/bin/sh\n`;
      const byulhookScript = `# byulhook\nnpx byulhook ${hook}\n# byulhook\n`;

      let existingScript = "";

      if (fs.existsSync(hookPath)) {
        try {
          existingScript = fs.readFileSync(hookPath, "utf8");

          const hookPattern = new RegExp(`\\n?# byulhook\\nnpx byulhook ${hook}\\n# byulhook\\n?`, "g");

          existingScript = existingScript.replace(hookPattern, "");

          if (!existingScript.includes(hookShebang)) {
            script += hookShebang;
          }

          script += `${existingScript}\n`;
        } catch (err) {
          console.error(`Failed to read existing hook: ${err}`);
        }
      } else {
        script += hookShebang;
      }

      script += byulhookScript;

      try {
        fs.writeFileSync(hookPath, script, { mode: 0o755 });
        console.log(`┌─────────────────────────────────────────────────┐`);
        console.log(`│ ✅  Hook: ${hook.padEnd(38)} │`);
        console.log(`└─────────────────────────────────────────────────┘`);

      } catch (err) {
        console.error(`Failed to write hook: ${err}`);
      }
    });
  } catch (err) {
    console.error(`Failed to install hooks: ${err}`);
  }
}

function runHookCommand(hookName: string) {
  const startTime = Date.now();

  const configPath = path.resolve(process.cwd(), "byulhook.yml");

  if (!fs.existsSync(configPath)) {
    console.error("Error: byulhook.yml not found.");
    process.exit(1);
  }

  const config = loadConfig(configPath);
  if (config && config[hookName] && config[hookName].commands) {
    const commands = config[hookName].commands;
    const summary = { success: 0, fail: 0 };
    console.log();
    console.log("\x1b[33m╭──────────────────────────────────────────────╮\x1b[0m");
    console.log("\x1b[33m│ 🐈 Starting byulhook - Developed by love1ace │\x1b[0m");
    console.log("\x1b[33m╰──────────────────────────────────────────────╯\x1b[0m");
    console.log();
    console.log(` ✅  Hook: ${hookName} `);
    console.log();

    for (const commandName in commands) {
      const commandObj = commands[commandName];
      const command = commandObj.run;

      if (command) {
        console.log(`\x1b[32m\x1b[1m┃ ${commandName} > \x1b[0m`);
        try {
          console.log(`\x1b[32m─────────────────────────────────────────────\x1b[0m`);
          console.log();
          execSync(command, { stdio: "inherit" });
          summary.success++;
          console.log();
          console.log(`\x1b[32m─────────────────────────────────────────────\x1b[0m`);
        } catch (error) {
          console.log(`\x1b[31m─────────────────────────────────────────────\x1b[0m`);
          console.error(`Error executing command ${commandName}:`, error);
          summary.fail++;
          console.log();
          console.log(`\x1b[31m─────────────────────────────────────────────\x1b[0m`);
        }
      }
    }
    console.log("\n📊 Execution Summary:");
    if (summary.success > 0) {
      console.log(`\x1b[32m  🟢  Successful: \x1b[0m${summary.success}`);
      console.log();
    }
    if (summary.fail > 0) {
      console.log(`\x1b[31m  ❌  Failed: \x1b[0m${summary.fail}`);
      console.log();
    }
    if (summary.success === 0 && summary.fail === 0) {
      console.log("  ✨ Done, no commands executed.");
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\x1b[36m\x1b[1m✨ Done in ${executionTime}s.\x1b[0m`);
    console.log();
  } else {
    console.log(`\x1b[31m\x1b[1m✨ Faild in ${hookName}s.\x1b[0m`);
    console.log(`No commands found for ${hookName}`);
  }
}

function loadConfig(configPath: string) {
  try {
    if (!fs.existsSync(configPath)) {
      console.error(`Error: Configuration file not found at ${configPath}`);
      return null;
    }
    const fileContent = fs.readFileSync(configPath, "utf8");
    return YAML.parse(fileContent);
  } catch (err) {
    console.error(`Failed to load configuration: ${err}`);
    return null;
  }
}

const command = process.argv[2];

if (allGitHooks.includes(command)) {
  runHookCommand(command);
}