// test-token-generator.ts
import * as jwt from "jsonwebtoken";

const payload = {
  data: {
    amount: 2500,
    tax: 0,
    discount: 0,
    deliveryCharges: [
      {
        storeId: 1,
        totalCharge: 2500,
      },
    ],
  },
};

const token = jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
  expiresIn: "1h",
});

console.log("Delivery Token:", token);
