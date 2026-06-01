import type { SourceSpan } from "./SourceSpan";
import { Ts2ShellError } from "./Ts2ShellError";

/**
 * Reassignment to a const binding (TS2SHELL400-419).
 */
export class ConstReassignError extends Ts2ShellError {
    public override name = "ConstReassignError";

    /**
     * @param code - Error code.
     * @param message - Message text.
     * @param span - Source span.
     * @param bindingName - Const variable name.
     * @param hints - Fix hints.
     */
    public constructor(
        code: string,
        message: string,
        span: SourceSpan,
        public readonly bindingName: string,
        hints: string[] = []
    ) {
        super(code, message, span, hints);
    }
}
