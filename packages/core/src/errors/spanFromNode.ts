import ts from "typescript";
import type { SourceSpan } from "./SourceSpan";

/**
 * Builds a source span from a TypeScript node.
 *
 * @param sourceFile - Containing source file.
 * @param node - AST node.
 * @returns Source span with 1-based line/column.
 */
export function spanFromNode(sourceFile: ts.SourceFile, node: ts.Node): SourceSpan {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

    return {
        file: sourceFile.fileName,
        line: line + 1,
        column: character + 1,
        length: node.getWidth(sourceFile)
    };
}

/**
 * Synthetic span for CLI errors without a source file.
 *
 * @param file - File path or placeholder.
 * @returns Source span at line 1.
 */
export function syntheticSpan(file = "<cli>"): SourceSpan {
    return { file, line: 1, column: 1 };
}
