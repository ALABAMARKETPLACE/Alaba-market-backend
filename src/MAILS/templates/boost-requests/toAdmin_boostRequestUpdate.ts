const ToAdminBoostRequestUpdate = async (
  oldRequest: any,
  updatedRequest: any,
  adminEmail: string
) => {
  try {
    let obj = {
      to: adminEmail,
      subject: `Boost Request Updated`,
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
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              padding: 20px 0;
            "
          >
            <div
              style="background-color:${
                process.env.COLOR
              }; height: 20px; margin: 0 auto"
            ></div>
      
            <img
              src="${process.env.LOGO}"
              alt="Company Logo"
              style="max-width: 50%; height: auto; display: block; margin: 0 auto"
            />
      
            <h1>Greetings from ${process.env.NAME}</h1>
      
            <!-- Content -->
            <div style="text-align: left; padding: 20px">
              <p>Hello Admin,</p>
              <p style="padding-left: 10px">  
              A boost request has been updated by the seller:
              </p>
              
              <h3 style="padding-left: 10px; color: ${
                process.env.COLOR
              }">Seller Information</h3>
              <ul>
                <li style="padding-left: 10px">
                  <strong>Seller Name:</strong> ${
                    updatedRequest?.seller?.name || "N/A"
                  }
                </li>
                <li style="padding-left: 10px">
                  <strong>Email:</strong> ${
                    updatedRequest?.seller?.email || "N/A"
                  }
                </li>
                <li style="padding-left: 10px">
                  <strong>Phone:</strong> ${
                    updatedRequest?.seller?.phone || "N/A"
                  }
                </li>
              </ul>

              <h3 style="padding-left: 10px; color: #e74c3c">Previous Request Details</h3>
              <ul>
                <li style="padding-left: 10px">
                  <strong>Boost Plan:</strong> ${
                    oldRequest?.plan?.name || "N/A"
                  }
                </li>
                <li style="padding-left: 10px">
                  <strong>Product Count:</strong> ${
                    oldRequest?.product_ids?.length || 0
                  } products
                </li>
                <li style="padding-left: 10px">
                  <strong>Duration:</strong> ${oldRequest?.days || 0} days
                </li>
                <li style="padding-left: 10px">
                  <strong>Total Amount:</strong> ${
                    oldRequest?.total_amount || 0
                  } AED
                </li>
              </ul>
              
              <h3 style="padding-left: 10px; color: #27ae60">Updated Request Details</h3>
              <ul>
                <li style="padding-left: 10px">
                  <strong>Boost Plan:</strong> ${
                    updatedRequest?.plan?.name || "N/A"
                  }
                </li>
                <li style="padding-left: 10px">
                  <strong>Plan Details:</strong> ${
                    updatedRequest?.plan?.min_products || 0
                  } - ${updatedRequest?.plan?.max_products || 0} products, ${
        updatedRequest?.plan?.duration_days || 0
      } days, ₦${updatedRequest?.plan?.price || 0}
                </li>
                <li style="padding-left: 10px">
                  <strong>Product Count:</strong> ${
                    updatedRequest?.product_ids?.length || 0
                  } products
                </li>
                <li style="padding-left: 10px">
                  <strong>Duration:</strong> ${updatedRequest?.days || 0} days
                </li>
                <li style="padding-left: 10px">
                  <strong>Total Amount:</strong> ${
                    updatedRequest?.total_amount || 0
                  } AED
                </li>
                <li style="padding-left: 10px">
                  <strong>Status:</strong> ${
                    updatedRequest?.status || "pending"
                  }
                </li>
                ${
                  updatedRequest?.remarks
                    ? `
                <li style="padding-left: 10px">
                  <strong>Remarks:</strong> ${updatedRequest.remarks}
                </li>
                `
                    : ""
                }
              </ul>
              <p style="padding-top: 20px">Please review the updated boost request.</p>
              <p style="padding-top: 10px">Thank you</p>
            </div>
            
      
            <div
              style="
                background-color:${process.env.COLOR};
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
                Founded in 2023 by UAE, with a group of businessmen, ${
                  process.env.NAME
                } leverages
                the power of marketing intelligence and e-commerce vision to deliver a
                wide range of products that make your lifestyle more attractive..
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
export { ToAdminBoostRequestUpdate };






