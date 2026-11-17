// Roda o vitest a partir de "C:\..." mesmo quando o terminal está em "c:\..." (comum no VS Code).
// Com a letra do drive minúscula o vitest carrega módulos duas vezes e quebra com
// "Cannot read properties of undefined (reading 'config')".
import { spawnSync } from "node:child_process";
import path from "node:path";

const cwd = process.cwd().replace(/^[a-z]:/, (d) => d.toUpperCase());
const bin = path.join(cwd, "node_modules", "vitest", "vitest.mjs");
const { status } = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], { cwd, stdio: "inherit" });
process.exit(status ?? 1);
