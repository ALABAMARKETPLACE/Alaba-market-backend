import { Body, Controller, Headers, HttpCode, Post, Req } from "@nestjs/common";
import { PaystackService } from "./paystack.service";
import { PaymentSplitService } from "../PAYMENT_SPLITS/payment-split.service";

@Controller('paystack')
export class PaystackController {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly paymentSplitService: PaymentSplitService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any, @Headers('x-paystack-signature') signature: string, @Req() req: any) {
    // Use rawBody if available (recommended); fall back to stringified body
    const raw = (req && req.rawBody) ? req.rawBody.toString() : JSON.stringify(body);

    const valid = this.paystackService.validateWebhook(raw, signature);
    if (!valid) {
      return { status: false, message: 'Invalid signature' };
    }

    const event = body.event;

    if (event === 'charge.success') {
      const reference = body.data?.reference;
      if (reference) {
        // Trigger verification and update split
        try {
          await this.paymentSplitService.verifyPayment(reference);
        } catch (e) {
          // swallow errors but respond 200 to Paystack
        }
      }
    }

    if (event && event.startsWith('transfer.')) {
      // For transfer events, you may update split records or reconciliation.
      // Implement as needed: match by transfer reference or metadata.
    }

    // Always return 200 to acknowledge receipt
    return { status: true };
  }
}

export default PaystackController;
