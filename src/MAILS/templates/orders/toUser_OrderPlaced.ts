const ToUserOrderPlaced = async ({
  user,
  newOrder,
  store,
  address,
  products,
}) => {
  const moment = require("moment");

  try {
    let InvoiceDetailsHTML: any = "";
    let Rows = products?.forEach(function (item) {
      InvoiceDetailsHTML += `<tr>
      <td>
          <div>
          <img src="${
            item?.image
          }" alt="logo" class="logo13"  style="width: 50px; height: 50px; object-fit: contain;"/>
          </div>
      </td>
      <td>
          <div>Product Name:${item && item?.name}</div>
          <div>Price: ${item && item?.price} * Quantity: ${
        item && item?.quantity
      }</div>
          <div>Sold by: ${store?.store_name}</div>
      </td>
  </tr>`;
    });
    let formattedDate = moment(newOrder?.createdAt).format("MM/DD/YYYY");
    let obj = {
      to: user?.email,
      subject: `Your ${process.env.NAME} Order Placed`,
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
            <div style="color: #262941; font-weight: bold; font-size: 20px">
              You Have a new order
            </div>
            <div>Order # ${newOrder?.order_id}</div>
            <br />
          </div>
    
          <div style="text-align: justify; padding: 0 30px">
            <p>Hello ${user?.name},</p>
            <p>
              Thank you for shopping with us. We'd like to let you know that
              ${
                store?.store_name
              } has received your order and is preparing it for
              shipment. Your estimated delivery date is indicated below. If you
              would like to view the status of your order or make any changes to it,
              please visit Your Orders on <a style="text-decoration: none; color: inherit"
                href="https://www.${process.env.WEBSITE}/profile/orders">${
        process.env.WEBSITE
      }<a/>.
            </p>
          </div>
          <div
            style="
              background-color: #f4f4f4;
              padding: 0px 10px;
              height: auto;
              margin: 0 30px;
              border-top: 4px solid;
              color: black;
              display: flex;
              justify-content: space-between;
            "
          >
            <div style="flex: 0.75; text-align: left">
              <p>Arriving:</p>
              <p>In two days</p>
              <a
                href="https://www.${process.env.WEBSITE}/profile/orders"
                style="
                  text-decoration: none;
                  color: white;
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: ${process.env.COLORPRIMARY};
                  border-radius: 5px;
                  margin-top: 10px;
                "
                >View Order</a
              >
            </div>
            <div style="flex: 1.5; text-align: right; width: 50%">
              <p>Your order will be sent to:</p>
              <div class="txt2">
              ${user.name ?? ""},
                ${address?.flat}, ${address?.street}, ${address?.city},
                ${address?.state}, ${address?.pin_code}
                <br />
                Contact Number:${address?.code ?? ""} ${address?.alt_phone}
              </div>
            </div>
          </div>
          <div style="padding: 0px 30px; height: auto; text-align: justify">
            <p style="font-size: larger">Order summary</p>
            <p>Placed on ${formattedDate}</p>
            <hr style="border: 0; border-top: 1px solid #ccc" />
            <table>
            ${InvoiceDetailsHTML}
          </table>
            <table>
              <tr>
                <td>Total Product Price:</td>
                <td>${process.env.CURRENCY} ${Number(newOrder?.total)?.toFixed(
        2
      )}</td>
              </tr>
              <tr>
                <td>TAX:</td>
                <td>${process.env.CURRENCY} ${Number(newOrder?.tax)?.toFixed(
        2
      )}</td>
              </tr>
              <tr>
                <td>Delivery Charges:</td>
                <td>${process.env.CURRENCY} ${Number(
        newOrder.deliveryCharge
      )?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Discounts:</td>
                <td>${process.env.CURRENCY} ${Number(
        newOrder.discount
      )?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Total:</td>
                <td>${process.env.CURRENCY} ${Number(
        newOrder.grandTotal
      )?.toFixed(2)}</td>
              </tr>
            </table>
            <hr
              style="border: 0; border-top: 1px solid #ccc; margin-bottom: 10px"
            />
            <p>
              To ensure your safety, the Delivery Agent will drop the package at
              your doorstep, ring the doorbell and then move back to maintain
              adequate distance while waiting for you to collect your package.
            </p>
            <p>We hope to see you again soon.</p>
            <a style="text-decoration: none; color: inherit"
                href="https://www.${process.env.WEBSITE}/profile/orders">${
        process.env.WEBSITE
      }<a/>
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
    let obj = {};
    return obj;
  }
};
export { ToUserOrderPlaced };
