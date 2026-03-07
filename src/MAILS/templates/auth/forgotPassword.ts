const RequestPasswdChangeTemplate = (Details, token) => {
  const email = `${process.env.BASE_URL}reset-password/${token}`;
  return {
    to: Details?.email,
    subject: "Reset your password",
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
            max-width: 600px;
            background-color: #fff;
            margin: 0 auto;
          "
        >
          <div style="text-align: center">
            <br />
            <div style="border-top: 20px solid ${process.env.COLOR}">
              <img
                src="${process.env.LOGO}"
                alt="logo"
                style="width: 200px; height: 70px; object-fit: contain"
              />
            </div>
            <br />
            <div style="color: #262941; font-weight: bold; font-size: 20px">
              Reset Your Password
            </div>
            <br />
          </div>
    
          <div style="padding: 20px">
            <p style="font-size: 16px">Hello ${Details.name},</p>
            <p style="font-size: 13px; color: gray">
              We have got a request to reset your password.
            </p>
            <p class="txt1">
              if you did'nt make the request ,just ignore the message.Otherwise ,you
              can reset your password.
            </p>
            <div style="align-content: center;">
            <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="border-radius: 20px; background-color: ${process.env.COLOR}; padding: 10px 20px;">
              <a href="${email}" style="text-decoration: none; color: white;">
              Reset
            </a>
          </td>
        </tr>
                </table>
              
            </div>
            <br />
            <p class="txt2">Or paste this link into your browser :</p>
            <a class="" href="${email}" target="”_blank">${email}</a>
            <br />
            <br />
            <div class="txt3">this link will expire in 5 min</div>
            <p>Team ${process.env.NAME}</p>
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

module.exports = RequestPasswdChangeTemplate;
