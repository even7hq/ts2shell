import { describe, expect, it } from "vitest";
import { ModuleResolver } from "../src/ModuleResolver";
import { Ts2ShellError } from "../src/errors/Ts2ShellError";
import { withTempProject, withTempSource } from "./helpers/withTempSource";

describe("ModuleResolver", () => {
    it("resolves entry with std imports only", () => {
        withTempSource(`import { echo } from "std/io";\necho("ok");\n`, (file) => {
            const bundle = new ModuleResolver().resolve(file);

            expect(bundle.entryPath).toBe(file);
            expect(bundle.sourceFiles).toHaveLength(1);
            expect(bundle.sourceFiles[0].fileName).toBe(file);
        });
    });

    it("follows relative local imports", () => {
        withTempProject(
            {
                "main.ts": 'import { n } from "./lib/util";\nconst x = n;\n',
                "lib/util.ts": "export const n = 1;\n"
            },
            "main.ts",
            (entry) => {
                const bundle = new ModuleResolver().resolve(entry);

                expect(bundle.sourceFiles).toHaveLength(2);
                expect(bundle.sourceFiles.map((sf) => sf.fileName).some((p) => p.endsWith("util.ts"))).toBe(true);
            }
        );
    });

    it("throws on unsupported npm-style imports", () => {
        withTempSource('import x from "lodash";\n', (file) => {
            expect(() => new ModuleResolver().resolve(file)).toThrow(Ts2ShellError);
        });
    });

    it("throws when entry file is missing", () => {
        expect(() => new ModuleResolver().resolve("/tmp/ts2shell-does-not-exist.ts")).toThrow(Ts2ShellError);
    });
});
