import { describe, expect, it } from "vitest";
import { ShellQuote } from "../src/quoting/ShellQuote";

describe("ShellQuote", () => {
    describe("posixSingle", () => {
        it("wraps simple strings in single quotes", () => {
            expect(ShellQuote.posixSingle("hello")).toBe("'hello'");
        });

        it("escapes embedded single quotes", () => {
            expect(ShellQuote.posixSingle("it's")).toBe(`'it'"'"'s'`);
        });
    });

    describe("ps1Double", () => {
        it("wraps simple strings in double quotes", () => {
            expect(ShellQuote.ps1Double("hello")).toBe('"hello"');
        });

        it("escapes double quotes and dollar signs", () => {
            expect(ShellQuote.ps1Double('say "hi" $x')).toBe('"say `"hi`" `$x"');
        });
    });

    describe("batArg", () => {
        it("leaves safe tokens unquoted", () => {
            expect(ShellQuote.batArg("DEBUG")).toBe("DEBUG");
        });

        it("quotes arguments with spaces or metacharacters", () => {
            expect(ShellQuote.batArg("hello world")).toBe('"hello world"');
            expect(ShellQuote.batArg('path"with')).toBe('"path""with"');
        });
    });
});
