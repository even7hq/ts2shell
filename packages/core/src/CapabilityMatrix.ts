import type { ShellTarget } from "./ShellTarget";

/** Capability keys checked before emission. */
export type Capability =
    | "objectLiteral"
    | "nestedArray"
    | "arrayPush"
    | "spreadArgv"
    | "associativeMap";

const MATRIX: Record<Capability, Record<ShellTarget, boolean>> = {
    objectLiteral: { bash: true, sh: false, ps1: true, bat: false },
    nestedArray: { bash: true, sh: false, ps1: true, bat: false },
    arrayPush: { bash: true, sh: false, ps1: true, bat: false },
    spreadArgv: { bash: true, sh: true, ps1: true, bat: false },
    associativeMap: { bash: true, sh: false, ps1: true, bat: false }
};

/**
 * Target capability checks.
 */
export namespace CapabilityMatrix {
    /**
     * Returns whether a capability is supported for a target.
     *
     * @param target - Compile target.
     * @param capability - Capability key.
     * @returns True if supported.
     */
    export function supports(target: ShellTarget, capability: Capability): boolean {
        return MATRIX[capability][target];
    }
}
