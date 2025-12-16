
const ToSellerOrderPlaced = async ({
  user,
  newOrder,
  store,
  address,
  products,
}) => {
  const moment = require("moment");
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
  try {
    let formattedDate = moment(newOrder?.createdAt).format("MM/DD/YYYY");
    let obj = {
      to: store?.email,
      subject: `New Order Placed`,
      template: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="background-color: #f4f4f4">
          <div
            style="
              box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
              transition: 0.3s;
              border-radius: 10px;
              max-width: 640px;
              background-color: #fff;
              margin: 0 auto;
            "
          >
            <div style="text-align: center">
              <br />
              <div
                style="
                  border-top: 20px solid ${process.env.COLOR};
                "
              >
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
      
            <div style="padding: 20px">
              <p style="font-size: 16px">Hello ${store?.store_name},</p>
              <p style="font-size: 13px; color: gray">
                You have a new order. The order details are given below.
                Please make necessary updates by loggin in to your dashboard. If you would like to
                know more , please visit
                Orders on ${process.env.WEBSITE}.
              </p>
              <br />
              <table
                style="
                  width: 100%;
                  table-layout: fixed;
                  background-color: rgb(255, 248, 248);
                  border-radius: 10px;
                  padding: 10px;
                "
              >
                <tr>
                  <td>
                    <div style="font-weight: 900">Placed on ${formattedDate}</div>
                    <div style="font-size: 13px; color: gray">
                      Your shipping speed : Delivery
                    </div>
                    <div style="font-size: 13px; color: gray">
                      Order Status : ${newOrder?.status}
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 14px">This order will be sent to:</div>
                    <div style="font-size: 13px; color: gray">
                    ${user.name},
                      ${address?.flat}, ${address?.street},
                      ${address?.city}, ${address?.state},
                      ${address?.pin_code}
                      <br />
                      Contact Number:${address?.code ?? ""} ${
        address?.alt_phone
      }
                    </div>
                  </td>
                </tr>
              </table>
              <br />
              <p class="txt1">Order summary</p>
              <table>
                ${InvoiceDetailsHTML}
              </table>
              <hr />
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
                  <td>${process.env.CURRENCY} ${Number(newOrder.discount)?.toFixed(
        2
      )}</td>
                </tr>
                <tr>
                  <td>Total:</td>
                  <td>${process.env.CURRENCY} ${Number(newOrder.grandTotal)?.toFixed(
        2
      )}</td>
                </tr>
              </table>
              <br />
              <p class="font-size: 11px; color: gray;">
                This email was sent from a notification-only address that cannot
                accept incoming email. Please do not reply to this message.
              </p>
            </div>
            <div
              style="
                background-color: ${process.env.COLOR};
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
                Founded in 2023 by a group of businessmen in UAE, ${process.env.NAME} leverages the
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
export { ToSellerOrderPlaced };
