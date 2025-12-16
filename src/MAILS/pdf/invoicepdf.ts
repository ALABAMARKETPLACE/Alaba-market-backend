const invoicePdf = (data: any) => {
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="background-color: #fff">
        <div
          style="
            // box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
            // transition: 0.3s;
            
            background-color: #fff;
            margin: 0 auto;
            height:100%;
          "
        >
          <div style="text-align: center">
            <div style="border-top: 20px solid #a10244"></div>
            <br />
            <div style="color: #262941; font-weight: bold; font-size: 20px">
              TAX INVOICE
            </div>
          </div>
    
          <div style="padding: 20px">
            <p style="font-size: 16px">Sold By: Alaba Marketplace</p>
            <p
              style="
                font-size: 13px;
                color: rgb(29, 29, 29);
                word-break: break-all;
                text-align: start;
                margin: 0px;
                white-space: wrap;
              "
            >
              <span style="font-weight: bold">Invoice Address:</span>${
                data?.newInvoice?.invoice_address ?? ""
              }
            </p>
            <div style="display: flex; justify-content: end">
              <p
                style="
                  border: 1px dotted black;
                  padding: 4px;
                  margin: 0px;
                  font-size: 13px;
                "
              >
                <span style="font-weight: bold"> Invoice Number:</span
                >${data?.newInvoice?.invoice_id ?? ""}
              </p>
            </div>
            <hr />
            <table
              style="
                width: 100%;
                table-layout: fixed;
                background-color: rgb(243, 243, 243);
                padding: 10px;
              "
            >
              <tr>
                <td>
                  <div style="font-weight: bold; font-size: 13px">
                    Invoice Date: ${
                      new Date(data?.newInvoice?.issue_date).toLocaleDateString(
                        "en-GB",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        }
                      ) ?? ""
                    }
                  </div>
                  <div style="font-weight: bold; font-size: 13px">
                    Due Date:  ${
                      new Date(data?.newInvoice?.due_date).toLocaleDateString(
                        "en-GB",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        }
                      ) ?? ""
                    }
                  </div>
                 
                </td>
                <td>
                  <div style="font-weight: bold; font-size: 13px;  white-space: wrap;">
                    <p style="word-break: break-all;">
                      Bill To:${data?.newInvoice?.to_name + "<br/>" ?? ""}
                     ${data?.newInvoice?.delivery_address ?? ""}</p>
                  </div>
                </td>
              </tr>
            </table>
            <br>
            <div style="font-size: 13px;">Total Items: ${
              data?.newItems.length ?? 0
            }</div>
            <table style="font-size: 13px; width: 100%;
            table-layout: fixed;
            ">
            <thead>
              <tr style="background-color: rgb(245, 245, 245);">
                <th >Product</th>
                <th >Title</th>
                <th >Qty</th>
                <th >Price</th>
                <th >Discount</th>
                <th >Vat</th>
                <th >Total</th>
              </tr>
            </thead>
              <tbody>
              ${data?.newItems?.map((item: any) => {
                return `<tr style="text-align: center;">
                <td >${item?.product ?? "----"}</td>
                <td >${item?.title ?? "----"}</td>
                <td >${item?.quantity ?? "----"}</td>
                <td >${item?.netPrice ?? "----"}</td>
                <td >${item?.totalDiscount ?? "----"}</td>
                <td >${item?.totalVat ?? "----"}</td>
                <td >${item?.total ?? "----"}</td>
              </tr>`;
              }).join('')}
              </tbody>
             
              
            </table>
            <hr>
            <table style="font-size: 13px; width: 100%;
            table-layout: fixed;
            ">
            <thead>
              <tr style="background-color: rgb(245, 245, 245);">
                <th colspan="2">Total</th>
                <th >${data?.total_quantity ?? 0}</th>
                <th >${data?.newInvoice?.sub_total ?? 0}</th>
                <th >${data?.newInvoice?.overall_discount ?? 0}</th>
                <th >${data?.newInvoice?.total_vat ?? 0}</th>
                <th >${data?.newInvoice?.total_amount ?? 0}</th>
              </tr>
            </thead>
            </table><br>
            <div style="display: flex; justify-content: end;">
              <span style="font-size: 14px;font-weight: bold;">Grand Total:&nbsp;${
                data?.newInvoice?.total_amount ?? 0
              }</span></div>
            <br /><br>
            <div style="display: flex; justify-content: end;"><span style="font-size: 13px;">Authorized signatory</span></div>
            <hr>
            <br><br><br>
            <p style="font-size: 13px;">
              This email was sent from a notification-only address that cannot
              accept incoming email. Please do not reply to this message.
            </p>
          </div>
          
        </div>
      </body>
    </html>`;
};
export { invoicePdf };
