import { createCheckPackage } from '../dist/index-node14.cjs.js';

createCheckPackage().checkRecommended({
  isLibrary: true,
  directDuplicateDependenciesOnlyWarnsFor: ['semver', 'chalk'],
});
