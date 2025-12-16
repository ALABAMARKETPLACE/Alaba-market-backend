import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_PRIVATE_KEY,
        signOptions: { expiresIn: process.env.SESSION_EXPIRY },
      }),
      inject: [],
    }),
  ],
  exports: [JwtModule],
})
export class NestJwtModule {}
