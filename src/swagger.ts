import { INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle(`${process.env.NAME}`)
    .setDescription("API Documentation")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Enter JWT token",
        in: "header",
      },
      "bearer",
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("apis", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
