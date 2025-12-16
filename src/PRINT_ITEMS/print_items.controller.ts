import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrintItemsService } from "./print_items.service";

@Controller("printItems")
@ApiTags("printItems")
export class PrintItemsController {
  constructor(private readonly printService: PrintItemsService) {}
}
