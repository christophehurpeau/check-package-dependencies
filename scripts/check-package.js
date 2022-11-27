import { createCheckPackage } from '../dist/index-node14.mjs';

await createCheckPackage()
  .checkRecommended({
    isLibrary: true,
    onlyWarnsForInDependencies: {
      '@babel/core': { duplicateDirectDependency: ['semver'] },
    },
  })
  .run();
