import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { Errors } from "./errors/Errors";

const STD_MODULES = new Set([
    "std/io",
    "std/env",
    "std/os",
    "std/shell",
    "std/fs",
    "std/meta"
]);

/**
 * Resolved bundle of TypeScript source files.
 */
export interface ResolvedBundle {
    entryPath: string;
    sourceFiles: ts.SourceFile[];
}

/**
 * Resolves std/* and relative local imports into a source bundle.
 */
export class ModuleResolver {
    private readonly visited = new Set<string>();

    /**
     * @param entryPath - Absolute path to entry .ts file.
     * @returns Parsed source files in dependency order.
     */
    public resolve(entryPath: string): ResolvedBundle {
        this.visited.clear();
        const absolute = path.resolve(entryPath);
        const ordered: ts.SourceFile[] = [];
        this.walk(absolute, ordered);

        return { entryPath: absolute, sourceFiles: ordered };
    }

    /**
     * @param filePath - File to load.
     * @param ordered - Output order accumulator.
     */
    private walk(filePath: string, ordered: ts.SourceFile[]): void {
        const normalized = path.resolve(filePath);

        if (this.visited.has(normalized)) {
            return;
        }

        this.visited.add(normalized);

        if (!fs.existsSync(normalized)) {
            throw Errors.missingEntry(normalized);
        }

        const content = fs.readFileSync(normalized, "utf8");
        const sf = ts.createSourceFile(normalized, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        ordered.push(sf);

        sf.forEachChild((node) => {
            if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
                return;
            }

            const spec = node.moduleSpecifier.text;

            if (STD_MODULES.has(spec) || spec.startsWith("std/")) {
                return;
            }

            if (spec.startsWith("./") || spec.startsWith("../")) {
                const resolved = resolveRelative(normalized, spec);
                this.walk(resolved, ordered);
                return;
            }

            throw Errors.unknownModule(sf, node.moduleSpecifier, spec);
        });
    }
}

/**
 * @param fromFile - Importing file path.
 * @param specifier - Relative specifier.
 * @returns Resolved .ts path.
 */
function resolveRelative(fromFile: string, specifier: string): string {
    const base = path.resolve(path.dirname(fromFile), specifier);

    if (fs.existsSync(base) && fs.statSync(base).isFile()) {
        return base;
    }

    if (fs.existsSync(`${base}.ts`)) {
        return `${base}.ts`;
    }

    throw Errors.missingEntry(base);
}
