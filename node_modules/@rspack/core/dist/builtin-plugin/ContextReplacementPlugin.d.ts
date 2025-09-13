export declare const ContextReplacementPlugin: {
    new (resourceRegExp: RegExp, newContentResource?: any, newContentRecursive?: any, newContentRegExp?: any): {
        name: string;
        _args: [resourceRegExp: RegExp, newContentResource?: any, newContentRecursive?: any, newContentRegExp?: any];
        affectedHooks: "done" | "compilation" | "run" | "afterDone" | "thisCompilation" | "invalid" | "compile" | "normalModuleFactory" | "contextModuleFactory" | "initialize" | "shouldEmit" | "infrastructureLog" | "beforeRun" | "emit" | "assetEmitted" | "afterEmit" | "failed" | "shutdown" | "watchRun" | "watchClose" | "environment" | "afterEnvironment" | "afterPlugins" | "afterResolvers" | "make" | "beforeCompile" | "afterCompile" | "finishMake" | "entryOption" | "additionalPass" | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
