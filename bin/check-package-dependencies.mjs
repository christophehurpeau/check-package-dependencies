#!/usr/bin/env node

import {
  createCheckPackage,
  createCheckPackageWithWorkspaces,
} from "../dist/index.js";

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
