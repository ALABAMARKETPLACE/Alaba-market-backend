
const medicalInsurancepdf = (data: any) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Overseas Travel Insurance</title>
    </head>
    <body style="font-size: 12pt; font-family: 'Times New Roman', Times, serif; margin: 0.5in">
    <table style="width: 100%; margin-bottom: 20px;">
          <tr>
              <td>
                  <img src="https://bairuha-bucket.s3.ap-south-1.amazonaws.com/kenya/icea-lion-logo.png" alt="ICEA LION Logo" style="width: 200px; height: 100px; display: block;">
              </td>
          </tr>
      </table>
      <table style="width: 100%">
        <tr>
          <td>SEPTEMBER 29, 2023</td>
        </tr>
      </table>
  
      <table style="width: 100%; margin-top: 10px">
        <tr>
          <td>THE VISA CONSULAR,</td>
        </tr>
        <tr>
          <td>EMBASSY OF UNITED STATES OF AMERICA</td>
        </tr>
        <tr>
          <td
            style="
              font-weight: bold;
              padding-top: 10px;
              text-decoration: underline;
            "
          >
            NAIROBI.
          </td>
        </tr>
      </table>
  
      <table
        style="
          margin-top: 20px;
          text-align: left;
          font-weight: bold;
          margin-bottom: 10px;
        "
      >
        <tr>
          <td style="padding-bottom: 30px">Dear Sir/Madam,</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px">RE: OVERSEAS TRAVEL INSURANCE</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; padding-left: 32px">
            INSURED:{placeholder_insured}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; padding-left: 32px">
            POLICY NUMBER:{placeholder_policynumber}
          </td>
        </tr>
        <tr>
          <td style="padding-left: 32px">
            ORGANIZATION: KENYA AIRWAYS
          </td>
        </tr>
      </table>
  
      <table style="width: 100%; border-top: 1px solid black">
        <tr>
          <td style="padding-bottom: 10px; padding-top: 20px">
            This is to confirm we have issued overseas travel insurance to the
            above-named who is scheduled to travel abroad.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px">
            The policy includes Emergency Medical and Evacuation benefits of USD
            {placeholder_amountXXX} respectively and is applicable worldwide
            including all Schengen States.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px">
            The policy is valid from {placeholder_date}
          </td>
        </tr>
      </table>
  
      <table style="width: 100%">
        <tr>
          <td>For any inquiries, please contact the undersigned.</td>
        </tr>
      </table>
  
      <table style="width: 100%; margin-top: 20px">
        <tr>
          <td style="padding-bottom: 10px">Yours Faithfully,</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px">For and on behalf of</td>
        </tr>
        <tr>
          <td>ICEALION General Insurance Co. Ltd</td>
        </tr>
      </table>
      <table style="width: 100%; margin-top: 80px">
        <!-- seal -->
        <tr>
          <td style="font-weight: bold;">{placeholder_name}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">{placeholder_designation}</td>
        </tr>
      </table>
  
      <table
        style="
          width: 100%;
          text-align: right;
          margin-top: 20px;
          font-size:xx-small;
        "
      >
        <tr>
          <td>ICEA LION GENERAL INSURANCE COMPANY LIMITED</td>
        </tr>
        <tr>
          <td>ICEA LION Centre, Chiromo Road</td>
        </tr>
        <tr>
          <td>PO Box 30190-00100 GPO Nairobi, Kenya</td>
        </tr>
        <tr>
          <td>T: 020 275 0000, 0730 151 000, 0719 071 000</td>
        </tr>
        <tr>
          <td>E. info@icealion.com | www.icealion.com</td>
        </tr>
        <tr>
          <td>
            Directors: Dr.C.W. Obura (Chairman), S.O. Olucch (Chief Executive
            Officer), J.K. Muiruri, E. Mwaniki, J.P.M. Ndegwa, A.S.M. Ndegwa, D.N.
            Ndegwa (Alt
          </td>
        </tr>
        <tr>
          <td>N. Karuki), JK. Kimou</td>
        </tr>
      </table>
    </body>
  </html>`;
};

module.exports = medicalInsurancepdf;
