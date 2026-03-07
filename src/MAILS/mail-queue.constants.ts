export const ENQUIRY_MAIL_QUEUE = "enquiry-mail";
export const ENQUIRY_MAIL_JOB = "send-enquiry-email";

export type EnquiryMailJobData = {
  to: string;
  subject?: string;
  template?: string;
};
