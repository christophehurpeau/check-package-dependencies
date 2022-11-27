import { fileURLToPath } from 'url';
import createRollupConfig from 'pob-babel/createRollupConfig.js';

export default createRollupConfig({
  cwd: fileURLToPath(new URL('.', import.meta.url)),
});
