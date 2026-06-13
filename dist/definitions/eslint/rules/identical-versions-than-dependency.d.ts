declare const depGroupSchema: {
    readonly type: "object";
    readonly patternProperties: {
        readonly ".*": {
            readonly type: "object";
            readonly properties: {
                readonly resolutions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly dependencies: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly devDependencies: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
            };
            readonly additionalProperties: false;
        };
    };
    readonly additionalProperties: false;
};
export { depGroupSchema };
export declare const identicalVersionsThanDependencyRule: Record<string, import("eslint").Rule.RuleModule>;
//# sourceMappingURL=identical-versions-than-dependency.d.ts.map