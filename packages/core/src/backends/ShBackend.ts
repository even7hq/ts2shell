import { BaseShellBackend } from "./BaseShellBackend";

/**
 * POSIX sh emission backend.
 */
export class ShBackend extends BaseShellBackend {
    public readonly target = "sh" as const;
}
