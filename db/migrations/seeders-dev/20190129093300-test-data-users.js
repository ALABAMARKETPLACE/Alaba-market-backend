"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("STORE", [
      {
        id:1,
        first_name: "admin",
        last_name: "User",
        name: "admin",
        email: "admin@123.com",
        code: "+91",
        phone: "1122334455",
        business_location: "test",
        business_address: "test",
        business_type: "fancy",
        agreement: "",
        trn_number: "1221123dffsfs",
        trade_lisc_no: "asdsadacxcc",
        seller_name: "admin",
        seller_country: "India",
        birth_country: "India",
        dob: "1997-12-03 07:50:07.385+00",
        id_proof: "",
        id_type: "passport",
        id_issue_country: "India",
        id_expiry_date: "2024-12-03 07:50:07.385+00",
        store_name: "adminstore",
        upscs: "",
        manufacture: "no",
        trn_upload: "",
        logo_upload: "",
        status: "approved",
        status_remark: "admin",
        sid:"69ab5771-d77a-4273-ab93-0a3619b92c82",
        createdAt: "2023-12-03 07:50:07.385+00",
        updatedAt: "2023-12-03 07:50:07.385+00",
      },
    ]);
    await queryInterface.bulkInsert("USER", [
      {
        username: "admin@123",
        password:
          "$2a$10$nt194MVrTzTbF7E7TSz7n.9pHMvXpnvM0pa6VzlClKBMhLGPXbAHS",
        first_name: "admin",
        last_name: "User",
        name: "admin",
        email: "admin@123.com",
        countrycode: "+91",
        phone: "1122334455",
        image: "https://cdn-icons-png.flaticon.com/512/9131/9131529.png",
        type: "admin",
        mail_verify: true,
        phone_verify: true,
        status: true,
        role: "admin",
        store_id: 1,
        uid:"fcfb85c0-b924-4818-aaca-407f02a2630a",
        createdAt: "2023-12-03 07:50:07.385+00",
        updatedAt: "2023-12-03 07:50:07.385+00",
      },
    ]);
    await queryInterface.bulkInsert("SETTINGS", [
      {
        id:1,
        type: "multi",
        isLocation: false,
        currency: "AED",
        adminEmail: "test@gmail.com",
        supportInfoEmail: "test@gmail.com",
        contactEmail: "test@gmail.com",
        contactNumber: "+911234567890",
        address: "test address",
        radius: 12,
        createdAt: "2023-12-03 07:50:07.385+00",
        updatedAt: "2023-12-03 07:50:07.385+00",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {},
};
