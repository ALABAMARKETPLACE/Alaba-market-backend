import { ApiProperty } from "@nestjs/swagger";

export class CreateMenusDto {
   @ApiProperty()
   readonly name: string;
   
   @ApiProperty()
   readonly route: string;

   @ApiProperty()
   readonly icon: string;
}