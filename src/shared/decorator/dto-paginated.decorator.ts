import { Type, applyDecorators } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from "@nestjs/swagger";
import { DataResponseDto } from "../dto/data-response-dto";
class Meta {
  @ApiProperty()
  take: number;
  @ApiProperty()
  itemCount: number;
  @ApiProperty()
  page: number;
  @ApiProperty()
  totalPages: number;
  @ApiProperty()
  hasPreviousPage: boolean;
  @ApiProperty()
  hasNextPage: boolean;
}
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiExtraModels(DataResponseDto),
    ApiExtraModels(Meta),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(DataResponseDto) },
          {
            properties: {
              data: {
                type: "array",
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: "object",
                $ref: getSchemaPath(Meta),
              },
            },
          },
        ],
      },
    })
  );
};
