import { createCheckPackage } from "../dist/index.js";

await createCheckPackage({
  isLibrary: true,
})
  .checkRecommended({})
  .run();
