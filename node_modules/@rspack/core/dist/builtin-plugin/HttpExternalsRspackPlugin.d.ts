export declare const HttpExternalsRspackPlugin: {
    new (css: boolean, webAsync: boolean): {
        name: string;
        _args: [css: boolean, webAsync: boolean];
        affectedHooks: "done" | "compilation" | "run" | "afterDone" | "thisCompilation" | "invalid" | "compile" | "normalModuleFactory" | "contextModuleFactory" | "initialize" | "shouldEmit" | "infrastructureLog" | "beforeRun" | "emit" | "assetEmitted" | "afterEmit" | "failed" | "shutdown" | "watchRun" | "watchClose" | "environment" | "afterEnvironment" | "afterPlugins" | "afterResolvers" | "make" | "beforeCompile" | "afterCompile" | "finishMake" | "entryOption" | "additionalPass" | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
