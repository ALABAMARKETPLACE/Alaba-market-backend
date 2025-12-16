import { Controller, Post, Body, Get, HttpStatus } from "@nestjs/common";
import { TokenGateway } from "./token.gateway";
import { Public } from "../shared/decorator/optional.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from "@nestjs/swagger";

// DTO for request validation and Swagger documentation
class UpdateTokenDto {
  @ApiProperty({
    description: "The ID of the room to update the token",
    example: "room-123",
    required: true,
  })
  roomId: string;

  @ApiProperty({
    description: "The new token number",
    example: 5,
    required: true,
    type: Number,
  })
  tokenNumber: number;
}

// DTO for response structure
class TokenResponseDto {
  @ApiProperty({
    description: "Response message",
    example: "Token updated successfully",
  })
  message: string;

  @ApiProperty({
    description: "Response data containing the updated token information",
    type: UpdateTokenDto,
  })
  data: UpdateTokenDto;
}

@ApiTags("Tokens")
@Controller("subtitution/token")
export class TokenController {
  constructor(private tokenGateway: TokenGateway) {}

  // @Public()
  // @Post()
  // @ApiOperation({
  //   summary: "Update token for a room",
  //   description:
  //     "Updates the token number for a specific room and broadcasts the change",
  // })
  // @ApiBody({
  //   type: UpdateTokenDto,
  //   description: "Token update information",
  // })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: "Token has been successfully updated",
  //   type: TokenResponseDto,
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: "Invalid input data",
  // })
  // updateToken(@Body() body: UpdateTokenDto): TokenResponseDto {
  //   this.tokenGateway.broadcastToken(body.roomId, body.tokenNumber);
  //   return {
  //     message: "Token updated successfully",
  //     data: body,
  //   };
  // }
}
