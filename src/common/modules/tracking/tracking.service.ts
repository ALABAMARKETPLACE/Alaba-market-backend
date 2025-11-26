// // src/tracking/tracking.service.ts
// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/sequelize';
// import { Tracking } from './entities/delivery-log.entity';
// import { CreateTrackingDto } from './dto/create-log.dto';
// import { UpdateTrackingDto } from './dto/update-log.dto';

// @Injectable()
// export class TrackingService {
//   create(createTrackingDto: CreateTrackingDto) {
//       throw new Error('Method not implemented.');
//   }
//   constructor(
//     @InjectModel(Tracking)
//     private trackingModel: typeof Tracking,
//   ) {}

      

//   async findAll(): Promise<Tracking[]> {
//     return this.trackingModel.findAll({
//       order: [['createdAt', 'DESC']],
//     });
//   }

//   async findOne(id: string): Promise<Tracking> {
//     const tracking = await this.trackingModel.findByPk(id);
//     if (!tracking) {
//       throw new NotFoundException(`Tracking record with ID ${id} not found`);
//     }
//     return tracking;
//   }

//   async findByOrderId(orderId: string): Promise<Tracking[]> {
//     const trackings = await this.trackingModel.findAll({
//       where: { orderId },
//       order: [['createdAt', 'DESC']],
//     });
//     return trackings;
//   }

//   async findByRiderId(riderId: string): Promise<Tracking[]> {
//     const trackings = await this.trackingModel.findAll({
//       where: { riderId },
//       order: [['createdAt', 'DESC']],
//     });
//     return trackings;
//   }

//   async update(id: string, updateTrackingDto: UpdateTrackingDto): Promise<Tracking> {
//     const tracking = await this.findOne(id);
    
//     // If status is being updated to 'delivered', set actual delivery time
//     if (updateTrackingDto.status === 'delivered' && tracking.status !== 'delivered') {
//       updateTrackingDto['actualDeliveryTime'] = new Date();
//     }

//     await tracking.update(updateTrackingDto);
//     return tracking;
//   }

//   async updateLocation(id: string, latitude: number, longitude: number, address?: string): Promise<Tracking> {
//     const tracking = await this.findOne(id);
//     await tracking.update({ latitude, longitude, address });
//     return tracking;
//   }

//   async remove(id: string): Promise<void> {
//     const tracking = await this.findOne(id);
//     await tracking.destroy();
//   }

//   async getLatestByOrderId(orderId: string): Promise<Tracking> {
//     const tracking = await this.trackingModel.findOne({
//       where: { orderId },
//       order: [['createdAt', 'DESC']],
//     });
    
//     if (!tracking) {
//       throw new NotFoundException(`No tracking records found for order ${orderId}`);
//     }
    
//     return tracking;
//   }
// }

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tracking } from './entities/delivery-log.entity';
import { CreateTrackingDto } from './dto/create-log.dto';
import { UpdateTrackingDto } from './dto/update-log.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(Tracking)
    private trackingModel: typeof Tracking,
  ) {}

  async create(createTrackingDto: CreateTrackingDto): Promise<Tracking> {
    try {
      // Convert string dates to Date objects before creating
      const trackingData: any = { ...createTrackingDto };
      if (trackingData.estimatedDeliveryTime) {
        trackingData.estimatedDeliveryTime = new Date(trackingData.estimatedDeliveryTime);
      }
      
      const tracking = await this.trackingModel.create(trackingData);
      return tracking;
    } catch (error) {
      throw new BadRequestException('Failed to create tracking record');
    }
  }

  async findAll(): Promise<Tracking[]> {
    return this.trackingModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<Tracking> {
    const tracking = await this.trackingModel.findByPk(id);
    if (!tracking) {
      throw new NotFoundException(`Tracking record with ID ${id} not found`);
    }
    return tracking;
  }

  async findByOrderId(orderId: string): Promise<Tracking[]> {
    const trackings = await this.trackingModel.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });
    return trackings;
  }

  async findByRiderId(riderId: string): Promise<Tracking[]> {
    const trackings = await this.trackingModel.findAll({
      where: { riderId },
      order: [['createdAt', 'DESC']],
    });
    return trackings;
  }

  async update(id: string, updateTrackingDto: UpdateTrackingDto): Promise<Tracking> {
    const tracking = await this.findOne(id);
    
    // Convert string dates to Date objects
    const updateData: any = { ...updateTrackingDto };
    if (updateData.estimatedDeliveryTime) {
      updateData.estimatedDeliveryTime = new Date(updateData.estimatedDeliveryTime);
    }
    
    // If status is being updated to 'delivered', set actual delivery time
    if (updateData.status === 'delivered' && tracking.status !== 'delivered') {
      updateData.actualDeliveryTime = new Date();
    }

    await tracking.update(updateData);
    return tracking;
  }

  async updateLocation(id: string, latitude: number, longitude: number, address?: string): Promise<Tracking> {
    const tracking = await this.findOne(id);
    await tracking.update({ latitude, longitude, address });
    return tracking;
  }

  async remove(id: string): Promise<void> {
    const tracking = await this.findOne(id);
    await tracking.destroy();
  }

  async getLatestByOrderId(orderId: string): Promise<Tracking> {
    const tracking = await this.trackingModel.findOne({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });
    
    if (!tracking) {
      throw new NotFoundException(`No tracking records found for order ${orderId}`);
    }
    
    return tracking;
  }
}