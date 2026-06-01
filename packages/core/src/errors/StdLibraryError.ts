import type { SourceSpan } from "./SourceSpan";
import { Ts2ShellError } from "./Ts2ShellError";

/**
 * Invalid std library usage (TS2SHELL350-399).
 */
export class StdLibraryError extends Ts2ShellError {
    public override name = "StdLibraryError";

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
