#!/usr/bin/env node

import {
  createCheckPackage,
  createCheckPackageWithWorkspaces,
} from "../dist/index-node18.mjs";

const checkPackage = createCheckPackage();
if (checkPackage.pkg.workspaces) {
  createCheckPackageWithWorkspaces().checkRecommended({
    isLibrary: () => true,
  });
} else {
  checkPackage.checkRecommended();
}

await checkPackage.run();
