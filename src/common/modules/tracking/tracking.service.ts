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
import { Op } from 'sequelize';
import { Tracking } from './entities/delivery-log.entity';
import { DriverLocation } from './entities/driver-location.entity';
import { CreateTrackingDto } from './dto/create-log.dto';
import { UpdateTrackingDto } from './dto/update-log.dto';
import { LocationUpdateDto } from './dto/location-update.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(Tracking)
    private trackingModel: typeof Tracking,
    @InjectModel(DriverLocation)
    private driverLocationModel: typeof DriverLocation,
  ) {
    console.log('🚀 TrackingService initialized');
    console.log('📦 DriverLocationModel injected:', !!this.driverLocationModel);
  }

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
    try {
      console.log('🔍 Fetching all active driver locations...');

      // Get all driver locations (don't filter by isActive initially to debug)
      const locations = await this.driverLocationModel.findAll({
        order: [['updatedAt', 'DESC']],
      });

      console.log(`📍 Found ${locations.length} driver locations`);

      if (locations.length === 0) {
        console.log('⚠️  No driver locations found in database');
        return [];
      }

      // Map locations to response format (simplified, no order lookup for now)
      const mappedLocations = locations
        .map((loc) => {
          try {
            return {
              driverId: loc.driverId || 'unknown',
              driverName: loc.driverName || 'Unknown Driver',
              latitude: loc.latitude ? parseFloat(loc.latitude as any) : 0,
              longitude: loc.longitude ? parseFloat(loc.longitude as any) : 0,
              accuracy: loc.accuracy || null,
              heading: loc.heading || null,
              speed: loc.speed || null,
              lastUpdated: loc.updatedAt ? loc.updatedAt.toISOString() : new Date().toISOString(),
              status: 'active',
            };
          } catch (err) {
            console.error(`Error mapping driver location:`, err.message);
            return null;
          }
        })
        .filter((loc) => loc !== null);

      console.log(`✅ Returning ${mappedLocations.length} driver locations`);
      return mappedLocations;
    } catch (error) {
      console.error('❌ Error fetching driver locations:', error.message);
      console.error('Stack:', error.stack);
      // Return empty array instead of throwing
      return [];
    }
  }

  // Get single driver location
  async getDriverLocation(driverId: string): Promise<any> {
    const location = await this.driverLocationModel.findOne({
      where: { driverId },
    });

    if (!location) {
      throw new NotFoundException(`Location not found for driver ${driverId}`);
    }

    return {
      driverId: location.driverId,
      driverName: location.driverName || 'Unknown Driver',
      latitude: parseFloat(location.latitude as any),
      longitude: parseFloat(location.longitude as any),
      accuracy: location.accuracy,
      heading: location.heading,
      speed: location.speed,
      lastUpdated: location.updatedAt.toISOString(),
    };
  }

  // Get multiple driver locations
  async getDriversLocations(driverIds: string[]): Promise<any[]> {
    const locations = await this.driverLocationModel.findAll({
      where: {
        driverId: { [Op.in]: driverIds },
      },
    });

    return locations.map((loc) => ({
      driverId: loc.driverId,
      driverName: loc.driverName || 'Unknown Driver',
      latitude: parseFloat(loc.latitude as any),
      longitude: parseFloat(loc.longitude as any),
      accuracy: loc.accuracy,
      heading: loc.heading,
      speed: loc.speed,
      lastUpdated: loc.updatedAt.toISOString(),
    }));
  }

  // Update driver location (real-time GPS updates)
  async updateDriverLocation(data: LocationUpdateDto): Promise<any> {
    try {
      // Upsert driver location (update if exists, create if not)
      const [location, created] = await this.driverLocationModel.upsert(
        {
          driverId: data.driverId,
          driverName: data.driverId, // Will be populated from driver service
          orderId: data.orderId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          heading: data.heading,
          speed: data.speed,
          address: data.address,
          isActive: true,
        },
        {
          returning: true,
        },
      );

      // Also create a tracking record if orderId is provided
      if (data.orderId) {
        await this.trackingModel.create({
          orderId: data.orderId,
          riderId: data.driverId,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          status: 'in_transit',
        });
      }

      return {
        driverId: location.driverId,
        driverName: location.driverName,
        latitude: parseFloat(location.latitude as any),
        longitude: parseFloat(location.longitude as any),
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        lastUpdated: location.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw new BadRequestException('Failed to update driver location');
    }
  }

  // Start tracking session
  async startTracking(orderId: string, driverId: string): Promise<{ trackingId: string }> {
    try {
      const tracking = await this.trackingModel.create({
        orderId,
        riderId: driverId,
        status: 'in_transit',
      });

      // Mark driver as active
      await this.driverLocationModel.update({ isActive: true, orderId }, { where: { driverId } });

      return { trackingId: tracking.id };
    } catch (error) {
      throw new BadRequestException('Failed to start tracking');
    }
  }

  // Stop tracking session
  async stopTracking(orderId: string): Promise<void> {
    try {
      // Update driver location to remove orderId
      await this.driverLocationModel.update({ orderId: null }, { where: { orderId } });

      // Update tracking status
      await this.trackingModel.update({ status: 'delivered' }, { where: { orderId } });
    } catch (error) {
      throw new BadRequestException('Failed to stop tracking');
    }
  }

  // Get order tracking with full details
  async getOrderTrackingDetails(orderId: string): Promise<any> {
    const trackingRecords = await this.findByOrderId(orderId);

    if (trackingRecords.length === 0) {
      throw new NotFoundException(`No tracking records found for order ${orderId}`);
    }

    const latestTracking = trackingRecords[0];

    // Get driver location if available
    let driverLocation = null;
    if (latestTracking.riderId) {
      try {
        const location = await this.driverLocationModel.findOne({
          where: { driverId: latestTracking.riderId },
        });
        if (location) {
          driverLocation = {
            latitude: parseFloat(location.latitude as any),
            longitude: parseFloat(location.longitude as any),
            lastUpdated: location.updatedAt.toISOString(),
          };
        }
      } catch (error) {
        console.log('Driver location not found');
      }
    }

    return {
      orderId,
      status: latestTracking.status,
      currentLocation: driverLocation,
      estimatedDeliveryTime: latestTracking.estimatedDeliveryTime,
      actualDeliveryTime: latestTracking.actualDeliveryTime,
      trackingHistory: trackingRecords.map((t) => ({
        status: t.status,
        latitude: t.latitude,
        longitude: t.longitude,
        address: t.address,
        timestamp: t.createdAt,
      })),
    };
  }

  // Get location history for driver
  async getLocationHistory(
    driverId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<any[]> {
    const whereClause: any = { riderId: driverId };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = startDate;
      if (endDate) whereClause.createdAt[Op.lte] = endDate;
    }

    const history = await this.trackingModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
    });

    return history.map((h) => ({
      latitude: h.latitude,
      longitude: h.longitude,
      address: h.address,
      timestamp: h.createdAt,
      status: h.status,
    }));
  }
}
