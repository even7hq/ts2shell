import { ShellQuote } from "../quoting/ShellQuote";
import type { ShellTarget } from "../ShellTarget";
import type { TargetBackend } from "./TargetBackend";

/**
 * Shared POSIX-oriented backend logic (bash/sh).
 */
export abstract class BaseShellBackend implements TargetBackend {
    public abstract readonly target: ShellTarget;

    /**
     * @returns Preamble for POSIX shells.
     */
    public getPreamble(): string[] {
        if (this.target === "bash") {
            return ["#!/usr/bin/env bash", "set -euo pipefail", ""];
        }

        return ["#!/bin/sh", "set -eu", ""];
    }

    /**
     * @returns Shell script extension.
     */
    public getFileExtension(): string {
        return ".sh";
    }

    /**
     * @param value - Raw string.
     * @returns Single-quoted POSIX string.
     */
    public quoteString(value: string): string {
        return ShellQuote.posixSingle(value);
    }

    /**
     * @param name - Variable name.
     * @param valueExpr - Value expression.
     * @returns Assignment line.
     */
    public emitScalarAssign(name: string, valueExpr: string): string {
        return `${name}=${valueExpr}`;
    }

    /**
     * @param name - Array name.
     * @param elements - Quoted elements.
     * @returns Array init line.
     */
    public emitArrayLiteral(name: string, elements: string[]): string {
        if (elements.length === 0) {
            return `${name}=()`;
        }

        return `${name}=(${elements.join(" ")})`;
    }

    /**
     * @param name - Array name.
     * @param value - Element value.
     * @returns Push line.
     */
    public emitArrayPush(name: string, value: string): string {
        return `${name}+=(${value})`;
    }

    /**
     * @param name - Array name.
     * @returns Length expression.
     */
    public emitArrayLength(name: string): string {
        return `\${#${name}[@]}`;
    }

    /**
     * @param name - Array name.
     * @param index - Index expression.
     * @returns Indexed read.
     */
    public emitArrayIndex(name: string, index: string): string {
        return `\${${name}[${index}]}`;
    }

    /**
     * @param name - Array name.
     * @param index - Index expression.
     * @param value - Assigned value.
     * @returns Index assignment.
     */
    public emitArrayIndexAssign(name: string, index: string, value: string): string {
        return `${name}[${index}]=${value}`;
    }

    /**
     * @param name - Loop variable.
     * @param arrayName - Array name.
     * @param body - Loop body.
     * @returns For-of lines.
     */
    public emitForOf(name: string, arrayName: string, body: string[]): string[] {
        const lines = [`for ${name} in "\${${arrayName}[@]}"; do`];
        lines.push(...this.indent(body));
        lines.push("done");

        return lines;
    }

    /**
     * @param name - Function name.
     * @param params - Parameters.
     * @param body - Body lines.
     * @returns Function block.
     */
    public emitFunction(name: string, params: string[], body: string[]): string[] {
        const lines = [`${name}() {`];

        for (let i = 0; i < params.length; i++) {
            lines.push(`  local ${params[i]}="\${${i + 1}}"`);
        }

        lines.push(...this.indent(body, 1));
        lines.push("}");

        return lines;
    }

    /**
     * @param condition - Shell condition.
     * @param thenLines - Then branch.
     * @param elseLines - Else branch.
     * @returns If block.
     */
    public emitIf(condition: string, thenLines: string[], elseLines?: string[]): string[] {
        const lines = [`if ${condition}; then`];
        lines.push(...this.indent(thenLines));

        if (elseLines && elseLines.length > 0) {
            lines.push("else");
            lines.push(...this.indent(elseLines));
        }

        lines.push("fi");

        return lines;
    }

    /**
     * @param condition - While condition.
     * @param body - Body lines.
     * @returns While block.
     */
    public emitWhile(condition: string, body: string[]): string[] {
        const lines = [`while ${condition}; do`];
        lines.push(...this.indent(body));
        lines.push("done");

        return lines;
    }

    /**
     * @param symbol - Std symbol.
     * @param args - Arguments.
     * @param asExpression - Expression context.
     * @returns Emitted shell fragment.
     */
    public emitStdCall(symbol: string, args: string[], asExpression: boolean): string {
        switch (symbol) {
            case "Env.set": {
                const key = args[0]?.replace(/^'|'$/g, "") ?? "";
                const val = args[1] ?? '""';

                return `export ${key}=${val}`;
            }
            case "Env.get": {
                const key = args[0]?.replace(/^'|'$/g, "") ?? "";

                return '"${' + key + '}"';
            }
            case "echo":
                return asExpression ? `$(echo ${args.join(" ")})` : `echo ${args.join(" ")}`;
            case "printf":
                return asExpression ? `$(printf ${args.join(" ")})` : `printf ${args.join(" ")}`;
            case "exec":
                return `${args.join(" ")}`;
            case "test": {
                const cond = args.join(" ");

                return asExpression ? `[ ${cond} ]` : `if [ ${cond} ]; then :; fi`;
            }
            case "cd":
                return `cd -- ${args[0] ?? "."}`;
            case "pwd":
                return asExpression ? "$(pwd)" : "pwd";
            case "exit":
                return `exit ${args[0] ?? "0"}`;
            case "read":
                return `read -r ${args[0] ?? "REPLY"}`;
            case "mkdir":
                return args[1] === "'true'" || args[1] === "true"
                    ? `mkdir -p ${args[0]}`
                    : `mkdir ${args[0]}`;
            case "rm":
                return args[1] === "'true'" || args[1] === "true"
                    ? `rm -rf ${args[0]}`
                    : `rm ${args[0]}`;
            case "cp":
                return `cp ${args[0]} ${args[1]}`;
            case "mv":
                return `mv ${args[0]} ${args[1]}`;
            default:
                return `# unknown std call: ${symbol}`;
        }
    }

    /**
     * @param expr - Return expression.
     * @returns Return line.
     */
    public emitReturn(expr?: string): string {
        if (expr) {
            return `echo ${expr}`;
        }

        return "return 0";
    }

    /**
     * @param lines - Lines to indent.
     * @param level - Depth.
     * @returns Indented lines.
     */
    public indent(lines: string[], level = 1): string[] {
        const pad = "  ".repeat(level);

        return lines.map((l) => (l ? pad + l : l));
    }
}
