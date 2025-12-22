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
   
    const cfg = configService.firebaseConfig;
    console.log("Firebase project_id:", cfg.project_id);
    console.log("Private key starts with:", cfg.private_key?.slice(0, 30));
    
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



