import createRollupConfig from 'pob-babel/createRollupConfig.js';

export default createRollupConfig({
  cwd: new URL('.', import.meta.url).pathname.slice(
    process.platform === 'win32' ? 1 : 0,
  ),
});
