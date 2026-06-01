import type { ShellTarget } from "../ShellTarget";

/**
 * Shell code emission backend for one compile target.
 */
export interface TargetBackend {
    readonly target: ShellTarget;

    /**
     * @returns Script preamble lines.
     */
    getPreamble(): string[];

    /**
     * @returns Default output file extension.
     */
    getFileExtension(): string;

    /**
     * @param value - String literal value.
     * @returns Quoted shell string.
     */
    quoteString(value: string): string;

    /**
     * @param name - Variable name.
     * @param valueExpr - Already-emitted value expression.
     * @returns Assignment line(s).
     */
    emitScalarAssign(name: string, valueExpr: string): string;

    /**
     * @param name - Array variable name.
     * @param elements - Quoted elements.
     * @returns Array initialization.
     */
    emitArrayLiteral(name: string, elements: string[]): string;

    /**
     * @param name - Array name.
     * @param value - Element expression.
     * @returns Push statement.
     */
    emitArrayPush(name: string, value: string): string;

    /**
     * @param name - Array name.
     * @returns Length expression.
     */
    emitArrayLength(name: string): string;

    /**
     * @param name - Array name.
     * @param index - Index expression.
     * @returns Element read expression.
     */
    emitArrayIndex(name: string, index: string): string;

    /**
     * @param name - Array name.
     * @param index - Index expression.
     * @param value - Value expression.
     * @returns Index assign statement.
     */
    emitArrayIndexAssign(name: string, index: string, value: string): string;

    /**
     * @param name - Loop variable.
     * @param arrayName - Array to iterate.
     * @param body - Loop body lines (indented).
     * @returns For-loop block lines.
     */
    emitForOf(name: string, arrayName: string, body: string[]): string[];

    /**
     * @param name - Function name.
     * @param params - Parameter names.
     * @param body - Function body lines.
     * @returns Function block lines.
     */
    emitFunction(name: string, params: string[], body: string[]): string[];

    /**
     * @param condition - Shell condition.
     * @param thenLines - Then branch lines.
     * @param elseLines - Else branch lines.
     * @returns If block lines.
     */
    emitIf(condition: string, thenLines: string[], elseLines?: string[]): string[];

    /**
     * @param condition - While condition.
     * @param body - Body lines.
     * @returns While block lines.
     */
    emitWhile(condition: string, body: string[]): string[];

    /**
     * @param symbol - Std or Env symbol name.
     * @param args - Emitted argument expressions.
     * @returns Statement or expression fragment.
     */
    emitStdCall(symbol: string, args: string[], asExpression: boolean): string;

    /**
     * @param expr - Return value expression.
     * @returns Return statement.
     */
    emitReturn(expr?: string): string;

    /**
     * @param lines - Body lines to indent.
     * @param level - Indent depth.
     * @returns Indented lines.
     */
    indent(lines: string[], level?: number): string[];
}
