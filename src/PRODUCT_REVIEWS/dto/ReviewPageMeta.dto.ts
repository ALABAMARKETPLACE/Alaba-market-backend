import { ApiProperty } from "@nestjs/swagger";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
export class ReviewPageMetaDto {
  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly take: number;

  @ApiProperty()
  readonly itemCount: number;

  @ApiProperty()
  readonly pageCount: number;

  @ApiProperty()
  readonly hasPreviousPage: boolean;

  @ApiProperty()
  readonly hasNextPage: boolean;

  @ApiProperty()
  readonly AvgRating: number;

  constructor({
    pageOptionsDto,
    itemCount,
    AvgRating,
  }: ReviewPageMetaDtoParameters) {
    this.page = pageOptionsDto.page;
    this.take = pageOptionsDto.take;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
    this.AvgRating = AvgRating ? parseFloat(Number(AvgRating).toFixed(1)) : 0;
  }
}
interface ReviewPageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  itemCount: number;
  AvgRating: number;
}
