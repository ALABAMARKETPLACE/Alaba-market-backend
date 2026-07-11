const fs = require("fs");
const path = require("path");

const collectionPaths = [
  path.join(__dirname, "..", "alaba-marketplace-postman-collection.json"),
  path.join(__dirname, "..", "postman_collection.json"),
];
const srcRoot = path.join(__dirname, "..", "src");
const DEFAULT_EMAIL = "olagiddz@gmail.com";

const collectionVariables = [
  { key: "baseUrl", value: "http://localhost:8000", type: "string" },
  { key: "authToken", value: "", type: "string" },
  { key: "refreshToken", value: "", type: "string" },
  { key: "password", value: "Options123#", type: "string" },
  { key: "userId", value: "1", type: "number" },
  { key: "managedUserId", value: "1", type: "number" },
  { key: "userEmail", value: DEFAULT_EMAIL, type: "string" },
  { key: "activeRole", value: "user", type: "string" },
  { key: "storeId", value: "1", type: "number" },
  { key: "orderId", value: "1", type: "number" },
  { key: "productId", value: "1", type: "number" },
  { key: "variantId", value: "1", type: "number" },
  { key: "cartItemId", value: "1", type: "number" },
  { key: "addressId", value: "1", type: "number" },
  { key: "deliveryToken", value: "", type: "string" },
  { key: "deliveryTokenAddressId", value: "", type: "number" },
  { key: "deliveryCharge", value: "0", type: "number" },
  { key: "deliveryDiscount", value: "0", type: "number" },
  {
    key: "callbackUrl",
    value: "http://localhost:3000/payment/callback",
    type: "string",
  },
  { key: "paymentReference", value: "", type: "string" },
  { key: "paymentProvider", value: "paystack", type: "string" },
  { key: "paystackAccessCode", value: "", type: "string" },
  { key: "budpayAccessCode", value: "", type: "string" },
  { key: "budpayCustomerId", value: "", type: "string" },
  { key: "budpayVirtualAccountId", value: "", type: "string" },
  { key: "budpayAccountNumber", value: "", type: "string" },
  { key: "budpayImportStatus", value: "", type: "string" },
  { key: "budpayWebhookSignature", value: "", type: "string" },
  { key: "boosterPlanId", value: "1", type: "number" },
  { key: "boosterConfigId", value: "1", type: "number" },
  { key: "boosterReference", value: "", type: "string" },
  { key: "boosterTier", value: "gold", type: "string" },
  { key: "boosterDurationDays", value: "30", type: "number" },
  { key: "managedRole", value: "admin", type: "string" },
  { key: "managedStatus", value: "true", type: "boolean" },
  { key: "adminEmail", value: "admin@example.com", type: "string" },
  { key: "adminResetToken", value: "", type: "string" },
  { key: "adminNewPassword", value: "NewStrongPassword123!", type: "string" },
  { key: "reconcileReference", value: "", type: "string" },
  { key: "guestEmail", value: DEFAULT_EMAIL, type: "string" },
  { key: "buyerEmail", value: DEFAULT_EMAIL, type: "string" },
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
  { key: "productName", value: "Sample product", type: "string" },
  {
    key: "productImage",
    value: "https://example.com/product.jpg",
    type: "string",
  },
  { key: "productPrice", value: "5000", type: "number" },
  { key: "productWeight", value: "1", type: "number" },
  { key: "orderQuantity", value: "1", type: "number" },
  { key: "phone", value: "2348012345678", type: "string" },
  { key: "slug", value: "", type: "string" },
  { key: "token", value: "", type: "string" },
  { key: "invoiceId", value: "1", type: "number" },
  { key: "invoiceToken", value: "", type: "string" },
  { key: "countryId", value: "1", type: "number" },
  { key: "stateId", value: "1", type: "number" },
  { key: "bannerId", value: "1", type: "number" },
  { key: "offerId", value: "1", type: "number" },
  { key: "notificationId", value: "1", type: "number" },
  { key: "bankAccountId", value: "1", type: "number" },
  { key: "companyId", value: "1", type: "number" },
  { key: "driverId", value: "1", type: "number" },
  { key: "position", value: "1", type: "number" },
  { key: "reference", value: "", type: "string" },
  { key: "bankCode", value: "", type: "string" },
  { key: "type", value: "", type: "string" },
  { key: "limit", value: "10", type: "number" },
];

const controllerGroupOverrides = {
  coorporate_store: "COORPORATE STORE",
  product_search: "PRODUCT SEARCH",
  store_search: "STORE SEARCH",
  individual_seller: "INDIVIDUAL SELLER",
  refund_request: "REFUND REQUEST",
  payment_gateway: "PAYMENT GATEWAY",
  payment_splits: "PAYMENT SPLITS",
  paymentlog: "PAYMENTLOG",
  order_status: "ORDERSTATUS",
  print_status: "PRINTSTATUS",
  print_configeration: "PRINT CONFIGERATION",
  new_address: "NEW ADDRESS",
  new_distance_charge: "NEW DISTANCE CHARGE",
  user_bank_account: "USER BANK ACCOUNT",
  userhistory: "USERHISTORY",
  subscription_plans: "SUBSCRIPTION PLANS",
  boost_requests: "BOOST REQUESTS",
  featured_products: "FEATURED PRODUCTS",
  paystack_subaccounts: "PAYSTACK SUBACCOUNTS",
  subtitution_token: "SUBTITUTION TOKEN",
  business_type: "BUSINESSTYPE",
};

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(target, acc);
    } else {
      acc.push(target);
    }
  }

  return acc;
}

function normalizeCollectionKey(value) {
  return String(value || "")
    .replace(/{{baseUrl}}/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function titleCaseSegment(value) {
  return String(value || "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function guessVariableType(key) {
  const lower = String(key || "").toLowerCase();
  if (
    lower.endsWith("id") ||
    lower === "position" ||
    lower === "page" ||
    lower === "take" ||
    lower === "limit"
  ) {
    return "number";
  }

  return "string";
}

function defaultVariableValue(key) {
  const preset = collectionVariables.find((entry) => entry.key === key);
  if (preset) {
    return preset.value;
  }

  return guessVariableType(key) === "number" ? "1" : "";
}

function deriveVariableName(controllerPath, paramName) {
  const normalizedController = String(controllerPath || "")
    .split("/")
    .filter(Boolean)
    .join("_")
    .toLowerCase();
  const normalizedParam = String(paramName || "").trim();
  const lowerParam = normalizedParam.toLowerCase();

  if (lowerParam === "email") return "userEmail";
  if (lowerParam === "phone") return "phone";
  if (lowerParam === "token") {
    if (normalizedController === "invoice") return "invoiceToken";
    return "token";
  }
  if (lowerParam === "slug") {
    if (normalizedController.includes("store_search")) return "storeSlug";
    return "slug";
  }
  if (lowerParam === "reference") return "reference";
  if (lowerParam === "bankcode") return "bankCode";
  if (lowerParam === "type") return "type";
  if (lowerParam !== "id") return normalizedParam;

  const idMap = {
    user: "userId",
    users: "managedUserId",
    products: "productId",
    productimage: "productId",
    productvariant: "variantId",
    order: "orderId",
    print: "orderId",
    address: "addressId",
    "new-address": "addressId",
    category: "categoryId",
    subcategory: "subCategoryId",
    sub_category: "subCategoryId",
    countries: "countryId",
    states: "stateId",
    banner: "bannerId",
    enquiry: "enquiryId",
    storereview: "storeId",
    invoice: "invoiceId",
    notifications: "notificationId",
    offers: "offerId",
    "user-bank-account": "bankAccountId",
    "paystack-subaccounts": "storeId",
  };

  return idMap[normalizedController] || "id";
}

function replacePathParams(rawPath, controllerPath) {
  const normalized = String(rawPath || "").replace(/\/+/g, "/");
  const discoveredVariables = [];

  const replaced = normalized.replace(/:([A-Za-z0-9_]+)/g, (_, paramName) => {
    const variableName = deriveVariableName(controllerPath, paramName);
    discoveredVariables.push(variableName);
    return `{{${variableName}}}`;
  });

  return {
    rawPath: replaced,
    discoveredVariables,
  };
}

function normalizeControllerGroupName(controllerPath) {
  const base = String(controllerPath || "")
    .split("/")
    .filter(Boolean)
    .join("_");

  if (controllerGroupOverrides[base]) {
    return controllerGroupOverrides[base];
  }

  return String(controllerPath || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => titleCaseSegment(segment))
    .join(" ")
    .toUpperCase();
}

function extractControllerRoutes() {
  const controllerFiles = walk(srcRoot).filter((file) =>
    file.endsWith(".controller.ts"),
  );
  const routes = [];

  for (const file of controllerFiles) {
    const source = fs.readFileSync(file, "utf8");
    const controllerMatch = source.match(/@Controller\(([^)]*)\)/);
    const controllerPath = controllerMatch
      ? controllerMatch[1].replace(/["'`\s]/g, "")
      : "";
    const routeRegex = /@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/g;

    let routeMatch;
    while ((routeMatch = routeRegex.exec(source))) {
      const method = routeMatch[1].toUpperCase();
      const routeSegment = String(routeMatch[2] || "").replace(/["'`\s]/g, "");
      const combinedPath = [controllerPath, routeSegment]
        .filter(Boolean)
        .join("/")
        .replace(/\/+/g, "/");
      const normalizedRoute = combinedPath.startsWith("/")
        ? combinedPath
        : `/${combinedPath}`;
      const converted = replacePathParams(normalizedRoute, controllerPath);
      const cleanedRawPath = converted.rawPath.replace(/\/$/, "") || "/";

      routes.push({
        controllerPath,
        groupName: normalizeControllerGroupName(controllerPath),
        method,
        rawPath: cleanedRawPath,
        regex: toRouteRegex(cleanedRawPath),
        pathSegments: cleanedRawPath
          .replace(/^\//, "")
          .split("/")
          .filter(Boolean),
        variables: converted.discoveredVariables,
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

    if (!item.request?.url?.raw) continue;
    acc.push(item);
  }

  return acc;
}

function toRouteRegex(rawPath) {
  const normalized = String(rawPath || "")
    .replace("{{baseUrl}}", "")
    .split("?")[0]
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");

  const pattern = (normalized || "/")
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (/^\{\{.+\}\}$/.test(segment)) return "[^/]+";
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  return new RegExp(`^${pattern || "/"}$`);
}

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
    return { email: DEFAULT_EMAIL, password: "Options123#" };
  }
  if (resource.includes("user") || resource.includes("users")) {
    return {
      name: "Jane Customer",
      email: DEFAULT_EMAIL,
      password: "Options123#",
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
    return sampleForRequest("POST", ["order"]);
  }
  if (resource.includes("wishlist")) return { userId: 1, productId: 123 };
  if (resource.includes("cart")) {
    return { userId: 1, items: [{ productId: 1, quantity: 1 }] };
  }
  return {};
}

function sampleForRequest(method, pathSegments = []) {
  const normalizedMethod = String(method || "").toUpperCase();
  const normalizedPath = (pathSegments || []).join("/");

  if (normalizedMethod === "POST" && normalizedPath === "auth/login") {
    return {
      email: "{{userEmail}}",
      password: "{{password}}",
    };
  }

  if (normalizedMethod === "POST" && normalizedPath === "new-address") {
    return {
      address_type: "home",
      full_address: "12 Test Street, Ikeja, Lagos",
      pincode: "100001",
      phone_no: "08000000000",
      country_id: "{{countryId}}",
      state_id: "{{stateId}}",
    };
  }

  if (normalizedMethod === "POST" && normalizedPath === "cart") {
    return {
      productId: "{{productId}}",
      variantId: "{{variantId}}",
      quantity: "{{orderQuantity}}",
    };
  }

  if (normalizedMethod === "PUT" && normalizedPath === "cart/{{id}}") {
    return {};
  }

  if (
    normalizedMethod === "POST" &&
    normalizedPath === "calculate_delivery"
  ) {
    return {
      cart: [
        {
          id: "{{cartItemId}}",
          userId: "{{userId}}",
          productId: "{{productId}}",
          variantId: "{{variantId}}",
          storeId: "{{storeId}}",
          quantity: "{{orderQuantity}}",
          image: "{{productImage}}",
          totalPrice: "{{productPrice}}",
          buyPrice: "{{productPrice}}",
          name: "{{productName}}",
          productDetails: {
            image: "{{productImage}}",
            name: "{{productName}}",
            price: "{{productPrice}}",
          },
          storeDetails: {},
        },
      ],
      address: {
        id: "{{addressId}}",
        userId: "{{userId}}",
        flat: "12",
        fullAddress: "12 Test Street, Ikeja, Lagos",
        pin_code: "100001",
        state: "Lagos",
        city: "Ikeja",
        street: "Test Street",
        alt_phone: "08000000000",
        code: "NG",
        geo_location: "",
        type: "home",
        lat: null,
        long: null,
      },
      total: "{{productPrice}}",
    };
  }

  if (
    normalizedMethod === "POST" &&
    normalizedPath === "calculate_delivery/new"
  ) {
    return {
      cart: [
        {
          weight: "{{productWeight}}",
          quantity: "{{orderQuantity}}",
        },
      ],
      address: {
        id: "{{addressId}}",
        country_id: "{{countryId}}",
        state_id: "{{stateId}}",
      },
    };
  }

  if (
    normalizedMethod === "POST" &&
    normalizedPath === "calculate_delivery/public"
  ) {
    return {
      cart: [
        {
          id: "{{productId}}",
          productId: "{{productId}}",
          variantId: "{{variantId}}",
          storeId: "{{storeId}}",
          name: "{{productName}}",
          quantity: "{{orderQuantity}}",
          weight: "{{productWeight}}",
          totalPrice: "{{productPrice}}",
        },
      ],
      address: {
        id: "guest_{{userId}}",
        full_name: "Guest Buyer",
        phone_no: "08000000000",
        full_address: "12 Test Street, Ikeja, Lagos",
        country_id: "{{countryId}}",
        state_id: "{{stateId}}",
        country: "Nigeria",
        state: "Lagos",
        is_guest: true,
      },
      total: "{{productPrice}}",
    };
  }

  if (normalizedMethod === "POST" && normalizedPath === "order") {
    return {
      cart: [
        {
          id: "{{cartItemId}}",
          productId: "{{productId}}",
          variantId: "{{variantId}}",
          storeId: "{{storeId}}",
          quantity: "{{orderQuantity}}",
        },
      ],
      payment: {
        type: "paystack",
        callback_url: "{{callbackUrl}}",
      },
      address: {
        id: "{{addressId}}",
      },
      charges: {
        token: "{{deliveryToken}}",
      },
    };
  }

  if (
    normalizedMethod === "POST" &&
    ["paystack/initialize-checkout", "budpay/initialize-checkout"].includes(
      normalizedPath,
    )
  ) {
    const provider = normalizedPath.startsWith("budpay/")
      ? "budpay"
      : "{{paymentProvider}}";
    const orderPayload = sampleForRequest("POST", ["order"]);
    orderPayload.payment.type = provider;
    return {
      payment_provider: provider,
      order_payload: orderPayload,
      callback_url: "{{callbackUrl}}",
    };
  }

  if (
    normalizedMethod === "POST" &&
    ["paystack/verify", "budpay/verify"].includes(normalizedPath)
  ) {
    return {
      reference: "{{paymentReference}}",
    };
  }

  if (normalizedMethod === "POST" && normalizedPath === "budpay/initialize") {
    return {
      payment_provider: "budpay",
      email: "{{userEmail}}",
      amount: 500000,
      currency: "NGN",
      callback_url: "{{callbackUrl}}",
      reference: "",
      metadata: {
        source: "postman",
      },
    };
  }

  if (
    normalizedMethod === "POST" &&
    ["paystack/initialize-guest", "budpay/initialize-guest"].includes(
      normalizedPath,
    )
  ) {
    const provider = normalizedPath.startsWith("budpay/")
      ? "budpay"
      : "{{paymentProvider}}";
    return {
      payment_provider: provider,
      guest_info: {
        email: "{{guestEmail}}",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      cart_items: [
        {
          product_id: "{{productId}}",
          store_id: "{{storeId}}",
          quantity: 1,
          unit_price: 500000,
        },
      ],
      amount: 500000,
      delivery_charge: 0,
      currency: "NGN",
      callback_url: "{{callbackUrl}}",
      order_payload: {
        guest_info: {
          email: "{{guestEmail}}",
          first_name: "Guest",
          last_name: "Buyer",
          phone: "08000000000",
        },
        delivery_address: {
          id: "guest_address_001",
          full_name: "Guest Buyer",
          phone_no: "08000000000",
          full_address: "12 Test Street, Ikeja, Lagos",
          city: "Ikeja",
          state: "Lagos",
          state_id: "{{stateId}}",
          country: "Nigeria",
          country_id: "{{countryId}}",
        },
        cart_items: [
          {
            product_id: "{{productId}}",
            store_id: "{{storeId}}",
            product_name: "{{productName}}",
            quantity: 1,
            unit_price: 500000,
            total_price: 500000,
          },
        ],
        payment: {
          payment_method: provider,
          payment_status: "pending",
        },
        delivery: {
          delivery_token: "{{deliveryToken}}",
        },
        order_summary: {
          subtotal: 5000,
          delivery_fee: 0,
          discount: 0,
          tax: 0,
          total: 5000,
        },
      },
    };
  }

  if (normalizedMethod === "POST" && normalizedPath === "budpay/webhook") {
    return {
      notify: "transaction",
      notifyType: "successful",
      data: {
        reference: "{{paymentReference}}",
        status: "success",
        amount: "500000",
        currency: "NGN",
        customer: {
          email: "{{guestEmail}}",
        },
        metadata: {
          payment_provider: "budpay",
        },
      },
    };
  }

  if (
    normalizedMethod === "POST" &&
    normalizedPath === "budpay/admin/import-paystack-subaccounts"
  ) {
    return {
      dryRun: true,
      limit: 25,
      storeId: "{{storeId}}",
      retryFailed: false,
      force: false,
    };
  }

  if (
    normalizedMethod === "PUT" &&
    /^(order\/guest\/update_status|order\/update_status|print\/update_status)\/.+$/.test(
      normalizedPath,
    )
  ) {
    return {
      status: "processing",
      remark: "Order is being processed",
      delivery_date: "2026-04-10T00:00:00.000Z",
    };
  }

  if (
    normalizedMethod === "PUT" &&
    /^products\/update_status\/.+$/.test(normalizedPath)
  ) {
    return {
      status: true,
    };
  }

  return sampleForResource(pathSegments[0]);
}

function rawBodyForRequest(method, pathSegments = []) {
  const normalizedMethod = String(method || "").toUpperCase();
  const normalizedPath = pathSegments.join("/");

  if (
    normalizedMethod === "POST" &&
    normalizedPath === "calculate_delivery"
  ) {
    return [
      "{",
      '  "cart": [',
      "    {",
      '      "id": {{cartItemId}},',
      '      "userId": {{userId}},',
      '      "productId": {{productId}},',
      '      "variantId": {{variantId}},',
      '      "storeId": {{storeId}},',
      '      "quantity": {{orderQuantity}},',
      '      "image": "{{productImage}}",',
      '      "totalPrice": {{productPrice}},',
      '      "buyPrice": {{productPrice}},',
      '      "name": "{{productName}}",',
      '      "productDetails": {',
      '        "image": "{{productImage}}",',
      '        "name": "{{productName}}",',
      '        "price": {{productPrice}}',
      "      },",
      '      "storeDetails": {}',
      "    }",
      "  ],",
      '  "address": {',
      '    "id": {{addressId}},',
      '    "userId": {{userId}},',
      '    "flat": "12",',
      '    "fullAddress": "12 Test Street, Ikeja, Lagos",',
      '    "pin_code": "100001",',
      '    "state": "Lagos",',
      '    "city": "Ikeja",',
      '    "street": "Test Street",',
      '    "alt_phone": "08000000000",',
      '    "code": "NG",',
      '    "geo_location": "",',
      '    "type": "home",',
      '    "lat": null,',
      '    "long": null',
      "  },",
      '  "total": {{productPrice}}',
      "}",
    ].join("\n");
  }

  if (
    normalizedMethod === "POST" &&
    normalizedPath === "calculate_delivery/new"
  ) {
    return [
      "{",
      '  "cart": [',
      "    {",
      '      "weight": {{productWeight}},',
      '      "quantity": {{orderQuantity}}',
      "    }",
      "  ],",
      '  "address": {',
      '    "id": {{addressId}},',
      '    "country_id": {{countryId}},',
      '    "state_id": {{stateId}}',
      "  }",
      "}",
    ].join("\n");
  }

  return JSON.stringify(sampleForRequest(method, pathSegments), null, 2);
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

  const pathSegments =
    Array.isArray(req.url?.path) && req.url.path.length > 0 ? req.url.path : [];
  const sample = sampleForRequest(
    method,
    pathSegments.length ? pathSegments : [resource],
  );
  const hasBody =
    req.body &&
    ((req.body.raw && req.body.raw.trim() !== "") ||
      (req.body.mode && req.body[req.body.mode]));

  const shouldReplaceGenericBody =
    typeof req.body?.raw === "string" &&
    (["{}", "{\n}"].includes(req.body.raw.trim()) ||
      req.body.raw.includes("replace_with_actual_payload") ||
      req.body.raw.includes('"shippingAddressId"') ||
      req.body.raw.includes('"paymentMethod"'));
  const shouldReplaceDeliveryBody =
    method === "POST" &&
    pathSegments.join("/") === "calculate_delivery/new" &&
    typeof req.body?.raw === "string" &&
    (req.body.raw.includes('"productDetails"') ||
      req.body.raw.includes('"weight": "{{productWeight}}"'));
  const shouldReplaceLegacyDeliveryBody =
    method === "POST" &&
    pathSegments.join("/") === "calculate_delivery" &&
    typeof req.body?.raw === "string" &&
    req.body.raw.includes('"id": "{{cartItemId}}"');
  const shouldRefreshPaymentProviderBody =
    method === "POST" &&
    [
      "paystack/initialize-checkout",
      "paystack/initialize-guest",
      "budpay/initialize",
      "budpay/initialize-checkout",
      "budpay/initialize-guest",
      "budpay/verify",
      "budpay/webhook",
      "budpay/admin/import-paystack-subaccounts",
    ].includes(pathSegments.join("/"));

  if (
    !hasBody ||
    shouldReplaceGenericBody ||
    shouldReplaceDeliveryBody ||
    shouldReplaceLegacyDeliveryBody ||
    shouldRefreshPaymentProviderBody
  ) {
    req.body = { mode: "raw", raw: rawBodyForRequest(method, pathSegments) };
    req.header = ensureJsonHeader(req.header);
    summary.updatedBodies += 1;
  }
}

function configureBudPayRequests(collection) {
  const descriptions = {
    "POST budpay/initialize":
      "Initialize a direct BudPay Standard transaction. Amount is in kobo.",
    "POST budpay/initialize-checkout":
      "Authenticated BudPay checkout using the same order_payload contract as Paystack.",
    "POST budpay/initialize-guest":
      "Guest BudPay checkout using the same request contract as Paystack.",
    "POST budpay/verify":
      "Verify a BudPay reference and validate stored checkout amount/email.",
    "GET budpay/verify":
      "Verify a BudPay reference using a query parameter.",
    "POST budpay/webhook":
      "BudPay webhook example. Production webhooks are server-verified against BudPay before order finalization.",
    "GET budpay/public-key":
      "Return the configured BudPay public key when frontend use requires it.",
    "POST budpay/admin/import-paystack-subaccounts":
      "Admin-only seller payout-profile import. Start with dryRun=true. force=true may replace stored BudPay identifiers.",
    "GET budpay/admin/import-paystack-subaccounts/preview":
      "Admin-only read-only preview. Shows ready, missing-data, and already-imported stores without mutation.",
    "GET budpay/admin/import-paystack-subaccounts/status":
      "Admin-only BudPay seller payout-profile import status.",
  };

  walkRequests(collection.item, (item) => {
    const request = item?.request;
    const segments = Array.isArray(request?.url?.path) ? request.url.path : [];
    if (segments[0] !== "budpay") {
      return;
    }

    const method = String(request.method || "GET").toUpperCase();
    const route = segments.join("/");
    const key = `${method} ${route}`;
    request.description = descriptions[key] || request.description;

    const isPublic =
      route === "budpay/webhook" ||
      route === "budpay/public-key" ||
      route === "budpay/initialize-guest";
    request.header = (request.header || []).filter(
      (header) =>
        !isPublic || String(header.key || "").toLowerCase() !== "authorization",
    );

    if (route === "budpay/webhook") {
      request.header = ensureJsonHeader(request.header);
      request.header = request.header.filter(
        (header) =>
          String(header.key || "").toLowerCase() !== "x-budpay-signature",
      );
      request.header.push({
        key: "x-budpay-signature",
        value: "{{budpayWebhookSignature}}",
        disabled: true,
        description:
          "Enable only when BUDPAY_WEBHOOK_SECRET/signature validation is configured.",
      });
    }

    if (method === "GET" && route === "budpay/verify") {
      request.url.raw = "{{baseUrl}}/budpay/verify?reference={{paymentReference}}";
      request.url.query = [
        { key: "reference", value: "{{paymentReference}}" },
      ];
    }

    if (
      method === "GET" &&
      route === "budpay/admin/import-paystack-subaccounts/preview"
    ) {
      request.url.raw =
        "{{baseUrl}}/budpay/admin/import-paystack-subaccounts/preview?limit=100&storeId=";
      request.url.query = [
        { key: "limit", value: "100" },
        {
          key: "storeId",
          value: "{{storeId}}",
          disabled: true,
          description: "Enable for a targeted store preview.",
        },
      ];
    }

    if (
      method === "GET" &&
      route === "budpay/admin/import-paystack-subaccounts/status"
    ) {
      request.url.raw =
        "{{baseUrl}}/budpay/admin/import-paystack-subaccounts/status?limit=100&storeId=";
      request.url.query = [
        { key: "limit", value: "100" },
        {
          key: "storeId",
          value: "{{storeId}}",
          disabled: true,
          description: "Enable for one store.",
        },
      ];
    }
  });
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

function ensureCollectionVariable(collection, key) {
  if (!key) {
    return;
  }

  collection.variable = Array.isArray(collection.variable)
    ? collection.variable
    : [];

  const existing = collection.variable.find((entry) => entry.key === key);
  if (existing) {
    existing.type = existing.type || guessVariableType(key);
    if (existing.value == null || existing.value === "") {
      existing.value = defaultVariableValue(key);
    }
    return;
  }

  collection.variable.push({
    id: key,
    key,
    type: guessVariableType(key),
    value: defaultVariableValue(key),
    enabled: true,
  });
}

function ensureTopLevelGroup(collection, preferredName) {
  collection.item = Array.isArray(collection.item) ? collection.item : [];
  const normalizedPreferredName = normalizeCollectionKey(preferredName);
  const existing = collection.item.find(
    (entry) => normalizeCollectionKey(entry.name) === normalizedPreferredName,
  );

  if (existing) {
    existing.item = Array.isArray(existing.item) ? existing.item : [];
    return existing;
  }

  const created = { name: preferredName, item: [] };
  collection.item.push(created);
  return created;
}

function buildGeneratedRequest(route) {
  const headers = [];
  if (["POST", "PUT", "PATCH"].includes(route.method)) {
    headers.push({ key: "Content-Type", value: "application/json" });
  }
  headers.push({ key: "Authorization", value: "Bearer {{authToken}}" });

  const request = {
    method: route.method,
    header: headers,
    url: {
      raw: `{{baseUrl}}${route.rawPath}`,
      host: ["{{baseUrl}}"],
      path: route.pathSegments,
    },
  };

  if (["POST", "PUT", "PATCH"].includes(route.method)) {
    request.body = {
      mode: "raw",
      raw: rawBodyForRequest(route.method, route.pathSegments),
      options: { raw: { language: "json" } },
    };
  }

  return {
    name: `${route.method} ${route.rawPath}`,
    request,
    response: [],
  };
}

function normalizeExistingRequestUrls(collection) {
  walkRequests(collection.item, (item) => {
    const request = item?.request;
    if (!request?.url?.raw) {
      return;
    }

    const pathArray = Array.isArray(request.url.path)
      ? request.url.path
      : String(request.url.raw || "")
          .replace("{{baseUrl}}", "")
          .split("?")[0]
          .replace(/^\//, "")
          .split("/")
          .filter(Boolean);
    const firstSegment = pathArray[0] || "";
    const converted = replacePathParams(
      String(request.url.raw || "").replace("{{baseUrl}}", ""),
      firstSegment,
    );

    request.url.raw = `{{baseUrl}}${converted.rawPath}`;
    request.url.path = converted.rawPath
      .replace(/^\//, "")
      .split("/")
      .filter(Boolean);

    converted.discoveredVariables.forEach((variable) =>
      ensureCollectionVariable(collection, variable),
    );
  });
}

function syncControllerRoutes(collection) {
  const routes = extractControllerRoutes();
  const existingRequests = new Set(
    flattenRequests(collection.item).map((item) =>
      normalizeCollectionKey(
        `${String(item.request.method || "GET").toUpperCase()} ${
          item.request.url.raw
        }`,
      ),
    ),
  );

  for (const route of routes) {
    route.variables.forEach((variable) =>
      ensureCollectionVariable(collection, variable),
    );

    const requestKey = normalizeCollectionKey(
      `${route.method} {{baseUrl}}${route.rawPath}`,
    );
    if (existingRequests.has(requestKey)) {
      continue;
    }

    const group = ensureTopLevelGroup(collection, route.groupName);
    const generatedRequest = buildGeneratedRequest(route);
    upsertRequest(group, generatedRequest);
    existingRequests.add(requestKey);
  }
}

function pruneUnknownRequests(items, knownRoutes) {
  const nextItems = [];

  for (const item of items || []) {
    if (Array.isArray(item.item)) {
      item.item = pruneUnknownRequests(item.item, knownRoutes);
      if (item.item.length > 0) {
        nextItems.push(item);
      }
      continue;
    }

    const method = String(item?.request?.method || "GET").toUpperCase();
    const raw = String(item?.request?.url?.raw || "");
    const regex = toRouteRegex(raw);
    const isKnown = knownRoutes.some(
      (route) =>
        route.method === method &&
        route.regex.test(raw.replace("{{baseUrl}}", "").split("?")[0]),
    );

    if (isKnown) {
      nextItems.push(item);
    }
  }

  return nextItems;
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

function upsertPreRequestScript(item, scriptLines) {
  item.event = Array.isArray(item.event) ? item.event : [];
  const existing = item.event.find((entry) => entry.listen === "prerequest");
  const script = {
    listen: "prerequest",
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
  const isCartLike = resource === "cart";
  const isCalculateDeliveryLike = resource === "calculate_delivery";
  const isOrderLike = resource === "order";
  const isAddressLike = resource === "address" || resource === "new-address";
  const isPaystackLike = resource === "paystack";
  const isBudPayLike = resource === "budpay";
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
    "  const unsetVar = (key) => {",
    "    pm.collectionVariables.unset(key);",
    "    if (pm.environment) {",
    "      pm.environment.unset(key);",
    "    }",
    "  };",
    "  const decodeJwtPayload = (token) => {",
    "    try {",
    "      if (!token || String(token).split('.').length < 2) return null;",
    "      let payload = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');",
    "      while (payload.length % 4) payload += '=';",
    "      return JSON.parse(atob(payload));",
    "    } catch (error) {",
    "      console.log('Unable to decode JWT payload', error);",
    "      return null;",
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
      "  setIf('productName', product?.name || product?.title || data?.name || data?.title);",
      "  setIf('productPrice', product?.price || product?.retail_rate || product?.retailRate || data?.price || data?.retail_rate);",
      "  setIf('productWeight', product?.product_weight || product?.productWeight || product?.weight || data?.product_weight || data?.productWeight || data?.weight);",
      "  setIf('storeSlug', store?.slug || first?.slug || data?.slug);",
      "  setIf('categoryId', product?.category || product?.categoryId || category?.id || category?._id || data?.category || data?.categoryId);",
      "  setIf('subCategoryId', product?.subCategory || product?.subCategoryId || subCategory?.id || subCategory?._id || data?.subCategory || data?.subCategoryId);",
      "  setIf('variantId', firstVariant?.id || firstVariant?._id || product?.variantId || first?.variantId);",
    );
  }

  if (isCartLike) {
    script.push(
      "  const cartRoot = data?.cart || data?.item || data;",
      "  const cartRows = Array.isArray(cartRoot?.rows) ? cartRoot.rows : [];",
      "  const cartResults = Array.isArray(cartRoot?.results) ? cartRoot.results : [];",
      "  const cartNested = Array.isArray(cartRoot?.data) ? cartRoot.data : [];",
      "  const cartList = Array.isArray(cartRoot) ? cartRoot : (cartRows.length ? cartRows : (cartResults.length ? cartResults : cartNested));",
      "  const cartItem = cartList[0] || cartRoot || first || {};",
      "  const cartProduct = cartItem?.product || cartItem?.productDetails || product || {};",
      "  const cartStore = cartItem?.store || cartItem?.storeDetails || store || {};",
      "  const cartVariant = cartItem?.variant || cartItem?.variantDetails || firstVariant || {};",
      "  const cartQuantity = cartItem?.quantity || cartItem?.qty || pm.collectionVariables.get('orderQuantity') || 1;",
      "  const cartPrice = cartItem?.price || cartItem?.buyPrice || cartItem?.unit_price || cartItem?.unitPrice || cartProduct?.price || cartProduct?.retail_rate || (cartItem?.totalPrice && cartQuantity ? Number(cartItem.totalPrice) / Number(cartQuantity) : undefined);",
      "  const cartWeight = cartItem?.productWeight || cartItem?.product_weight || cartItem?.weight || cartProduct?.product_weight || cartProduct?.productWeight || cartProduct?.weight || pm.collectionVariables.get('productWeight') || 1;",
      "  setIf('cartItemId', cartItem?.id || cartItem?._id || cartItem?.cartId || cartItem?.cart_id);",
      "  setIf('productId', cartItem?.productId || cartItem?.product_id || cartProduct?._id || cartProduct?.id || cartProduct?.productId);",
      "  setIf('productPid', cartItem?.pid || cartProduct?.pid);",
      "  setIf('variantId', cartItem?.variantId ?? cartItem?.variant_id ?? cartVariant?.id ?? cartVariant?._id ?? 'null');",
      "  setIf('storeId', cartItem?.storeId || cartItem?.store_id || cartProduct?.store_id || cartProduct?.storeId || cartStore?.id || cartStore?._id);",
      "  setIf('orderQuantity', cartQuantity);",
      "  setIf('productPrice', cartPrice);",
      "  setIf('productName', cartItem?.name || cartProduct?.name || cartProduct?.title);",
      "  setIf('productImage', cartItem?.image || cartProduct?.image || cartVariant?.image);",
      "  setIf('productWeight', cartWeight);",
    );
  }

  if (isAddressLike) {
    script.push(
      "  const addressRoot = data?.address || data;",
      "  const addressRows = Array.isArray(addressRoot?.rows) ? addressRoot.rows : [];",
      "  const addressResults = Array.isArray(addressRoot?.results) ? addressRoot.results : [];",
      "  const addressNested = Array.isArray(addressRoot?.data) ? addressRoot.data : [];",
      "  const addressList = Array.isArray(addressRoot) ? addressRoot : (addressRows.length ? addressRows : (addressResults.length ? addressResults : addressNested));",
      "  const selectedAddress = addressList[0] || addressRoot || address || {};",
      "  const previousAddressId = pm.collectionVariables.get('addressId') || (pm.environment && pm.environment.get('addressId'));",
      "  const nextAddressId = selectedAddress?.id || selectedAddress?._id || selectedAddress?.addressId || data?.id || data?.addressId;",
      "  if (nextAddressId && previousAddressId && String(nextAddressId) !== String(previousAddressId)) {",
      "    unsetVar('deliveryToken');",
      "    unsetVar('deliveryTokenAddressId');",
      "    unsetVar('deliveryCharge');",
      "    unsetVar('deliveryDiscount');",
      "  }",
      "  setIf('addressId', selectedAddress?.id || selectedAddress?._id || selectedAddress?.addressId || data?.id || data?.addressId);",
      "  setIf('countryId', selectedAddress?.country_id || selectedAddress?.countryId || data?.country_id || data?.countryId);",
      "  setIf('stateId', selectedAddress?.state_id || selectedAddress?.stateId || data?.state_id || data?.stateId);",
    );
  }

  if (isCalculateDeliveryLike) {
    script.push(
      "  const deliveryToken = json?.token || data?.token;",
      "  const deliveryTokenPayload = decodeJwtPayload(deliveryToken);",
      "  setIf('deliveryToken', deliveryToken);",
      "  setIf('deliveryTokenAddressId', deliveryTokenPayload?.data?.addressId || pm.collectionVariables.get('addressId'));",
      "  setIf('deliveryCharge', data?.amount || data?.delivery_charge || data?.deliveryCharge);",
      "  setIf('deliveryDiscount', data?.discount);",
      "  setIf('productWeight', data?.totalWeight || data?.total_weight || pm.collectionVariables.get('productWeight'));",
    );
  }

  if (isOrderLike) {
    script.push(
      "  const orderCandidate = order || first;",
      "  setIf('orderId', orderCandidate?.id || data?.id);",
      "  setIf('orderPublicId', orderCandidate?.order_id || data?.order_id);",
      "  setIf('paymentReference', data?.reference || payment?.ref || orderCandidate?.payment_reference || orderCandidate?.transaction_reference);",
      "  setIf('reconcileReference', data?.reference || payment?.ref || orderCandidate?.payment_reference || orderCandidate?.transaction_reference);",
      "  setIf('paystackAuthUrl', data?.authorization_url || data?.authorizationUrl || payment?.authorization_url);",
      "  setIf('paystackAccessCode', data?.access_code || data?.accessCode || payment?.access_code);",
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

  if (isBudPayLike) {
    script.push(
      "  const budpayReference = data?.reference || json?.reference || payment?.ref;",
      "  const importResult = results[0] || (Array.isArray(data?.stores) ? data.stores[0] : null) || first;",
      "  setIf('paymentReference', budpayReference);",
      "  setIf('reconcileReference', budpayReference);",
      "  setIf('budpayAccessCode', data?.access_code || json?.access_code);",
      "  setIf('budpayCustomerId', importResult?.budpay?.customer_id || importResult?.budpay_customer_id || data?.customer?.id);",
      "  setIf('budpayVirtualAccountId', importResult?.budpay?.virtual_account_id || importResult?.budpay_virtual_account_id);",
      "  setIf('budpayAccountNumber', importResult?.budpay?.account_number || importResult?.budpay_account_number);",
      "  setIf('budpayImportStatus', importResult?.result || importResult?.status || data?.status || json?.status);",
      "  setIf('guestEmail', data?.customer?.email || first?.guest_email);",
    );
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

function buildOrderPreRequestScript() {
  return [
    "const addressId = pm.variables.get('addressId');",
    "const deliveryToken = pm.variables.get('deliveryToken');",
    "let tokenAddressId = pm.variables.get('deliveryTokenAddressId');",
    "",
    "const decodeJwtPayload = (token) => {",
    "  try {",
    "    if (!token || String(token).split('.').length < 2) return null;",
    "    let payload = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');",
    "    while (payload.length % 4) payload += '=';",
    "    return JSON.parse(atob(payload));",
    "  } catch (error) {",
    "    console.log('Unable to decode delivery token', error);",
    "    return null;",
    "  }",
    "};",
    "",
    "if (!deliveryToken) {",
    "  throw new Error('Missing deliveryToken. Run POST /calculate_delivery/new after selecting address and cart, then retry /order.');",
    "}",
    "",
    "if (!tokenAddressId) {",
    "  const decoded = decodeJwtPayload(deliveryToken);",
    "  tokenAddressId = decoded?.data?.addressId;",
    "  if (tokenAddressId !== undefined && tokenAddressId !== null) {",
    "    pm.collectionVariables.set('deliveryTokenAddressId', String(tokenAddressId));",
    "    if (pm.environment) pm.environment.set('deliveryTokenAddressId', String(tokenAddressId));",
    "  }",
    "}",
    "",
    "if (addressId && tokenAddressId && String(addressId) !== String(tokenAddressId)) {",
    "  throw new Error(`Stale deliveryToken: token addressId=${tokenAddressId}, order addressId=${addressId}. Run POST /calculate_delivery/new again, then retry /order.`);",
    "}",
  ];
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

function removeRequestsByName(items, requestName) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item?.name !== requestName)
    .map((item) => {
      if (Array.isArray(item?.item)) {
        return {
          ...item,
          item: removeRequestsByName(item.item, requestName),
        };
      }

      return item;
    });
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

function ensurePaystackManualSettlementAuditRequest(collection) {
  const paymentsGroup = findFirstGroup(collection, ["💳 Payments", "PAYSTACK"]);
  if (!paymentsGroup) {
    return;
  }

  paymentsGroup.item = Array.isArray(paymentsGroup.item)
    ? paymentsGroup.item.filter(
        (entry) => entry?.name !== "GET /paystack/manual-settlement/audit",
      )
    : [];

  const legacyPaystackGroup =
    paymentsGroup.name === "PAYSTACK"
      ? null
      : findGroup(collection, "PAYSTACK");
  if (legacyPaystackGroup && Array.isArray(legacyPaystackGroup.item)) {
    legacyPaystackGroup.item = legacyPaystackGroup.item.filter(
      (entry) => entry?.name !== "GET /paystack/manual-settlement/audit",
    );
  }

  upsertRequest(paymentsGroup, {
    name: "GET /paystack/manual-settlement/audit",
    request: {
      method: "GET",
      header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
      url: {
        raw: "{{baseUrl}}/paystack/manual-settlement/audit?page=1&take=20&storeId={{storeId}}&reference={{reconcileReference}}&buyerEmail={{buyerEmail}}",
        host: ["{{baseUrl}}"],
        path: ["paystack", "manual-settlement", "audit"],
        query: [
          { key: "page", value: "1" },
          { key: "take", value: "20" },
          { key: "storeId", value: "{{storeId}}" },
          { key: "reference", value: "{{reconcileReference}}" },
          { key: "buyerEmail", value: "{{buyerEmail}}" },
        ],
      },
      description:
        "Admin-only audit endpoint for all non-split payments, including company-account collections and legacy payments without split metadata. Supports filtering by storeId, reference, and buyerEmail.",
    },
    response: [],
  });
}

function ensurePaystackSubaccountPercentageUpdateRequest(collection) {
  collection.item = removeRequestsByName(
    collection.item,
    "POST /admin/paystack/subaccounts/update-percentage",
  );

  const paymentsGroup = findFirstGroup(collection, ["💳 Payments", "PAYSTACK"]);
  if (!paymentsGroup) {
    return;
  }

  upsertRequest(paymentsGroup, {
    name: "POST /admin/paystack/subaccounts/update-percentage",
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
            percentage_charge: 93.5,
            dryRun: true,
          },
          null,
          2,
        ),
      },
      url: {
        raw: "{{baseUrl}}/admin/paystack/subaccounts/update-percentage",
        host: ["{{baseUrl}}"],
        path: ["admin", "paystack", "subaccounts", "update-percentage"],
      },
      description:
        "Admin-only bulk updater for new-account Paystack subaccounts. Omit storeIds to update every migrated store, or pass storeIds to target specific stores. Use dryRun=true first to preview affected stores, then set dryRun=false to push the update to Paystack and sync local store records.",
    },
    response: [],
  });
}

function ensurePaystackSubaccountSyncRequest(collection) {
  const paymentsGroup = findFirstGroup(collection, ["💳 Payments", "PAYSTACK"]);
  if (!paymentsGroup) {
    return;
  }

  collection.item = removeRequestsByName(
    collection.item,
    "POST /admin/paystack/subaccounts/sync-new-codes",
  );

  const refreshedPaymentsGroup = findFirstGroup(collection, [
    "💳 Payments",
    "PAYSTACK",
  ]);
  if (!refreshedPaymentsGroup) {
    return;
  }

  upsertRequest(refreshedPaymentsGroup, {
    name: "POST /admin/paystack/subaccounts/sync-new-codes",
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
            perPage: 100,
          },
          null,
          2,
        ),
      },
      url: {
        raw: "{{baseUrl}}/admin/paystack/subaccounts/sync-new-codes",
        host: ["{{baseUrl}}"],
        path: ["admin", "paystack", "subaccounts", "sync-new-codes"],
      },
      description:
        "Admin-only backfill for copied Paystack subaccounts. It fetches subaccounts from the new Paystack account, matches them to local stores, and stores paystack_subaccount_code_new locally. Use dryRun=true first.",
    },
    response: [],
  });
}

function ensurePaystackUnmatchedRemoteRequest(collection) {
  const paymentsGroup = findFirstGroup(collection, ["💳 Payments", "PAYSTACK"]);
  if (!paymentsGroup) {
    return;
  }

  collection.item = removeRequestsByName(
    collection.item,
    "GET /admin/paystack/subaccounts/unmatched-remote",
  );

  const refreshedPaymentsGroup = findFirstGroup(collection, [
    "💳 Payments",
    "PAYSTACK",
  ]);
  if (!refreshedPaymentsGroup) {
    return;
  }

  upsertRequest(refreshedPaymentsGroup, {
    name: "GET /admin/paystack/subaccounts/unmatched-remote",
    request: {
      method: "GET",
      header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
      url: {
        raw: "{{baseUrl}}/admin/paystack/subaccounts/unmatched-remote?page=1&limit=100",
        host: ["{{baseUrl}}"],
        path: ["admin", "paystack", "subaccounts", "unmatched-remote"],
        query: [
          { key: "page", value: "1" },
          { key: "limit", value: "100" },
        ],
      },
      description:
        "Admin-only list of live new-account Paystack subaccounts that are not currently matched to local stores targeted by the percentage update flow. Each item includes a classification, candidate_store_ids, and a reason.",
    },
    response: [],
  });
}

function ensurePaystackResolveUnmatchedRequest(collection) {
  const paymentsGroup = findFirstGroup(collection, ["💳 Payments", "PAYSTACK"]);
  if (!paymentsGroup) {
    return;
  }

  collection.item = removeRequestsByName(
    collection.item,
    "POST /admin/paystack/subaccounts/resolve-unmatched",
  );

  const refreshedPaymentsGroup = findFirstGroup(collection, [
    "💳 Payments",
    "PAYSTACK",
  ]);
  if (!refreshedPaymentsGroup) {
    return;
  }

  upsertRequest(refreshedPaymentsGroup, {
    name: "POST /admin/paystack/subaccounts/resolve-unmatched",
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
            classifications: ["missing_local_link"],
            page: 1,
            limit: 100,
          },
          null,
          2,
        ),
      },
      url: {
        raw: "{{baseUrl}}/admin/paystack/subaccounts/resolve-unmatched",
        host: ["{{baseUrl}}"],
        path: ["admin", "paystack", "subaccounts", "resolve-unmatched"],
      },
      description:
        "Admin-only safe auto-linker for unmatched remote Paystack subaccounts. By default it previews only missing_local_link records with exactly one candidate store. Set dryRun=false after verifying the preview.",
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
        raw: "{{baseUrl}}/order/guest/all?page=1&take=10&status=&sort=&order=DESC",
        host: ["{{baseUrl}}"],
        path: ["order", "guest", "all"],
        query: [
          { key: "page", value: "1" },
          { key: "take", value: "10" },
          { key: "status", value: "" },
          { key: "sort", value: "" },
          { key: "order", value: "DESC" },
        ],
      },
      description:
        "Admin-only guest purchases endpoint. Returns all guest orders, including paid-but-unfulfilled guest checkout records. Use this for a dedicated guest purchases screen.",
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

function ensureAdminAuthRequests(collection) {
  const group = ensureTopLevelGroup(collection, "ADMIN AUTH");
  const jsonHeaders = [{ key: "Content-Type", value: "application/json" }];
  const authHeaders = [{ key: "Authorization", value: "Bearer {{authToken}}" }];
  const authJsonHeaders = [
    { key: "Content-Type", value: "application/json" },
    { key: "Authorization", value: "Bearer {{authToken}}" },
  ];

  upsertRequest(group, {
    name: "POST /admin/auth/forgot-password",
    request: {
      method: "POST",
      header: jsonHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("POST", ["admin", "auth", "forgot-password"]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/admin/auth/forgot-password",
        host: ["{{baseUrl}}"],
        path: ["admin", "auth", "forgot-password"],
      },
      description:
        "Public admin forgot-password endpoint. Sends a reset email when the address belongs to an active admin or super admin, and always returns a generic success message.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "POST /admin/auth/request-password-change",
    request: {
      method: "POST",
      header: authHeaders,
      url: {
        raw: "{{baseUrl}}/admin/auth/request-password-change",
        host: ["{{baseUrl}}"],
        path: ["admin", "auth", "request-password-change"],
      },
      description:
        "Authenticated admin/super-admin endpoint. Sends the logged-in admin a reset link so password changes still go through the email reset flow.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "POST /admin/auth/reset-password",
    request: {
      method: "POST",
      header: authJsonHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("POST", ["admin", "auth", "reset-password"]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/admin/auth/reset-password",
        host: ["{{baseUrl}}"],
        path: ["admin", "auth", "reset-password"],
      },
      description:
        "Public admin reset endpoint. Use the one-time token from the email link with the new password.",
    },
    response: [],
  });
}

function ensureSellerBoosterRequests(collection) {
  const group = ensureTopLevelGroup(collection, "SELLER BOOSTER");
  const authHeaders = [
    { key: "Content-Type", value: "application/json" },
    { key: "Authorization", value: "Bearer {{authToken}}" },
  ];

  upsertRequest(group, {
    name: "GET /seller/booster/plans",
    request: {
      method: "GET",
      header: [{ key: "Content-Type", value: "application/json" }],
      url: {
        raw: "{{baseUrl}}/seller/booster/plans",
        host: ["{{baseUrl}}"],
        path: ["seller", "booster", "plans"],
      },
      description:
        "Fetch available seller booster plans. Returns basic, gold, and premium tiers with product limits, duration, amount, and boost score.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "POST /seller/booster/initialize",
    request: {
      method: "POST",
      header: authHeaders,
      body: {
        mode: "raw",
        raw: [
          "{",
          '  "tier": "{{boosterTier}}",',
          '  "product_ids": [',
          "    1,",
          "    2,",
          "    3",
          "  ],",
          '  "duration_days": {{boosterDurationDays}},',
          '  "callback_url": "http://localhost:3000/seller/booster/callback"',
          "}",
        ].join("\n"),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/seller/booster/initialize",
        host: ["{{baseUrl}}"],
        path: ["seller", "booster", "initialize"],
      },
      description:
        "Seller-only Paystack initialization for product booster checkout. Basic and gold require product_ids owned by the seller store; premium ignores product_ids and boosts all active products after payment.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "POST /seller/booster/verify",
    request: {
      method: "POST",
      header: authHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("POST", ["seller", "booster", "verify"]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/seller/booster/verify",
        host: ["{{baseUrl}}"],
        path: ["seller", "booster", "verify"],
      },
      description:
        "Seller-only payment verification. Use the boosterReference captured from initialize or Paystack callback to activate the booster plan.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "GET /seller/booster/status",
    request: {
      method: "GET",
      header: [{ key: "Authorization", value: "Bearer {{authToken}}" }],
      url: {
        raw: "{{baseUrl}}/seller/booster/status",
        host: ["{{baseUrl}}"],
        path: ["seller", "booster", "status"],
      },
      description:
        "Seller-only current booster status, including active plan details, expiry, boosted product count, and boosted products.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "PUT /seller/booster/products",
    request: {
      method: "PUT",
      header: authHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("PUT", ["seller", "booster", "products"]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/seller/booster/products",
        host: ["{{baseUrl}}"],
        path: ["seller", "booster", "products"],
      },
      description:
        "Seller-only replacement of selected boosted products for active basic or gold plans. Premium boosters cannot be manually edited.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "POST /seller/booster/cancel",
    request: {
      method: "POST",
      header: authHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("POST", ["seller", "booster", "cancel"]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/seller/booster/cancel",
        host: ["{{baseUrl}}"],
        path: ["seller", "booster", "cancel"],
      },
      description:
        "Seller-only booster cancellation. Marks the active plan and boosted product rows cancelled and clears product boost flags.",
    },
    response: [],
  });
}

function ensureSuperAdminRequests(collection) {
  const group = ensureTopLevelGroup(collection, "SUPER ADMIN");
  const authHeaders = [
    { key: "Content-Type", value: "application/json" },
    { key: "Authorization", value: "Bearer {{authToken}}" },
  ];
  const authOnlyHeaders = [
    { key: "Authorization", value: "Bearer {{authToken}}" },
  ];

  upsertRequest(group, {
    name: "GET /super-admin/booster-plan-configs",
    request: {
      method: "GET",
      header: authOnlyHeaders,
      url: {
        raw: "{{baseUrl}}/super-admin/booster-plan-configs",
        host: ["{{baseUrl}}"],
        path: ["super-admin", "booster-plan-configs"],
      },
      description:
        "Super Admin-only list of booster plan configs. Sellers use the active configs returned by GET /seller/booster/plans for purchases.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "POST /super-admin/booster-plan-configs",
    request: {
      method: "POST",
      header: authHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("POST", ["super-admin", "booster-plan-configs"]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/super-admin/booster-plan-configs",
        host: ["{{baseUrl}}"],
        path: ["super-admin", "booster-plan-configs"],
      },
      description:
        "Super Admin-only creation of a booster tier config. Names are basic, gold, or premium.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "PATCH /super-admin/booster-plan-configs/:id",
    request: {
      method: "PATCH",
      header: authHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("PATCH", [
            "super-admin",
            "booster-plan-configs",
            "{{boosterConfigId}}",
          ]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/super-admin/booster-plan-configs/{{boosterConfigId}}",
        host: ["{{baseUrl}}"],
        path: ["super-admin", "booster-plan-configs", "{{boosterConfigId}}"],
      },
      description:
        "Super Admin-only update for editable booster config fields such as product_limit, boost_score, duration_days, price, is_active, and is_unlimited.",
    },
    response: [],
  });

  for (const action of ["disable", "enable"]) {
    upsertRequest(group, {
      name: `PATCH /super-admin/booster-plan-configs/:id/${action}`,
      request: {
        method: "PATCH",
        header: authOnlyHeaders,
        url: {
          raw: `{{baseUrl}}/super-admin/booster-plan-configs/{{boosterConfigId}}/${action}`,
          host: ["{{baseUrl}}"],
          path: [
            "super-admin",
            "booster-plan-configs",
            "{{boosterConfigId}}",
            action,
          ],
        },
        description: `Super Admin-only ${action} action for a booster plan config.`,
      },
      response: [],
    });
  }

  upsertRequest(group, {
    name: "GET /super-admin/users",
    request: {
      method: "GET",
      header: authOnlyHeaders,
      url: {
        raw: "{{baseUrl}}/super-admin/users",
        host: ["{{baseUrl}}"],
        path: ["super-admin", "users"],
      },
      description: "Super Admin-only user list.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "GET /super-admin/admins",
    request: {
      method: "GET",
      header: authOnlyHeaders,
      url: {
        raw: "{{baseUrl}}/super-admin/admins",
        host: ["{{baseUrl}}"],
        path: ["super-admin", "admins"],
      },
      description: "Super Admin-only admin and super-admin list.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "PATCH /super-admin/users/:id/role",
    request: {
      method: "PATCH",
      header: authHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("PATCH", [
            "super-admin",
            "users",
            "{{managedUserId}}",
            "role",
          ]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/super-admin/users/{{managedUserId}}/role",
        host: ["{{baseUrl}}"],
        path: ["super-admin", "users", "{{managedUserId}}", "role"],
      },
      description:
        "Super Admin-only user role update. Only Super Admin can assign super_admin.",
    },
    response: [],
  });

  upsertRequest(group, {
    name: "PATCH /super-admin/users/:id/status",
    request: {
      method: "PATCH",
      header: authHeaders,
      body: {
        mode: "raw",
        raw: JSON.stringify(
          sampleForRequest("PATCH", [
            "super-admin",
            "users",
            "{{managedUserId}}",
            "status",
          ]),
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      },
      url: {
        raw: "{{baseUrl}}/super-admin/users/{{managedUserId}}/status",
        host: ["{{baseUrl}}"],
        path: ["super-admin", "users", "{{managedUserId}}", "status"],
      },
      description:
        "Super Admin-only user enable/disable endpoint. The service prevents disabling the last active Super Admin.",
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

    const method = String(item?.request?.method || "").toUpperCase();
    if (method === "POST" && pathSegments.join("/") === "order") {
      upsertPreRequestScript(item, buildOrderPreRequestScript());
    }
  });
}

function removePlaceholderBodies(collection) {
  walkRequests(collection.item, (item) => {
    const request = item?.request;
    const raw = request?.body?.raw;
    if (
      typeof raw !== "string" ||
      !raw.includes("Update this body with the endpoint-specific DTO fields")
    ) {
      return;
    }

    const method = String(request.method || "").toUpperCase();
    const pathSegments = Array.isArray(request.url?.path)
      ? request.url.path
      : [];

    request.body = {
      mode: "raw",
      raw: rawBodyForRequest(method, pathSegments),
      options: { raw: { language: "json" } },
    };
    request.header = ensureJsonHeader(request.header);
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
  normalizeExistingRequestUrls(collection);
  syncControllerRoutes(collection);
  configureBudPayRequests(collection);
  ensurePaystackReconcileRequest(collection);
  ensurePaystackManualSettlementAuditRequest(collection);
  ensurePaystackSubaccountPercentageUpdateRequest(collection);
  ensurePaystackSubaccountSyncRequest(collection);
  ensurePaystackUnmatchedRemoteRequest(collection);
  ensurePaystackResolveUnmatchedRequest(collection);
  ensurePaystackReconciliationRequests(collection);
  ensureUserManagementRoleRequests(collection);
  ensureGuestOrderRequests(collection);
  ensureSellerBoosterRequests(collection);
  ensureSuperAdminRequests(collection);
  collection.item = pruneUnknownRequests(
    collection.item,
    extractControllerRoutes(),
  );
  if (Array.isArray(collection.item)) {
    collection.item.forEach((item) => processItem(item, summary));
  }
  configureBudPayRequests(collection);
  walkRequests(collection.item, (item) => {
    normalizeEmailsInRequest(item.request);
  });
  applyScripts(collection);
  removePlaceholderBodies(collection);

  fs.writeFileSync(filePath, JSON.stringify(collection, null, 2), "utf8");
  console.log("Updated Postman collection:", filePath);
  console.log("Request bodies added for", summary.updatedBodies, "endpoints.");
}

function main() {
  collectionPaths.forEach((filePath) => updateCollectionFile(filePath));
}

main();
