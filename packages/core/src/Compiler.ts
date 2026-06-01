import fs from "node:fs";
import { createBackend } from "./backends/createBackend";
import { DiagnosticFormatter } from "./errors/DiagnosticFormatter";
import type { Ts2ShellDiagnostic } from "./errors/DiagnosticFormatter";
import { Ts2ShellError } from "./errors/Ts2ShellError";
import { ScriptEmitter } from "./emit/ScriptEmitter";
import { ModuleResolver } from "./ModuleResolver";
import { extensionForTarget, type ShellTarget } from "./ShellTarget";

/**
 * Compile options.
 */
export interface CompileOptions {
    target: ShellTarget;
    strictTargets?: boolean;
}

/**
 * Successful compile result.
 */
export interface CompileResult {
    code: string;
    extension: string;
    diagnostics: Ts2ShellDiagnostic[];
}

/**
 * Compiles a TypeScript entry file to a shell script.
 */
export namespace Compiler {
    /**
     * @param entryPath - Path to entry .ts file.
     * @param options - Compile options.
     * @returns Generated script and diagnostics.
     */
    export function compile(entryPath: string, options: CompileOptions): CompileResult {
        try {
            const resolver = new ModuleResolver();
            const bundle = resolver.resolve(entryPath);
            const backend = createBackend(options.target);
            const lines: string[] = [...backend.getPreamble()];

            for (const sf of bundle.sourceFiles) {
                const emitter = new ScriptEmitter(
                    sf,
                    backend,
                    options.target,
                    options.strictTargets ?? false
                );
                lines.push(...emitter.emitSourceFile(sf));
                lines.push("");
            }

            const code = lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";

            return {
                code,
                extension: extensionForTarget(options.target),
                diagnostics: []
            };
        } catch (err) {
            if (err instanceof Ts2ShellError) {
                const source = fs.existsSync(err.span.file)
                    ? fs.readFileSync(err.span.file, "utf8")
                    : undefined;
                const diagnostic = DiagnosticFormatter.fromError(err, source);

                throw Object.assign(err, { diagnostics: [diagnostic] });
            }

            throw err;
        }
    }
}
