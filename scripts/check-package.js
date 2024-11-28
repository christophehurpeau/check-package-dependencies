import { createCheckPackage } from "../dist/index.js";

await createCheckPackage({
  isLibrary: true,
})
  .checkRecommended({
    onlyWarnsForInDependencies: {
      eslint: { duplicateDirectDependency: ["chalk"] },
    },
  })
  .run();
