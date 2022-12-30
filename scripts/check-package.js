import { createCheckPackage } from '../dist/index-node16.mjs';

await createCheckPackage()
  .checkRecommended({
    isLibrary: true,
    onlyWarnsForInDependencies: {
      '@babel/core': { duplicateDirectDependency: ['semver'] },
      eslint: { duplicateDirectDependency: ['chalk'] },
    },
  })
  .run();
