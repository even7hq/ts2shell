/** Compile targets for ts2shell CLI `--target`. */
export type ShellTarget = "bash" | "sh" | "ps1" | "bat";

/**
 * Active compile target. Replaced by the compiler from `--target`.
 * Use in `switch (TARGET) { case "bash": ... }`.
 */
export declare const TARGET: ShellTarget;
