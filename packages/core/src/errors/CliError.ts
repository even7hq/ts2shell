import type { SourceSpan } from "./SourceSpan";
import { Ts2ShellError } from "./Ts2ShellError";

/**
 * CLI and configuration errors (TS2SHELL001-049).
 */
export class CliError extends Ts2ShellError {
    public override name = "CliError";

    /**
     * @param code - Error code.
     * @param message - Message text.
     * @param span - Source span (synthetic for CLI).
     * @param hints - Fix hints.
     */
    public constructor(code: string, message: string, span: SourceSpan, hints: string[] = []) {
        super(code, message, span, hints);
    }
}
