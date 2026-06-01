import type { RelatedSpan, SourceSpan } from "./SourceSpan";

/**
 * Base error for all ts2shell compile failures.
 */
export class Ts2ShellError extends Error {
    public override name = "Ts2ShellError";

    /**
     * @param code - Stable error code (TS2SHELL###).
     * @param message - Primary message (English).
     * @param span - Source location.
     * @param hints - Actionable fix suggestions.
     * @param related - Optional related spans.
     */
    public constructor(
        public readonly code: string,
        message: string,
        public readonly span: SourceSpan,
        public readonly hints: string[] = [],
        public readonly related: RelatedSpan[] = []
    ) {
        super(message);
    }
}
