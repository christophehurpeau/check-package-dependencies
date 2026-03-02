import { createCheckPackage } from "../dist/index-node.mjs";

await createCheckPackage({
  isLibrary: true,
})
  .checkRecommended({})
  .run();
