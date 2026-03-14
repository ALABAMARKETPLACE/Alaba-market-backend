import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { FeaturedProductsService } from "./featured-products.service";

const SCHEDULER_BATCH_SIZE = 5;
const SCHEDULER_ROTATION_MINUTES = 5;

@Injectable()
export class FeaturedRotationScheduler {
  private readonly positions = [1, 2, 3];

  constructor(
    private readonly featuredProductsService: FeaturedProductsService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRotationTick(): Promise<void> {
    const timestamp = new Date().toISOString();
    // console.log(
    //   "[FeaturedRotationScheduler] Tick",
    //   JSON.stringify({ timestamp })
    // );

    for (const position of this.positions) {
      try {
        const result = await this.featuredProductsService.rotatePositionIfDue(
          position,
          {
            batchSize: SCHEDULER_BATCH_SIZE,
            rotationMinutes: SCHEDULER_ROTATION_MINUTES,
            force: false,
            logContext: "[Scheduler]",
          }
        );

        if (result.rotated) {
          // console.log(
          //   "[FeaturedRotationScheduler] Rotated",
          //   JSON.stringify({
          //     position,
          //     activeProductIds: result.state.active_product_ids,
          //     fallbackCount: result.state.fallback_product_ids?.length ?? 0,
          //     queueLength: result.context.queueLength,
          //     batchIndex: result.context.batchIndex,
          //     nextRotationAt:
          //       result.state.next_rotation_at?.toISOString() ?? null,
          //     timestamp,
          //   })
          // );
        }
      } catch (error) {
        console.error(
          "[FeaturedRotationScheduler] Rotation error",
          JSON.stringify({
            position,
            message: error?.message ?? error,
          })
        );
      }
    }
  }
}
