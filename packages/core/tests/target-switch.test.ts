import { describe, expect, it } from "vitest";
import { Compiler } from "../src/Compiler";
import { withTempSource } from "./helpers/withTempSource";

describe("switch(TARGET)", () => {
    it("emits only the active target branch", () => {
        const source = `import { TARGET } from "std/meta";
import { exec } from "std/shell";

function run() {
  switch (TARGET) {
    case "bash":
    case "sh":
      exec("mkdir", "-p", "/tmp");
      break;
    case "ps1":
      exec("New-Item", "-ItemType", "Directory", "/tmp");
      break;
  }
}
run();
`;

        withTempSource(source, (file) => {
            const bash = Compiler.compile(file, { target: "bash" });
            const ps1 = Compiler.compile(file, { target: "ps1" });

            expect(bash.code).toMatch(/mkdir/);
            expect(bash.code).toMatch(/-p/);
            expect(bash.code).not.toContain("New-Item");
            expect(ps1.code).toContain("New-Item");
            expect(ps1.code).not.toMatch(/mkdir.*-p/);
        });
    });

    it("emits empty run() when no case matches and strictTargets is false", () => {
        const source = `import { TARGET } from "std/meta";

function run() {
  switch (TARGET) {
    case "ps1":
      break;
  }
}
run();
`;

        withTempSource(source, (file) => {
            const bash = Compiler.compile(file, { target: "bash" });

            expect(bash.code).toContain("run()");
        });
    });
});
