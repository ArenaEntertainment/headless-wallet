import { type RawEvalDevToolModulePluginOptions } from "@rspack/binding";
export type { RawEvalDevToolModulePluginOptions as EvalDevToolModulePluginOptions };
export declare const EvalDevToolModulePlugin: {
    new (options: RawEvalDevToolModulePluginOptions): {
        name: string;
        _args: [options: RawEvalDevToolModulePluginOptions];
        affectedHooks: "done" | "compilation" | "run" | "afterDone" | "thisCompilation" | "invalid" | "compile" | "normalModuleFactory" | "contextModuleFactory" | "initialize" | "shouldEmit" | "infrastructureLog" | "beforeRun" | "emit" | "assetEmitted" | "afterEmit" | "failed" | "shutdown" | "watchRun" | "watchClose" | "environment" | "afterEnvironment" | "afterPlugins" | "afterResolvers" | "make" | "beforeCompile" | "afterCompile" | "finishMake" | "entryOption" | "additionalPass" | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
