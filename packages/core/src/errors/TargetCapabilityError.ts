import type { SourceSpan } from "./SourceSpan";
import { Ts2ShellError } from "./Ts2ShellError";
import type { ShellTarget } from "../ShellTarget";

/**
 * Feature unsupported for the active compile target (TS2SHELL200-299).
 */
export class TargetCapabilityError extends Ts2ShellError {
    public override name = "TargetCapabilityError";

    /**
     * @param code - Error code.
     * @param message - Message text.
     * @param span - Source span.
     * @param target - Active compile target.
     * @param capability - Human-readable capability name.
     * @param hints - Fix hints.
     */
    public constructor(
        code: string,
        message: string,
        span: SourceSpan,
        public readonly target: ShellTarget,
        public readonly capability: string,
        hints: string[] = []
    ) {
        super(code, message, span, hints);
    }
}
