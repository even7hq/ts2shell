import fs from "node:fs";
import type { Ts2ShellError } from "./Ts2ShellError";

/**
 * Structured diagnostic for compile results.
 */
export interface Ts2ShellDiagnostic {
    code: string;
    message: string;
    file: string;
    line: number;
    column: number;
    snippet: string;
    caret: string;
    hints: string[];
    formatted: string;
}

/**
 * Formats ts2shell errors with source snippets.
 */
export namespace DiagnosticFormatter {
    /**
     * Converts an error to a structured diagnostic.
     *
     * @param err - Ts2shell error.
     * @param source - Optional full source text for snippets.
     * @returns Structured diagnostic.
     */
    export function fromError(err: Ts2ShellError, source?: string): Ts2ShellDiagnostic {
        const text = source ?? readFileSafe(err.span.file);
        const snippet = buildSnippet(text, err.span.line, err.span.column, err.span.length ?? 1);
        const caret = buildCaret(err.span.column, err.span.length ?? 1);
        const formatted = formatFull(err, snippet, caret);

        return {
            code: err.code,
            message: err.message,
            file: err.span.file,
            line: err.span.line,
            column: err.span.column,
            snippet,
            caret,
            hints: err.hints,
            formatted
        };
    }

    /**
     * @param err - Error to format.
     * @param snippet - Source snippet lines.
     * @param caret - Caret line.
     * @returns Multi-line formatted message.
     */
    function formatFull(err: Ts2ShellError, snippet: string, caret: string): string {
        const lines: string[] = [
            `error ${err.code}: ${err.message}`,
            "",
            `  --> ${err.span.file}:${err.span.line}:${err.span.column}`
        ];

        if (snippet) {
            lines.push("   |");
            for (const line of snippet.split("\n")) {
                lines.push(` ${line}`);
            }
            if (caret) {
                lines.push(`   |${caret}`);
            }
        }

        for (const hint of err.hints) {
            lines.push("", `help: ${hint}`);
        }

        return lines.join("\n");
    }

    /**
     * @param text - Full file source.
     * @param line - 1-based line.
     * @param column - 1-based column.
     * @param length - Highlight length.
     * @returns Snippet text with line numbers.
     */
    function buildSnippet(text: string, line: number, column: number, length: number): string {
        if (!text) {
            return "";
        }

        const lines = text.split(/\r?\n/);
        const idx = line - 1;
        const start = Math.max(0, idx - 1);
        const end = Math.min(lines.length - 1, idx + 1);
        const out: string[] = [];

        for (let i = start; i <= end; i++) {
            const num = String(i + 1).padStart(4, " ");
            const marker = i === idx ? ">" : " ";
            out.push(`${marker}${num} | ${lines[i] ?? ""}`);
        }

        return out.join("\n");
    }

    /**
     * @param column - 1-based column.
     * @param length - Underline length.
     * @returns Caret line.
     */
    function buildCaret(column: number, length: number): string {
        const pad = " ".repeat(column + 5);
        const carets = "^".repeat(Math.max(1, length));

        return `${pad}${carets}`;
    }

    /**
     * @param path - File path.
     * @returns File contents or empty string.
     */
    function readFileSafe(path: string): string {
        if (path === "<cli>" || !path) {
            return "";
        }

        try {
            return fs.readFileSync(path, "utf8");
        } catch {
            return "";
        }
    }
}
