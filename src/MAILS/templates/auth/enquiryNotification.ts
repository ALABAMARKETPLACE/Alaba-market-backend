const EnquiryNotification = (Details: any) => {
  const fromEmail = Details?.email || "unknown";
  const message = Details?.message || "";

  return {
    to: Details?.to,
    subject: `New Enquiry from ${fromEmail}`,
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
              New Enquiry Received
            </div>
            <br />
          </div>

          <div style="padding: 20px">
            <p style="font-size: 16px">Hello,</p>
            <p style="font-size: 13px; color: gray">
              You have received a new enquiry on ${process.env.NAME}.
            </p>
            <p style="font-size: 14px">
              <b>From:</b> ${fromEmail}
            </p>
            <p style="font-size: 14px"><b>Message:</b></p>
            <div
              style="
                background: #f7f7f7;
                padding: 12px;
                border-radius: 8px;
                white-space: pre-wrap;
                font-size: 14px;
              "
            >
              ${message}
            </div>
            <br />
            <p>Team ${process.env.NAME}</p>
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

module.exports = EnquiryNotification;
