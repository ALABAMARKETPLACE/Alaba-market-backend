const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const COLLECTION_FILES = [
  path.join(ROOT, "alaba-marketplace-postman-collection.json"),
  path.join(ROOT, "postman_collection.json"),
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function normalizePath(p) {
  if (!p) return "";
  let out = p.replace("{{baseUrl}}", "");
  out = out.split("?")[0] || "";
  out = out.replace(/\/+/g, "/");
  if (!out.startsWith("/")) out = `/${out}`;
  out = out.replace(/\/$/, "");
  return out || "/";
}

function extractControllerRoutes() {
  const controllerFiles = walk(SRC_DIR).filter((f) =>
    f.endsWith(".controller.ts"),
  );

  const routes = new Set();

  for (const file of controllerFiles) {
    const text = fs.readFileSync(file, "utf8");
    const controllerMatch = text.match(/@Controller\(([^)]*)\)/);
    const base = controllerMatch
      ? controllerMatch[1].replace(/["'\s]/g, "")
      : "";

    const routeRegex = /@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/g;
    let m;
    while ((m = routeRegex.exec(text))) {
      const method = m[1].toUpperCase();
      const segment = (m[2] || "").replace(/["'\s]/g, "");
      const full = normalizePath(`/${base}/${segment}`);
      routes.add(`${method} ${full}`);
    }
  }

  return routes;
}

function flattenRequests(items, acc = []) {
  for (const item of items || []) {
    if (Array.isArray(item.item)) {
      flattenRequests(item.item, acc);
      continue;
    }

    if (!item.request || !item.request.url) continue;

    const method = String(item.request.method || "GET").toUpperCase();
    const raw = String(item.request.url.raw || "");
    const route = normalizePath(raw);
    acc.push({ name: item.name || "", key: `${method} ${route}` });
  }

  return acc;
}

function run() {
  const routes = extractControllerRoutes();

  for (const file of COLLECTION_FILES) {
    if (!fs.existsSync(file)) continue;
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    const requests = flattenRequests(json.item || []);
    const missing = requests.filter((r) => !routes.has(r.key));

    console.log(
      `\n${path.basename(file)} => total=${requests.length}, missing=${
        missing.length
      }`,
    );
    for (const entry of missing.slice(0, 200)) {
      console.log(`${entry.key} :: ${entry.name}`);
    }
  }
}

run();
