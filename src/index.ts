import * as fs from "fs";
import * as path from "path";
import * as YAML from "yaml";
import { execSync } from "child_process";
import { getHooksPath } from "./utils.js";

const allGitHooks = [
  // Client-side hooks
  "applypatch-msg",       // 패치 메시지를 준비한 후 호출
  "pre-applypatch",       // 패치를 적용하기 전에 호출
  "post-applypatch",      // 패치가 적용된 후 호출
  "pre-commit",           // 커밋을 만들기 전에 호출
  "prepare-commit-msg",   // 커밋 메시지를 준비하기 전에 호출
  "commit-msg",           // 커밋 메시지가 입력된 후 호출
  "post-commit",          // 커밋이 완료된 후 호출
  "pre-rebase",           // 리베이스하기 전에 호출
  "post-checkout",        // 체크아웃 후에 호출
  "post-merge",           // 병합 후에 호출
  "pre-push",             // 원격으로 푸시하기 전에 호출
  "fsmonitor-watchman",   // 작업 디렉토리의 변경 사항을 감시하기 위해 호출
  "p4-changelist",        // 퍼포스(P4)에서 changelist가 생성되기 전에 호출
  "p4-prepare-changelist",// 퍼포스(P4)에서 changelist가 준비된 후 호출
  "p4-post-changelist",   // 퍼포스(P4)에서 changelist가 적용된 후 호출
  "p4-pre-submit",        // 퍼포스(P4)에서 변경 사항을 제출하기 전에 호출
  "post-index-change",    // 인덱스 파일이 변경된 후에 호출

  // Server-side hooks
  "pre-receive",          // 푸시된 데이터를 처리하기 전에 호출
  "update",               // 푸시된 데이터가 각 참조를 업데이트할 때 호출
  "post-receive",         // 푸시된 데이터가 처리된 후 호출
  "post-update",          // 푸시된 데이터가 업데이트된 후 호출
  "reference-transaction",// 참조 트랜잭션의 시작과 끝에 호출
  "push-to-checkout",     // 푸시 후 작업 트리의 업데이트를 처리
  "pre-auto-gc",          // 자동 가비지 컬렉션이 시작되기 전에 호출
  "post-rewrite",         // `git commit --amend` 및 `git rebase` 후에 호출
  "sendemail-validate"    // `git send-email`에서 호출되어 수신자의 유효성을 검사
];

// 목적: Git 훅을 설치하고 설정합니다.
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

    // 모든 훅 파일을 검사하여 설정된 훅을 제외한 훅에서 byulhook 코드를 삭제
    const allHooks = fs.readdirSync(hooksDir);
    allHooks.forEach((hookFile) => {
      const hookPath = path.join(hooksDir, hookFile);

      if (!hooks.includes(hookFile) && fs.existsSync(hookPath)) {
        let existingScript = fs.readFileSync(hookPath, "utf8");

        const hookPattern = new RegExp(`\\n?# byulhook\\nnpx byulhook ${hookFile}\\n# byulhook\\n?`, "g");
        const updatedScript = existingScript.replace(hookPattern, "");

        if (updatedScript !== existingScript) {
          fs.writeFileSync(hookPath, updatedScript, { mode: 0o755 });
          // 삭제된 훅에 대한 로그 출력
          console.log(`┌─────────────────────────────────────────────────┐`);
          console.log(`│ ❌  (Removed) Hook: ${hookFile.padEnd(28)} │`);
          console.log(`└─────────────────────────────────────────────────┘`);
        }
      }
    });

    // byulhook.yml이 비어 있거나 훅이 없는 경우에도 삭제 로직이 작동하도록 추가
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

// 목적: 특정 Git 훅에 정의된 명령어들을 실행합니다.
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

// 목적: YAML 형식의 설정 파일을 읽고 파싱합니다.
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