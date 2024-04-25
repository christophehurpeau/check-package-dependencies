import { it, expect } from 'vitest';
import { createCheckPackage, createCheckPackageWithWorkspaces } from './index';

it.each([
  ['createCheckPackage', createCheckPackage],
  ['createCheckPackageWithWorkspaces', createCheckPackageWithWorkspaces],
])('%s should be defined', (_, fn) => {
  expect(fn).toBeDefined();
});
