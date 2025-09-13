export declare const SizeLimitsPlugin: {
    new (options: {
        assetFilter?: (assetFilename: string) => boolean;
        hints?: false | "warning" | "error";
        maxAssetSize?: number;
        maxEntrypointSize?: number;
    }): {
        name: string;
        _args: [options: {
            assetFilter?: (assetFilename: string) => boolean;
            hints?: false | "warning" | "error";
            maxAssetSize?: number;
            maxEntrypointSize?: number;
        }];
        affectedHooks: "done" | "compilation" | "run" | "afterDone" | "thisCompilation" | "invalid" | "compile" | "normalModuleFactory" | "contextModuleFactory" | "initialize" | "shouldEmit" | "infrastructureLog" | "beforeRun" | "emit" | "assetEmitted" | "afterEmit" | "failed" | "shutdown" | "watchRun" | "watchClose" | "environment" | "afterEnvironment" | "afterPlugins" | "afterResolvers" | "make" | "beforeCompile" | "afterCompile" | "finishMake" | "entryOption" | "additionalPass" | undefined;
        raw(compiler: import("..").Compiler): import("@rspack/binding").BuiltinPlugin;
        apply(compiler: import("..").Compiler): void;
    };
};
