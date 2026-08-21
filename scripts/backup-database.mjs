import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(process.cwd(), "backups");
const outputFile = join(backupDir, `backup-${stamp}.dump`);

await mkdir(backupDir, { recursive: true });

const child = spawn("pg_dump", ["--format=custom", "--no-owner", "--no-acl", databaseUrl, "--file", outputFile], {
  stdio: "inherit"
});

const exitCode = await new Promise((resolve) => child.on("exit", resolve));
if (exitCode !== 0) throw new Error(`pg_dump failed with exit code ${exitCode}`);

console.log(outputFile);
