import { createCheckPackage } from '../dist/index-node14.cjs.js';

createCheckPackage(undefined, { tryToAutoFix: true }).checkRecommended({
  isLibrary: true,
  directDuplicateDependenciesOnlyWarnsFor: ['semver', 'chalk'],
});
