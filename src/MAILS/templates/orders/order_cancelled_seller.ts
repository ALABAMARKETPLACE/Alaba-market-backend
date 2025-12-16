
const orderCancelSellerMail = async (
  order: any,
  user: any,
  store: any,
  items: any[],
  remark: string
) => {
  let InvoiceDetailsHTML: any = "";
  const moment = require("moment");
  items?.forEach(function (item) {
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
      </td>
  </tr>`;
  });
  try {
    let obj = {
      to: store.email ?? "",
      subject: `Order Cancelled #${order.order_id}`,
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
                    border-top: 20px solid #a10244;
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
                 Order is Cancelled
                </div>
                <div>OrderID: ${order.order_id}</div>
                <br />
              </div>
        
              <div style="padding: 20px">
                <p style="font-size: 16px">Hello ${store?.store_name},</p>
                <p style="font-size: 13px; color: gray">
                  The user has cancelled the order for #${
                    order.order_id
                  }. the order details are given below.
                   if you would like to know more about this order , please visit
                  Orders on your Seller Account.
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
                      <div style="font-weight: 900">Cancelled on ${moment(
                        order.updatedAt
                      ).format("DD/MM/YYYY")}</div>
                      <div style="font-size: 13px; color: gray">
                      User Name: ${user?.name ?? ""}
                    </div><br/>
                      <div style="font-size: 13px; color: gray">
                      Reason : ${remark}
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
                <td>${process.env.CURRENCY} ${Number(order?.total)?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>TAX:</td>
                <td>${process.env.CURRENCY} ${Number(order?.tax)?.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Delivery Charges:</td>
                <td>${process.env.CURRENCY} ${Number(order.deliveryCharge)?.toFixed(
        2
      )}</td>
              </tr>
              <tr>
                <td>Discounts:</td>
                <td>${process.env.CURRENCY} ${Number(order.discount)?.toFixed(
        2
      )}</td>
              </tr>
              <tr>
                <td>Total:</td>
                <td>${process.env.CURRENCY} ${Number(order.grandTotal)?.toFixed(
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
                  background-color: #a10244;
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
export { orderCancelSellerMail };
