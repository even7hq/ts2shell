import type { SourceSpan } from "./SourceSpan";
import { Ts2ShellError } from "./Ts2ShellError";

/**
 * Invalid switch(TARGET) usage (TS2SHELL500-549).
 */
export class TargetSwitchError extends Ts2ShellError {
    public override name = "TargetSwitchError";

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
