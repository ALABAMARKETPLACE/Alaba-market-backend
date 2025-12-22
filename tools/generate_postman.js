const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

const files = walk(srcDir).filter(f => /\.controller\.ts$/.test(f));

const collection = {
  info: {
    name: "alaba-marketplace-server",
    _postman_id: "",
    description: "Auto-generated Postman collection (best-effort)",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [],
  variable: [
    { key: "baseUrl", value: "http://localhost:3000", type: "string" },
    { key: "authToken", value: "", type: "string" }
  ]
};

function parseControllerPath(src) {
  const controllerRegex = /@Controller\s*\(\s*(?:'([^']*)'|"([^\"]*)"|`([^`]*)`)?\s*\)/m;
  const m = src.match(controllerRegex);
  if (!m) return '';
  return m[1] || m[2] || m[3] || '';
}

function findMethods(src) {
  const lines = src.split(/\r?\n/);
  const methods = [];
  const decorators = ['Get','Post','Put','Delete','Patch','All','Options','Head'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const decMatch = line.match(/@([A-Za-z]+)\s*\((.*)\)/);
    if (decMatch && decorators.includes(decMatch[1])) {
      const http = decMatch[1].toUpperCase();
      // extract route argument if present
      let routeArg = '';
      const arg = decMatch[2].trim();
      if (arg) {
        const routeMatch = arg.match(/['"`]([^'"`]*)['"`]/);
        if (routeMatch) routeArg = routeMatch[1];
      }

      // find next few lines for method signature
      let methodName = '';
      for (let j = i + 1; j <= i + 6 && j < lines.length; j++) {
        const sig = lines[j].trim();
        // skip empty and decorator lines
        if (!sig || sig.startsWith('@')) continue;
        // try to extract name before parentheses
        const nameMatch = sig.match(/([a-zA-Z0-9_]+)\s*\(/);
        if (nameMatch) {
          methodName = nameMatch[1];
          break;
        }
      }
      methods.push({ http: http === 'ALL' ? 'ANY' : http, route: routeArg, methodName });
    }
  }
  return methods;
}

files.forEach(file => {
  const src = fs.readFileSync(file, 'utf8');
  const controllerPath = parseControllerPath(src);
  const methods = findMethods(src);
  if (!methods.length) return;

  const items = methods.map(m => {
    const routeParts = [];
    if (controllerPath) routeParts.push(controllerPath.replace(/^\/+|\/+$/g, ''));
    if (m.route) routeParts.push(m.route.replace(/^\/+|\/+$/g, ''));
    const fullPath = routeParts.join('/');
    const raw = '{{baseUrl}}' + (fullPath ? '/' + fullPath : '');
    const pathArray = fullPath ? fullPath.split('/').filter(Boolean) : [];
    const item = {
      name: `${m.http} /${controllerPath}${m.route ? '/' + m.route : ''}`,
      request: {
        method: m.http === 'ANY' ? 'GET' : m.http,
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{authToken}}' }
        ],
        url: { raw, host: ['{{baseUrl}}'], path: pathArray }
      }
    };

    // add sample body for write methods
    if (['POST','PUT','PATCH'].includes(item.request.method)) {
      item.request.body = {
        mode: 'raw',
        raw: JSON.stringify({ /* add fields as needed */ }, null, 2),
        options: { raw: { language: 'json' } }
      };
    }

    return item;
  });

  function uppercaseName(name) {
    if (!name) return '';
    name = name.replace(/\.controller\.ts$/i, '').replace(/\.ts$/i, '');
    return name.replace(/[\-_\/]+/g, ' ').toUpperCase();
  }

  const groupName = controllerPath && controllerPath.length ? uppercaseName(controllerPath) : uppercaseName(path.basename(file));
  collection.item.push({ name: groupName, item: items });
});

fs.writeFileSync(path.resolve(__dirname, '..', 'postman_collection.json'), JSON.stringify(collection, null, 2));
console.log('postman_collection.json written');
