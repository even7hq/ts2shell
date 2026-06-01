import ts from "typescript";
import { describe, expect, it } from "vitest";
import { Errors } from "../src/errors/Errors";
import { CliError } from "../src/errors/CliError";
import { ConstReassignError } from "../src/errors/ConstReassignError";
import { ModuleResolutionError } from "../src/errors/ModuleResolutionError";
import { TargetCapabilityError } from "../src/errors/TargetCapabilityError";
import { UnsupportedSyntaxError } from "../src/errors/UnsupportedSyntaxError";

describe("Errors", () => {
    it("invalidTarget returns CliError with TS2SHELL003", () => {
        const err = Errors.invalidTarget("foo");

        expect(err).toBeInstanceOf(CliError);
        expect(err.code).toBe("TS2SHELL003");
        expect(err.message).toContain("foo");
    });

    it("missingEntry returns CliError with TS2SHELL001", () => {
        const err = Errors.missingEntry("/missing/entry.ts");

        expect(err.code).toBe("TS2SHELL001");
        expect(err.span.file).toContain("entry.ts");
    });

    it("unknownModule returns ModuleResolutionError with TS2SHELL301", () => {
        const source = 'import "lodash";';
        const sf = ts.createSourceFile("t.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const node = sf.statements[0];

        const err = Errors.unknownModule(sf, node, "lodash");

        expect(err).toBeInstanceOf(ModuleResolutionError);
        expect(err.code).toBe("TS2SHELL301");
    });

    it("unsupportedSyntax returns UnsupportedSyntaxError with TS2SHELL101", () => {
        const source = "class Foo {}";
        const sf = ts.createSourceFile("t.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const node = sf.statements[0];

        const err = Errors.unsupportedSyntax(sf, node, "class declaration");

        expect(err).toBeInstanceOf(UnsupportedSyntaxError);
        expect(err.code).toBe("TS2SHELL101");
        expect(err.message).toContain("class declaration");
    });

    it("targetCapability includes active target in message", () => {
        const source = 'const o = { a: "1" };';
        const sf = ts.createSourceFile("t.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const node = sf.statements[0];

        const err = Errors.targetCapability(sf, node, "sh", "Object literals");

        expect(err).toBeInstanceOf(TargetCapabilityError);
        expect(err.message).toContain("sh");
    });

    it("constReassign returns ConstReassignError with binding name", () => {
        const source = "const x = 1;\nx = 2;";
        const sf = ts.createSourceFile("t.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const assign = sf.statements[1];

        const err = Errors.constReassign(sf, assign, "x");

        expect(err).toBeInstanceOf(ConstReassignError);
        expect(err.code).toBe("TS2SHELL401");
        expect(err.message).toContain("x");
    });
});
