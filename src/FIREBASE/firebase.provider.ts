import { createStructuredLogger } from "../shared/logger/structured-logger";
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

const appLog = createStructuredLogger("firebase_provider");

export const FirebaseProvider = {
  provide: "FIREBASE_ADMIN",
  useFactory: (configService: ConfigService) => {
   
    const cfg = configService.firebaseConfig;
    appLog.info(
      { event: "firebase_initialization", projectId: cfg.project_id },
      "Firebase provider initializing",
    );
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          cfg as admin.ServiceAccount
        ),
      });
    }
    return admin;
  },
  inject: [ConfigService],
};


