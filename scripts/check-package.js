'use strict';

const { createCheckPackage } = require('..');

createCheckPackage().checkRecommended({
  isLibrary: true,
  directDuplicateDependenciesOnlyWarnsFor: ['semver', 'chalk'],
});
