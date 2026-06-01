import { describe, expect, it } from "vitest";
import { CapabilityMatrix } from "../src/CapabilityMatrix";

describe("CapabilityMatrix", () => {
    it("allows object literals on bash and ps1 only", () => {
        expect(CapabilityMatrix.supports("bash", "objectLiteral")).toBe(true);
        expect(CapabilityMatrix.supports("ps1", "objectLiteral")).toBe(true);
        expect(CapabilityMatrix.supports("sh", "objectLiteral")).toBe(false);
        expect(CapabilityMatrix.supports("bat", "objectLiteral")).toBe(false);
    });

    it("allows spread argv on posix and ps1 but not bat", () => {
        expect(CapabilityMatrix.supports("bash", "spreadArgv")).toBe(true);
        expect(CapabilityMatrix.supports("sh", "spreadArgv")).toBe(true);
        expect(CapabilityMatrix.supports("ps1", "spreadArgv")).toBe(true);
        expect(CapabilityMatrix.supports("bat", "spreadArgv")).toBe(false);
    });

    it("allows associative maps on bash and ps1 only", () => {
        expect(CapabilityMatrix.supports("bash", "associativeMap")).toBe(true);
        expect(CapabilityMatrix.supports("ps1", "associativeMap")).toBe(true);
        expect(CapabilityMatrix.supports("sh", "associativeMap")).toBe(false);
    });
});
