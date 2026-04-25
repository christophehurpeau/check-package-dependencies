import checkPackagePlugin from "../../dist/eslint-plugin-node.mjs";

export default [
  checkPackagePlugin.configs["recommended-library"],
  {
    files: ["package.json"],
  },
];
