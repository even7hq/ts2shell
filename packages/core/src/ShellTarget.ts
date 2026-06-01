/** Supported shell output targets. */
export type ShellTarget = "bash" | "sh" | "ps1" | "bat";

const TARGETS: ShellTarget[] = ["bash", "sh", "ps1", "bat"];

/**
 * Parses a CLI target string.
 *
 * @param value - Raw `--target` value.
 * @returns Parsed target or undefined if invalid.
 */
export function parseShellTarget(value: string): ShellTarget | undefined {
    if (TARGETS.includes(value as ShellTarget)) {
        return value as ShellTarget;
    }

    return undefined;
}

/**
 * Default file extension for a shell target.
 *
 * @param target - Compile target.
 * @returns File extension including dot.
 */
export function extensionForTarget(target: ShellTarget): string {
    switch (target) {
        case "ps1":
            return ".ps1";
        case "bat":
            return ".bat";
        default:
            return ".sh";
    }
}
