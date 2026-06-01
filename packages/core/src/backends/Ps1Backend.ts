import { ShellQuote } from "../quoting/ShellQuote";
import type { TargetBackend } from "./TargetBackend";

/**
 * PowerShell emission backend.
 */
export class Ps1Backend implements TargetBackend {
    public readonly target = "ps1" as const;

    /**
     * @returns PowerShell preamble.
     */
    public getPreamble(): string[] {
        return ["$ErrorActionPreference = 'Stop'", ""];
    }

    /**
     * @returns ps1 extension.
     */
    public getFileExtension(): string {
        return ".ps1";
    }

    /**
     * @param value - Raw string.
     * @returns Quoted string.
     */
    public quoteString(value: string): string {
        return ShellQuote.ps1Double(value);
    }

    /**
     * @param name - Variable name.
     * @param valueExpr - Value expression.
     * @returns Assignment.
     */
    public emitScalarAssign(name: string, valueExpr: string): string {
        return `$${name} = ${valueExpr}`;
    }

    /**
     * @param name - Array name.
     * @param elements - Elements.
     * @returns Array assignment.
     */
    public emitArrayLiteral(name: string, elements: string[]): string {
        return `$${name} = @(${elements.join(", ")})`;
    }

    /**
     * @param name - Array name.
     * @param value - Value.
     * @returns Push statement.
     */
    public emitArrayPush(name: string, value: string): string {
        return `$${name} += @(${value})`;
    }

    /**
     * @param name - Array name.
     * @returns Length expression.
     */
    public emitArrayLength(name: string): string {
        return `$${name}.Count`;
    }

    /**
     * @param name - Array name.
     * @param index - Index.
     * @returns Index read.
     */
    public emitArrayIndex(name: string, index: string): string {
        return `$${name}[${index}]`;
    }

    /**
     * @param name - Array name.
     * @param index - Index.
     * @param value - Value.
     * @returns Index assign.
     */
    public emitArrayIndexAssign(name: string, index: string, value: string): string {
        return `$${name}[${index}] = ${value}`;
    }

    /**
     * @param name - Loop variable.
     * @param arrayName - Array name.
     * @param body - Body lines.
     * @returns Foreach block.
     */
    public emitForOf(name: string, arrayName: string, body: string[]): string[] {
        const lines = [`foreach ($${name} in $${arrayName}) {`];
        lines.push(...this.indent(body));
        lines.push("}");

        return lines;
    }

    /**
     * @param name - Function name.
     * @param params - Parameters.
     * @param body - Body.
     * @returns Function block.
     */
    public emitFunction(name: string, params: string[], body: string[]): string[] {
        const paramList = params.map((p) => `$${p}`).join(", ");
        const lines = [`function ${name}(${paramList}) {`];
        lines.push(...this.indent(body));
        lines.push("}");

        return lines;
    }

    /**
     * @param condition - Condition.
     * @param thenLines - Then branch.
     * @param elseLines - Else branch.
     * @returns If block.
     */
    public emitIf(condition: string, thenLines: string[], elseLines?: string[]): string[] {
        const lines = [`if (${condition}) {`];
        lines.push(...this.indent(thenLines));

        if (elseLines?.length) {
            lines.push("} else {");
            lines.push(...this.indent(elseLines));
        }

        lines.push("}");

        return lines;
    }

    /**
     * @param condition - Condition.
     * @param body - Body.
     * @returns While block.
     */
    public emitWhile(condition: string, body: string[]): string[] {
        const lines = [`while (${condition}) {`];
        lines.push(...this.indent(body));
        lines.push("}");

        return lines;
    }

    /**
     * @param symbol - Std symbol.
     * @param args - Args.
     * @param asExpression - Expression context.
     * @returns Emitted code.
     */
    public emitStdCall(symbol: string, args: string[], asExpression: boolean): string {
        switch (symbol) {
            case "Env.set": {
                const key = stripQuotes(args[0] ?? "");
                const val = args[1] ?? '""';

                return `$env:${key} = ${val}`;
            }
            case "Env.get": {
                const key = stripQuotes(args[0] ?? "");

                return `$env:${key}`;
            }
            case "echo":
                return asExpression
                    ? `(Write-Output ${args.join(" ")})`
                    : `Write-Output ${args.join(" ")}`;
            case "exec": {
                const cmd = args[0];
                const rest = args.slice(1);

                return rest.length ? `& ${cmd} ${rest.join(" ")}` : `& ${cmd}`;
            }
            case "test": {
                const op = stripQuotes(args[0] ?? "");

                if (op === "-f" && args[1]) {
                    return `Test-Path ${args[1]}`;
                }

                if (op === "-n" && args[1]) {
                    return `[string]::IsNullOrEmpty($${stripQuotes(args[1])}) -eq $false`;
                }

                return `$true`;
            }
            case "cd":
                return `Set-Location ${args[0]}`;
            case "pwd":
                return asExpression ? "(Get-Location)" : "Get-Location";
            case "exit":
                return `exit ${args[0] ?? "0"}`;
            case "read":
                return `$${stripQuotes(args[0] ?? "input")} = Read-Host`;
            case "mkdir":
                return `New-Item -ItemType Directory -Force -Path ${args[0]}`;
            case "rm":
                return `Remove-Item -Recurse -Force ${args[0]}`;
            case "cp":
                return `Copy-Item ${args[0]} ${args[1]}`;
            case "mv":
                return `Move-Item ${args[0]} ${args[1]}`;
            default:
                return `# unknown: ${symbol}`;
        }
    }

    /**
     * @param expr - Return value.
     * @returns Return statement.
     */
    public emitReturn(expr?: string): string {
        if (expr) {
            return `return ${expr}`;
        }

        return "return";
    }

    /**
     * @param lines - Lines.
     * @param level - Indent.
     * @returns Indented lines.
     */
    public indent(lines: string[], level = 1): string[] {
        const pad = "    ".repeat(level);

        return lines.map((l) => (l ? pad + l : l));
    }
}

/**
 * @param arg - Quoted arg.
 * @returns Unquoted name.
 */
function stripQuotes(arg: string): string {
    return arg.replace(/^["'$]+|["']$/g, "");
}
