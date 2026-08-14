import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const VALID_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
]);

let filesAnalyzed = 0;
let importsAnalyzed = 0;
const errors = [];

/**
 * Obtiene todos los archivos JS del proyecto.
 */
function getJsFiles(dir) {
  const result = [];

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...getJsFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      VALID_EXTENSIONS.has(path.extname(entry.name))
    ) {
      result.push(fullPath);
    }
  }

  return result;
}


/**
 * Busca imports relativos:
 *
 * import x from "./archivo.js"
 * import "./archivo.js"
 * export x from "./archivo.js"
 * import("./archivo.js")
 */
function getRelativeImports(content) {
  const imports = [];

  const patterns = [
    /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const regex of patterns) {
    let match;

    while ((match = regex.exec(content)) !== null) {
      const importPath = match[1];

      if (
        importPath.startsWith("./") ||
        importPath.startsWith("../")
      ) {
        imports.push(importPath);
      }
    }
  }

  return [...new Set(imports)];
}


/**
 * Comprueba segmento por segmento que el nombre utilizado
 * coincida exactamente con el filesystem.
 *
 * Esto permite detectar:
 *
 * motorConceptos
 *
 * cuando realmente existe:
 *
 * motorconceptos
 */
function checkExactCase(absolutePath) {
  const relative = path.relative(ROOT, absolutePath);

  const segments = relative.split(path.sep);

  let current = ROOT;

  for (const segment of segments) {
    if (!fs.existsSync(current)) {
      return {
        valid: false,
        type: "missing",
      };
    }

    const entries = fs.readdirSync(current);

    const exact = entries.find(
      (entry) => entry === segment
    );

    if (exact) {
      current = path.join(current, exact);
      continue;
    }

    const insensitive = entries.find(
      (entry) =>
        entry.toLowerCase() === segment.toLowerCase()
    );

    if (insensitive) {
      return {
        valid: false,
        type: "case",
        expected: insensitive,
        received: segment,
        directory: current,
      };
    }

    return {
      valid: false,
      type: "missing",
      received: segment,
      directory: current,
    };
  }

  return {
    valid: true,
  };
}


/**
 * Resuelve imports teniendo en cuenta:
 *
 * ./archivo.js
 * ./archivo
 * ./carpeta
 */
function resolveImport(importingFile, importPath) {
  const base = path.resolve(
    path.dirname(importingFile),
    importPath
  );

  const candidates = [
    base,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.cjs`,
    path.join(base, "index.js"),
    path.join(base, "index.mjs"),
    path.join(base, "index.cjs"),
  ];

  for (const candidate of candidates) {
    const result = checkExactCase(candidate);

    if (result.valid) {
      return {
        found: true,
        path: candidate,
      };
    }

    if (result.type === "case") {
      return {
        found: false,
        caseError: result,
        attemptedPath: candidate,
      };
    }
  }

  return {
    found: false,
    missing: true,
    attemptedPath: base,
  };
}


console.log("");
console.log("========================================");
console.log("🔎 VERIFICANDO IMPORTS PARA LINUX");
console.log("========================================");
console.log("");


const files = getJsFiles(ROOT);

for (const file of files) {
  filesAnalyzed++;

  let content;

  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const imports = getRelativeImports(content);

  for (const importPath of imports) {
    importsAnalyzed++;

    const result = resolveImport(
      file,
      importPath
    );

    if (result.found) {
      continue;
    }

    const relativeFile = path.relative(
      ROOT,
      file
    );

    if (result.caseError) {
      errors.push({
        type: "CASE",
        file: relativeFile,
        importPath,
        received:
          result.caseError.received,
        expected:
          result.caseError.expected,
      });

      continue;
    }

    errors.push({
      type: "MISSING",
      file: relativeFile,
      importPath,
    });
  }
}


console.log(
  `📄 Archivos analizados: ${filesAnalyzed}`
);

console.log(
  `📦 Imports relativos analizados: ${importsAnalyzed}`
);

console.log("");


if (errors.length === 0) {

  console.log(
    "✅ Todos los imports son compatibles con Linux."
  );

  console.log("");

  process.exit(0);
}


console.log(
  `❌ Se encontraron ${errors.length} problema(s):`
);

console.log("");


errors.forEach((error, index) => {

  console.log(
    `----------------------------------------`
  );

  console.log(
    `${index + 1}. ${error.file}`
  );

  console.log("");

  console.log(
    `   Import: ${error.importPath}`
  );

  if (error.type === "CASE") {

    console.log("");
    console.log(
      "   ❌ Diferencia de mayúsculas/minúsculas"
    );

    console.log(
      `   Escrito: ${error.received}`
    );

    console.log(
      `   Real:    ${error.expected}`
    );

  } else {

    console.log("");
    console.log(
      "   ❌ El archivo o carpeta no existe"
    );
  }

  console.log("");
});


console.log(
  "========================================"
);

console.log(
  "❌ VERIFICACIÓN FALLIDA"
);

console.log(
  "Corregí estos imports antes de hacer deploy."
);

console.log(
  "========================================"
);

console.log("");

process.exit(1);