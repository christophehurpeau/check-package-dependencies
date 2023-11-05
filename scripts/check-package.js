import { createCheckPackage } from '../dist/index-node18.mjs';

await createCheckPackage({
  isLibrary: true,
})
  .checkRecommended({
    onlyWarnsForInDependencies: {
      '@babel/core': { duplicateDirectDependency: ['semver'] },
      eslint: { duplicateDirectDependency: ['chalk'] },
    },
  })
  .run();
