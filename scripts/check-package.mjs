import { createCheckPackage } from '../dist/index-node14.cjs.js';

await createCheckPackage(undefined, { tryToAutoFix: true })
  .checkRecommended({
    isLibrary: true,
    onlyWarnsForInDependencies: {
      '@babel/core': { duplicateDirectDependency: ['semver'] },
    },
  })
  .run();
