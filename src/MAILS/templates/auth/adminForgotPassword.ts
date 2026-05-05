const AdminForgotPasswordMail = async (
  details: {
    email: string;
    name?: string;
    first_name?: string;
  },
  token: string,
  expiresInMinutes = 20,
) => {
  const frontendUrl =
    process.env.PASSWORD_RESET_FRONTEND_URL ||
    process.env.ADMIN_FRONTEND_URL ||
    process.env.ADMIN_BASE_URL ||
    process.env.BASE_URL ||
    "";
  const resetLink = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  const recipientName =
    details?.first_name || details?.name || details?.email?.split("@")[0] || "there";

  return {
    to: details.email,
    subject: `${process.env.NAME || "Alaba Marketplace"} password reset`,
    template: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 12px;">Reset your password</h2>
        <p>Hello ${recipientName},</p>
        <p>We received a request to reset your account password.</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>This link expires in ${expiresInMinutes} minutes.</p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you did not request this password reset, ignore this email.</p>
      </div>
    `,
  };
};

module.exports = AdminForgotPasswordMail;
