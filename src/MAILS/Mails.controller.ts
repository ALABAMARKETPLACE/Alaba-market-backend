import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { MailService } from "./Mails.services";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { SendTestMailDto } from "./dto/send-test-mail.dto";

@Controller("mail")
@ApiTags("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post("test")
  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: "Send a test email using the active mail provider",
    description:
      "Sends a simple test email using the currently configured mail provider, such as Mailtrap SMTP.",
  })
  @ApiOkResponse({ type: DataResponseDto })
  async sendTestMail(
    @Body() data: SendTestMailDto,
  ): Promise<DataResponseDto> {
    return this.mailService.sendTestMail(data);
  }
}
