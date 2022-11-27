import {
  createCheckPackage,
  createCheckPackageWithWorkspaces,
} from '../dist/index-node14.mjs';

const checkPackage = createCheckPackage();
if (checkPackage.pkg.workspaces) {
  createCheckPackageWithWorkspaces().checkRecommended({
    isLibrary: () => true,
  });
} else {
  checkPackage.checkRecommended();
}

await checkPackage.run();
