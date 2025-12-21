const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

function findControllers(srcDir) {
  return walk(srcDir).filter((f) => f.endsWith('.controller.ts'));
}

function findDtoFiles(srcDir) {
  return walk(srcDir).filter((f) => f.includes(path.sep + 'dto' + path.sep) && f.endsWith('.ts'));
}

function extractExportedClasses(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /export\s+class\s+(\w+)/g;
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push({ name: m[1], file: filePath, content });
  }
  return matches;
}

function buildDtoMap(srcDir) {
  const dtoFiles = findDtoFiles(srcDir);
  const map = {};
  dtoFiles.forEach((f) => {
    const classes = extractExportedClasses(f);
    classes.forEach((c) => {
      map[c.name] = { file: f, content: c.content };
    });
  });
  return map;
}

function buildServiceMap(srcDir) {
  const svcFiles = walk(srcDir).filter((f) => f.endsWith('.service.ts'));
  const map = {};
  svcFiles.forEach((f) => {
    const content = fs.readFileSync(f, 'utf8');
    const m = content.match(/export\s+class\s+(\w+Service)/);
    if (m) {
      map[m[1]] = { file: f, content };
    }
  });
  return map;
}

function parseDtoExample(dtoName, dtoMap, seen = new Set()) {
  if (!dtoMap[dtoName] || seen.has(dtoName)) return null;
  seen.add(dtoName);
  const content = dtoMap[dtoName].content;
  const clsRegex = new RegExp('export\\s+class\\s+' + dtoName + '\\s*\\{([\\s\\S]*?)\\n\\}', 'm');
  const m = content.match(clsRegex);
  const example = {};
  if (!m) return null;
  const body = m[1];
  const propRegex = /@?\w*\(?[^\n]*\)?\s*\n?\s*([a-zA-Z0-9_]+)\??\s*:\s*([^;\n]+);/g;
  let pm;
  while ((pm = propRegex.exec(body)) !== null) {
    const prop = pm[1];
    let type = pm[2].trim();
    // simplify union types and generics
    type = type.split('|')[0].trim();
    if (/string/.test(type)) example[prop] = "string";
    else if (/number|int|float|double/.test(type)) example[prop] = 0;
    else if (/boolean/.test(type)) example[prop] = true;
    else if (/Array<(.+)>/.test(type)) example[prop] = [];
    else if (/\[\]$/.test(type)) example[prop] = [];
    else if (/Record|Map|object|any/.test(type)) example[prop] = {};
    else if (dtoMap[type]) {
      const nested = parseDtoExample(type, dtoMap, seen);
      example[prop] = nested || {};
    } else {
      example[prop] = null;
    }
  }
  return example;
}

function extractEndpoints(controllerFile) {
  const content = fs.readFileSync(controllerFile, 'utf8');
  const controllerMatch = content.match(/@Controller\((?:'|")([^'"]+)(?:'|")\)/);
  const base = controllerMatch ? controllerMatch[1] : '';
  const endpointRegex = /@(Get|Post|Put|Delete|Patch)\((?:['\"]([^'\"]*)['\"])?\)[\s\S]*?\n\s*(?:public\s+|async\s+)?([a-zA-Z0-9_]+)\s*\(/g;
  const responsesRegex = /@Api(?:OkResponse|CreatedResponse|DataObjectResponse|DataArrayResponse)\(([^)]*)\)/g;
  const authRegex = /@UseGuards\(AuthGuard\)|@ApiBearerAuth\(|@Public\(|@Public\)/g;

  const endpoints = [];
  let m;
  while ((m = endpointRegex.exec(content)) !== null) {
    const httpMethod = m[1];
    const route = m[2] || '';
    const methodName = m[3];
    // find decorator block start (search backwards)
    const decoratorStart = content.lastIndexOf('@', m.index);
    const decoratorBlock = content.slice(decoratorStart, endpointRegex.lastIndex);
    // find response type in the nearby lines before method
    let respMatch;
    let responseType = null;
    const blockBefore = content.slice(Math.max(0, m.index - 300), m.index + 100);
    const respRegexLocal = /@Api(?:OkResponse|CreatedResponse|DataObjectResponse|DataArrayResponse)\(([^)]*)\)/g;
    while ((respMatch = respRegexLocal.exec(blockBefore)) !== null) {
      const inner = respMatch[1];
      // try to find type: Something or (Something)
      const typeMatch = inner.match(/type\s*:\s*([^,\}\)]+)/);
      if (typeMatch) {
        responseType = typeMatch[1].trim();
        responseType = responseType.replace(/\[|\]|new\s+|class\s+|typeof\s+|\{/g, '').trim();
      } else {
        // ApiDataObjectResponse(Something)
        const direct = inner.trim();
        if (/^[A-Za-z0-9_\.]+$/.test(direct)) responseType = direct;
        else {
          const parenMatch = blockBefore.match(/@ApiData(Object|Array)Response\(([^)]+)\)/);
          if (parenMatch) responseType = parenMatch[2].trim();
        }
      }
    }
    // find request body DTO in the method signature nearby
    const signatureArea = content.slice(m.index, m.index + 300);
    const bodyMatch = signatureArea.match(/@Body\([^\)]*\)\s*([a-zA-Z0-9_]+)\s*:\s*([A-Za-z0-9_<>\[\]]+)/);
    let requestType = null;
    if (bodyMatch) requestType = bodyMatch[2];
    // check auth
    const auth = /@UseGuards\(AuthGuard\)|@ApiBearerAuth\(|@Public\(|@Public\)/.test(blockBefore);

    endpoints.push({ method: httpMethod, route: path.posix.join('/', base, route), controller: controllerFile, methodName, requestType, responseType, auth });
  }
  return endpoints;
}

function findServiceCallInController(controllerFile, handlerName) {
  const content = fs.readFileSync(controllerFile, 'utf8');
  // find method block for handlerName
  const methodRegex = new RegExp(handlerName + '\\s*\\([^\\)]*\\)\\s*\\{([\\s\\S]*?)\\n\\s*\\}', 'm');
  const m = content.match(methodRegex);
  if (!m) return null;
  const body = m[1];
  // look for this.<serviceVar>.<methodName>(
  const callMatch = body.match(/this\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\(/);
  if (!callMatch) return null;
  return { serviceVar: callMatch[1], serviceMethod: callMatch[2] };
}

function resolveServiceClassFromController(controllerFile, serviceVar) {
  const content = fs.readFileSync(controllerFile, 'utf8');
  // look in constructor for ': ServiceClass' or types for the variable
  const ctorRegex = /constructor\s*\([^\)]*\)\s*\{/m;
  const ctorMatch = content.match(ctorRegex);
  let searchArea = content;
  if (ctorMatch) {
    const start = content.indexOf('constructor');
    const end = content.indexOf('}', start);
    searchArea = content.slice(start, end + 1);
  }
  const varRegex = new RegExp(serviceVar + '\\s*:\\s*([A-Za-z0-9_]+)');
  const vm = searchArea.match(varRegex);
  if (vm) return vm[1];
  return null;
}

async function generateDoc(endpoints, dtoMap, outPath) {
  // Build a minimal, clean sections array: each endpoint -> heading + request example + response example
  const sections = [];
  sections.push({
    properties: {},
    children: [
      new Paragraph({ text: 'API Endpoints (concise)', heading: HeadingLevel.TITLE }),
      new Paragraph({ text: `Generated: ${new Date().toISOString()}` }),
      new Paragraph({ text: '' }),
    ],
  });

  function cleanTypeName(t) {
    if (!t) return null;
    return t.replace(/[^A-Za-z0-9_]/g, '').trim();
  }

  endpoints.forEach((ep) => {
    const children = [];
    // Heading: METHOD PATH
    children.push(new Paragraph({ text: `${ep.method} ${ep.route}`, heading: HeadingLevel.HEADING_2 }));

    // Request example
    let reqExample = '—';
    if (ep.requestType) {
      const cleaned = cleanTypeName(ep.requestType);
      const ex = dtoMap[cleaned] ? parseDtoExample(cleaned, dtoMap) : null;
      if (ex) reqExample = JSON.stringify(ex, null, 2);
    }
    children.push(new Paragraph({ text: 'Request Example:' }));
    children.push(new Paragraph({ text: reqExample }));

    // Response example: prefer service-returned object literal when available
    let resExample = '—';
    if (ep.serviceFile && ep.serviceMethod) {
      try {
        const svcContent = fs.readFileSync(ep.serviceFile, 'utf8');
        const methodRegex = new RegExp(ep.serviceMethod + '\\s*\\([^\\)]*\\)\\s*\\{([\\s\\S]*?)\\n\\s*\\}', 'm');
        const mm = svcContent.match(methodRegex);
        if (mm) {
          const svcBody = mm[1];
          const returnObj = svcBody.match(/return\s+({[\s\S]*?})\s*;/m);
          if (returnObj) {
            resExample = returnObj[1];
          }
        }
      } catch (e) {
        // fallback to DTO
      }
    }
    if ((resExample === '—' || !resExample) && ep.responseType) {
      const cleaned = cleanTypeName(ep.responseType);
      const ex = dtoMap[cleaned] ? parseDtoExample(cleaned, dtoMap) : null;
      if (ex) resExample = JSON.stringify(ex, null, 2);
    }
    children.push(new Paragraph({ text: 'Response Example:' }));
    children.push(new Paragraph({ text: resExample }));

    // blank line
    children.push(new Paragraph({ text: '' }));
    sections.push({ children });
  });

  const doc = new Document({
    creator: 'API Doc Generator',
    title: 'API Endpoints',
    sections,
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
}

(async function main(){
  const srcDir = path.join(__dirname, '..', 'src');
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found');
    process.exit(1);
  }
  const dtoMap = buildDtoMap(srcDir);
  const serviceMap = buildServiceMap(srcDir);
  const controllerFiles = findControllers(srcDir);
  const allEndpoints = [];
  controllerFiles.forEach((cf) => {
    const eps = extractEndpoints(cf);
    allEndpoints.push(...eps);
  });
  // sort endpoints
  allEndpoints.sort((a,b) => (a.route > b.route?1:-1));
  const outPath = path.join(__dirname, '..', 'API_DOCUMENTATION.docx');
  // augment endpoints with service method info when possible
  const augmented = allEndpoints.map((ep) => {
    try {
      const call = findServiceCallInController(ep.controller, ep.methodName);
      if (call) {
        const svcClass = resolveServiceClassFromController(ep.controller, call.serviceVar);
        ep.serviceVar = call.serviceVar;
        ep.serviceMethod = call.serviceMethod;
        ep.serviceClass = svcClass;
        if (svcClass && serviceMap[svcClass]) {
          ep.serviceFile = serviceMap[svcClass].file;
          ep.serviceContent = serviceMap[svcClass].content;
        }
      }
    } catch (e) {
      // ignore
    }
    return ep;
  });

  await generateDoc(augmented, dtoMap, outPath);
  console.log('API documentation generated at', outPath);
})();
