const AdminInviteMail = async (
  details: {
    email: string;
    first_name?: string;
    invitedByName?: string;
  },
  token: string,
) => {
  const inviteLink = `${process.env.BASE_URL}accept-admin-invite/${token}`;
  const recipientName =
    details?.first_name || details?.email?.split("@")[0] || "there";
  const inviter =
    details?.invitedByName || `${process.env.NAME || "Alaba Marketplace"} Admin`;

  return {
    to: details.email,
    subject: `${process.env.NAME} admin invitation`,
    template: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 12px;">Admin invitation</h2>
        <p>Hello ${recipientName},</p>
        <p>${inviter} has invited you to join ${process.env.NAME} as an admin.</p>
        <p>Use the button below to accept the invite and set your password.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteLink}" style="background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 6px; display: inline-block;">
            Accept Admin Invite
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>If you were not expecting this invite, you can ignore this email.</p>
      </div>
    `,
  };
};

module.exports = AdminInviteMail;
