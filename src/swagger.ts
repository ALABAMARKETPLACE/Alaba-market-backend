import { INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle("Alaba Marketplace API")
    .setDescription(
      "Purchase & payment API — covers guest checkout, authenticated checkout, cart, delivery calculation, and payment verification for Paystack, BudPay, and PalmPay.\n\n" +
        "**How to use:**\n" +
        "1. Click **Authorize** (top right) and paste your JWT token to unlock auth endpoints.\n" +
        "2. Expand any endpoint and click **Try it out** to send a live request to the dev server.\n" +
        "3. Guest endpoints (marked Public) work without a token.\n\n" +
        "**Base URL:** `https://dev-backend.alabamarketplace.ng`",
    )
    .setVersion("1.0")
    .addServer("https://dev-backend.alabamarketplace.ng", "Dev server")
    .addServer("http://localhost:4000", "Local")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste the JWT token returned by POST /auth/login",
      },
      "JWT",
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("apis", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: -1,
    },
    customSiteTitle: "Alaba Marketplace API Docs",
  });
}
