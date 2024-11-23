import { createCheckPackage } from "../dist/index-node22.mjs";

await createCheckPackage({
  isLibrary: true,
})
  .checkRecommended({
    onlyWarnsForInDependencies: {
      eslint: { duplicateDirectDependency: ["chalk"] },
    },
  })
  .run();
