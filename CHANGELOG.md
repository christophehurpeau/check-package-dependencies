# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.2.0](https://github.com/christophehurpeau/pob/compare/check-package-dependencies@0.1.2...check-package-dependencies@0.2.0) (2021-03-13)


### Features

* **check-package-dependencies:** add bin script ([1886768](https://github.com/christophehurpeau/pob/commit/1886768250216ed301ee7d3ae79c141c4478f543))





### [2.0.2](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v2.0.1...v2.0.2) (2021-07-11)


### Bug Fixes

* add main field for eslint ([a3961be](https://www.github.com/christophehurpeau/check-package-dependencies/commit/a3961be34be1b025f5cb6edfa2b82e5ec5db745f))

### [2.0.1](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v2.0.0...v2.0.1) (2021-07-11)


### Bug Fixes

* ignore workspace in version or range ([96284e8](https://www.github.com/christophehurpeau/check-package-dependencies/commit/96284e8debfaf81bf81ee6ae4362b9bb09c33580))

## [2.0.0](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.2.7...v2.0.0) (2021-07-11)


### ⚠ BREAKING CHANGES

* requires node that support module

### Miscellaneous Chores

* update dev dependencies ([4c94bed](https://www.github.com/christophehurpeau/check-package-dependencies/commit/4c94bed5a014dfbdc9fa14dd664ed6a7a4df31a8))

### [1.2.7](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.2.6...v1.2.7) (2021-07-11)


### Bug Fixes

* dont export mjs version of this lib ([c6ea1b1](https://www.github.com/christophehurpeau/check-package-dependencies/commit/c6ea1b152c25446788953a18368902c8a7c38880))
* use semver as default export ([fe63dae](https://www.github.com/christophehurpeau/check-package-dependencies/commit/fe63dae679e29fc0b30a8801bd3f4247e2aee9b9))

### [1.2.6](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.2.5...v1.2.6) (2021-07-08)


### Bug Fixes

* exports package.json ([5b390b0](https://www.github.com/christophehurpeau/check-package-dependencies/commit/5b390b022429b35af451a31026f4af31ba0a60cc))

### [1.2.5](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.2.4...v1.2.5) (2021-06-27)


### Bug Fixes

* allow peer to be used in both dependencies and peerDependencies ([130cf50](https://www.github.com/christophehurpeau/check-package-dependencies/commit/130cf5015ca0ddd1c2e09c5fdb77966f2a622702))

### [1.2.4](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.2.3...v1.2.4) (2021-04-19)


### Bug Fixes

* allow peerDependencies to also be in peerDependencies for libraries but not in devDependencies ([25269a7](https://www.github.com/christophehurpeau/check-package-dependencies/commit/25269a7b731c22cb4eb1660c6f64dbba215eda2d))

### [1.2.3](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.2.2...v1.2.3) (2021-03-28)


### Bug Fixes

* warn when exact version not respected on workspaces ([a8d5019](https://www.github.com/christophehurpeau/check-package-dependencies/commit/a8d5019a782093512b91f258c1f317c1ee4d89b8))

### [1.2.2](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.2.1...v1.2.2) (2021-03-28)


### Bug Fixes

* ignore checking when range starts with file: ([fe5d3d8](https://www.github.com/christophehurpeau/check-package-dependencies/commit/fe5d3d80015c795b77ee8f1b189c8929644f2ec6))

### [1.2.1](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.2.0...v1.2.1) (2021-03-23)


### Bug Fixes

* internalWarnedForDuplicate use in workspace root pkg ([fcff2ba](https://www.github.com/christophehurpeau/check-package-dependencies/commit/fcff2baa55accb3dc3064ae56bb8579b42cd6842))

## [1.2.0](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.1.0...v1.2.0) (2021-03-23)


### Features

* add .forEach ([333b617](https://www.github.com/christophehurpeau/check-package-dependencies/commit/333b61782aade735f7f7db0346453fe1bfa64ba8))


### Bug Fixes

* checkExactVersions report multiple errors ([fb716e0](https://www.github.com/christophehurpeau/check-package-dependencies/commit/fb716e09cbfc2ea605c75fcbb6d8ba8e155e065d))
* chek direct duplicate dependencies in workspaces ([4904ca9](https://www.github.com/christophehurpeau/check-package-dependencies/commit/4904ca97ea7073d64afc2840a57ae2cbdf64be8b))
* missing docs ([c728f26](https://www.github.com/christophehurpeau/check-package-dependencies/commit/c728f261b885225541ee6031c052b24a401e781d))
* use report error and clearer message when a dependency is missing the dependency ([c6215e2](https://www.github.com/christophehurpeau/check-package-dependencies/commit/c6215e24b06492b2d7a0dcac44e005de73e9faa9))

## [1.1.0](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.0.1...v1.1.0) (2021-03-23)


### Features

* add checkSatisfiesVersionsBetweenDependencies ([6b9a201](https://www.github.com/christophehurpeau/check-package-dependencies/commit/6b9a2017c0e02b199f9d56d2792fbaeedf5fccd5))
* **deps:** update dependency type-fest to v1 ([#22](https://www.github.com/christophehurpeau/check-package-dependencies/issues/22)) ([da34b8f](https://www.github.com/christophehurpeau/check-package-dependencies/commit/da34b8f9be325fbd70f86ae4d314a1bd79ca8d8b))

### [1.0.1](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v1.0.0...v1.0.1) (2021-03-21)


### Bug Fixes

* improve regexp for detecting path in ERR_PACKAGE_PATH_NOT_EXPORTED error ([81efce3](https://www.github.com/christophehurpeau/check-package-dependencies/commit/81efce3c605fe63e810dfe3a0cbb740742d83d64))

## 1.0.0 (2021-03-14)


### Features

* rewrite in typescript ([236eae9](https://www.github.com/christophehurpeau/check-package-dependencies/commit/236eae9d320d80dc5356452de52ffd8434cf2d15))

## [0.1.2](https://github.com/christophehurpeau/pob/compare/check-package-dependencies@0.1.1...check-package-dependencies@0.1.2) (2021-03-13)


### Bug Fixes

* **check-package-dependencies:** onlyWarnsFor undefined ([0a52498](https://github.com/christophehurpeau/pob/commit/0a524989225cc954afc6caec073069d4cceff30c))





## [0.1.1](https://github.com/christophehurpeau/pob/compare/check-package-dependencies@0.1.0...check-package-dependencies@0.1.1) (2021-03-13)


### Bug Fixes

* **check-package-dependencies:** pkg path name ([f056a54](https://github.com/christophehurpeau/pob/commit/f056a547908c39834407ef9673c5cd8908fe8158))





# 0.1.0 (2021-03-13)


### Bug Fixes

* **check-package-dependencies:** better duplicate message error and fix reportError pkgPath ([fede23a](https://github.com/christophehurpeau/pob/commit/fede23a9e417b4e5cadc5dc81baae85569a6c6ae))


### Features

* **check-package-dependencies:** improve error messages and add color ([d89820c](https://github.com/christophehurpeau/pob/commit/d89820cef680d7a881c54ee3e90a674466fe3443))
* check-package-dependencies ([#849](https://github.com/christophehurpeau/pob/issues/849)) ([213969e](https://github.com/christophehurpeau/pob/commit/213969ed1ee4bc99ce431186a9d590a42d507d5e))
