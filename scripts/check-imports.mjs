// scripts/check-imports.mjs
import fs from 'fs';
import path from 'path';
import url from 'url';

const ROOT = process.cwd();
const exts = ['.js', '.mjs', '.cjs']; // ajustá si usás TS transp
const files = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // ignora node_modules, dist, build, .git
      if (['node_modules', 'dist', 'build', '.git'].includes(ent.name)) continue;
      walk(full);
    } else if (ent.isFile() && /\.(js|mjs|cjs)$/.test(ent.name)) {
      files.push(full);
    }
  }
}

function dirHasExactName(dir, name) {
  // devuelve true si en dir hay una entrada EXACTAMENTE igual a name (case-sensitive)
  try {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === name) return true;
    }
  } catch {
    return false;
  }
  return false;
}

function resolveWithCase(baseFile, spec) {
  // Solo chequea paths relativos
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null;

  const baseDir = path.dirname(baseFile);
  let target = path.resolve(baseDir, spec);

  // Si especificaron un archivo con extensión, validar casing exacto
  const hasExt = !!path.extname(target);
  if (hasExt) {
    const dir = path.dirname(target);
    const name = path.basename(target);
    const okDir = fs.existsSync(dir);
    const okName = okDir && dirHasExactName(dir, name);
    return okDir && okName ? null : { baseFile, spec, reason: 'file-case-or-missing' };
  } else {
    // Probar agregando extensiones
    for (const ext of exts) {
      const candidate = target + ext;
      const dir = path.dirname(candidate);
      const name = path.basename(candidate);
      if (fs.existsSync(dir) && dirHasExactName(dir, name)) return null;
    }
    // Probar index.* si es carpeta
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      for (const ext of exts) {
        const idx = path.join(target, 'index' + ext);
        const dir = path.dirname(idx);
        const name = path.basename(idx);
        if (fs.existsSync(dir) && dirHasExactName(dir, name)) return null;
      }
    }
    return { baseFile, spec, reason: 'missing-extension-or-file' };
  }
}

function extractImports(code) {
  const matches = [];
  // import ... from '...';
  const re1 = /import\s+[^'"]*['"]([^'"]+)['"]/g;
  // dynamic import('...')
  const re2 = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  // require('...') por si usás algo mezclado
  const re3 = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re1.exec(code))) matches.push(m[1]);
  while ((m = re2.exec(code))) matches.push(m[1]);
  while ((m = re3.exec(code))) matches.push(m[1]);
  return matches;
}

walk(ROOT);

const problems = [];
for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  const specs = extractImports(code);
  for (const spec of specs) {
    const res = resolveWithCase(f, spec);
    if (res) problems.push(res);
  }
}

if (problems.length === 0) {
  console.log('✅ No se encontraron imports problemáticos por case/extensión.');
} else {
  console.log('❌ Imports problemáticos encontrados:');
  for (const p of problems) {
    console.log(`- ${path.relative(ROOT, p.baseFile)} → '${p.spec}' (${p.reason})`);
  }
  process.exitCode = 1;
}
