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

  async updateLocation(
    id: string,
    latitude: number,
    longitude: number,
    address?: string,
  ): Promise<Tracking> {
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

  async getCompanyDriversLocations(companyId?: string): Promise<any[]> {
    // Get the latest location for each active driver
    // For now, return mock data with proper structure
    // This can be enhanced when driver real-time location tracking is implemented

    try {
      // Query to get latest tracking record for each driver
      const latestTrackings = await this.trackingModel.findAll({
        attributes: ['riderId', 'latitude', 'longitude', 'address', 'status', 'updatedAt'],
        where: {
          ...(companyId ? { companyId } : {}),
          latitude: { [require('sequelize').Op.ne]: null },
          longitude: { [require('sequelize').Op.ne]: null },
        },
        order: [['updatedAt', 'DESC']],
        limit: 100,
      });

      // Group by riderId and get the most recent location for each
      const driverLocations = new Map();
      for (const tracking of latestTrackings) {
        const riderId = tracking.riderId;
        if (!driverLocations.has(riderId)) {
          driverLocations.set(riderId, {
            driverId: riderId,
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            address: tracking.address || 'Unknown location',
            status: tracking.status,
            lastUpdated: tracking.updatedAt,
            heading: 0, // Can be calculated from location history
          });
        }
      }

      return Array.from(driverLocations.values());
    } catch (error) {
      console.error('Error fetching driver locations:', error);
      // Return empty array instead of throwing to prevent frontend errors
      return [];
    }
  }
}
