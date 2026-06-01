import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Compiler } from "../src/Compiler";
import { Ts2ShellError } from "../src/errors/Ts2ShellError";
import { withTempSource } from "./helpers/withTempSource";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const helloFixture = path.join(repoRoot, "examples", "hello.ts");

describe("Compiler", () => {
    it("compiles hello.ts to bash", () => {
        const result = Compiler.compile(helloFixture, { target: "bash" });

        expect(result.code).toContain("#!/usr/bin/env bash");
        expect(result.code).toContain("export DEBUG=");
        expect(result.code).toContain('for arg in "${flags[@]}"');
        expect(result.extension).toBe(".sh");
    });

    it("compiles hello.ts to ps1", () => {
        const result = Compiler.compile(helloFixture, { target: "ps1" });

        expect(result.code).toContain("$env:DEBUG");
        expect(result.code).toContain("foreach");
        expect(result.extension).toBe(".ps1");
    });

    it("compiles hello.ts to bat", () => {
        withTempSource(
            `import { Env } from "std/env";\nimport { echo } from "std/io";\nEnv.set("DEBUG", "1");\necho("hi");\n`,
            (file) => {
                const result = Compiler.compile(file, { target: "bat" });

                expect(result.code).toContain("@echo off");
                expect(result.extension).toBe(".bat");
            }
        );
    });

    it("rejects object literal on sh", () => {
        withTempSource('const o = { a: "1" };\n', (file) => {
            expect(() => Compiler.compile(file, { target: "sh" })).toThrow(Ts2ShellError);
        });
    });

    it("emits Env.set and Env.get for bash", () => {
        withTempSource(
            `import { Env } from "std/env";\nEnv.set("FOO", "bar");\nconst v = Env.get("FOO");\n`,
            (file) => {
                const result = Compiler.compile(file, { target: "bash" });

                expect(result.code).toMatch(/export FOO=/);
                expect(result.code).toContain("${FOO}");
            }
        );
    });

    it("rejects const reassignment", () => {
        withTempSource("const x = 1;\nx = 2;\n", (file) => {
            expect(() => Compiler.compile(file, { target: "bash" })).toThrow(Ts2ShellError);
        });
    });

    it("attaches diagnostics when compile fails", () => {
        withTempSource("const o = { a: 1 };\n", (file) => {
            try {
                Compiler.compile(file, { target: "sh" });
                expect.unreachable("expected compile to throw");
            } catch (err) {
                expect(err).toBeInstanceOf(Ts2ShellError);
                const shellErr = err as Ts2ShellError & { diagnostics?: { code: string }[] };

                expect(shellErr.diagnostics?.[0]?.code).toMatch(/^TS2SHELL/);
            }
        });
    });
});
