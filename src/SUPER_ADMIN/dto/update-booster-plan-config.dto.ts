import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateBoosterPlanConfigDto } from "./create-booster-plan-config.dto";

export class UpdateBoosterPlanConfigDto extends PartialType(
  OmitType(CreateBoosterPlanConfigDto, ["name"] as const),
) {}
