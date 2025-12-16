const ToUserOrderSubstitution = async ({
    user,
    order,
    store,
    address,
    originalProduct,
    substitutedProducts, // Array of substitute products
  }) => {
    const moment = require("moment");
  
    try {
      let formattedDate = moment(order?.createdAt).format("MM/DD/YYYY");
      
      // Create the original product part
      let originalProductHTML = `
      <tr>
        <td colspan="2" style="padding: 10px 0; background-color: #f9f9f9; text-align: center; font-weight: bold; color: #e74c3c;">
          PRODUCT SUBSTITUTION NOTICE
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 15px; background-color: #f9f9f9;">
          <div style="font-weight: bold; color: #888; margin-bottom: 10px; text-align: center;">ORIGINAL PRODUCT (UNAVAILABLE)</div>
          <div style="display: flex; align-items: center;">
            <div style="flex: 0 0 100px; margin-right: 15px;">
              <img src="${originalProduct?.image}" alt="Original product" style="width: 80px; height: 80px; object-fit: contain;"/>
            </div>
            <div style="flex: 1; text-align: left;">
              <div style="font-weight: bold;">${originalProduct?.name}</div>
              <div>Price: ${process.env.CURRENCY} ${originalProduct?.price}</div>
              <div>Quantity: ${originalProduct?.quantity}</div>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 10px 0; background-color: #f9f9f9; text-align: center; font-weight: bold; color: #27ae60;">
          SUBSTITUTION OPTIONS
        </td>
      </tr>`;
      
      // Create the substituted products part
      let substitutedProductsHTML = "";
      
      substitutedProducts.forEach((product, index) => {
        substitutedProductsHTML += `
        <tr>
          <td colspan="2" style="padding: 15px; ${index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f5f5f5;'} border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center;">
              <div style="flex: 0 0 100px; margin-right: 15px;">
                <img src="${product?.image}" alt="Substitution option ${index + 1}" style="width: 80px; height: 80px; object-fit: contain;"/>
              </div>
              <div style="flex: 1; text-align: left;">
                <div style="font-weight: bold;">${product?.name}</div>
                <div>Price: ${process.env.CURRENCY} ${product?.price}</div>
                <div>Quantity: ${product?.quantity}</div>
                <div style="margin-top: 10px;">
                  <a href="https://www.${process.env.WEBSITE}/user/orders/${order?.order_id}"
                    style="
                      text-decoration: none;
                      color: white;
                      display: inline-block;
                      padding: 5px 15px;
                      background-color: #27ae60;
                      border-radius: 3px;
                      font-size: 14px;
                    "
                  >Select This Product</a>
                </div>
              </div>
            </div>
          </td>
        </tr>`;
      });
      
      // Combine to create the substitution details
      let substitutionDetailsHTML = originalProductHTML + substitutedProductsHTML;
      
      // Add the seller information
      substitutionDetailsHTML += `
      <tr>
        <td colspan="2" style="padding: 10px; background-color: #f9f9f9; text-align: center;">
          <div>Sold by: ${store?.store_name}</div>
        </td>
      </tr>`;
  
      // Create the rest of the product items list if there are other products
      let otherProductsHTML = "";
      if (order?.products && order.products.length > 0) {
        order.products.forEach(function (item) {
          if (item.id !== originalProduct.id) {
            otherProductsHTML += `<tr>
            <td>
                <div>
                <img src="${item?.image}" alt="logo" class="logo13" style="width: 50px; height: 50px; object-fit: contain;"/>
                </div>
            </td>
            <td>
                <div>Product Name: ${item && item?.name}</div>
                <div>Price: ${process.env.CURRENCY} ${item && item?.price} * Quantity: ${
              item && item?.quantity
            }</div>
                <div>Sold by: ${store?.store_name}</div>
            </td>
        </tr>`;
          }
        });
      }
  
      // Only show other products section if there are other products
      let otherProductsSection = otherProductsHTML ? 
        `<p style="font-size: larger">Other items in your order:</p>
        <table>
          ${otherProductsHTML}
        </table>` : '';
  
      let obj = {
        to: user?.email,
        subject: `Product Substitution Options for Your ${process.env.NAME} Order #${order?.order_id}`,
        template: `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
      
        <body
          style="
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          "
        >
          <div
            style="
              max-width: 640px;
              margin: 0 auto;
              background-color: #fff;
              padding: 20px 0;
            "
          >
            <div style="text-align: center">
              <br />
              <div style="border-top: 20px solid ${process.env.COLORPRIMARY}">
                <img
                  src="${process.env.LOGO}"
                  alt="logo"
                  style="width: 200px; height: 70px; object-fit: contain"
                />
              </div>
              <br />
              <div style="color: #e74c3c; font-weight: bold; font-size: 20px">
                Product Substitution Options
              </div>
              <div>Order # ${order?.order_id}</div>
              <br />
            </div>
      
            <div style="text-align: justify; padding: 0 30px">
              <p>Hello ${user?.name},</p>
              <p>
                We hope this email finds you well. We'd like to inform you that for your recent order
                (Order #${order?.order_id}), ${store?.store_name} has requested to substitute one of your selected products
                with a similar alternative due to availability issues.
              </p>
              <p>
                <strong>Please review the substitution options below and select one:</strong>
              </p>
            </div>
            
            <div
              style="
                padding: 0px 30px;
                margin: 20px 0;
                border: 1px solid #eee;
                border-radius: 5px;
              "
            >
              <table style="width: 100%; border-collapse: collapse;">
                ${substitutionDetailsHTML}
              </table>
            </div>
    
            <div style="text-align: center; padding: 0 30px; margin: 20px 0;">
              <a
                href="https://www.${process.env.WEBSITE}/user/orders/${order?.order_id}"
                style="
                  text-decoration: none;
                  color: white;
                  display: inline-block;
                  padding: 10px 30px;
                  background-color: #e74c3c;
                  border-radius: 5px;
                "
                >Reject All Options</a
              >
              <p style="font-size: 13px; color: #777; margin-top: 10px;">
                If you don't select any option within 24 hours, the order for this item will be canceled and refunded.
              </p>
            </div>
    
            <div
              style="
                background-color: #f4f4f4;
                padding: 15px;
                margin: 0 30px;
                border-radius: 5px;
              "
            >
              <div style="text-align: left">
                <p><strong>Order Summary</strong></p>
                <p>Placed on ${formattedDate}</p>
                <p>Your order will be sent to:</p>
                <div>
                  ${user.name ?? ""},
                  ${address?.flat}, ${address?.street}, ${address?.city},
                  ${address?.state}, ${address?.pin_code}
                  <br />
                  Contact Number: ${address?.code ?? ""} ${address?.alt_phone}
                </div>
              </div>
            </div>
    
            <div style="padding: 0px 30px; height: auto; text-align: justify; margin-top: 20px;">
              <hr style="border: 0; border-top: 1px solid #ccc" />
              
              ${otherProductsSection}
              
              <table style="width: 100%; margin-top: 20px;">
                <tr>
                  <td>Total Product Price:</td>
                  <td>${process.env.CURRENCY} ${Number(order?.total)?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>TAX:</td>
                  <td>${process.env.CURRENCY} ${Number(order?.tax)?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Delivery Charges:</td>
                  <td>${process.env.CURRENCY} ${Number(order.deliveryCharge)?.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Discounts:</td>
                  <td>${process.env.CURRENCY} ${Number(order.discount)?.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: bold;">
                  <td>Total:</td>
                  <td>${process.env.CURRENCY} ${Number(order.grandTotal)?.toFixed(2)}</td>
                </tr>
              </table>
              
              <p style="margin-top: 20px;">
                <strong>Note:</strong> If the price of your selected substitute product differs from your original selection, 
                the appropriate adjustment will be made to your final order total after your confirmation.
              </p>
    
              <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
              
              <p>
                If you have any questions about these substitution options, please contact our customer service at
                <a href="mailto:support@${process.env.WEBSITE}">support@${process.env.WEBSITE}</a>.
              </p>
              
              <p>Thank you for your understanding and continued support.</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a
                  href="https://www.${process.env.WEBSITE}/user/orders/${order?.order_id}"
                  style="
                    text-decoration: none;
                    color: white;
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: ${process.env.COLORPRIMARY};
                    border-radius: 5px;
                    margin-right: 10px;
                  "
                  >View This Order</a
                >
                <a
                  href="https://www.${process.env.WEBSITE}/user/orders"
                  style="
                    text-decoration: none;
                    color: white;
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: ${process.env.COLORPRIMARY};
                    border-radius: 5px;
                  "
                  >View All Orders</a
                >
              </div>
            </div>
      
            <div
              style="
                background-color: ${process.env.COLORPRIMARY};
                height: auto;
                margin: 0 auto;
                padding: 10px 40px;
                text-align: justify;
                color: white;
                font-size: x-small;
              "
            >
              <h2 style="text-align: center; color: white">
                <span style="text-decoration: none; color: inherit">
                  <a
                    href="${process.env.BASE_URL}"
                    style="text-decoration: none; color: inherit"
                    >${process.env.NAME}</a
                  >
                </span>
              </h2>
              <p>
                Founded in 2023 by a group of businessmen in UAE, ${
                  process.env.NAME
                } leverages the
                power of marketing intelligence and e-commerce vision to deliver a
                wide range of products that make your lifestyle more attractive.
              </p>
            </div>
          </div>
        </body>
      </html>
        `,
      };
      return obj;
    } catch (err) {
      console.error("Error in ToUserOrderSubstitution:", err);
      let obj = {};
      return obj;
    }
  };
  
  export { ToUserOrderSubstitution };