import { Inject, Injectable } from "@nestjs/common";
import { Roles } from "./roles.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
@Injectable()
export class RolesService {
  constructor(
    @Inject("RolesRepository")
    private readonly RolesRepository: typeof Roles
  ) {}

}
