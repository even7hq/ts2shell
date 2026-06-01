import { describe, expect, it } from "vitest";
import { extensionForTarget, parseShellTarget } from "../src/ShellTarget";

describe("ShellTarget", () => {
    describe("parseShellTarget", () => {
        it("accepts all supported targets", () => {
            expect(parseShellTarget("bash")).toBe("bash");
            expect(parseShellTarget("sh")).toBe("sh");
            expect(parseShellTarget("ps1")).toBe("ps1");
            expect(parseShellTarget("bat")).toBe("bat");
        });

        it("rejects unknown targets", () => {
            expect(parseShellTarget("zsh")).toBeUndefined();
            expect(parseShellTarget("")).toBeUndefined();
            expect(parseShellTarget("BASH")).toBeUndefined();
        });
    });

    describe("extensionForTarget", () => {
        it("maps targets to file extensions", () => {
            expect(extensionForTarget("bash")).toBe(".sh");
            expect(extensionForTarget("sh")).toBe(".sh");
            expect(extensionForTarget("ps1")).toBe(".ps1");
            expect(extensionForTarget("bat")).toBe(".bat");
        });
    });
});
