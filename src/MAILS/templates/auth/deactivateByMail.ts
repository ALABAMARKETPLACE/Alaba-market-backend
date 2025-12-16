const DeactivateAccountViaMail = async (Details: any, token: any) => {
  const deactivationLink = `${process.env.BASE_URL}deactivate/${token}`;
  try {
    let obj = {
      to: Details?.email,
      subject: `${process.env.NAME} Email verification`,
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
                Account Deactivation
              </div>
              <br />
            </div>
      
            <div style="padding: 20px">
              <p style="font-size: 16px">Hello ${Details?.name},</p>
              <p style="font-size: 13px; color: gray">
                We have received a request to deactivate your account associated with
                the email: <b>${Details.email}</b>.
              </p>
              <div style="text-align: center">
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
                        Confirm Deactivation
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              <br />
              <p class="txt2">Or paste this link into your browser :</p>
              <a class="" href="${deactivationLink}" target="_blank"
                >${deactivationLink}</a
              >
              <br />
              <br />
              <div class="txt3">
                Please note that this link will expire in 5 minutes.
              </div>
              <p>If you did not request this action, please disregard this email.</p>
              <br />
              <p>Best Regards,</p>
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
                Founded in 2023 by a group of businessmen in UAE, ${process.env.NAME} leverages the
                power of marketing intelligence and e-commerce vision to deliver a
                wide range of products that make your lifestyle more attractive.
              </p>
            </div>
          </div>
        </body>
      </html>`,
    };
    return obj;
  } catch (err) {
    let obj = {};
    return obj;
  }
};
module.exports = DeactivateAccountViaMail;
