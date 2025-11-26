// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { Subscription } from './entities/subscription.entity';
// import { CreateSubscriptionDto } from './dto/create-subscription.dto';
// import { UpdateSubscriptionDto } from './dto/update-dto';
// import { Op } from 'sequelize';

// @Injectable()
// export class SubscriptionService {
//   constructor(
//     @InjectModel(Subscription)
//     private subscriptionModel: typeof Subscription,
//   ) {}

//   async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
//     try {
//       const subscription = await this.subscriptionModel.create({
//         ...createSubscriptionDto,
//       });
//       return subscription;
//     } catch (error) {
//       throw new BadRequestException('Failed to create subscription');
//     }
//   }

//   async findAll(): Promise<Subscription[]> {
//     return this.subscriptionModel.findAll({
//       order: [['createdAt', 'DESC']],
//     });
//   }

//   async findOne(id: string): Promise<Subscription> {
//     const subscription = await this.subscriptionModel.findByPk(id);
//     if (!subscription) {
//       throw new NotFoundException(`Subscription with ID ${id} not found`);
//     }
//     return subscription;
//   }

//   async findByUserId(userId: string): Promise<Subscription[]> {
//     return this.subscriptionModel.findAll({
//       where: { userId },
//       order: [['createdAt', 'DESC']],
//     });
//   }

//   async findActiveByUserId(userId: string): Promise<Subscription> {
//     const subscription = await this.subscriptionModel.findOne({
//       where: { 
//         userId,
//         status: 'active',
//         endDate: {
//           [Op.gte]: new Date(),
//         },
//       },
//       order: [['createdAt', 'DESC']],
//     });
    
//     if (!subscription) {
//       throw new NotFoundException(`No active subscription found for user ${userId}`);
//     }
    
//     return subscription;
//   }

//   async findByStatus(status: string): Promise<Subscription[]> {
//     return this.subscriptionModel.findAll({
//       where: { status },
//       order: [['createdAt', 'DESC']],
//     });
//   }

//   async findExpiring(days: number = 7): Promise<Subscription[]> {
//     const futureDate = new Date();
//     futureDate.setDate(futureDate.getDate() + days);

//     return this.subscriptionModel.findAll({
//       where: {
//         status: 'active',
//         endDate: {
//           [Op.between]: [new Date(), futureDate],
//         },
//       },
//       order: [['endDate', 'ASC']],
//     });
//   }

//   async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
//     const subscription = await this.findOne(id);
//     await subscription.update(updateSubscriptionDto);
//     return subscription;
//   }

//   async cancel(id: string): Promise<Subscription> {
//     const subscription = await this.findOne(id);
//     await subscription.update({ 
//       status: 'cancelled',
//       autoRenew: false,
//     });
//     return subscription;
//   }

//   async renew(id: string, endDate: Date, nextBillingDate?: Date): Promise<Subscription> {
//     const subscription = await this.findOne(id);
    
//     if (subscription.status !== 'active' && subscription.status !== 'expired') {
//       throw new BadRequestException('Only active or expired subscriptions can be renewed');
//     }

//     await subscription.update({ 
//       status: 'active',
//       endDate,
//       nextBillingDate,
//     });
    
//     return subscription;
//   }

//   async remove(id: string): Promise<void> {
//     const subscription = await this.findOne(id);
//     await subscription.destroy();
//   }

//   async checkAndExpireSubscriptions(): Promise<number> {
//     const expiredCount = await this.subscriptionModel.update(
//       { status: 'expired' },
//       {
//         where: {
//           status: 'active',
//           endDate: {
//             [Op.lt]: new Date(),
//           },
//         },
//       },
//     );
    
//     return expiredCount[0];
//   }
// }

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-dto';
import { Op } from 'sequelize';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription)
    private subscriptionModel: typeof Subscription,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    try {
      const subscriptionData = {
        ...createSubscriptionDto,
        startDate: new Date(createSubscriptionDto.startDate),
        endDate: new Date(createSubscriptionDto.endDate),
        nextBillingDate: createSubscriptionDto.nextBillingDate
          ? new Date(createSubscriptionDto.nextBillingDate)
          : undefined,
      };

      return await this.subscriptionModel.create(subscriptionData);
    } catch (error) {
      throw new BadRequestException('Failed to create subscription');
    }
  }

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionModel.findAll({ order: [['createdAt', 'DESC']] });
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findByPk(id);
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    return this.subscriptionModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async findActiveByUserId(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findOne({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gte]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!subscription) {
      throw new NotFoundException(`No active subscription found for user ${userId}`);
    }

    return subscription;
  }

  async findByStatus(status: string): Promise<Subscription[]> {
    return this.subscriptionModel.findAll({
      where: { status },
      order: [['createdAt', 'DESC']],
    });
  }

  async findExpiring(days = 7): Promise<Subscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.subscriptionModel.findAll({
      where: {
        status: 'active',
        endDate: { [Op.between]: [new Date(), futureDate] },
      },
      order: [['endDate', 'ASC']],
    });
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.findOne(id);

    // Convert date strings to Date if present
    if (updateSubscriptionDto.startDate) {
      updateSubscriptionDto.startDate = new Date(updateSubscriptionDto.startDate) as any;
    }
    if (updateSubscriptionDto.endDate) {
      updateSubscriptionDto.endDate = new Date(updateSubscriptionDto.endDate) as any;
    }
    if (updateSubscriptionDto.nextBillingDate) {
      updateSubscriptionDto.nextBillingDate = new Date(updateSubscriptionDto.nextBillingDate) as any;
    }

    await subscription.update(updateSubscriptionDto as any);
    return subscription;
  }

  async cancel(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);
    await subscription.update({ status: 'cancelled', autoRenew: false });
    return subscription;
  }

  async renew(id: string, endDate: Date, nextBillingDate?: Date): Promise<Subscription> {
    const subscription = await this.findOne(id);

    if (!['active', 'expired'].includes(subscription.status)) {
      throw new BadRequestException('Only active or expired subscriptions can be renewed');
    }

    await subscription.update({
      status: 'active',
      endDate,
      nextBillingDate,
    });
    return subscription;
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await subscription.destroy();
  }

  async checkAndExpireSubscriptions(): Promise<number> {
    const [expiredCount] = await this.subscriptionModel.update(
      { status: 'expired' },
      {
        where: { status: 'active', endDate: { [Op.lt]: new Date() } },
      },
    );
    return expiredCount;
  }
}
