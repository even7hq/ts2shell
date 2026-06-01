import type { SourceSpan } from "./SourceSpan";
import { Ts2ShellError } from "./Ts2ShellError";

/**
 * TypeScript syntax not supported by ts2shell (TS2SHELL100-149).
 */
export class UnsupportedSyntaxError extends Ts2ShellError {
    public override name = "UnsupportedSyntaxError";

    /**
     * @param code - Error code.
     * @param message - Message text.
     * @param span - Source span.
     * @param hints - Fix hints.
     */
    public constructor(code: string, message: string, span: SourceSpan, hints: string[] = []) {
        super(code, message, span, hints);
    }
}
