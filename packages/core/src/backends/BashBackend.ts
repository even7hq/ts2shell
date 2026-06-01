import { BaseShellBackend } from "./BaseShellBackend";

/**
 * GNU Bash emission backend.
 */
export class BashBackend extends BaseShellBackend {
    public readonly target = "bash" as const;
}
