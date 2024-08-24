#!/usr/bin/env node
import { installHooks } from "../src/index.js";
const command = process.argv[2];
if (command === "install" || command === "add") {
    installHooks();
}
