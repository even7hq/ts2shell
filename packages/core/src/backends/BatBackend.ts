import { ShellQuote } from "../quoting/ShellQuote";
import type { TargetBackend } from "./TargetBackend";

/**
 * Windows cmd.exe batch emission backend.
 */
export class BatBackend implements TargetBackend {
    public readonly target = "bat" as const;

    /**
     * @returns Batch preamble.
     */
    public getPreamble(): string[] {
        return ["@echo off", "setlocal EnableExtensions", ""];
    }

    /**
     * @returns bat extension.
     */
    public getFileExtension(): string {
        return ".bat";
    }

    /**
     * @param value - Raw string.
     * @returns Quoted batch string.
     */
    public quoteString(value: string): string {
        return ShellQuote.batArg(value);
    }

    /**
     * @param name - Variable name.
     * @param valueExpr - Value.
     * @returns Set statement.
     */
    public emitScalarAssign(name: string, valueExpr: string): string {
        return `set ${name}=${valueExpr}`;
    }

    /**
     * @param name - Not used as real array in bat.
     * @param elements - Space-separated list stored in one var.
     * @returns Set with elements.
     */
    public emitArrayLiteral(name: string, elements: string[]): string {
        const inner = elements.map((e) => e.replace(/^"|"$/g, "")).join(" ");

        return `set ${name}=${ShellQuote.batArg(inner)}`;
    }

    /**
     * @param name - Variable name.
     * @param value - Appended token.
     * @returns Set with append (limited).
     */
    public emitArrayPush(name: string, value: string): string {
        return `set ${name}=%${name}% ${value}`;
    }

    /**
     * @param name - Variable name.
     * @returns Placeholder length.
     */
    public emitArrayLength(name: string): string {
        return `0 /* .length not supported on bat for %${name}% */`;
    }

    /**
     * @param name - Name.
     * @param index - Index.
     * @returns Index read placeholder.
     */
    public emitArrayIndex(name: string, index: string): string {
        return `%${name}%`;
    }

    /**
     * @param name - Name.
     * @param index - Index.
     * @param value - Value.
     * @returns Assign line.
     */
    public emitArrayIndexAssign(name: string, index: string, value: string): string {
        return `set ${name}=${value}`;
    }

    /**
     * @param name - Loop var.
     * @param arrayName - List variable.
     * @param body - Body.
     * @returns For block.
     */
    public emitForOf(name: string, arrayName: string, body: string[]): string[] {
        const lines = [`for %%${name} in (%${arrayName}%) do (`];
        lines.push(...this.indent(body));
        lines.push(")");

        return lines;
    }

    /**
     * @param name - Label name.
     * @param params - Unused in bat v1.
     * @param body - Body lines.
     * @returns Label block.
     */
    public emitFunction(name: string, _params: string[], body: string[]): string[] {
        const lines = [`:${name}`];
        lines.push(...body);
        lines.push("goto :eof");

        return lines;
    }

    /**
     * @param condition - Condition.
     * @param thenLines - Then lines.
     * @param elseLines - Else lines.
     * @returns If block.
     */
    public emitIf(condition: string, thenLines: string[], elseLines?: string[]): string[] {
        const lines = [`if ${condition} (`];
        lines.push(...this.indent(thenLines));
        lines.push(")");

        if (elseLines?.length) {
            lines.push("else (");
            lines.push(...this.indent(elseLines));
            lines.push(")");
        }

        return lines;
    }

    /**
     * @param condition - Condition.
     * @param body - Body.
     * @returns While-not-supported stub using goto pattern simplified.
     */
    public emitWhile(condition: string, body: string[]): string[] {
        return [`if ${condition} (${body.join(" & ")})`];
    }

    /**
     * @param symbol - Std symbol.
     * @param args - Args.
     * @param asExpression - Expression flag.
     * @returns Emitted line.
     */
    public emitStdCall(symbol: string, args: string[], asExpression: boolean): string {
        switch (symbol) {
            case "Env.set": {
                const key = stripQuotes(args[0] ?? "");
                const val = args[1] ?? "";

                return `set ${key}=${val}`;
            }
            case "Env.get": {
                const key = stripQuotes(args[0] ?? "");

                return `%${key}%`;
            }
            case "echo":
                return asExpression ? `echo ${args.join(" ")}` : `echo ${args.join(" ")}`;
            case "exec":
                return args.join(" ");
            case "test": {
                if (stripQuotes(args[0] ?? "") === "-n") {
                    const v = stripQuotes(args[1] ?? "x");

                    return `defined ${v}`;
                }

                if (stripQuotes(args[0] ?? "") === "-f") {
                    return `exist ${args[1]}`;
                }

                return "0 equ 0";
            }
            case "cd":
                return `cd /d ${args[0]}`;
            case "pwd":
                return asExpression ? "%CD%" : "cd";
            case "exit":
                return `exit /b ${args[0] ?? "0"}`;
            case "read":
                return `set /p ${stripQuotes(args[0] ?? "line")}=`;
            case "mkdir":
                return `if not exist ${args[0]} mkdir ${args[0]}`;
            case "rm":
                return `del /q ${args[0]}`;
            case "cp":
                return `copy ${args[0]} ${args[1]}`;
            case "mv":
                return `move ${args[0]} ${args[1]}`;
            default:
                return `REM unknown ${symbol}`;
        }
    }

    /**
     * @param expr - Return expr.
     * @returns Exit.
     */
    public emitReturn(expr?: string): string {
        if (expr) {
            return `echo ${expr}`;
        }

        return "exit /b 0";
    }

    /**
     * @param lines - Lines.
     * @param level - Indent.
     * @returns Indented.
     */
    public indent(lines: string[], level = 1): string[] {
        const pad = "  ".repeat(level);

        return lines.map((l) => (l ? pad + l : l));
    }
}

/**
 * @param arg - Arg token.
 * @returns Stripped.
 */
function stripQuotes(arg: string): string {
    return arg.replace(/^["'%]+|["']$/g, "");
}
