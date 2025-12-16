import { ApiProperty } from "@nestjs/swagger";
import { Enquiry } from "../enquiry.entity";

export class EnquiryDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly message: string;

  constructor(enquiry: Enquiry) {
    this.id = enquiry.id;
    this.email = enquiry.email;
    this.message = enquiry.message;
  }
}
