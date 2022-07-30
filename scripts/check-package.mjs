import { createCheckPackage } from '../dist/index-node14.cjs.js';

await createCheckPackage()
  .checkRecommended({
    isLibrary: true,
    onlyWarnsForInDependencies: {
      '@babel/core': { duplicateDirectDependency: ['semver'] },
    },
  })
  .run();
