import type { Module } from "../../Module";
export declare const BuiltinLazyCompilationPlugin: {
    new (currentActiveModules: () => Set<string>, entries: boolean, imports: boolean, client: string, test?: RegExp | ((module: Module) => boolean) | undefined): {
        name: string;
        _args: [currentActiveModules: () => Set<string>, entries: boolean, imports: boolean, client: string, test?: RegExp | ((module: Module) => boolean) | undefined];
        affectedHooks: "done" | "compilation" | "run" | "afterDone" | "thisCompilation" | "invalid" | "compile" | "normalModuleFactory" | "contextModuleFactory" | "initialize" | "shouldEmit" | "infrastructureLog" | "beforeRun" | "emit" | "assetEmitted" | "afterEmit" | "failed" | "shutdown" | "watchRun" | "watchClose" | "environment" | "afterEnvironment" | "afterPlugins" | "afterResolvers" | "make" | "beforeCompile" | "afterCompile" | "finishMake" | "entryOption" | "additionalPass" | undefined;
        raw(compiler: import("../..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("../..").Compiler): void;
    };
};
