import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import * as admin from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";

@Injectable()
export class FirebaseService {
  constructor(
    @Inject("FIREBASE_ADMIN") private readonly firebaseAdmin: admin.app.App
  ) {}

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken: DecodedIdToken = await this.firebaseAdmin
        .auth()
        .verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException("Failed to Verify user.");
    }
  }
}
