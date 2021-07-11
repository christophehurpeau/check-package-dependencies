// eslint-disable-next-line import/extensions
import { createCheckPackage } from '../dist/index-node12.cjs.js';

createCheckPackage().checkRecommended({
  isLibrary: true,
  directDuplicateDependenciesOnlyWarnsFor: ['semver', 'chalk'],
});
