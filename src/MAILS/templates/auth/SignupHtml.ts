const SignupHtml = (addUser, token) => {
  return {
    to: addUser?.email,
    subject: "New Account Created",
    template: `<!DOCTYPE html>
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
            <div style="border-top: 20px solid ${process.env.COLOR}; background-color: #ececec;">
              <img
                src="${process.env.LOGO}"
                alt="logo"
                style="width: 200px; height: 70px; object-fit: contain"
              />
            </div>
            <br />
            <div style="color: #262941; font-weight: bold; font-size: 20px">
              Greetings from ${process.env.NAME}!
            </div>
            <br />
          </div>
    
          <div style="padding: 20px">
            <p style="font-size: 16px">Hello ${addUser?.name},</p>
            <p style="font-size: 13px; color: gray">
              Congratulations ! You have just created a ${process.env.NAME} account. You can now
              order products through ${process.env.NAME}. If you would like go through a wide
              range of products, please visit ${process.env.WEBSITE}.
            </p>
            <p>Best Regards,</p>
            <p>Team ${process.env.NAME}</p>
            <br />
    
            <br />
            <hr />
            <table>
              <tr>
                <td
                  style="border-right: 1px dotted #000; width: 50%; padding: 10px"
                >
                  <div>
                    <p>What Next?</p>
                    <p>
                      Enjoy your shopping! Visit the My Orders page to see your
                      order history
                    </p>
                  </div>
                </td>
                <td style="width: 50%; padding: 10px">
                  <div>
                    <p>Want to become a Seller?</p>
                    <p>Click on seller Registration on ${process.env.NAME}.com</p>
                  </div>
                </td>
              </tr>
            </table>
            <br />
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
               Founded in 2026 by the Alaba Amalgamated Traders Union in partnership with Taxgoglobal Corporation, 
              ${process.env.NAME} leverages the power of marketing intelligence and e-commerce vision to deliver a wide range of products that make your lifestyle more attractive.
            </p>
          </div>
        </div>
      </body>
    </html>
    `,
  };
};

module.exports = SignupHtml;
