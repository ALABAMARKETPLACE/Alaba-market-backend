const fs = require("fs");
const path = require("path");

const collectionPaths = [
  path.join(__dirname, "..", "alaba-marketplace-postman-collection.json"),
  path.join(__dirname, "..", "postman_collection.json"),
];
const DEFAULT_EMAIL = "olagiddz@gmail.com";

const collectionVariables = [
  { key: "baseUrl", value: "http://localhost:8000", type: "string" },
  { key: "authToken", value: "", type: "string" },
  { key: "refreshToken", value: "", type: "string" },
  { key: "userId", value: "1", type: "number" },
  { key: "managedUserId", value: "1", type: "number" },
  { key: "userEmail", value: DEFAULT_EMAIL, type: "string" },
  { key: "activeRole", value: "user", type: "string" },
  { key: "storeId", value: "1", type: "number" },
  { key: "orderId", value: "1", type: "number" },
  { key: "productId", value: "1", type: "number" },
  { key: "variantId", value: "1", type: "number" },
  { key: "addressId", value: "1", type: "number" },
  { key: "deliveryToken", value: "", type: "string" },
  { key: "paymentReference", value: "", type: "string" },
  { key: "reconcileReference", value: "", type: "string" },
  { key: "guestEmail", value: DEFAULT_EMAIL, type: "string" },
  { key: "paystackStatus", value: "", type: "string" },
  { key: "paystackCustomerEmail", value: "", type: "string" },
  { key: "paystackAuthUrl", value: "", type: "string" },
  { key: "paystackAmountKobo", value: "", type: "string" },
  { key: "enquiryId", value: "1", type: "number" },
  { key: "paystackSignature", value: "", type: "string" },
  { key: "orderPublicId", value: "", type: "string" },
  { key: "categoryId", value: "1", type: "number" },
  { key: "subCategoryId", value: "1", type: "number" },
  { key: "storeSlug", value: "", type: "string" },
  { key: "productPid", value: "", type: "string" },
];

function sampleForResource(resource) {
  resource = (resource || "").toLowerCase();
  if (resource.includes("address")) {
    return {
      fullname: "John Doe",
      phone: "+2348012345678",
      street: "12 Example St",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      postalCode: "100001",
    };
  }
  if (resource.includes("banner")) {
    return {
      title: "Spring Sale",
      imageUrl: "https://example.com/banner.jpg",
      position: 1,
      status: "active",
    };
  }
  if (resource.includes("boost")) {
    return { storeId: 123, productId: 456, days: 7, amount: 5000 };
  }
  if (resource.includes("auth") || resource.includes("login")) {
    return { email: DEFAULT_EMAIL, password: "P@ssw0rd" };
  }
  if (resource.includes("user") || resource.includes("users")) {
    return {
      name: "Jane Customer",
      email: DEFAULT_EMAIL,
      password: "P@ssw0rd",
      phone: "+2348012345678",
    };
  }
  if (resource.includes("product") || resource.includes("products")) {
    return {
      title: "Sample Product",
      description: "A short description",
      price: 2500,
      stock: 10,
      categoryId: 1,
    };
  }
  if (resource.includes("order")) {
    return {
      userId: 1,
      items: [{ productId: 1, quantity: 2 }],
      shippingAddressId: 1,
      paymentMethod: "card",
    };
  }
  if (resource.includes("wishlist")) return { userId: 1, productId: 123 };
  if (resource.includes("cart")) {
    return { userId: 1, items: [{ productId: 1, quantity: 1 }] };
  }
  return { example: "replace_with_actual_payload" };
}

function ensureJsonHeader(headers) {
  const list = Array.isArray(headers) ? headers : [];
  const has = list.find(
    (header) => (header.key || "").toLowerCase() === "content-type",
  );
  if (!has) {
    list.push({ key: "Content-Type", value: "application/json" });
  }
  return list;
}

function processItem(item, summary) {
  if (item.item && Array.isArray(item.item)) {
    item.item.forEach((child) => processItem(child, summary));
    return;
  }

  const req = item.request;
  if (!req || !req.method) return;

  const method = (req.method || "").toUpperCase();
  if (!["POST", "PUT", "PATCH"].includes(method)) return;

  let resource = null;
  try {
    const p = req.url && req.url.path;
    if (Array.isArray(p) && p.length > 0) {
      resource = p[0];
    }
  } catch (error) {}

  const sample = sampleForResource(resource);
  const hasBody =
    req.body &&
    ((req.body.raw && req.body.raw.trim() !== "") ||
      (req.body.mode && req.body[req.body.mode]));

  if (!hasBody) {
    req.body = { mode: "raw", raw: JSON.stringify(sample, null, 2) };
    req.header = ensureJsonHeader(req.header);
    summary.updatedBodies += 1;
  }
}

function upsertCollectionVariables(collection) {
  collection.variable = Array.isArray(collection.variable)
    ? collection.variable
    : [];

  for (const variable of collectionVariables) {
    const existing = collection.variable.find(
      (entry) => entry.key === variable.key,
    );
    if (existing) {
      existing.type = variable.type;
      if (
        existing.value == null ||
        variable.key === "userEmail" ||
        variable.key === "guestEmail"
      ) {
        existing.value = variable.value;
      }
      continue;
    }

    collection.variable.push({
      id: variable.key,
      key: variable.key,
      type: variable.type,
      value: variable.value,
      enabled: true,
    });
  }
}

function replaceInString(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replaceAll("user@example.com", "{{userEmail}}")
    .replaceAll("jane@example.com", "{{userEmail}}")
    .replaceAll("newemail@example.com", "{{userEmail}}")
    .replaceAll("guest@example.com", "{{guestEmail}}");
}

function normalizeEmailsInRequest(request) {
  if (!request) {
    return;
  }

  if (request.url) {
    request.url.raw = replaceInString(request.url.raw);
    if (Array.isArray(request.url.path)) {
      request.url.path = request.url.path.map((segment) =>
        replaceInString(segment),
      );
    }
    if (Array.isArray(request.url.query)) {
      request.url.query = request.url.query.map((query) => ({
        ...query,
        key: replaceInString(query.key),
        value: replaceInString(query.value),
      }));
    }
  }

  if (request.body?.raw) {
    request.body.raw = replaceInString(request.body.raw);
  }
}

function findGroup(collection, name) {
  return (collection.item || []).find((entry) => entry.name === name);
}

function findFirstGroup(collection, names = []) {
  for (const name of names) {
    const group = findGroup(collection, name);
    if (group) {
      return group;
    }
  }

  return null;
}

function findRequest(group, name) {
  return (group?.item || []).find((entry) => entry.name === name);
}

function upsertRequest(group, requestItem) {
  const existing = findRequest(group, requestItem.name);
  if (existing) {
    existing.request = requestItem.request;
    existing.response = requestItem.response || [];
    return existing;
  }

  group.item = Array.isArray(group.item) ? group.item : [];
  group.item.push(requestItem);
  return requestItem;
}

function upsertTestScript(item, scriptLines) {
  item.event = Array.isArray(item.event) ? item.event : [];
  const existing = item.event.find((entry) => entry.listen === "test");
  const script = {
    listen: "test",
    script: {
      type: "text/javascript",
      exec: scriptLines,
    },
  };

  if (existing) {
    existing.script = script.script;
  } else {
    item.event.push(script);
  }
}

function safeJsonLines() {
  return [
    "let json = null;",
    "try {",
    "  json = pm.response.json();",
    "} catch (error) {",
    "  console.log('Response is not valid JSON', error);",
    "}",
    "if (json) {",
  ];
}

function closingJsonGuardLines() {
  return ["}"];
}

function buildContextualScript(pathSegments = [], requestName = "") {
  const resource = String(pathSegments[0] || "").toLowerCase();
  const requestLabel = String(requestName || "").toLowerCase();
  const isAuthLike = resource === "auth";
  const isUserLike = resource === "user" || resource === "users";
  const isStoreLike = resource === "coorporate_store";
  const isProductLike = resource === "products";
  const isOrderLike = resource === "order";
  const isAddressLike = resource === "address";
  const isPaystackLike = resource === "paystack";
  const isCategoryLike = resource === "category";
  const isSubCategoryLike = resource === "sub_category";
  const isProductSearchLike = resource === "product_search";
  const isEnquiryLike = resource === "enquiry";
  const isPaystackReconcile =
    isPaystackLike && requestLabel.includes("transactions/reconcile");
  const isPaystackReconciliation =
    isPaystackLike && requestLabel.includes("/reconciliation/");

  const script = [
    ...safeJsonLines(),
    "  const setIf = (key, value) => {",
    "    if (value !== undefined && value !== null && value !== '') {",
    "      const normalized = String(value);",
    "      pm.collectionVariables.set(key, normalized);",
    "      if (pm.environment) {",
    "        pm.environment.set(key, normalized);",
    "      }",
    "    }",
    "  };",
    "  const data = json?.data ?? json;",
    "  const rows = Array.isArray(data?.rows) ? data.rows : [];",
    "  const results = Array.isArray(data?.results) ? data.results : [];",
    "  const nestedList = Array.isArray(data?.data) ? data.data : [];",
    "  const list = Array.isArray(data) ? data : (rows.length ? rows : (results.length ? results : nestedList));",
    "  const first = list[0] || data?.newOrder || data?.order || data?.store || data?.product || data?.user || data || {};",
    "  const order = first?.newOrder || first?.order || data?.newOrder || data?.order || null;",
    "  const payment = order?.payment || order?.orderPayment || first?.payment || data?.payment || data?.orderPayment || null;",
    "  const store = first?.store || first?.storeDetails || data?.store || data?.storeDetails || null;",
    "  const user = data?.user || first?.user || first;",
    "  const product = first?.product || data?.product || first;",
    "  const address = first?.address || data?.address || first;",
    "  const category = first?.category || data?.category || first;",
    "  const subCategory = first?.subCategory || first?.subcategory || data?.subCategory || data?.subcategory || first;",
    "  const enquiry = data?.enquiry || first?.enquiry || first;",
    "  const firstVariant = Array.isArray(product?.variants) ? product.variants[0] : (Array.isArray(first?.variants) ? first.variants[0] : null);",
    "  const reconcile = results.find((entry) => entry?.action === 'missing' || entry?.action === 'failed' || entry?.action === 'skipped') || results[0] || null;",
  ];

  if (isAuthLike || isUserLike) {
    script.push(
      "  const resolvedAuthToken = json?.token || data?.token || json?.accessToken || data?.accessToken || json?.access_token || data?.access_token || json?.jwt || data?.jwt || data?.access?.token || json?.access?.token;",
      "  const resolvedRefreshToken = json?.refreshToken || data?.refreshToken || json?.refresh_token || data?.refresh_token || data?.refresh?.token || json?.refresh?.token;",
      "  setIf('authToken', resolvedAuthToken);",
      "  setIf('refreshToken', resolvedRefreshToken);",
      "  setIf('userId', user?._id || user?.id || data?._id || data?.id);",
      "  setIf('managedUserId', user?._id || user?.id || data?._id || data?.id);",
      "  setIf('userEmail', user?.email || data?.email || data?.profile?.email || json?.profile?.email);",
      "  setIf('storeId', user?.store_id || user?.storeId || data?.store_id || data?.storeId);",
      "  setIf('activeRole', user?.active_role || user?.role || data?.active_role || data?.role || data?.activeRole || user?.activeRole);",
    );
  }

  if (isStoreLike) {
    script.push(
      "  setIf('storeId', store?.id || store?._id || data?.id || data?._id);",
      "  setIf('storeSlug', store?.slug || data?.slug || first?.slug);",
    );
  }

  if (isProductLike || isProductSearchLike) {
    script.push(
      "  setIf('productId', product?._id || product?.id || product?.productId || data?._id || data?.id);",
      "  setIf('productPid', product?.pid || product?._id || product?.id);",
      "  setIf('storeId', product?.store_id || product?.storeId || store?.id || data?.store_id || data?.storeId);",
      "  setIf('storeSlug', store?.slug || first?.slug || data?.slug);",
      "  setIf('categoryId', product?.category || product?.categoryId || category?.id || category?._id || data?.category || data?.categoryId);",
      "  setIf('subCategoryId', product?.subCategory || product?.subCategoryId || subCategory?.id || subCategory?._id || data?.subCategory || data?.subCategoryId);",
      "  setIf('variantId', firstVariant?.id || firstVariant?._id || product?.variantId || first?.variantId);",
    );
  }

  if (isAddressLike) {
    script.push(
      "  setIf('addressId', address?.id || address?._id || data?.id || data?.addressId);",
    );
  }

  if (isOrderLike) {
    script.push(
      "  const orderCandidate = order || first;",
      "  setIf('orderId', orderCandidate?.id || data?.id);",
      "  setIf('orderPublicId', orderCandidate?.order_id || data?.order_id);",
      "  setIf('paymentReference', payment?.ref || orderCandidate?.payment_reference || orderCandidate?.transaction_reference);",
      "  setIf('reconcileReference', payment?.ref || orderCandidate?.payment_reference || orderCandidate?.transaction_reference);",
      "  setIf('guestEmail', orderCandidate?.guest_email || data?.email);",
      "  setIf('storeId', orderCandidate?.storeId || store?.id || data?.storeId);",
    );
  }

  if (isPaystackLike) {
    if (isPaystackReconcile) {
      script.push(
        "  setIf('paymentReference', reconcile?.reference);",
        "  setIf('reconcileReference', reconcile?.reference);",
        "  setIf('paystackStatus', reconcile?.paystack_status);",
        "  setIf('paystackCustomerEmail', reconcile?.customer_email);",
        "  setIf('paystackAmountKobo', reconcile?.amount_kobo);",
      );
    } else {
      script.push(
        "  const paystackReference = data?.reference || json?.reference || payment?.ref;",
        "  setIf('paymentReference', paystackReference);",
        "  setIf('reconcileReference', paystackReference);",
        "  setIf('paystackAuthUrl', data?.authorization_url || json?.authorization_url);",
        "  setIf('paystackStatus', data?.status || json?.status);",
        "  setIf('paystackCustomerEmail', data?.customer?.email || data?.authorization?.email);",
        "  setIf('paystackAmountKobo', data?.amount || json?.amount);",
        "  setIf('guestEmail', data?.customer?.email || data?.authorization?.email || first?.guest_email);",
      );
    }
  }

  if (isCategoryLike) {
    script.push(
      "  setIf('categoryId', category?.id || category?._id || data?.id || data?.categoryId);",
    );
  }

  if (isSubCategoryLike) {
    script.push(
      "  setIf('subCategoryId', subCategory?.id || subCategory?._id || data?.id || data?.subCategoryId);",
      "  setIf('categoryId', subCategory?.category || subCategory?.categoryId || data?.category || data?.categoryId);",
    );
  }

  if (isEnquiryLike) {
    script.push(
      "  setIf('enquiryId', enquiry?.id || enquiry?._id || data?.id);",
    );
  }

  if (isPaystackReconciliation) {
    script.push(
      "  pm.test('Status code is 200', function () {",
      "    pm.response.to.have.status(200);",
      "  });",
    );

    if (requestLabel.includes("orphaned-payments")) {
      script.push(
        "  pm.test('Reconciliation has orphanedCount', function () {",
        "    pm.expect(data).to.have.property('orphanedCount');",
        "  });",
      );
    }

    if (requestLabel.includes("orphaned-guest-checkout")) {
      script.push(
        "  pm.test('Guest reconciliation has unprocessedCheckoutCount', function () {",
        "    pm.expect(data).to.have.property('unprocessedCheckoutCount');",
        "  });",
      );
    }

    if (requestLabel.includes("full-report")) {
      script.push(
        "  pm.test('Full report has summary', function () {",
        "    pm.expect(data).to.have.property('summary');",
        "  });",
        "  pm.test('Full report has orderDetails', function () {",
        "    pm.expect(data).to.have.property('details');",
        "    pm.expect(data.details).to.have.property('orderDetails');",
        "  });",
      );
    }

    if (requestLabel.includes("audit-mismatches")) {
      script.push(
        "  pm.test('Audit response has summary', function () {",
        "    pm.expect(data).to.have.property('summary');",
        "  });",
      );
    }
  }

  script.push(...closingJsonGuardLines());
  return script;
}

function walkRequests(items, callback, trail = []) {
  for (const item of items || []) {
    if (Array.isArray(item.item)) {
      walkRequests(item.item, callback, [...trail, item.name]);
      continue;
    }

    callback(item, trail);
  }
}

function ensurePaystackReconcileRequest(collection) {
  const paymentsGroup = findFirstGroup(collection, ["💳 Payments", "PAYSTACK"]);
  if (!paymentsGroup) {
    return;
  }

  const item = upsertRequest(paymentsGroup, {
    name: "POST /paystack/transactions/reconcile",
    request: {
      method: "POST",
      header: [
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer {{authToken}}" },
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify(
          {
            dryRun: true,
            status: "success",
            page: 1,
            perPage: 50,
            maxPages: 1,
          },
          null,
          2,
        ),
      },
      url: {
        raw: "{{baseUrl}}/paystack/transactions/reconcile",
        host: ["{{baseUrl}}"],
        path: ["paystack", "transactions", "reconcile"],
      },
      description:
        "Admin-only reconciliation for historical Paystack transactions. Run with dryRun=true first, then set dryRun=false to replay reconcilable entries through the existing webhook sync flow.",
    },
    response: [],
  });
}

function ensurePaystackReconciliationRequests(collection) {
  const paymentsGroup = findFirstGroup(collection, ["💳 Payments", "PAYSTACK"]);
  if (!paymentsGroup) {
    return;
  }

  const folderName = "🧾 Paystack Reconciliation";
  const requestNames = [
    "GET /paystack/reconciliation/orphaned-payments",
    "GET /paystack/reconciliation/orphaned-guest-checkout",
    "GET /paystack/reconciliation/full-report",
    "GET /paystack/reconciliation/audit-mismatches",
  ];

  paymentsGroup.item = Array.isArray(paymentsGroup.item)
    ? paymentsGroup.item
    : [];
  let reconcileFolder = paymentsGroup.item.find(
    (entry) => entry?.name === folderName && Array.isArray(entry?.item),
  );

  if (!reconcileFolder) {
    reconcileFolder = { name: folderName, item: [] };
    paymentsGroup.item.push(reconcileFolder);
  }

  paymentsGroup.item = paymentsGroup.item.filter(
    (entry) =>
      entry?.name === folderName || !requestNames.includes(entry?.name),
  );

  const authHeaders = [
    { key: "Content-Type", value: "application/json" },
    { key: "Authorization", value: "Bearer {{authToken}}" },
  ];

  const orphanedPaymentsRequest = upsertRequest(reconcileFolder, {
    name: "GET /paystack/reconciliation/orphaned-payments",
    request: {
      method: "GET",
      header: authHeaders,
      url: {
        raw: "{{baseUrl}}/paystack/reconciliation/orphaned-payments",
        host: ["{{baseUrl}}"],
        path: ["paystack", "reconciliation", "orphaned-payments"],
      },
      description:
        "Admin-only endpoint for successful online payments that are not linked to valid orders.",
    },
    response: [],
  });
  upsertTestScript(orphanedPaymentsRequest, [
    "pm.test('Status code is 200', function () {",
    "  pm.response.to.have.status(200);",
    "});",
    "const json = pm.response.json();",
    "pm.test('Response has orphanedCount', function () {",
    "  pm.expect(json).to.have.property('data');",
    "  pm.expect(json.data).to.have.property('orphanedCount');",
    "});",
  ]);

  const orphanedGuestRequest = upsertRequest(reconcileFolder, {
    name: "GET /paystack/reconciliation/orphaned-guest-checkout",
    request: {
      method: "GET",
      header: authHeaders,
      url: {
        raw: "{{baseUrl}}/paystack/reconciliation/orphaned-guest-checkout",
        host: ["{{baseUrl}}"],
        path: ["paystack", "reconciliation", "orphaned-guest-checkout"],
      },
      description:
        "Admin-only endpoint to find guest checkouts marked paid but not completed.",
    },
    response: [],
  });
  upsertTestScript(orphanedGuestRequest, [
    "pm.test('Status code is 200', function () {",
    "  pm.response.to.have.status(200);",
    "});",
    "const json = pm.response.json();",
    "pm.test('Response has unprocessedCheckoutCount', function () {",
    "  pm.expect(json).to.have.property('data');",
    "  pm.expect(json.data).to.have.property('unprocessedCheckoutCount');",
    "});",
  ]);

  const fullReportRequest = upsertRequest(reconcileFolder, {
    name: "GET /paystack/reconciliation/full-report",
    request: {
      method: "GET",
      header: authHeaders,
      url: {
        raw: "{{baseUrl}}/paystack/reconciliation/full-report?page=1&take=50",
        host: ["{{baseUrl}}"],
        path: ["paystack", "reconciliation", "full-report"],
        query: [
          { key: "page", value: "1" },
          { key: "take", value: "50" },
        ],
      },
      description:
        "Admin-only endpoint that returns a consolidated paystack reconciliation report. Supports pagination via page and take query params.",
    },
    response: [],
  });
  upsertTestScript(fullReportRequest, [
    "pm.test('Status code is 200', function () {",
    "  pm.response.to.have.status(200);",
    "});",
    "const json = pm.response.json();",
    "pm.test('Response has summary block', function () {",
    "  pm.expect(json).to.have.property('data');",
    "  pm.expect(json.data).to.have.property('summary');",
    "});",
  ]);

  const auditRequest = upsertRequest(reconcileFolder, {
    name: "GET /paystack/reconciliation/audit-mismatches",
    request: {
      method: "GET",
      header: authHeaders,
      url: {
        raw: "{{baseUrl}}/paystack/reconciliation/audit-mismatches",
        host: ["{{baseUrl}}"],
        path: ["paystack", "reconciliation", "audit-mismatches"],
      },
      description:
        "Admin-only endpoint to audit mismatches between ORDER and ORDER_PAYMENTS records.",
    },
    response: [],
  });
  upsertTestScript(auditRequest, [
    "pm.test('Status code is 200', function () {",
    "  pm.response.to.have.status(200);",
    "});",
    "const json = pm.response.json();",
    "pm.test('Response has summary mismatches', function () {",
    "  pm.expect(json).to.have.property('data');",
    "  pm.expect(json.data).to.have.property('summary');",
    "});",
  ]);
}

function ensureUserManagementRoleRequests(collection) {
  const userGroup = findGroup(collection, "👤 User Management");
  if (!userGroup) {
    return;
  }

  upsertRequest(userGroup, {
    name: "PATCH /users/me/active-role",
    request: {
      method: "PATCH",
      header: [
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer {{authToken}}" },
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify(
          {
            role: "seller",
          },
          null,
          2,
        ),
      },
      url: {
        raw: "{{baseUrl}}/users/me/active-role",
        host: ["{{baseUrl}}"],
        path: ["users", "me", "active-role"],
      },
      description:
        "Switch the authenticated user's active role. Allowed values are buyer, seller, or admin.",
    },
    response: [],
  });

  upsertRequest(userGroup, {
    name: "POST /users/upgrade-to-seller",
    request: {
      method: "POST",
      header: [
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer {{authToken}}" },
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify(
          {
            business_address: "12 Alaba Market Road, Ojo, Lagos",
            trn_number: "TRN-123456",
            trade_lisc_no: "TL-654321",
            id_proof: "https://example.com/id-proof.jpg",
            store_name: "My Seller Store",
            trn_upload: "https://example.com/trn-upload.jpg",
            lat: 6.465422,
            long: 3.406448,
            business_types: [1],
            business_name: "My Seller Profile",
          },
          null,
          2,
        ),
      },
      url: {
        raw: "{{baseUrl}}/users/upgrade-to-seller",
        host: ["{{baseUrl}}"],
        path: ["users", "upgrade-to-seller"],
      },
      description:
        "Upgrade the authenticated user to seller. Use this before switching active role to seller if the account does not already have seller access.",
    },
    response: [],
  });

  upsertRequest(userGroup, {
    name: "POST /users/downgrade-to-buyer",
    request: {
      method: "POST",
      header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
      url: {
        raw: "{{baseUrl}}/users/downgrade-to-buyer",
        host: ["{{baseUrl}}"],
        path: ["users", "downgrade-to-buyer"],
      },
      description:
        "Downgrade the authenticated user back to buyer-only access.",
    },
    response: [],
  });

  upsertRequest(userGroup, {
    name: "PATCH /users/:id/assign-admin",
    request: {
      method: "PATCH",
      header: [
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer {{authToken}}" },
      ],
      body: {
        mode: "raw",
        raw: JSON.stringify(
          {
            make_active_role: true,
          },
          null,
          2,
        ),
      },
      url: {
        raw: "{{baseUrl}}/users/{{managedUserId}}/assign-admin",
        host: ["{{baseUrl}}"],
        path: ["users", "{{managedUserId}}", "assign-admin"],
      },
      description:
        "Assign the admin role to a user. Admin-only route. Set make_active_role to true to switch the user's active role immediately.",
    },
    response: [],
  });
}

function ensureGuestOrderRequests(collection) {
  const ordersGroup = findGroup(collection, "🛒 Orders");
  if (!ordersGroup) {
    return;
  }

  upsertRequest(ordersGroup, {
    name: "GET /order/guest/all",
    request: {
      method: "GET",
      header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
      url: {
        raw: "{{baseUrl}}/order/guest/all?page=1&take=10",
        host: ["{{baseUrl}}"],
        path: ["order", "guest", "all"],
        query: [
          { key: "page", value: "1" },
          { key: "take", value: "10" },
        ],
      },
      description:
        "Fetch all guest purchases. Admin route. Supports pagination and optional status query filters.",
    },
    response: [],
  });

  upsertRequest(ordersGroup, {
    name: "GET /order/guest/store",
    request: {
      method: "GET",
      header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
      url: {
        raw: "{{baseUrl}}/order/guest/store?page=1&take=10",
        host: ["{{baseUrl}}"],
        path: ["order", "guest", "store"],
        query: [
          { key: "page", value: "1" },
          { key: "take", value: "10" },
        ],
      },
      description:
        "Fetch guest purchases for the authenticated seller store, or all guest purchases when used by an admin without a linked store.",
    },
    response: [],
  });
}

function applyScripts(collection) {
  walkRequests(collection.item, (item) => {
    const pathSegments = Array.isArray(item?.request?.url?.path)
      ? item.request.url.path
      : [];

    upsertTestScript(item, buildContextualScript(pathSegments, item.name));
  });
}

function updateCollectionFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const collection = JSON.parse(raw);
  const summary = { updatedBodies: 0 };

  if (Array.isArray(collection.item)) {
    collection.item.forEach((item) => processItem(item, summary));
  }

  upsertCollectionVariables(collection);
  ensurePaystackReconcileRequest(collection);
  ensurePaystackReconciliationRequests(collection);
  ensureUserManagementRoleRequests(collection);
  ensureGuestOrderRequests(collection);
  walkRequests(collection.item, (item) => {
    normalizeEmailsInRequest(item.request);
  });
  applyScripts(collection);

  fs.writeFileSync(filePath, JSON.stringify(collection, null, 2), "utf8");
  console.log("Updated Postman collection:", filePath);
  console.log("Request bodies added for", summary.updatedBodies, "endpoints.");
}

function main() {
  collectionPaths.forEach((filePath) => updateCollectionFile(filePath));
}

main();
