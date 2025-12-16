import { HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { States } from "./states.entity";
import { UpdateStatesDto } from "./dto/updateStates.dto";
import { CreateStatesDto } from "./dto/createStates.dto";
import { StatesDto } from "./dto/states.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";


@Injectable()
export class StatesService {
  constructor(
    @Inject("StatesRepository")
    private readonly StatesRepository: typeof States
  ) {}

  async findAll() {
    try {
      const states = await this.StatesRepository.findAll({});
      const data = states.map(
        (item: States) => new StatesDto(item)
      );
      return new DataResponseDto(data, true, "Successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(data: CreateStatesDto) {
    try {
      const states = new States();
      states.name = data.name;
      states.description = data.description;
      const created = await states.save();
      return new DataResponseDto(created, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(id: number, data: UpdateStatesDto) {
    try {
      const states = await States.findByPk(id);
      if (!states)
        throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
      states.name = data.name;
      states.description = data.description;
      const updated = await states.save();
      return new DataResponseDto(states, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const states = await States.findByPk(id);
      if (!states)
        throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
      await states.destroy();
      return new DataResponseDto(states, true, "Successfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
