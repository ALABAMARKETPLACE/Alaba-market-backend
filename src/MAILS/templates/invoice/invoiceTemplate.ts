const InvoiceHtml = async (Details: any, token: string) => {
  const deactivationLink = `${process.env.BASE_URL}invoice/${token}`;
  let obj = {
    to: Details?.to_mail,
    subject: `Invoice Generated`,
    template: `
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div
          style="
            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
            transition: 0.3s;
            border-radius: 10px;
            max-width: 600px;
            background-color: #ffffff;
            margin: 0 auto;
          "
        >
          <div style="text-align: center">
            <div style="border-top: 20px solid ${
              process.env.COLOR
            }; background-color: #ececec">
              <img
                src="${process.env.LOGO}"
                alt="logo"
                style="width: 200px; height: 70px; object-fit: contain"
              />
            </div>
            <br />
            <div style="color: #262941; font-weight: bold; font-size: 20px">
              Invoice Generated
            </div>
            <br />
          </div>
    
          <div style="padding: 20px">
            <p style="font-size: 13px; color: gray">
              You have a new Invoice with invoice ID:${
                Details.invoice_id ?? ""
              }, open the url
              below to view the invoice. also attached in the email itself.
            </p>
            <table
              role="presentation"
              align="center"
              cellspacing="0"
              cellpadding="0"
              border="0"
            >
              <tr>
                <td
                  style="
                    border-radius: 20px;
                    background-color: ${process.env.COLOR};
                    padding: 10px 20px;
                  "
                >
                  <a
                    href="${deactivationLink}"
                    style="text-decoration: none; color: white"
                  >
                   View Invoice
                  </a>
                </td>
              </tr>
            </table>
            <br />
            <p class="txt2">Or paste this link into your browser :</p>
            <a class="" href="${deactivationLink}" target="_blank"
              >${deactivationLink}</a
            >
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
               Founded in 2025 by the Alaba Amalgamated Traders Union in partnership with Taxgoglobal Corporation, 
              ${
                process.env.NAME
              } leverages the power of marketing intelligence and e-commerce vision to deliver a wide range of products that make your lifestyle more attractive.
            </p>
          </div>
        </div>
      </body>
    </html>
    
        `,
  };
  return obj;
};
export { InvoiceHtml };
