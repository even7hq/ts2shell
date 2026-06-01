import type { ShellTarget } from "../ShellTarget";
import { BashBackend } from "./BashBackend";
import { BatBackend } from "./BatBackend";
import { Ps1Backend } from "./Ps1Backend";
import { ShBackend } from "./ShBackend";
import type { TargetBackend } from "./TargetBackend";

/**
 * Creates a shell emission backend for a target.
 *
 * @param target - Compile target.
 * @returns Backend instance.
 */
export function createBackend(target: ShellTarget): TargetBackend {
    switch (target) {
        case "bash":
            return new BashBackend();
        case "sh":
            return new ShBackend();
        case "ps1":
            return new Ps1Backend();
        case "bat":
            return new BatBackend();
        default:
            return new BashBackend();
    }
}
