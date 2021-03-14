#!/usr/bin/env node

'use strict';

const { createCheckPackage, createCheckPackageWithWorkspaces } = require('../lib');

const checkPackage = createCheckPackage();
if (checkPackage.pkg.workspaces) {
  createCheckPackageWithWorkspaces().checkRecommended({
    isLibrary: () => true
  });
} else {
  checkPackage.checkRecommended();
}
