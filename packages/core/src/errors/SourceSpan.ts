/**
 * Location in a TypeScript source file.
 */
export interface SourceSpan {
    file: string;
    line: number;
    column: number;
    length?: number;
}

/**
 * Related location for multi-span diagnostics.
 */
export interface RelatedSpan {
    span: SourceSpan;
    message: string;
}
