const PasswordChangedMail = async (details: {
  email: string;
  name?: string;
  first_name?: string;
}) => {
  const recipientName =
    details?.first_name || details?.name || details?.email?.split("@")[0] || "there";

  return {
    to: details.email,
    subject: `${process.env.NAME || "Alaba Marketplace"} password changed`,
    template: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 12px;">Your password was changed</h2>
        <p>Hello ${recipientName},</p>
        <p>This is a confirmation that the password for your account was changed successfully.</p>
        <p>If you did not make this change, reset your password immediately and contact support.</p>
      </div>
    `,
  };
};

module.exports = PasswordChangedMail;
