// import * as admin from "firebase-admin";
// import { ConfigService } from "../shared/config/config.service";
// export const FirebaseProvider = {
//   provide: "FIREBASE_ADMIN",
//   useFactory: (configService: ConfigService) => {
//     admin.initializeApp({
//       credential: admin.credential.cert(
//         configService.firebaseConfig as admin.ServiceAccount
//       ),
//     });
//     return admin;
//   },
//   inject: [ConfigService],
// };

import * as admin from "firebase-admin";
import { ConfigService } from "../shared/config/config.service";

export const FirebaseProvider = {
  provide: "FIREBASE_ADMIN",
  useFactory: (configService: ConfigService) => {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          configService.firebaseConfig as admin.ServiceAccount
        ),
      });
    }
    return admin;
  },
  inject: [ConfigService],
};
