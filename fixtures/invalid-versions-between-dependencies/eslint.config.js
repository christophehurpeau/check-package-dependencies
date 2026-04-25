import checkPackagePlugin from "../../dist/eslint-plugin-node.mjs";

export default [
  checkPackagePlugin.configs.base,
  // {
  //   files: ["package.json"],
  //   rules: {
  //     "check-package-dependencies/satisfies-versions-between-dependencies": [
  //       "error",
  //       {
  //         dependencies: [
  //           {
  //             name: "@eslint/core",
  //             from: "eslint",
  //             to: "@eslint/plugin-kit",
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // },
];
