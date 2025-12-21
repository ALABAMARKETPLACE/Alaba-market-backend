const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, '..', 'alaba-marketplace-postman-collection.json');

function sampleForResource(resource) {
  resource = (resource || '').toLowerCase();
  if (resource.includes('address')) return {
    fullname: 'John Doe',
    phone: '+2348012345678',
    street: '12 Example St',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    postalCode: '100001'
  };
  if (resource.includes('banner')) return { title: 'Spring Sale', imageUrl: 'https://example.com/banner.jpg', position: 1, status: 'active' };
  if (resource.includes('boost')) return { storeId: 123, productId: 456, days: 7, amount: 5000 };
  if (resource.includes('auth') || resource.includes('login')) return { email: 'user@example.com', password: 'P@ssw0rd' };
  if (resource.includes('user') || resource.includes('users')) return { name: 'Jane Customer', email: 'jane@example.com', password: 'P@ssw0rd', phone: '+2348012345678' };
  if (resource.includes('product') || resource.includes('products')) return { title: 'Sample Product', description: 'A short description', price: 2500, stock: 10, categoryId: 1 };
  if (resource.includes('order')) return { userId: 1, items: [{ productId: 1, quantity: 2 }], shippingAddressId: 1, paymentMethod: 'card' };
  if (resource.includes('wishlist')) return { userId: 1, productId: 123 };
  if (resource.includes('cart')) return { userId: 1, items: [{ productId: 1, quantity: 1 }] };
  // Generic fallback
  return { example: 'replace_with_actual_payload' };
}

function ensureJsonHeader(headers) {
  const has = headers && headers.find(h => (h.key || '').toLowerCase() === 'content-type');
  if (!has) {
    headers = headers || [];
    headers.push({ key: 'Content-Type', value: 'application/json' });
  }
  return headers;
}

function processItem(item, summary) {
  if (item.item && Array.isArray(item.item)) {
    item.item.forEach(child => processItem(child, summary));
    return;
  }
  const req = item.request;
  if (!req || !req.method) return;
  const method = (req.method || '').toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    // determine resource name from path
    let resource = null;
    try {
      const p = req.url && req.url.path;
      if (Array.isArray(p) && p.length > 0) resource = p[0];
    } catch (e) {}

    const sample = sampleForResource(resource);

    const hasBody = req.body && (req.body.raw && req.body.raw.trim() !== '' || (req.body.mode && req.body[req.body.mode]));
    if (!hasBody) {
      req.body = { mode: 'raw', raw: JSON.stringify(sample, null, 2) };
      req.header = ensureJsonHeader(req.header || req.header === null ? req.header : []);
      summary.updated += 1;
    }
  }
}

function main() {
  const raw = fs.readFileSync(collectionPath, 'utf8');
  const col = JSON.parse(raw);
  const summary = { updated: 0 };
  if (Array.isArray(col.item)) {
    col.item.forEach(it => processItem(it, summary));
  }

  fs.writeFileSync(collectionPath, JSON.stringify(col, null, 2), 'utf8');
  console.log('Updated Postman collection:', collectionPath);
  console.log('Request bodies added for', summary.updated, 'endpoints.');
}

main();
