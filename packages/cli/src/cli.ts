#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Compiler, parseShellTarget, Ts2ShellError } from "@ts2shell/core";
import type { Ts2ShellDiagnostic } from "@ts2shell/core";

/**
 * Prints usage help.
 */
function printUsage(): void {
    console.log(`ts2shell compile <entry.ts> --target bash|sh|ps1|bat [-o output] [--strict-targets]

Transpile TypeScript to shell scripts. Documentation: packages/docs
`);
}

/**
 * @param argv - CLI arguments.
 * @returns Exit code.
 */
function main(argv: string[]): number {
    if (argv.length < 2 || argv[1] === "--help" || argv[1] === "-h") {
        printUsage();

        return 0;
    }

    if (argv[1] !== "compile") {
        console.error("Unknown command. Use: ts2shell compile <file.ts>");

        return 1;
    }

    const entry = argv[2];

    if (!entry) {
        console.error("Missing entry file.");

        return 1;
    }

    let targetRaw = "bash";
    let output: string | undefined;
    let strictTargets = false;

    for (let i = 3; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--target" && argv[i + 1]) {
            targetRaw = argv[++i];
        } else if (arg === "-o" && argv[i + 1]) {
            output = argv[++i];
        } else if (arg === "--strict-targets") {
            strictTargets = true;
        }
    }

    const target = parseShellTarget(targetRaw);

    if (!target) {
        console.error(`Invalid target "${targetRaw}". Use bash, sh, ps1, or bat.`);

        return 1;
    }

    const entryPath = path.resolve(process.cwd(), entry);

    try {
        const result = Compiler.compile(entryPath, { target, strictTargets });
        const outPath = output ?? defaultOutput(entry, result.extension);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, result.code, "utf8");
        console.log(`Wrote ${outPath}`);

        return 0;
    } catch (err) {
        if (err instanceof Ts2ShellError) {
            const diag = (err as Ts2ShellError & { diagnostics?: Ts2ShellDiagnostic[] }).diagnostics?.[0];

            if (diag) {
                console.error(diag.formatted);
            } else {
                console.error(`${err.code}: ${err.message}`);
            }

            return 1;
        }

        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(String(err));
        }

        return 1;
    }
}

/**
 * @param entry - Entry file path.
 * @param ext - Output extension.
 * @returns Default output path.
 */
function defaultOutput(entry: string, ext: string): string {
    const base = path.basename(entry, path.extname(entry));

    return path.join("dist", `${base}${ext}`);
}

process.exit(main(["ts2shell", ...process.argv.slice(2)]));
