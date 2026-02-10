const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"HastaKrafts Nepal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset OTP - HastaKrafts",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #2C1810; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #D4813F 0%, #8B4513 100%);
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content { 
              background: #FFF8DC; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .otp-box { 
              background: white; 
              border: 3px dashed #D4813F; 
              padding: 20px; 
              text-align: center; 
              font-size: 32px; 
              font-weight: bold; 
              letter-spacing: 8px; 
              margin: 20px 0;
              color: #D4813F; 
              border-radius: 10px; 
            }
            .warning {
              color: #DC2626;
              font-weight: bold;
              margin: 15px 0;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              color: #78716C; 
              font-size: 12px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HastaKrafts Nepal</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>You requested to reset your password. Please use the OTP code below:</p>
              <div class="otp-box">${otp}</div>
              <p class="warning">This OTP will expire in 10 minutes.</p>
              <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>2025 HastaKrafts Nepal. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully to:", email);
    console.log("Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw new Error("Failed to send email. Please check your email configuration.");
  }
};

module.exports = { sendOTPEmail };