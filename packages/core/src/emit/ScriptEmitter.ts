import ts from "typescript";
import { CapabilityMatrix } from "../CapabilityMatrix";
import { Errors } from "../errors/Errors";
import type { TargetBackend } from "../backends/TargetBackend";
import type { ShellTarget } from "../ShellTarget";
import { TargetSwitchFolder } from "../TargetSwitchFolder";

const STD_CALLS = new Set([
    "echo", "printf", "read", "exec", "test", "cd", "pwd", "exit",
    "mkdir", "rm", "cp", "mv", "set", "get"
]);

/**
 * Emits shell script lines from TypeScript AST.
 */
export class ScriptEmitter {
    private readonly constBindings = new Set<string>();
    private readonly stdImports = new Map<string, string>();

    /**
     * @param sourceFile - File being emitted.
     * @param backend - Target backend.
     * @param target - Compile target.
     * @param strictTargets - Strict target switch.
     */
    public constructor(
        public readonly sourceFile: ts.SourceFile,
        private readonly backend: TargetBackend,
        private readonly target: ShellTarget,
        private readonly strictTargets: boolean
    ) {
        this.collectStdImports();
    }

    /**
     * @param node - Source file or block statements.
     * @returns Emitted shell lines.
     */
    public emitSourceFile(node: ts.SourceFile): string[] {
        const lines: string[] = [];

        for (const stmt of node.statements) {
            if (ts.isImportDeclaration(stmt)) {
                continue;
            }

            lines.push(...this.emitStatement(stmt));
        }

        return lines;
    }

    /**
     * @param statements - Statement array.
     * @returns Emitted lines.
     */
    public emitStatements(statements: readonly ts.Statement[]): string[] {
        const lines: string[] = [];

        for (const stmt of statements) {
            lines.push(...this.emitStatement(stmt));
        }

        return lines;
    }

    /**
     * @param stmt - Single statement.
     * @returns Emitted lines.
     */
    public emitStatement(stmt: ts.Statement): string[] {
        if (ts.isFunctionDeclaration(stmt) && stmt.name) {
            return this.emitFunction(stmt);
        }

        if (ts.isVariableStatement(stmt)) {
            return this.emitVariableStatement(stmt);
        }

        if (ts.isExpressionStatement(stmt)) {
            const expr = this.emitExpression(stmt.expression, false);

            return expr ? [expr] : [];
        }

        if (ts.isIfStatement(stmt)) {
            return this.emitIf(stmt);
        }

        if (ts.isWhileStatement(stmt)) {
            return this.emitWhile(stmt);
        }

        if (ts.isForOfStatement(stmt)) {
            return this.emitForOf(stmt);
        }

        if (ts.isSwitchStatement(stmt) && TargetSwitchFolder.isTargetSwitch(stmt, this.sourceFile)) {
            return TargetSwitchFolder.emitTargetSwitch(stmt, this.target, this, this.strictTargets);
        }

        if (ts.isSwitchStatement(stmt)) {
            throw Errors.unsupportedSyntax(this.sourceFile, stmt, "switch (non-TARGET)", [
                'Use switch (TARGET) with import { TARGET } from "std/meta".'
            ]);
        }

        if (ts.isReturnStatement(stmt)) {
            const expr = stmt.expression ? this.emitExpression(stmt.expression, true) : undefined;

            return [this.backend.emitReturn(expr)];
        }

        if (ts.isBlock(stmt)) {
            return this.emitStatements(stmt.statements);
        }

        if (ts.isClassDeclaration(stmt)) {
            throw Errors.unsupportedSyntax(this.sourceFile, stmt, "class declaration");
        }

        if (ts.isFunctionDeclaration(stmt) && stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) {
            throw Errors.unsupportedSyntax(this.sourceFile, stmt, "async function");
        }

        return [];
    }

    /**
     * @param fn - Function declaration.
     * @returns Function shell block.
     */
    private emitFunction(fn: ts.FunctionDeclaration): string[] {
        const name = fn.name!.text;
        const params = fn.parameters.map((p) => {
            if (ts.isIdentifier(p.name)) {
                return p.name.text;
            }

            throw Errors.unsupportedSyntax(this.sourceFile, p, "non-identifier parameter");
        });
        const body = fn.body ? this.emitStatements(fn.body.statements) : [];

        return this.backend.emitFunction(name, params, body);
    }

    /**
     * @param stmt - Variable statement.
     * @returns Assignment lines.
     */
    private emitVariableStatement(stmt: ts.VariableStatement): string[] {
        const lines: string[] = [];
        const isConst = (stmt.declarationList.flags & ts.NodeFlags.Const) !== 0;

        for (const decl of stmt.declarationList.declarations) {
            if (!ts.isIdentifier(decl.name) || !decl.initializer) {
                throw Errors.unsupportedSyntax(this.sourceFile, decl, "complex variable declaration");
            }

            const name = decl.name.text;

            if (isConst) {
                this.constBindings.add(name);
            }

            if (ts.isArrayLiteralExpression(decl.initializer)) {
                if (!CapabilityMatrix.supports(this.target, "arrayPush") && decl.initializer.elements.length > 0) {
                    throw Errors.targetCapability(
                        this.sourceFile,
                        decl.initializer,
                        this.target,
                        "array literals",
                        "TS2SHELL220"
                    );
                }

                const elems = decl.initializer.elements.map((el) => {
                    if (!ts.isStringLiteral(el) && !ts.isNumericLiteral(el)) {
                        throw Errors.unsupportedSyntax(this.sourceFile, el, "array element type");
                    }

                    return this.emitExpression(el, true);
                });
                lines.push(this.backend.emitArrayLiteral(name, elems));
                continue;
            }

            if (ts.isObjectLiteralExpression(decl.initializer)) {
                if (!CapabilityMatrix.supports(this.target, "objectLiteral")) {
                    throw Errors.targetCapability(
                        this.sourceFile,
                        decl.initializer,
                        this.target,
                        "object literals",
                        "TS2SHELL214"
                    );
                }

                lines.push(...this.emitObjectLiteral(name, decl.initializer));
                continue;
            }

            const value = this.emitExpression(decl.initializer, true);
            lines.push(this.backend.emitScalarAssign(name, value));
        }

        return lines;
    }

    /**
     * @param name - Object variable name.
     * @param obj - Object literal.
     * @returns Emitted lines (bash -A).
     */
    private emitObjectLiteral(name: string, obj: ts.ObjectLiteralExpression): string[] {
        const pairs: string[] = [];

        for (const prop of obj.properties) {
            if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
                throw Errors.unsupportedSyntax(this.sourceFile, prop, "object property form");
            }

            const key = prop.name.text;
            const val = this.emitExpression(prop.initializer!, true);
            pairs.push(`["${key}"]=${val}`);
        }

        return [`declare -A ${name}=(${pairs.join(" ")})`];
    }

    /**
     * @param stmt - If statement.
     * @returns If block.
     */
    private emitIf(stmt: ts.IfStatement): string[] {
        const cond = this.emitIfCondition(stmt.expression);
        const thenLines = ts.isBlock(stmt.thenStatement)
            ? this.emitStatements(stmt.thenStatement.statements)
            : this.emitStatement(stmt.thenStatement);
        const elseLines = stmt.elseStatement
            ? ts.isBlock(stmt.elseStatement)
                ? this.emitStatements(stmt.elseStatement.statements)
                : this.emitStatement(stmt.elseStatement)
            : undefined;

        return this.backend.emitIf(cond, thenLines, elseLines);
    }

    /**
     * @param expr - Condition expression.
     * @returns Shell condition.
     */
    private emitIfCondition(expr: ts.Expression): string {
        if (ts.isCallExpression(expr)) {
            const sym = this.resolveStdCall(expr);

            if (sym === "test") {
                const args = expr.arguments.map((a) => this.emitExpression(a as ts.Expression, true));

                return args.join(" ");
            }
        }

        return this.emitExpression(expr, true);
    }

    /**
     * @param stmt - While loop.
     * @returns While block.
     */
    private emitWhile(stmt: ts.WhileStatement): string[] {
        const cond = this.emitIfCondition(stmt.expression);
        const body = ts.isBlock(stmt.statement)
            ? this.emitStatements(stmt.statement.statements)
            : this.emitStatement(stmt.statement);

        return this.backend.emitWhile(cond, body);
    }

    /**
     * @param stmt - For-of loop.
     * @returns For block.
     */
    private emitForOf(stmt: ts.ForOfStatement): string[] {
        let varName: string | undefined;

        if (ts.isVariableDeclarationList(stmt.initializer)) {
            const decl = stmt.initializer.declarations[0];

            if (decl && ts.isIdentifier(decl.name)) {
                varName = decl.name.text;
            }
        } else if (ts.isIdentifier(stmt.initializer)) {
            varName = stmt.initializer.text;
        }

        if (!varName) {
            throw Errors.unsupportedSyntax(this.sourceFile, stmt, "for-of initializer", [
                "Use for (const item of array) or for (let item of array)."
            ]);
        }

        if (!ts.isIdentifier(stmt.expression)) {
            throw Errors.unsupportedSyntax(this.sourceFile, stmt.expression, "for-of iterable");
        }

        const arrayName = stmt.expression.text;
        const body = ts.isBlock(stmt.statement)
            ? this.emitStatements(stmt.statement.statements)
            : this.emitStatement(stmt.statement);

        return this.backend.emitForOf(varName, arrayName, body);
    }

    /**
     * @param expr - Expression.
     * @param asExpression - Expression vs statement context.
     * @returns Shell fragment.
     */
    public emitExpression(expr: ts.Expression, asExpression: boolean): string {
        if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
            return this.backend.quoteString(expr.text);
        }

        if (ts.isNumericLiteral(expr)) {
            return expr.text;
        }

        if (ts.isIdentifier(expr)) {
            return posixExpandVar(expr.text);
        }

        if (ts.isTemplateExpression(expr)) {
            return this.emitTemplate(expr);
        }

        if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.PlusToken) {
            const left = this.emitExpression(expr.left, true);
            const right = this.emitExpression(expr.right, true);

            return `"${left}${right}"`;
        }

        if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            return this.emitAssignment(expr);
        }

        if (ts.isPropertyAccessExpression(expr)) {
            return this.emitPropertyAccess(expr);
        }

        if (ts.isElementAccessExpression(expr)) {
            return this.emitElementAccess(expr);
        }

        if (ts.isCallExpression(expr)) {
            return this.emitCall(expr, asExpression);
        }

        throw Errors.unsupportedSyntax(this.sourceFile, expr, "expression form");
    }

    /**
     * @param expr - Template expression.
     * @returns Interpolated shell string.
     */
    private emitTemplate(expr: ts.TemplateExpression): string {
        let out = this.backend.quoteString(expr.head.text);

        for (const span of expr.templateSpans) {
            const mid = this.emitExpression(span.expression, true);
            out = `"${out.slice(1, -1)}${mid}${span.literal.text}"`;
        }

        return out;
    }

    /**
     * @param expr - Assignment expression.
     * @returns Assignment statement/expression.
     */
    private emitAssignment(expr: ts.BinaryExpression): string {
        if (ts.isIdentifier(expr.left)) {
            const name = expr.left.text;

            if (this.constBindings.has(name)) {
                throw Errors.constReassign(this.sourceFile, expr, name);
            }

            const right = this.emitExpression(expr.right, true);

            return this.backend.emitScalarAssign(name, right);
        }

        if (ts.isElementAccessExpression(expr.left) && ts.isIdentifier(expr.left.expression)) {
            const arr = expr.left.expression.text;
            const idx = this.emitExpression(expr.left.argumentExpression, true);
            const val = this.emitExpression(expr.right, true);

            return this.backend.emitArrayIndexAssign(arr, idx, val);
        }

        throw Errors.unsupportedSyntax(this.sourceFile, expr, "assignment target");
    }

    /**
     * @param expr - Property access.
     * @returns Expansion.
     */
    private emitPropertyAccess(expr: ts.PropertyAccessExpression): string {
        if (expr.name.text === "length" && ts.isIdentifier(expr.expression)) {
            return this.backend.emitArrayLength(expr.expression.text);
        }

        if (ts.isIdentifier(expr.expression)) {
            const obj = expr.expression.text;
            const key = expr.name.text;

            return '"${' + obj + '[' + key + ']}"';
        }

        throw Errors.unsupportedSyntax(this.sourceFile, expr, "property access");
    }

    /**
     * @param expr - Element access.
     * @returns Indexed read.
     */
    private emitElementAccess(expr: ts.ElementAccessExpression): string {
        if (!ts.isIdentifier(expr.expression)) {
            throw Errors.unsupportedSyntax(this.sourceFile, expr, "element access");
        }

        const arr = expr.expression.text;
        const idx = this.emitExpression(expr.argumentExpression, true);

        return this.backend.emitArrayIndex(arr, idx);
    }

    /**
     * @param expr - Call expression.
     * @param asExpression - Context flag.
     * @returns Emitted call.
     */
    private emitCall(expr: ts.CallExpression, asExpression: boolean): string {
        if (expr.expression.kind === ts.SyntaxKind.Identifier && (expr.expression as ts.Identifier).text === "exec") {
            return this.emitExecCall(expr, asExpression);
        }

        const sym = this.resolveStdCall(expr);

        if (sym) {
            const args = expr.arguments.map((a) => this.emitExpression(a as ts.Expression, true));

            return this.backend.emitStdCall(sym, args, asExpression);
        }

        if (ts.isIdentifier(expr.expression)) {
            const name = expr.expression.text;
            const args = expr.arguments.map((a) => this.emitExpression(a as ts.Expression, true));

            return `${name} ${args.join(" ")}`.trim();
        }

        if (ts.isPropertyAccessExpression(expr.expression) && expr.expression.name.text === "push") {
            if (!CapabilityMatrix.supports(this.target, "arrayPush")) {
                throw Errors.targetCapability(this.sourceFile, expr, this.target, ".push()", "TS2SHELL221");
            }

            const arr = (expr.expression.expression as ts.Identifier).text;
            const arg = expr.arguments[0]
                ? this.emitExpression(expr.arguments[0] as ts.Expression, true)
                : '""';

            return this.backend.emitArrayPush(arr, arg);
        }

        throw Errors.unsupportedSyntax(this.sourceFile, expr, "call expression");
    }

    /**
     * @param expr - Exec call with optional spread.
     * @param asExpression - Context.
     * @returns Command line.
     */
    private emitExecCall(expr: ts.CallExpression, asExpression: boolean): string {
        const parts: string[] = [];

        for (const arg of expr.arguments) {
            if (ts.isSpreadElement(arg)) {
                if (!CapabilityMatrix.supports(this.target, "spreadArgv")) {
                    throw Errors.targetCapability(this.sourceFile, arg, this.target, "spread in exec", "TS2SHELL222");
                }

                if (ts.isIdentifier(arg.expression)) {
                    parts.push(`"\${${arg.expression.text}[@]}"`);
                }

                continue;
            }

            parts.push(this.emitExpression(arg as ts.Expression, true));
        }

        return this.backend.emitStdCall("exec", parts, asExpression);
    }

    /**
     * @param expr - Call expression.
     * @returns Std symbol or undefined.
     */
    private resolveStdCall(expr: ts.CallExpression): string | undefined {
        if (ts.isPropertyAccessExpression(expr.expression)) {
            if (ts.isIdentifier(expr.expression.expression) && expr.expression.expression.text === "Env") {
                return `Env.${expr.expression.name.text}`;
            }
        }

        if (ts.isIdentifier(expr.expression)) {
            const name = expr.expression.text;
            const mapped = this.stdImports.get(name);

            return mapped ?? (STD_CALLS.has(name) ? name : undefined);
        }

        return undefined;
    }

    /**
     * Collects std import bindings.
     */
    private collectStdImports(): void {
        this.sourceFile.forEachChild((child) => {
            if (!ts.isImportDeclaration(child) || !child.importClause) {
                return;
            }

            if (!ts.isStringLiteral(child.moduleSpecifier)) {
                return;
            }

            const mod = child.moduleSpecifier.text;

            if (!mod.startsWith("std/")) {
                return;
            }

            if (child.importClause.namedBindings && ts.isNamedImports(child.importClause.namedBindings)) {
                for (const el of child.importClause.namedBindings.elements) {
                    const imported = (el.propertyName ?? el.name).text;
                    const local = el.name.text;

                    this.stdImports.set(local, imported);
                }
            }
        });
    }
}

/**
 * @param name - Shell variable name.
 * @returns POSIX parameter expansion.
 */
function posixExpandVar(name: string): string {
    return '"${' + name + '}"';
}
