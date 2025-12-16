/**
 * Direct database query to export all drivers and companies with credentials
 * Run: npx ts-node scripts/query-credentials.ts
 */

import { Sequelize } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';

async function queryCredentials() {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'alaba_marketplace',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      logging: false,
    },
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Query all drivers with user credentials
    const driversQuery = `
      SELECT 
        d.id as "driverId",
        d.name,
        d.email as "driverEmail",
        d.phone,
        d."licenseNumber",
        d."vehicleNumber",
        d."isActive",
        u.email as "userEmail",
        u.password,
        u."firstName",
        u."lastName",
        COALESCE(dc."companyName", 'Unassigned') as "companyName",
        d."createdAt"
      FROM drivers d
      LEFT JOIN users u ON d."userId" = u.id
      LEFT JOIN delivery_companies dc ON d."companyId" = dc.id
      ORDER BY d."createdAt" DESC;
    `;

    // Query all companies with admin credentials
    const companiesQuery = `
      SELECT 
        dc.id as "companyId",
        dc."companyName",
        dc."subscriptionStatus",
        dc."isActive",
        u.email as "adminEmail",
        u.password as "adminPassword",
        u."firstName" as "adminFirstName",
        u."lastName" as "adminLastName",
        u.phone as "adminPhone",
        COUNT(d.id) as "driverCount",
        dc."createdAt"
      FROM delivery_companies dc
      JOIN users u ON dc."userId" = u.id
      LEFT JOIN drivers d ON dc.id = d."companyId"
      GROUP BY dc.id, u.id
      ORDER BY dc."createdAt" DESC;
    `;

    const [drivers]: any = await sequelize.query(driversQuery);
    const [companies]: any = await sequelize.query(companiesQuery);

    // Display drivers
    console.log('='.repeat(140));
    console.log('📦 ALL DRIVERS IN DATABASE');
    console.log('='.repeat(140));

    if (drivers.length === 0) {
      console.log('❌ No drivers found\n');
    } else {
      console.table(
        drivers.map((d: any) => ({
          'Driver ID': d.driverId.substring(0, 8),
          Name: d.name,
          Email: d.userEmail || d.driverEmail,
          Password: d.password,
          Phone: d.phone,
          License: d.licenseNumber || '-',
          Vehicle: d.vehicleNumber || '-',
          Company: d.companyName,
          Status: d.isActive ? '✅ Active' : '❌ Inactive',
        })),
      );

      // Export to JSON
      const exportDir = path.join(__dirname, '../exports');
      fs.mkdirSync(exportDir, { recursive: true });
      fs.writeFileSync(path.join(exportDir, 'drivers.json'), JSON.stringify(drivers, null, 2));
      console.log(`\n📄 Exported to: exports/drivers.json\n`);
    }

    // Display companies
    console.log('='.repeat(140));
    console.log('🏢 ALL COMPANIES IN DATABASE');
    console.log('='.repeat(140));

    if (companies.length === 0) {
      console.log('❌ No companies found\n');
    } else {
      console.table(
        companies.map((c: any) => ({
          'Company ID': c.companyId.substring(0, 8),
          'Company Name': c.companyName,
          'Admin Email': c.adminEmail,
          'Admin Password': c.adminPassword,
          'Admin Name': `${c.adminFirstName} ${c.adminLastName}`,
          'Admin Phone': c.adminPhone || '-',
          Drivers: c.driverCount,
          Subscription: c.subscriptionStatus,
          Status: c.isActive ? '✅ Active' : '❌ Inactive',
        })),
      );

      // Export to JSON
      const exportDir = path.join(__dirname, '../exports');
      fs.mkdirSync(exportDir, { recursive: true });
      fs.writeFileSync(path.join(exportDir, 'companies.json'), JSON.stringify(companies, null, 2));
      console.log(`\n📄 Exported to: exports/companies.json\n`);
    }

    // Summary
    console.log('='.repeat(140));
    console.log('📊 SUMMARY');
    console.log('='.repeat(140));
    console.log(`Total Drivers: ${drivers.length}`);
    console.log(`Total Companies: ${companies.length}`);
    console.log(`Total Users (Drivers + Companies): ${drivers.length + companies.length}`);
    console.log('='.repeat(140) + '\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

queryCredentials();
