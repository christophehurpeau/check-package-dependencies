# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [10.4.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v10.3.0...v10.4.0) (2025-07-23)

### Features

* add REPORT_PROVIDED_PEER_DEPENDENCIES ([c95eb2d](https://github.com/christophehurpeau/check-package-dependencies/commit/c95eb2d3d670fda64564338f6067746d57d3f376))

### Bug Fixes

* add name of duplicate dependency ([d0dcf13](https://github.com/christophehurpeau/check-package-dependencies/commit/d0dcf130b88957474c6609cc99bef1be13bf0150))
* use run() in cli ([be565ed](https://github.com/christophehurpeau/check-package-dependencies/commit/be565ed68020623b3d6bb90131fb45cf4d36a4e1))

## [10.3.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v10.2.1...v10.3.0) (2025-06-08)

### Features

* skip patch ([451bf78](https://github.com/christophehurpeau/check-package-dependencies/commit/451bf787130835724dff692a547dfd3c895411e2))

## [10.2.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v10.2.0...v10.2.1) (2025-06-03)

Note: no notable changes


## [10.2.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v10.1.0...v10.2.0) (2025-04-27)

### Features

* add not great rule workspace-dependencies ([227d744](https://github.com/christophehurpeau/check-package-dependencies/commit/227d744c54ebb0a78580f338d944f0c1767fa1af))

## [10.1.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v10.0.0...v10.1.0) (2025-02-24)

### Features

* add more rules ([08668b3](https://github.com/christophehurpeau/check-package-dependencies/commit/08668b3be2c33f92f742fcd63568005233f2f8d9))

## [10.0.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v9.2.0...v10.0.0) (2025-02-17)

### ⚠ BREAKING CHANGES

* requires node >= 22.14

### Features

* eslint rule direct-duplicate-dependencies ([e4bf5a9](https://github.com/christophehurpeau/check-package-dependencies/commit/e4bf5a94922bfe7d6a8cf60b681ba56cdae75d12))
* use node findPackageJSON ([49d7239](https://github.com/christophehurpeau/check-package-dependencies/commit/49d72399459e4089d790c4d5f953dd726ecfac97))

## [9.2.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v9.1.0...v9.2.0) (2025-02-10)

### Features

* add eslint rule satisfies-versions ([7906b49](https://github.com/christophehurpeau/check-package-dependencies/commit/7906b49a6ef7fc945b93e5f093239656bd12838e))
* better locations for eslint plugin ([db7d1d0](https://github.com/christophehurpeau/check-package-dependencies/commit/db7d1d0efccc24d92064025ff4b2aea6ce05bb52))
* eslint fixer ([316a46e](https://github.com/christophehurpeau/check-package-dependencies/commit/316a46ef38d15705db4cb904fa857bf41a8a7c8a))
* eslint fixer ([7164e32](https://github.com/christophehurpeau/check-package-dependencies/commit/7164e32a19fa506927163fb3450a19aa9a3adca1))
* eslint rule resolutions-versions-match ([db8cb7f](https://github.com/christophehurpeau/check-package-dependencies/commit/db8cb7fa1fdc9a2382aafbc1b482ea61e10663ce))
* remove languageOptions and prefer rule config ([c686de8](https://github.com/christophehurpeau/check-package-dependencies/commit/c686de8df1296012a169bc910343fc18518cfd74))
* rule direct-peer-dependencies ([13d19a5](https://github.com/christophehurpeau/check-package-dependencies/commit/13d19a5169b7f5687ea0728d1ad46220c20ed3ef))

### Bug Fixes

* dont check peerdep in workspace if was already checked in subpackage ([cce70d6](https://github.com/christophehurpeau/check-package-dependencies/commit/cce70d6da9133bf0ed38a7f8ed01d792fc7630db))
* enable noUncheckedIndexedAccess ([35a364b](https://github.com/christophehurpeau/check-package-dependencies/commit/35a364bbfa76e612e6ca8bb74a8e91a4b1451a42))
* use chalk.dim instead of chalk.gray ([0077a0f](https://github.com/christophehurpeau/check-package-dependencies/commit/0077a0f1f7ba1d9b986a7a87f5d55b2e4c3d54f4))

## [9.1.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v9.0.0...v9.1.0) (2025-01-18)

### Features

* experimental eslint plugin ([13a2482](https://github.com/christophehurpeau/check-package-dependencies/commit/13a2482e54c6f5b815a72dbdabcb8cffbda25d13))
* look for direct peer dependencies of subpackage matching monorepo devdependencies ([7d88aa7](https://github.com/christophehurpeau/check-package-dependencies/commit/7d88aa72298df3430d12a3b913e4cde9c243fbb1))

## [9.0.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v8.0.1...v9.0.0) (2024-12-10)

### ⚠ BREAKING CHANGES

* fix checkSatisfiesVersionsBetweenDependencies config and result

### Bug Fixes

* fix checkSatisfiesVersionsBetweenDependencies config and result ([f8ddc10](https://github.com/christophehurpeau/check-package-dependencies/commit/f8ddc10449fde1153abc3a52065e4ac16f38a2cf))

## [8.0.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v8.0.0...v8.0.1) (2024-12-08)

Note: no notable changes


## [8.0.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v7.2.0...v8.0.0) (2024-12-08)

### ⚠ BREAKING CHANGES

* drop node 18 and node 20
* change message format
* parse package to get line:column in error messages

### Features

* change message format ([0f64246](https://github.com/christophehurpeau/check-package-dependencies/commit/0f64246cd01cda2c459afee6a81e27f6e87b4f63))
* parse package to get line:column in error messages ([6c82228](https://github.com/christophehurpeau/check-package-dependencies/commit/6c82228f64afacbff8cf9d04a87f6104b08004da))

### Code Refactoring

* update to node 22 and use fs.glob ([10d509a](https://github.com/christophehurpeau/check-package-dependencies/commit/10d509a72b722f838b55ef672e214024b3798996))

## [7.2.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v7.1.2...v7.2.0) (2024-07-17)

### Features

* support workspace:* ([310347a](https://github.com/christophehurpeau/check-package-dependencies/commit/310347a77833a821799eaa07eb4e7164635124f2))

## [7.1.2](https://github.com/christophehurpeau/check-package-dependencies/compare/v7.1.1...v7.1.2) (2024-06-09)

### Bug Fixes

* properly check peer dependency's dependencies for non-matching version when it is in pkg peer dependency ([b40fdaa](https://github.com/christophehurpeau/check-package-dependencies/commit/b40fdaa876dcea54822bee6e853ae55efe8013d8))

## [7.1.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v7.1.0...v7.1.1) (2024-03-06)

Note: no notable changes


## [7.1.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v7.0.0...v7.1.0) (2024-03-06)


### Features

* better support exact versions ([e9e6aa2](https://github.com/christophehurpeau/check-package-dependencies/commit/e9e6aa2643175e49622486f96dce49c03404d178))


## [7.0.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.8.0...v7.0.0) (2023-11-05)


### ⚠ BREAKING CHANGES

* drop node 16, requires node 18

### Features

* indicate when the issue is auto fixable ([f9a5609](https://github.com/christophehurpeau/check-package-dependencies/commit/f9a560917296d21de967a9af50e0b75b7330ff7b))


### Bug Fixes

* add missing newline when autofixing package.json ([5e52efc](https://github.com/christophehurpeau/check-package-dependencies/commit/5e52efc9d2a6aaf7cab1da0d38a2e1f0707344d2))
* display expected version in checkExactVersion if we could resolve it ([14e1103](https://github.com/christophehurpeau/check-package-dependencies/commit/14e1103ae6aa14b52d31b8e64f1b931c5e06c7dd))
* update import-meta-resolve ([77acefd](https://github.com/christophehurpeau/check-package-dependencies/commit/77acefd1a705b9cbeec385bbc07db46c646ffc45))
* use fileURLToPath ([ad78573](https://github.com/christophehurpeau/check-package-dependencies/commit/ad785739203486171f7c707b1af8366867af3217))


### Miscellaneous Chores

* pob update and update to yarn 4 and node 18 ([d474f59](https://github.com/christophehurpeau/check-package-dependencies/commit/d474f59a37bf8c36b2a73498d8b45bce78d88013))


# [0.2.0](https://github.com/christophehurpeau/pob/compare/check-package-dependencies@0.1.2...check-package-dependencies@0.2.0) (2021-03-13)


### Features

* **check-package-dependencies:** add bin script ([1886768](https://github.com/christophehurpeau/pob/commit/1886768250216ed301ee7d3ae79c141c4478f543))





## [6.8.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.7.0...v6.8.0) (2023-09-15)


### Features

* **checkResolutionsVersionsMatch:** add support for resolutions with patch ([42520ad](https://github.com/christophehurpeau/check-package-dependencies/commit/42520adc525dbd631306625bd611b8559d2f5a79))
* **deps:** update dependency type-fest to v4 ([#535](https://github.com/christophehurpeau/check-package-dependencies/issues/535)) ([4c94049](https://github.com/christophehurpeau/check-package-dependencies/commit/4c940490202accb27edde2bae165a0a68ff97dd1))

## [6.7.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.6.0...v6.7.0) (2023-07-13)


### Features

* add tryToAutoFix support in checkSatisfiesVersionsFromDependency ([c4efa60](https://github.com/christophehurpeau/check-package-dependencies/commit/c4efa603e47d3be05460bad38e332b574902e451))

## [6.6.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.5.0...v6.6.0) (2023-07-05)


### Features

* allow * use in onlyWarnsForInMonorepoPackagesDependencies ([350e62a](https://github.com/christophehurpeau/check-package-dependencies/commit/350e62a91c349c6c35f2f56a628bf60a270870d8))

## [6.5.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.4.1...v6.5.0) (2023-07-05)


### Features

* add checkMinRangePeerDependenciesSatisfiesDependencies and enable in recommended for librairies ([c04eb24](https://github.com/christophehurpeau/check-package-dependencies/commit/c04eb24bfe3c4108ce641fd13a5e19293cc2bb53))
* **deps:** update dependency semver to v7.5.1 ([#504](https://github.com/christophehurpeau/check-package-dependencies/issues/504)) ([d8079a5](https://github.com/christophehurpeau/check-package-dependencies/commit/d8079a5afef6aa35696ba6ae766638efdbea6338))


### Bug Fixes

* better support for * ([1ac69e6](https://github.com/christophehurpeau/check-package-dependencies/commit/1ac69e6b42839147a9fe9a5a2af56fa33ef5a7e7))

## [6.4.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.4.0...v6.4.1) (2023-05-11)


### Bug Fixes

* fix colors when both errors and warnings are found ([5779fe2](https://github.com/christophehurpeau/check-package-dependencies/commit/5779fe247ae97f06a1817adc559f5531c001ae01))

## [6.4.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.3.2...v6.4.0) (2023-05-08)


### Features

* add conclusion ([d29d77c](https://github.com/christophehurpeau/check-package-dependencies/commit/d29d77cf30689acbff3525a5de773b180aaccbe2))
* **deps:** update dependency glob to v10 ([#491](https://github.com/christophehurpeau/check-package-dependencies/issues/491)) ([455068c](https://github.com/christophehurpeau/check-package-dependencies/commit/455068c985408700844d60d2fdd43677a621c728))
* **deps:** update dependency import-meta-resolve to v3 ([#498](https://github.com/christophehurpeau/check-package-dependencies/issues/498)) ([626782a](https://github.com/christophehurpeau/check-package-dependencies/commit/626782a926e55444e3782584f8c37fb87df8606f))


### Bug Fixes

* fix multiple beforeExit ([d0595d2](https://github.com/christophehurpeau/check-package-dependencies/commit/d0595d2ff8008f65e4f9a81253a15681f40a9bac))

## [6.3.2](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.3.1...v6.3.2) (2023-04-17)


### Bug Fixes

* ignore direct peer dependency check if the dependency is in peer dependencies ([9eb7635](https://github.com/christophehurpeau/check-package-dependencies/commit/9eb763530047148334970ed5367eadd3ad495022))

## [6.3.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.3.0...v6.3.1) (2023-03-13)


### Bug Fixes

* make sure all dependencies matches peerdependency range before skipping it ([6b0db57](https://github.com/christophehurpeau/check-package-dependencies/commit/6b0db575a696e09f5a72c529626ae37fdbc6a136))
* only allow dependencies satisfiying peerdependencies when isLibrary is false ([0093237](https://github.com/christophehurpeau/check-package-dependencies/commit/00932373f3b3b78c977140680b76f81db38b9fcb))

## [6.3.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.2.1...v6.3.0) (2023-03-13)


### Features

* allow direct peer dependencies to be satisfied by another direct peer dependency ([2aba256](https://github.com/christophehurpeau/check-package-dependencies/commit/2aba256c989fa57786fe69ebefba73d2956c50ac))


### Bug Fixes

* add missing shebang ([d978b3d](https://github.com/christophehurpeau/check-package-dependencies/commit/d978b3d4f9be64448d2cfebbfb76fd04b6d2ffea))
* fix bin ([80900d3](https://github.com/christophehurpeau/check-package-dependencies/commit/80900d35773310a7fd6626494f86e5b43741850a)), closes [#472](https://github.com/christophehurpeau/check-package-dependencies/issues/472)

## [6.2.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.2.0...v6.2.1) (2023-01-29)


### Bug Fixes

* ignore directory with no package.json with warning ([76cdddf](https://github.com/christophehurpeau/check-package-dependencies/commit/76cdddf0c6b43e181a4e9b2fd71a1a75478e5ad9))

## [6.2.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.1.0...v6.2.0) (2023-01-09)


### Features

* **checkExactVersion:** add check for comparators range ([c886651](https://github.com/christophehurpeau/check-package-dependencies/commit/c886651e7632b022e783ad33a7d308ba1a952587))

## [6.1.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v6.0.0...v6.1.0) (2022-12-30)


### Features

* add checkMinRangeDependenciesSatisfiesDevDependencies ([934247f](https://github.com/christophehurpeau/check-package-dependencies/commit/934247f6eb8a00ea84262104c4f9514c431875b9))
* autofix checkMinRangeSatisfies ([63b20f7](https://github.com/christophehurpeau/check-package-dependencies/commit/63b20f72ff0294b380b9643f427267bf8377f52c))

## [6.0.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v5.0.0...v6.0.0) (2022-12-30)


### ⚠ BREAKING CHANGES

* isLibrary is now an option on createCheckPackage instead of checkRecommended

### Features

* allow duplicate devdep and dep when pkg is library and dep is range ([3697f8d](https://github.com/christophehurpeau/check-package-dependencies/commit/3697f8da6fff5a98af768c36864ac5ad32be1c43))

## [5.0.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v4.0.0...v5.0.0) (2022-12-30)


### ⚠ BREAKING CHANGES

* requires node 16

### Features

* add checkSatisfiesVersionsInDependency ([59cb1d2](https://github.com/christophehurpeau/check-package-dependencies/commit/59cb1d2f71e5cb93469c9d0727817695e6ce9be7))
* **deps:** update dependency chalk to v5 ([#219](https://github.com/christophehurpeau/check-package-dependencies/issues/219)) ([b1ac9b1](https://github.com/christophehurpeau/check-package-dependencies/commit/b1ac9b10b7e403e1c1d5a184925e723fb31b36eb))


### Miscellaneous Chores

* drop node 14 ([3d4c7f1](https://github.com/christophehurpeau/check-package-dependencies/commit/3d4c7f191cf6de8a05792e54dd7fad0deb462de5))

## [4.0.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.11.0...v4.0.0) (2022-11-29)


### ⚠ BREAKING CHANGES

* removed deprecated methods
* requires ESM, drop CJS support

### Features

* remove deprecated methods ([57e411a](https://github.com/christophehurpeau/check-package-dependencies/commit/57e411aae97bf6bce10e63b69212f4adcfc8f51e))
* rewrite for ESM ([464baa4](https://github.com/christophehurpeau/check-package-dependencies/commit/464baa4158f93f778b36b5fa3d83bdfeae11df5e))

## [3.11.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.10.0...v3.11.0) (2022-11-27)


### Features

* **deps:** update dependency type-fest to v3 ([#419](https://github.com/christophehurpeau/check-package-dependencies/issues/419)) ([1195137](https://github.com/christophehurpeau/check-package-dependencies/commit/1195137aad2ad042079ee5049802b93a1799db0d))

## [3.10.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.9.2...v3.10.0) (2022-09-21)


### Features

* add checkSatisfiesVersions ([083b1ce](https://github.com/christophehurpeau/check-package-dependencies/commit/083b1cecf9f0f7d7b3ad7cb499376892671e5a9d))

## [3.9.2](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.9.1...v3.9.2) (2022-07-30)


### Bug Fixes

* fix enable --fix cli option ([2fff3cd](https://github.com/christophehurpeau/check-package-dependencies/commit/2fff3cde8de2e7125f984a3dc0a5c43dbb4aaa01))
* fix run message warning always displaying for workspaces ([2e7e01d](https://github.com/christophehurpeau/check-package-dependencies/commit/2e7e01d00bc599bea1722ff89b8e59d45a60677a))

## [3.9.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.9.0...v3.9.1) (2022-07-30)


### Bug Fixes

* add beforeExit listener only once ([ae46f9a](https://github.com/christophehurpeau/check-package-dependencies/commit/ae46f9a9abc17f9703db553138acd37a3513f6cf))
* glob.sync option cwd to fix windows compat ([b663e18](https://github.com/christophehurpeau/check-package-dependencies/commit/b663e18274dc9b831d4765a0e940e8ca70a99ca0))

## [3.9.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.8.0...v3.9.0) (2022-07-30)


### Features

* allow `--fix` option ([27a2f85](https://github.com/christophehurpeau/check-package-dependencies/commit/27a2f85882ed95ff1796a5d44abc0fa2c02f1787))


### Bug Fixes

* fix autofix exact dependencies ([cb8108e](https://github.com/christophehurpeau/check-package-dependencies/commit/cb8108e395b683fcbe80f74981dbdc0b8bfb9293))

## [3.8.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.7.1...v3.8.0) (2022-07-30)


### Features

* prepare run() for async use with ESM ([e904c03](https://github.com/christophehurpeau/check-package-dependencies/commit/e904c0377d67d4751be3125dbab86987f7bd9e55))


### Bug Fixes

* support windows ERR_PACKAGE_PATH_NOT_EXPORTED error ([d77c4fe](https://github.com/christophehurpeau/check-package-dependencies/commit/d77c4fe61c58ef540451c85e3e9d9d756eff0e0d))

## [3.7.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.7.0...v3.7.1) (2022-07-24)


### Bug Fixes

* allow peer dep of a dep to be in devdep ([4e36aa8](https://github.com/christophehurpeau/check-package-dependencies/commit/4e36aa84f9edeb28408ad418b7fab9a15b9a0561)), closes [#323](https://github.com/christophehurpeau/check-package-dependencies/issues/323)

## [3.7.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.6.0...v3.7.0) (2022-07-07)


### Features

* check duplicates from previously checked packages in monorepo ([eec2e71](https://github.com/christophehurpeau/check-package-dependencies/commit/eec2e7106c6f307dd485be2bf8c9c33a967897ad))
* **deps:** update dependency glob to v8 ([#334](https://github.com/christophehurpeau/check-package-dependencies/issues/334)) ([32953d1](https://github.com/christophehurpeau/check-package-dependencies/commit/32953d1167047ece5f0199495ed88f83828fb30c))

## [3.6.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.5.2...v3.6.0) (2022-04-27)


### Features

* add checkResolutionsVersionsMatch ([af67b83](https://github.com/christophehurpeau/check-package-dependencies/commit/af67b83bb492a4b75fc2c81f564e24789b78ac18))

### [3.5.2](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.5.1...v3.5.2) (2022-03-12)


### Bug Fixes

* fixes for monorepo ([28b13e3](https://github.com/christophehurpeau/check-package-dependencies/commit/28b13e3e5374bd43e54d9e3d67fd1ae9eaeca2b0))

### [3.5.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.5.0...v3.5.1) (2022-03-12)


### Bug Fixes

* default exactVersionsOnlyWarnsFor ([f3a5a34](https://github.com/christophehurpeau/check-package-dependencies/commit/f3a5a344bdd8e9a7edb8e3e7db7a87832665f0ca))

## [3.5.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.4.0...v3.5.0) (2022-03-12)


### Features

* better warns for checks ([18c47ef](https://github.com/christophehurpeau/check-package-dependencies/commit/18c47ef54d8ef566bec0f10cabf5c10a77c34a51))

## [3.4.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.3.0...v3.4.0) (2022-03-05)


### Features

* support npm: in version ([51959c2](https://github.com/christophehurpeau/check-package-dependencies/commit/51959c20d66082783eae9321e25065ba4d349cb3))

## [3.3.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.2.0...v3.3.0) (2022-03-05)


### Features

* add createCheckPackageOptions to createCheckPackageWithWorkspaces ([5168959](https://github.com/christophehurpeau/check-package-dependencies/commit/51689594e79fddce803866d8819be1282d740f19))


### Bug Fixes

* better implementation of autofix and add tests ([0abf7cc](https://github.com/christophehurpeau/check-package-dependencies/commit/0abf7ccdd47341f53b933b888a89255a50237d77))
* format package.json ([3747ff8](https://github.com/christophehurpeau/check-package-dependencies/commit/3747ff89a07c0e56e2600df08f057e75414627b8))

## [3.2.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.1.0...v3.2.0) (2022-02-06)


### Features

* add allowRangeVersionsInDependencies option ([fc5bc18](https://github.com/christophehurpeau/check-package-dependencies/commit/fc5bc189688f7bd2c3553825bfa862b2ef2f1dec))

## [3.1.0](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.0.2...v3.1.0) (2022-01-26)


### Features

* add option monorepoDirectDuplicateDependenciesOnlyWarnsFor ([0fa6149](https://github.com/christophehurpeau/check-package-dependencies/commit/0fa614935786cda310f2007a60833f642c981009))

### [3.0.2](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.0.1...v3.0.2) (2022-01-19)


### Bug Fixes

* beta in direct duplicate dependencies ([bab86e1](https://github.com/christophehurpeau/check-package-dependencies/commit/bab86e15ccf9a72fee48f0be0ae9bb074eb6fd09))

### [3.0.1](https://github.com/christophehurpeau/check-package-dependencies/compare/v3.0.0...v3.0.1) (2022-01-19)


### Bug Fixes

* supports prereleases ([8c49a05](https://github.com/christophehurpeau/check-package-dependencies/commit/8c49a05fa79697544b08f9dc06c329b757f2e4ae))

## [3.0.0](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v2.2.1...v3.0.0) (2021-12-11)


### ⚠ BREAKING CHANGES

* requires node 14

### Features

* drop node 12 ([ef56e15](https://www.github.com/christophehurpeau/check-package-dependencies/commit/ef56e1572d886d73c7e0fcc6698ef622463be7fc))


### Bug Fixes

* bin script ([736bad3](https://www.github.com/christophehurpeau/check-package-dependencies/commit/736bad37e65f664f1b77e9388681fe96f6d2f166))

### [2.2.1](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v2.2.0...v2.2.1) (2021-12-06)


### Bug Fixes

* build ([04ebf5f](https://www.github.com/christophehurpeau/check-package-dependencies/commit/04ebf5f4e506144023985c9d2190939137f8dd7a))

## [2.2.0](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v2.1.0...v2.2.0) (2021-12-06)


### Features

* allow to check identical version in other dep types ([e157111](https://www.github.com/christophehurpeau/check-package-dependencies/commit/e157111f5384b46c9d99d0ac8917f98b775dc975))

## [2.1.0](https://www.github.com/christophehurpeau/check-package-dependencies/compare/v2.0.2...v2.1.0) (2021-12-04)


### Features

* **deps:** update dependency type-fest to v2 ([#143](https://www.github.com/christophehurpeau/check-package-dependencies/issues/143)) ([faf6286](https://www.github.com/christophehurpeau/check-package-dependencies/commit/faf6286adf8646869b29fb03a9770ca86352e73e))

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
