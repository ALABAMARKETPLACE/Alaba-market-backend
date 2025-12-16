import { Injectable, PipeTransform, ArgumentMetadata } from "@nestjs/common";
const defaults = [
  "id",
  "userId",
  "_id",
  "user_id",
  "storeId",
  "store_id",
  "createdAt",
  "updatedAt",
];
//this pipe will remove the provided properties and the above ones from the body object. for post and put
@Injectable()
export class StripBodyPipe implements PipeTransform {
  constructor(private readonly types: string[] | string = []) {}
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value != "object" || value == null) {
      return value;
    }
    const filteredData = Object.keys(value).reduce((acc, key) => {
      if (
        ![
          ...(Array.isArray(this.types) ? this.types : [this.types]),
          ...defaults,
        ].includes(key)
      ) {
        acc[key] = value[key];
      }
      return acc;
    }, {});

    return filteredData;
  }
}
