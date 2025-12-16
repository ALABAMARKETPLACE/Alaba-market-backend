import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from "@nestjs/common";
const fileType = require("file-type");
const allowedTypesRegex = /(image\/jpeg|image\/png|image\/gif|image\/webp)$/i;
@Injectable()
export class ImageMimetypeValidationPipe implements PipeTransform {
  async transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!value || !value.buffer) {
      throw new BadRequestException("No file Selected..");
    }
    const type = await fileType.fromBuffer(value.buffer);
    if (!type || !allowedTypesRegex.test(type.mime)) {
      throw new BadRequestException(
        "Invalid Image Format Found. (Please use jpeg/png/webp)"
      );
    }
    return value;
  }
}
