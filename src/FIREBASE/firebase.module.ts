import { Module, Global } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { FirebaseProvider } from "./firebase.provider";

@Global()
@Module({
  providers: [FirebaseService, FirebaseProvider],
  exports: ["FIREBASE_ADMIN", FirebaseService],
})
export class FirebaseModule {}
