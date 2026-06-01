import ts from "typescript";
import { ConstReassignError } from "./ConstReassignError";
import { CliError } from "./CliError";
import { ModuleResolutionError } from "./ModuleResolutionError";
import { spanFromNode, syntheticSpan } from "./spanFromNode";
import { TargetCapabilityError } from "./TargetCapabilityError";
import { TargetSwitchError } from "./TargetSwitchError";
import { UnsupportedSyntaxError } from "./UnsupportedSyntaxError";
import type { ShellTarget } from "../ShellTarget";

export namespace Errors {
    /**
     * Invalid CLI target.
     *
     * @param value - Provided target string.
     * @returns CliError instance.
     */
    export function invalidTarget(value: string): CliError {
        return new CliError(
            "TS2SHELL003",
            `Invalid compile target "${value}".`,
            syntheticSpan(),
            ['Use one of: bash, sh, ps1, bat.', "Example: ts2shell compile entry.ts --target bash"]
        );
    }

    /**
     * Missing entry file.
     *
     * @param path - Requested path.
     * @returns CliError instance.
     */
    export function missingEntry(path: string): CliError {
        return new CliError(
            "TS2SHELL001",
            `Entry file not found: ${path}`,
            syntheticSpan(path),
            ["Check the path and try again."]
        );
    }

    /**
     * Unknown import module.
     *
     * @param sourceFile - Source file.
     * @param node - Import declaration.
     * @param specifier - Module specifier.
     * @returns ModuleResolutionError instance.
     */
    export function unknownModule(
        sourceFile: ts.SourceFile,
        node: ts.Node,
        specifier: string
    ): ModuleResolutionError {
        return new ModuleResolutionError(
            "TS2SHELL301",
            `Cannot resolve module "${specifier}".`,
            spanFromNode(sourceFile, node),
            [
                'Use std/* modules (e.g. "std/io") or relative paths like "./lib/foo.ts".',
                "npm package imports are not supported."
            ]
        );
    }

    /**
     * Unsupported syntax construct.
     *
     * @param sourceFile - Source file.
     * @param node - Offending node.
     * @param construct - Short construct name.
     * @param hints - Additional hints.
     * @returns UnsupportedSyntaxError instance.
     */
    export function unsupportedSyntax(
        sourceFile: ts.SourceFile,
        node: ts.Node,
        construct: string,
        hints: string[] = []
    ): UnsupportedSyntaxError {
        return new UnsupportedSyntaxError(
            "TS2SHELL101",
            `${construct} is not supported by ts2shell.`,
            spanFromNode(sourceFile, node),
            hints
        );
    }

    /**
     * Capability missing for active target.
     *
     * @param sourceFile - Source file.
     * @param node - Offending node.
     * @param target - Active target.
     * @param capability - Capability description.
     * @param code - Specific error code.
     * @returns TargetCapabilityError instance.
     */
    export function targetCapability(
        sourceFile: ts.SourceFile,
        node: ts.Node,
        target: ShellTarget,
        capability: string,
        code = "TS2SHELL214"
    ): TargetCapabilityError {
        return new TargetCapabilityError(
            code,
            `${capability} is not supported when compiling for ${target}.`,
            spanFromNode(sourceFile, node),
            target,
            capability,
            [
                `Recompile with --target bash or --target ps1 if you need this feature.`,
                "See docs: reference/targets"
            ]
        );
    }

    /**
     * Const reassignment.
     *
     * @param sourceFile - Source file.
     * @param node - Assignment node.
     * @param name - Binding name.
     * @returns ConstReassignError instance.
     */
    export function constReassign(
        sourceFile: ts.SourceFile,
        node: ts.Node,
        name: string
    ): ConstReassignError {
        return new ConstReassignError(
            "TS2SHELL401",
            `Cannot reassign const binding "${name}".`,
            spanFromNode(sourceFile, node),
            name,
            ['Use let instead of const if you need reassignment.']
        );
    }

    /**
     * Invalid target switch.
     *
     * @param sourceFile - Source file.
     * @param node - Switch node.
     * @param message - Detail message.
     * @param code - Error code.
     * @param hints - Fix hints.
     * @returns TargetSwitchError instance.
     */
    export function targetSwitch(
        sourceFile: ts.SourceFile,
        node: ts.Node,
        message: string,
        code = "TS2SHELL501",
        hints: string[] = []
    ): TargetSwitchError {
        return new TargetSwitchError(code, message, spanFromNode(sourceFile, node), hints);
    }

    /**
     * No matching case for active target in switch(TARGET).
     *
     * @param sourceFile - Source file.
     * @param node - Switch node.
     * @param target - Active target.
     * @returns TargetSwitchError instance.
     */
    export function missingTargetCase(
        sourceFile: ts.SourceFile,
        node: ts.Node,
        target: ShellTarget
    ): TargetSwitchError {
        return new TargetSwitchError(
            "TS2SHELL510",
            `switch (TARGET) has no case for the active compile target "${target}".`,
            spanFromNode(sourceFile, node),
            [
                `Add case "${target}": or a default branch.`,
                "Use --strict-targets to require exhaustive cases at compile time."
            ]
        );
    }
}
