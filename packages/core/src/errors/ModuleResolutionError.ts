import type { SourceSpan } from "./SourceSpan";
import { Ts2ShellError } from "./Ts2ShellError";

/**
 * Import/module resolution failures (TS2SHELL300-349).
 */
export class ModuleResolutionError extends Ts2ShellError {
    public override name = "ModuleResolutionError";

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
