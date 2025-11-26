// =====================================================
// FILE: backend/src/modules/drivers/dto/update-driver.dto.ts
// =====================================================
import { PartialType } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {}