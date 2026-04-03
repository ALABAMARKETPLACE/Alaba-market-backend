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

function normalizeLiteralPath(p) {
  let out = String(p || "").replace("{{baseUrl}}", "");
  out = out.split("?")[0] || "";
  out = out.replace(/\/+/g, "/");
  if (!out.startsWith("/")) out = `/${out}`;
  out = out.replace(/\/$/, "");
  return out || "/";
}

function toPattern(pathValue) {
  const normalized = normalizeLiteralPath(pathValue);
  return normalized
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (/^:/.test(segment)) return "[^/]+";
      if (/^\{\{.+\}\}$/.test(segment)) return "[^/]+";
      if (/^\d+$/.test(segment)) return "[^/]+";
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
}

function extractControllerRoutes() {
  const controllerFiles = walk(SRC_DIR).filter((f) =>
    f.endsWith(".controller.ts"),
  );
  const routes = [];

  for (const file of controllerFiles) {
    const text = fs.readFileSync(file, "utf8");
    const cm = text.match(/@Controller\(([^)]*)\)/);
    const base = cm ? cm[1].replace(/["'\s]/g, "") : "";
    const rx = /@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/g;
    let m;
    while ((m = rx.exec(text))) {
      const method = m[1].toUpperCase();
      const seg = (m[2] || "").replace(/["'\s]/g, "");
      const full = normalizeLiteralPath(`/${base}/${seg}`);
      routes.push({
        method,
        path: full,
        regex: new RegExp(`^${toPattern(full)}$`),
      });
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
    acc.push({
      name: item.name || "",
      method: String(item.request.method || "GET").toUpperCase(),
      path: normalizeLiteralPath(item.request.url.raw || ""),
    });
  }
  return acc;
}

const routes = extractControllerRoutes();
for (const file of COLLECTION_FILES) {
  if (!fs.existsSync(file)) continue;
  const collection = JSON.parse(fs.readFileSync(file, "utf8"));
  const requests = flattenRequests(collection.item || []);
  const missing = requests.filter(
    (req) =>
      !routes.some(
        (route) => route.method === req.method && route.regex.test(req.path),
      ),
  );
  console.log(
    `\n${path.basename(file)} => total=${requests.length}, missing=${
      missing.length
    }`,
  );
  missing
    .slice(0, 200)
    .forEach((entry) =>
      console.log(`${entry.method} ${entry.path} :: ${entry.name}`),
    );
}
