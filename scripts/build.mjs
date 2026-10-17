// Builds dist/firefox and dist/chrome (unpacked) plus a zip for each.
// Usage: node scripts/build.mjs [firefox|chrome]   (default: both)
// Requires the `zip` command (preinstalled on macOS and most Linux).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const base = JSON.parse(readFileSync(join(root, "manifests/base.json"), "utf8"));
const targets = process.argv[2] ? [process.argv[2]] : ["firefox", "chrome"];

for (const target of targets) {
  const overrides = JSON.parse(readFileSync(join(root, `manifests/${target}.json`), "utf8"));
  const out = join(root, "dist", target);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(join(root, "src"), out, { recursive: true });

  const manifest = { ...base, version, ...overrides };
  writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  const zipPath = join(root, "dist", `densepress-${target}-${version}.zip`);
  rmSync(zipPath, { force: true });
  execFileSync("zip", ["-qr", zipPath, ".", "-x", ".*"], { cwd: out });
  console.log(`${target}: dist/${target}/  and  dist/densepress-${target}-${version}.zip`);
}
