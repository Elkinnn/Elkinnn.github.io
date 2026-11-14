import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(new URL('../assets/lab/',import.meta.url),{recursive:true});
await build({
  absWorkingDir:root,
  entryPoints:['scripts/lab/orbital.js'],
  outfile:'assets/lab/scene.js',
  bundle:true,minify:true,format:'esm',target:'es2022',legalComments:'eof'
});
const license=await readFile(new URL('../node_modules/three/LICENSE',import.meta.url),'utf8');
await writeFile(new URL('../assets/lab/THREE-LICENSE.txt',import.meta.url),license);
