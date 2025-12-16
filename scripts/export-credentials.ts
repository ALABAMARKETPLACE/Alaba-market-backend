/**
 * Script to export all drivers and companies from the database with credentials
 * Run: npx ts-node scripts/export-credentials.ts
 */

import { Sequelize } from 'sequelize-typescript';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../src/common/modules/users/entities/user-entity';
import { Driver } from '../src/common/modules/drivers/entities/driver.entity';
import { DeliveryCompany } from '../src/common/modules/delivery/entities/delivery-compnay-entity';

async function exportCredentials() {
  // Initialize Sequelize
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'delivery_app',
    models: [User, Driver, DeliveryCompany],
    logging: false,
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Fetch all drivers with their user data
    const drivers = await Driver.findAll({
      include: [
        {
          model: User,
          attributes: ['email', 'password', 'firstName', 'lastName', 'phone'],
        },
        {
          model: DeliveryCompany,
          attributes: ['companyName', 'id'],
        },
      ],
      attributes: ['id', 'name', 'email', 'phone', 'licenseNumber', 'vehicleNumber', 'isActive'],
      order: [['createdAt', 'DESC']],
    });

    // Fetch all companies with their user data
    const companies = await DeliveryCompany.findAll({
      include: [
        {
          model: User,
          attributes: ['email', 'password', 'firstName', 'lastName', 'phone'],
        },
      ],
      attributes: ['id', 'companyName', 'subscriptionStatus', 'isActive'],
      order: [['createdAt', 'DESC']],
    });

    // Format drivers output
    console.log('\n' + '='.repeat(100));
    console.log('📦 ALL DRIVERS IN DATABASE');
    console.log('='.repeat(100));

    if (drivers.length === 0) {
      console.log('❌ No drivers found in database\n');
    } else {
      const driverData = drivers.map((driver: any) => ({
        'Driver ID': driver.id,
        Name: driver.name,
        'Email (Driver)': driver.email,
        'Email (User)': driver.user?.email,
        Password: driver.user?.password || 'N/A',
        Phone: driver.phone,
        License: driver.licenseNumber || 'N/A',
        Vehicle: driver.vehicleNumber || 'N/A',
        Company: driver.deliveryCompany?.companyName || 'Unassigned',
        Status: driver.isActive ? 'Active' : 'Inactive',
      }));

      console.table(driverData);

      // Save drivers to JSON
      const driverJsonFile = path.join(__dirname, '../exports/drivers.json');
      fs.mkdirSync(path.dirname(driverJsonFile), { recursive: true });
      fs.writeFileSync(driverJsonFile, JSON.stringify(driverData, null, 2));
      console.log(`\n✅ Drivers exported to: ${driverJsonFile}\n`);
    }

    // Format companies output
    console.log('='.repeat(100));
    console.log('🏢 ALL COMPANIES IN DATABASE');
    console.log('='.repeat(100));

    if (companies.length === 0) {
      console.log('❌ No companies found in database\n');
    } else {
      const companyData = companies.map((company: any) => ({
        'Company ID': company.id,
        'Company Name': company.companyName,
        'Admin Email': company.user?.email,
        'Admin Password': company.user?.password || 'N/A',
        'Admin Name': `${company.user?.firstName || ''} ${company.user?.lastName || ''}`.trim(),
        'Admin Phone': company.user?.phone || 'N/A',
        Subscription: company.subscriptionStatus,
        Status: company.isActive ? 'Active' : 'Inactive',
      }));

      console.table(companyData);

      // Save companies to JSON
      const companyJsonFile = path.join(__dirname, '../exports/companies.json');
      fs.mkdirSync(path.dirname(companyJsonFile), { recursive: true });
      fs.writeFileSync(companyJsonFile, JSON.stringify(companyData, null, 2));
      console.log(`\n✅ Companies exported to: ${companyJsonFile}\n`);
    }

    // Summary
    console.log('='.repeat(100));
    console.log('📊 SUMMARY');
    console.log('='.repeat(100));
    console.log(`Total Drivers: ${drivers.length}`);
    console.log(`Total Companies: ${companies.length}`);
    console.log('='.repeat(100) + '\n');
  } catch (error) {
    console.error('❌ Error exporting credentials:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the export
exportCredentials();
