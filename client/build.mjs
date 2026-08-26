import { build } from 'esbuild'

await build({
  entryPoints: ['client/index.js'],
  outfile: 'client/client.js',
  bundle: true,
  format: 'esm',
  external: ['react'],
  platform: 'browser',
  target: 'es2020',
  logLevel: 'info',
})

console.log('[dsh-desktop-pet] client built → client/client.js')
