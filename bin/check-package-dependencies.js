#!/usr/bin/env node

'use strict';

const {
  createCheckPackage,
  createCheckPackageWithWorkspaces,
} = require('../dist/index-node14.cjs');

const checkPackage = createCheckPackage();
if (checkPackage.pkg.workspaces) {
  createCheckPackageWithWorkspaces().checkRecommended({
    isLibrary: () => true,
  });
} else {
  checkPackage.checkRecommended();
}
