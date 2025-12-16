const ForgottPassword = (Details) => {
  return `<!DOCTYPE html
    PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="format-detection" content="date=no" />
  <meta name="format-detection" content="address=no" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <link href="https://fonts.googleapis.com/css?family=Muli:400,400i,700,700i" rel="stylesheet" />
  <style type="text/css" media="screen">
      .box {
          box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
          transition: 0.3s;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          max-width: 500px;
      }

      .txt {
          color: #000;
          font-weight: bold;
          font-size: 20px;
      }

      .txt1 {
          color: gray;
          font-family: 14px;
      }

      .button {
          background-color: #21c46a;
          color: #fff;
          border: 0px;
          padding: 10px 50px;
          border-radius: 5px;
      }

      .txt2 {
          color: gray;
          font-family: 10px;
          margin-bottom: -0px;
      }

      .logo13 {
          width: 70px;
          height: 70px;
          object-fit: contain;
      }
      .txt3{
        color:"red";
      }
  </style>
</head>

<body>
  <div class="box">
      <div class="txt3">this link will expire in 5 min</div>
  </div>
</body>
</footer>

</html>
    
    
    `;
};

module.exports = ForgottPassword;
