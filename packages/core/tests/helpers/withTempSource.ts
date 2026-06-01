import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Writes a temporary `.ts` file in a fresh directory and runs a callback.
 *
 * @param source - TypeScript source text.
 * @param fn - Callback receiving the absolute entry file path.
 */
export function withTempSource(source: string, fn: (filePath: string) => void): void {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ts2shell-test-"));
    const filePath = path.join(dir, "entry.ts");

    fs.writeFileSync(filePath, source, "utf8");

    try {
        fn(filePath);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

/**
 * Writes multiple `.ts` files in a temp directory and runs a callback.
 *
 * @param files - Map of relative path to source text (must include an entry path).
 * @param entryRelative - Relative path of the entry file inside the temp dir.
 * @param fn - Callback receiving the absolute entry file path.
 */
export function withTempProject(
    files: Record<string, string>,
    entryRelative: string,
    fn: (entryPath: string) => void
): void {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ts2shell-test-"));

    for (const [rel, source] of Object.entries(files)) {
        const full = path.join(dir, rel);

        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, source, "utf8");
    }

    const entryPath = path.join(dir, entryRelative);

    try {
        fn(entryPath);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}
