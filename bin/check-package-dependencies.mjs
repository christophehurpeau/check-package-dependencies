#!/usr/bin/env node

import {
  createCheckPackage,
  createCheckPackageWithWorkspaces,
} from "../dist/index-node22.mjs";

const checkPackage = createCheckPackage();
if (checkPackage.pkg.workspaces) {
  const checkPackageWithWorkspaces = await createCheckPackageWithWorkspaces();
  checkPackageWithWorkspaces.checkRecommended({
    isLibrary: () => true,
  });
} else {
  checkPackage.checkRecommended();
}

await checkPackage.run();
