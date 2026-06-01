import { describe, expect, it } from "vitest";
import { createBackend } from "../src/backends/createBackend";

describe("createBackend", () => {
    it("returns bash preamble with pipefail", () => {
        const backend = createBackend("bash");

        expect(backend.target).toBe("bash");
        expect(backend.getPreamble().join("\n")).toContain("#!/usr/bin/env bash");
        expect(backend.getPreamble().join("\n")).toContain("pipefail");
        expect(backend.getFileExtension()).toBe(".sh");
    });

    it("returns posix sh preamble", () => {
        const backend = createBackend("sh");

        expect(backend.target).toBe("sh");
        expect(backend.getPreamble()[0]).toBe("#!/bin/sh");
        expect(backend.getFileExtension()).toBe(".sh");
    });

    it("returns PowerShell preamble", () => {
        const backend = createBackend("ps1");

        expect(backend.target).toBe("ps1");
        expect(backend.getPreamble().join("\n")).toContain("$ErrorActionPreference");
        expect(backend.getFileExtension()).toBe(".ps1");
    });

    it("returns batch preamble", () => {
        const backend = createBackend("bat");

        expect(backend.target).toBe("bat");
        expect(backend.getPreamble().join("\n")).toContain("@echo off");
        expect(backend.getFileExtension()).toBe(".bat");
    });
});
