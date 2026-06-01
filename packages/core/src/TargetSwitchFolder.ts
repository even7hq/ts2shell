import ts from "typescript";
import { Errors } from "./errors/Errors";
import type { ShellTarget } from "./ShellTarget";
import type { ScriptEmitter } from "./emit/ScriptEmitter";

/**
 * Folds switch(TARGET) to the active target case only.
 */
export namespace TargetSwitchFolder {
    /**
     * Returns true if node is switch(TARGET) from std/meta.
     *
     * @param node - Switch statement.
     * @param sourceFile - Source file.
     * @returns Whether this is a target switch.
     */
    export function isTargetSwitch(node: ts.SwitchStatement, sourceFile: ts.SourceFile): boolean {
        const expr = node.expression;

        return ts.isIdentifier(expr) && expr.text === "TARGET" && isTargetImport(sourceFile);
    }

    /**
     * Emits statements for the matching target case only.
     *
     * @param node - Switch statement.
     * @param target - Active target.
     * @param emitter - Script emitter.
     * @param strictTargets - Require matching case.
     * @returns Emitted lines.
     */
    export function emitTargetSwitch(
        node: ts.SwitchStatement,
        target: ShellTarget,
        emitter: ScriptEmitter,
        strictTargets: boolean
    ): string[] {
        const sourceFile = emitter.sourceFile;
        const body = collectMatchingStatements(node, target, emitter);

        if (body.length === 0) {
            const defaultClause = node.caseBlock.clauses.find(ts.isDefaultClause);

            if (defaultClause) {
                return emitter.emitStatements(defaultClause.statements);
            }

            if (strictTargets) {
                throw Errors.missingTargetCase(sourceFile, node, target);
            }

            return [];
        }

        return body;
    }

    /**
     * Resolves case fall-through and returns statements for the active target.
     *
     * @param node - Switch node.
     * @param target - Active target.
     * @param emitter - Emitter.
     * @returns Emitted lines for matching case body.
     */
    function collectMatchingStatements(
        node: ts.SwitchStatement,
        target: ShellTarget,
        emitter: ScriptEmitter
    ): string[] {
        const pendingLabels: string[] = [];

        for (const clause of node.caseBlock.clauses) {
            if (!ts.isCaseClause(clause)) {
                continue;
            }

            const expressions = Array.isArray(clause.expression)
                ? clause.expression
                : [clause.expression];

            for (const expr of expressions) {
                if (ts.isStringLiteral(expr)) {
                    pendingLabels.push(expr.text);
                }
            }

            if (clause.statements.length === 0) {
                continue;
            }

            if (pendingLabels.includes(target)) {
                return emitter.emitStatements(clause.statements);
            }

            pendingLabels.length = 0;
        }

        return [];
    }

    /**
     * @param sourceFile - Source file.
     * @returns True if TARGET identifier is plausible.
     */
    function isTargetImport(sourceFile: ts.SourceFile): boolean {
        let found = false;

        sourceFile.forEachChild((child) => {
            if (!ts.isImportDeclaration(child) || !ts.isStringLiteral(child.moduleSpecifier)) {
                return;
            }

            if (child.moduleSpecifier.text === "std/meta") {
                found = true;
            }
        });

        return found;
    }
}
