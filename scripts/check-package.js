import { createCheckPackage } from '../dist/index-node18.mjs';

await createCheckPackage({
  isLibrary: true,
})
  .checkRecommended({
    onlyWarnsForInDependencies: {
      eslint: { duplicateDirectDependency: ['chalk'] },
    },
  })
  .run();
