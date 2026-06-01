import { describe, expect, it } from "vitest";
import { DiagnosticFormatter } from "../src/errors/DiagnosticFormatter";
import { Errors } from "../src/errors/Errors";
import { Ts2ShellError } from "../src/errors/Ts2ShellError";

describe("DiagnosticFormatter", () => {
    it("formats error code, message, and hints", () => {
        const err = Errors.invalidTarget("zsh");
        const diagnostic = DiagnosticFormatter.fromError(err);

        expect(diagnostic.code).toBe("TS2SHELL003");
        expect(diagnostic.message).toContain("Invalid compile target");
        expect(diagnostic.hints.length).toBeGreaterThan(0);
        expect(diagnostic.formatted).toContain("error TS2SHELL003");
        expect(diagnostic.formatted).toContain("help:");
    });

    it("builds a source snippet when source text is provided", () => {
        const source = "const x = 1;\nconst y = 2;\n";
        const err = new Ts2ShellError(
            "TS2SHELL999",
            "test error",
            { file: "/tmp/sample.ts", line: 2, column: 7, length: 1 },
            ["hint one"]
        );

        const diagnostic = DiagnosticFormatter.fromError(err, source);

        expect(diagnostic.snippet).toContain("const y");
        expect(diagnostic.caret).toContain("^");
        expect(diagnostic.line).toBe(2);
        expect(diagnostic.column).toBe(7);
    });
});
