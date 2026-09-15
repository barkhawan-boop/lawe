import { mkdir, copyFile, writeFile } from 'node:fs/promises';
await mkdir('vendor', { recursive: true });
await copyFile('node_modules/exceljs/dist/exceljs.min.js', 'vendor/exceljs.min.js');
await copyFile('node_modules/exceljs/LICENSE', 'vendor/exceljs.LICENSE');
await mkdir('dist/vendor', { recursive: true });
for (const file of ['index.html', 'styles.css', 'script.js', 'auth.js', 'export.js', 'assets/myapps-logo.jpg', 'vendor/exceljs.min.js', 'vendor/exceljs.LICENSE']) {
  await copyFile(file, `dist/${file}`);
}
// Production cannot fall back to browser-only authentication.
await writeFile('dist/auth-mode.js', 'window.LAWE_SERVER_AUTH = true;\n');
console.log('Cloudflare assets built in dist/');

