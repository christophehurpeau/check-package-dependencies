import { createCheckPackage } from "../dist/index-node.mjs";

await createCheckPackage().checkRecommended({}).run();
