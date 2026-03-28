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

// ==================== SHARED STYLES ====================
const baseStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #2C1810; margin: 0; padding: 0; }

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

  .header h1 { margin: 0; font-size: 28px; }
  .header p { margin: 6px 0 0; opacity: 0.9; font-size: 14px; }

  .content {
    background: #FFF8DC;
    padding: 30px;
    border-radius: 0 0 10px 10px;
  }

  .content h2 { margin-top: 0; color: #2C1810; }

  .footer {
    text-align: center;
    margin-top: 20px;
    color: #78716C;
    font-size: 12px;
  }

  .btn {
    display: inline-block;
    margin: 18px 0;
    padding: 12px 28px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    color: white;
  }
`;

// ==================== OTP EMAIL ====================
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
            ${baseStyles}

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
              <p>If you did not request this, please ignore this email.</p>
            </div>

            <div class="footer">
              <p>&copy; 2025 HastaKrafts Nepal. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent to:", email, "| ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("OTP email failed:", error.message);
    throw new Error("Failed to send email. Please check your email configuration.");
  }
};

// ==================== SELLER APPROVAL EMAIL ====================
const sendSellerApprovalEmail = async (email, sellerName, shopName) => {
  const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/seller/dashboard`;

  const mailOptions = {
    from: `"HastaKrafts Nepal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Your Seller Account Has Been Approved - HastaKrafts",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${baseStyles}

            .success-box {
              background: #F0FDF4;
              border: 2px solid #86EFAC;
              border-radius: 10px;
              padding: 18px 22px;
              margin: 20px 0;
              color: #166534;
            }

            .success-icon {
              font-size: 48px;
              text-align: center;
              margin-bottom: 10px;
            }

            .steps {
              background: white;
              border-radius: 8px;
              padding: 16px 22px;
              margin: 16px 0;
            }

            .steps li {
              margin: 8px 0;
              color: #2C1810;
              font-size: 14px;
            }

            .btn-approve { background: #D4813F; }
            .btn-approve:hover { background: #B8692E; }
          </style>
        </head>

        <body>
          <div class="container">
            <div class="header">
              <h1>HastaKrafts Nepal</h1>
              <p>Seller Account Approved</p>
            </div>

            <div class="content">
              <div class="success-icon">🎉</div>

              <h2>Congratulations, ${sellerName}!</h2>

              <div class="success-box">
                <strong>Your shop "${shopName}" has been approved!</strong><br/>
                You can now start listing products and selling on HastaKrafts Nepal.
              </div>

              <p>Here's what you can do next:</p>

              <div class="steps">
                <ul>
                  <li>📦 Add your first product from your seller dashboard</li>
                  <li>🖼️ Upload high-quality photos to attract buyers</li>
                  <li>💰 Set competitive prices for your handcrafted items</li>
                  <li>📊 Track your orders and revenue from the dashboard</li>
                </ul>
              </div>

              <center>
                <a href="${dashboardUrl}" class="btn btn-approve">
                  Go to Seller Dashboard
                </a>
              </center>

              <p style="color:#78716C; font-size:13px;">
                Need help? Reply to this email or visit our support page.
              </p>
            </div>

            <div class="footer">
              <p>&copy; 2025 HastaKrafts Nepal. All rights reserved.</p>
              <p>Supporting local artisans, preserving traditional crafts.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Approval email sent to:", email, "| ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Approval email failed:", error.message);
  }
};

// ==================== SELLER REJECTION EMAIL ====================
const sendSellerRejectionEmail = async (email, sellerName, shopName, rejectionReason) => {
  const reapplyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register/seller`;

  const mailOptions = {
    from: `"HastaKrafts Nepal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Update on Your Seller Application - HastaKrafts",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${baseStyles}

            .reason-box {
              background: #FFF7ED;
              border-left: 4px solid #D4813F;
              border-radius: 0 8px 8px 0;
              padding: 14px 18px;
              margin: 20px 0;
              color: #2C1810;
            }

            .reason-box strong {
              display: block;
              margin-bottom: 6px;
              color: #9A3412;
            }

            .tips {
              background: white;
              border-radius: 8px;
              padding: 16px 22px;
              margin: 16px 0;
            }

            .tips li {
              margin: 8px 0;
              color: #2C1810;
              font-size: 14px;
            }

            .btn-reapply { background: #D4813F; }
          </style>
        </head>

        <body>
          <div class="container">
            <div class="header">
              <h1>HastaKrafts Nepal</h1>
              <p>Seller Application Update</p>
            </div>

            <div class="content">
              <h2>Hello ${sellerName},</h2>

              <p>
                Thank you for applying to sell on HastaKrafts Nepal.
                After reviewing your application for <strong>"${shopName}"</strong>,
                we were unable to approve it at this time.
              </p>

              <div class="reason-box">
                <strong>Reason for rejection:</strong>
                ${rejectionReason}
              </div>

              <p>
                Don't be discouraged — you're welcome to re-apply after addressing the feedback above.
              </p>

              <div class="tips">
                <p style="margin:0 0 8px; font-weight:700; color:#2C1810;">
                  Tips for a successful application:
                </p>

                <ul>
                  <li>Upload a clear, valid citizenship document</li>
                  <li>Provide a complete shop description</li>
                  <li>Use a professional shop logo</li>
                  <li>Ensure your contact details are accurate</li>
                </ul>
              </div>

              <center>
                <p class="btn btn-reapply">Re-apply as Seller</p>
              </center>

              <p style="color:#78716C; font-size:13px;">
                If you believe this decision was made in error, please contact our support team.
              </p>
            </div>

            <div class="footer">
              <p>&copy; 2025 HastaKrafts Nepal. All rights reserved.</p>
              <p>Supporting local artisans, preserving traditional crafts.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Rejection email sent to:", email, "| ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Rejection email failed:", error.message);
  }
};

// ==================== CONTACT REPLY EMAIL ====================
const sendContactReplyEmail = async (email, name, subject, userMessage, adminReply) => {
  const mailOptions = {
    from: `"HastaKrafts Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Re: ${subject} — HastaKrafts Support`,
    html: `
      <html>
        <head>
          <style>
            ${baseStyles}

            .message-box {
              background: #FFF7ED;
              border-left: 4px solid #D4813F;
              padding: 14px 18px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }

            .reply-box {
              background: #F0FDF4;
              border: 2px solid #86EFAC;
              padding: 18px;
              border-radius: 10px;
              margin: 20px 0;
            }
          </style>
        </head>

        <body>
          <div class="container">
            <div class="header">
              <h1>HastaKrafts Support</h1>
              <p>We've replied to your message</p>
            </div>

            <div class="content">
              <h2>Hello ${name},</h2>

              <p>Here is our response regarding your message:</p>

              <div class="message-box">
                <strong>Your Message:</strong>
                <p>${userMessage}</p>
              </div>

              <div class="reply-box">
                <strong>Our Reply:</strong>
                <p>${adminReply}</p>
              </div>

              <p>If you need further help, feel free to reply to this email.</p>
            </div>

            <div class="footer">
              <p>&copy; 2025 HastaKrafts Nepal</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Contact reply email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Contact reply email failed:", error.message);
  }
};

// ==================== WELCOME EMAIL ====================
const sendWelcomeEmail = async (email, fullName) => {
  const mailOptions = {
    from: `"HastaKrafts Nepal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to HastaKrafts Nepal! 🎉",
    html: `
      <!DOCTYPE html><html><head><style>${baseStyles}</style></head>
      <body><div class="container">
        <div class="header"><h1>HastaKrafts Nepal</h1><p>Welcome!</p></div>
        <div class="content">
          <h2>Welcome, ${fullName}! 🎉</h2>
          <p>Your account is ready. Start exploring authentic Nepali handicrafts.</p>
          <center><a href="http://localhost:5173/products" class="btn" style="background:#D4813F;">Shop Now</a></center>
        </div>
        <div class="footer"><p>&copy; 2025 HastaKrafts Nepal</p></div>
      </div></body></html>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to:", email);
  } catch (err) {
    console.error("Welcome email failed (non-fatal):", err.message);
  }
};

module.exports = {
  sendOTPEmail,
  sendSellerApprovalEmail,
  sendSellerRejectionEmail,
  sendContactReplyEmail,
   sendWelcomeEmail,
};