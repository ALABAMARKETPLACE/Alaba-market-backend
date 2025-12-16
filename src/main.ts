import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { setupSwagger } from "./swagger";
import * as dotenv from "dotenv";
import * as path from "path";
import * as bodyParser from "body-parser";
//test
async function bootstrap() {
  //env config...===============================================
  dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
  const environment = process.env.NODE_ENV || ".env.development";
  const envFilePath = path.resolve(__dirname, "..", `.env.${environment}`);
  dotenv.config({ path: envFilePath });
  //==============================================================
  const logger = new Logger(process.env.NAME);
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    })
  );
  setupSwagger(app);
  app.enableCors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: "*",
    credentials: true,
  });
  
  // Add comprehensive request logging for debugging
  app.use((req: any, res: any, next: any) => {
    console.log('=== INCOMING REQUEST ===');
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Origin: ${req.headers.origin}`);
    console.log(`User-Agent: ${req.headers['user-agent']}`);
    console.log(`Content-Type: ${req.headers['content-type']}`);
    console.log(`Authorization: ${req.headers.authorization ? 'Present' : 'Not present'}`);
    
    if (req.url.includes('/auth/login')) {
      console.log('=== AUTH LOGIN REQUEST ===');
      console.log(`Body:`, req.body);
      console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
    }
    
    res.on('finish', () => {
      console.log(`Response Status: ${res.statusCode}`);
      console.log('=== REQUEST COMPLETE ===\n');
    });
    
    next();
  });
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  await app.listen(process.env.PORT, "0.0.0.0", () =>
    logger.log(
      `server is running on port ${process.env.PORT} ${process.env.NODE_ENV}`
    )
  );
}
//test
bootstrap();
