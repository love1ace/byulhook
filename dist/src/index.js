import * as fs from "fs";
import * as path from "path";
import * as YAML from "yaml";
import { execSync } from "child_process";
import { getHooksPath } from "./utils.js";
// 목적: Git 훅을 설치하고 설정합니다.
export function installHooks() {
    try {
        const hooksDir = getHooksPath();
        const configPath = path.resolve(process.cwd(), "byulhook.yml");
        if (!fs.existsSync(configPath)) {
            console.error("Error: byulhook.yml not found.");
            process.exit(1);
        }
        const config = loadConfig(configPath);
        const hooks = Object.keys(config);
        hooks.forEach((hook) => {
            const hookPath = path.join(hooksDir, hook);
            const samplePath = `${hookPath}.sample`;
            if (fs.existsSync(samplePath)) {
                try {
                    fs.unlinkSync(samplePath);
                }
                catch (err) {
                    console.error(`Failed to delete sample hook: ${err}`);
                }
            }
            let script = `#!/bin/sh\n`;
            let existingScript = "";
            if (fs.existsSync(hookPath)) {
                try {
                    existingScript = fs.readFileSync(hookPath, "utf8");
                    if (existingScript.includes(`# byulhook\nnpx byulhook ${hook}\n# byulhook\n`)) {
                        console.log(`┌─────────────────────────────────────────────────┐`);
                        console.log(`│ ✅ Hook: ${hook.padEnd(38)} │`);
                        console.log(`└─────────────────────────────────────────────────┘`);
                        return;
                    }
                    script += `${existingScript}\n`;
                }
                catch (err) {
                    console.error(`Failed to read existing hook: ${err}`);
                }
            }
            script += `\n# byulhook\nnpx byulhook ${hook}\n# byulhook\n`;
            try {
                fs.writeFileSync(hookPath, script, { mode: 0o755 });
            }
            catch (err) {
                console.error(`Failed to write hook: ${err}`);
            }
        });
    }
    catch (err) {
        console.error(`Failed to install hooks: ${err}`);
    }
}
// 목적: 특정 Git 훅에 정의된 명령어들을 실행합니다.
function runHookCommand(hookName) {
    const startTime = Date.now();
    console.log();
    console.log("╭──────────────────────────────────────────────╮");
    console.log("│ 🐈 Starting byulhook - Developed by love1ace │ ");
    console.log("╰──────────────────────────────────────────────╯");
    console.log();
    const configPath = path.resolve(process.cwd(), "byulhook.yml");
    if (!fs.existsSync(configPath)) {
        console.error("Error: byulhook.yml not found.");
        process.exit(1);
    }
    const config = loadConfig(configPath);
    if (config && config[hookName] && config[hookName].commands) {
        const commands = config[hookName].commands;
        const summary = { success: 0, fail: 0 };
        console.log(`[Hook: ${hookName}]`);
        for (const commandName in commands) {
            const commandObj = commands[commandName];
            const command = commandObj.run;
            if (command) {
                console.log();
                console.log(`┃ ${commandName} ❯ `);
                console.log();
                try {
                    execSync(command, { stdio: "inherit" });
                    summary.success++;
                }
                catch (error) {
                    console.error(`Error executing command ${commandName}:`, error);
                    summary.fail++;
                }
            }
        }
        console.log();
        console.log("\n📊 Execution Summary:");
        if (summary.success > 0) {
            console.log(`  ✅ Successful: ${summary.success}`);
            console.log();
        }
        if (summary.fail > 0) {
            console.log(`  ❌ Failed: ${summary.fail}`);
            console.log();
        }
        if (summary.success === 0 && summary.fail === 0) {
            console.log("  ✨ Done, no commands executed.");
        }
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const message = `😽 Done in ${executionTime}s.`;
        const boxWidth = Math.max(message.length + 4, 24);
        console.log("╭" + "─".repeat(boxWidth - 2) + "╮");
        console.log(`│ ${message.padEnd(boxWidth - 4)} │`);
        console.log("╰" + "─".repeat(boxWidth - 2) + "╯");
    }
    else {
        console.log(`No commands found for ${hookName}`);
    }
}
// 목적: YAML 형식의 설정 파일을 읽고 파싱합니다.
function loadConfig(configPath) {
    try {
        if (!fs.existsSync(configPath)) {
            console.error(`Error: Configuration file not found at ${configPath}`);
            return null;
        }
        const fileContent = fs.readFileSync(configPath, "utf8");
        return YAML.parse(fileContent);
    }
    catch (err) {
        console.error(`Failed to load configuration: ${err}`);
        return null;
    }
}
const command = process.argv[2];
if (command === "install" || command === "add") {
}
else if (command === "commit-msg" || command === "pre-commit") {
    runHookCommand(command);
}
