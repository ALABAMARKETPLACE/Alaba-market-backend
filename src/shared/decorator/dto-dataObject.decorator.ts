import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { DataResponseDto } from "../dto/data-response-dto";

export const ApiDataObjectResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiExtraModels(DataResponseDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(DataResponseDto) },
          {
            properties: {
              data: {
                type: "object",
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    })
  );
};
