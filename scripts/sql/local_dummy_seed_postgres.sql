-- Auto-generated PostgreSQL seed script
-- Source: seeders/data.json
-- Generated at: 2026-04-07T15:38:59.839Z
BEGIN;

DELETE FROM "BANNER";
DELETE FROM "PRODUCTS";
DELETE FROM "DISTANCE_CHARGE";
DELETE FROM "DELIVERY_CHARGE";
DELETE FROM "SUB_CATEGORY";
DELETE FROM "CATEGORY";
DELETE FROM "SETTINGS";
DELETE FROM "USER";
DELETE FROM "STORE";

-- STORE
INSERT INTO "STORE" ("id", "first_name", "last_name", "name", "email", "phone", "code", "password", "business_location", "business_address", "business_type", "agreement", "trn_number", "trade_lisc_no", "seller_name", "seller_country", "birth_country", "dob", "id_proof", "id_type", "id_issue_country", "id_expiry_date", "store_name", "upscs", "manufacture", "trn_upload", "logo_upload", "status", "status_remark", "createdAt", "updatedAt", "order_count", "lat", "long", "business_types", "sid", "slug", "default", "delivery_period", "delivery_period_minutes", "cover_image", "ratings", "averageRating")
VALUES
(123456, 'admin', 'store', 'admin store', 'admin@123.com', '12345678', '+91', '11111111', 'Kozhikode', 'Sheikh Zayed Rd - DXB Tower - Trade Centre 1 - Dubai, UAE', 'all_Items', 'true', '121e334dc', '454545455', 'admin', 'UAE', 'India', '1996-09-16 05:14:59.987+00', '', 'passport', 'India', '2028-11-02 05:16:57.317+00', 'Admin Store', 'yes', 'no', '', 'https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/flower8.jpg', 'approved', '', '2024-11-18 05:40:06.418+00', '2024-01-18 06:05:06.586+00', 0, 11.4903982, 76.0043618, NULL, 'd2a975f5-d08b-4256-a335-c4c671bd1f26', 'admin-store', FALSE, 2, 0, 'https://vivagifts.in/wp-content/uploads/2023/06/Kids-stationary-kit.jpg', 0, 0)
ON CONFLICT DO NOTHING;

-- USER
INSERT INTO "USER" ("_id", "username", "password", "first_name", "last_name", "name", "email", "countrycode", "phone", "image", "type", "mail_verify", "phone_verify", "status", "role", "store_id", "createdAt", "updatedAt", "uid")
VALUES
(654321, 'admin123', '$2a$12$qIc.dePYdUP.EfyMMO0Xa.kh3iWICvMGE4qobUnw5VZtmvmJLLOSW', 'Admin', 'User', 'Admin User', 'admin@123.com', '+91', '1234554321', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy7nFdX1g_CVR4WyP5LgKOGytP0J8PE53_RQ&s', 'admin', FALSE, FALSE, TRUE, 'admin', 123456, '2024-06-02 03:01:44.678+00', '2024-06-14 12:44:30.491+00', '52aa6c70-35e3-43d1-803a-1d98e638dba8')
ON CONFLICT DO NOTHING;

-- SETTINGS
INSERT INTO "SETTINGS" ("id", "type", "isLocation", "currency", "adminEmail", "supportInfoEmail", "contactEmail", "contactNumber", "address", "radius", "createdAt", "updatedAt")
VALUES
(1231, 'multi', FALSE, 'AED', 'test@gmail.com', 'test@gmail.com', 'test@gmail.com', '+911234567890', 'test address', 12, '2023-12-03 07:50:07.385+00', '2023-12-03 07:50:07.385+00')
ON CONFLICT DO NOTHING;

-- CATEGORY
INSERT INTO "CATEGORY" ("id", "name", "image", "description", "featured", "featuredTitle", "position", "createdAt", "updatedAt")
VALUES
(345, 'Electronics', 'https://t3.ftcdn.net/jpg/02/57/16/84/360_F_257168460_AwhicdEIavp7bdCbHXyTaBTHnBoBcZad.jpg', 'Electronics is a scientific and engineering discipline that studies and applies', FALSE, NULL, 5, '2023-09-12 13:43:04.448+00', '2023-09-12 13:43:04.448+00'),
(346, 'Stationary', 'https://vivagifts.in/wp-content/uploads/2023/06/Kids-stationary-kit.jpg', 'Stationery refers to commercially manufactured writing materials, including cut paper,', FALSE, NULL, 3, '2023-09-12 13:43:04.448+00', '2023-09-12 13:43:04.448+00')
ON CONFLICT DO NOTHING;

-- SUB_CATEGORY
INSERT INTO "SUB_CATEGORY" ("_id", "name", "image", "category_id", "description", "slug", "position", "bannerImg", "createdAt", "updatedAt")
VALUES
(1000, 'Electronics', 'https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1707662428818.jpg', 345, 'Equipments and Machines', 'electronics', 0, 'https://superfreshfruits.com/assets/images/fruit-1000x727.png', '2024-02-11 14:40:30.17+00', '2024-05-15 07:57:56.745+00'),
(1001, 'Headphones', 'https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1710474265271.jpg', 345, 'Toner cartridges contain toner powder, a fine, dry mixture of plastic particles, carbon', 'headphones', 0, 'https://superfreshfruits.com/assets/images/fruit-1000x727.png', '2024-02-11 14:40:30.17+00', '2024-05-15 07:57:56.745+00'),
(1002, 'Writing Material', 'https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1705749447297.jpg', 346, 'Pencil, Crayon Pencil, Marker, Liquid Crayon, Crayon, Chalk,', 'writing-material', 0, 'https://superfreshfruits.com/assets/images/fruit-1000x727.png', '2024-01-19 13:47:46.373+00', '2024-01-20 11:17:28.482+00'),
(1003, 'Sticky Note', 'https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1705749543032.jpg', 346, 'Great for marking your place in a book or highlighting important points. Comes in different color.', 'sticky-note', 0, 'https://superfreshfruits.com/assets/images/fruit-1000x727.png', '2024-01-19 14:01:07.888+00', '2024-01-20 11:19:05.068+00'),
(1004, 'Rubber Band', 'https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1707991673387.jpg', 346, 'Rubber Bands: So, stretch your imagination, snap into action, and let the rubber band weave its magic into your daily routine', 'rubber-band', 0, 'https://superfreshfruits.com/assets/images/fruit-1000x727.png', '2024-01-19 14:01:07.888+00', '2024-01-20 11:19:05.068+00')
ON CONFLICT DO NOTHING;

-- DELIVERY_CHARGE
INSERT INTO "DELIVERY_CHARGE" ("id", "comparisonOperator", "amount", "charge", "createdAt", "updatedAt")
VALUES
(100, '<=', 10000, 2, '2024-01-19 00:00:00+00', '2024-05-28 09:54:05.231+00'),
(101, '<=', 100000, 25, '2024-01-19 00:00:00+00', '2024-01-19 00:00:00+00'),
(102, '<=', 500000, 50, '2024-01-19 00:00:00+00', '2024-01-19 00:00:00+00'),
(103, '<=', 1000000, 100, '2024-01-23 10:21:06.372+00', '2024-01-23 10:21:06.372+00')
ON CONFLICT DO NOTHING;

-- DISTANCE_CHARGE
INSERT INTO "DISTANCE_CHARGE" ("id", "distance", "operator", "charge", "createdAt", "updatedAt")
VALUES
(100, 5, '<=', 1, '2024-01-16 08:05:14.665+00', '2024-01-16 08:05:14.665+00'),
(101, 15, '<=', 2, '2024-01-16 08:05:14.804+00', '2024-05-18 17:34:51.118+00'),
(102, 30, '<=', 3, '2024-01-16 08:05:14.941+00', '2024-01-16 08:05:14.941+00'),
(103, 50, '<=', 4, '2024-01-16 08:05:15.078+00', '2024-01-16 08:05:15.078+00'),
(104, 100, '<=', 5, '2024-01-16 08:05:15.216+00', '2024-01-16 08:05:15.216+00'),
(105, 150, '>=', 10, '2024-01-16 08:05:15.354+00', '2024-01-16 09:45:27.945+00'),
(106, 300, '<=', 15, '2024-01-16 08:05:14.665+00', '2024-01-16 08:05:14.665+00'),
(107, 3000, '<=', 500, '2024-01-16 08:05:14.665+00', '2024-01-16 08:05:14.665+00'),
(108, 1000, '<', 20, '2024-01-16 08:05:14.665+00', '2024-01-16 08:05:14.665+00'),
(109, 5000, '<=', 50, '2024-01-23 10:28:32.324+00', '2024-01-23 10:28:32.324+00')
ON CONFLICT DO NOTHING;

-- PRODUCTS
INSERT INTO "PRODUCTS" ("_id", "name", "image", "bar_code", "sku", "brand", "bulk_order", "category", "description", "specifications", "manufacture", "purchase_rate", "retail_rate", "status", "subCategory", "title", "unit", "units", "store_id", "price", "pid", "slug", "orderCount", "averageRating", "totalReviews", "createdAt", "updatedAt")
VALUES
(111111, 'V-MODA - BassFit Wireles', 'https://www.headphonezone.in/cdn/shop/products/Headphone-Zone-v-moda-bassfit-1160-1160-2.jpg?v=1617275574&width=1000', 'BDKDIEEKD33', 'o1NMLCpSL693', 'V-MODA', FALSE, 345, 'V-MODA - BassFit Wireless', '<p><br></p>', 'V-MODA', 145, 145, TRUE, 1000, 'V-MODA - BassFit Wireless', 21, 4, 123456, 145, '52aa6c70-35e3-43d1-803a-1d98e638dba8', 'v-moda-bassfit-wireles', 0, 0, 0, '2024-05-23 12:56:19.922+00', '2024-06-17 10:41:47.041+00'),
(111112, 'DITA Audio - Project S', 'https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/ditaaudio.webp', 'BDKDIEEKD76', 'vsJtZQS4mGf6', 'DITA AUDIO', FALSE, 345, 'DITA Audio - Project M', '<p><br></p>', 'DITA AUDIO', 99, 99, TRUE, 1000, 'DITA Audio - Project M', 12, 2, 123456, 99, '43619c36-5cbc-443e-9297-430de3f2b9dd', 'dita-audio-project-s', 0, 0, 0, '2024-05-28 10:38:11.136+00', '2024-06-17 10:38:45.13+00'),
(111113, 'FiiO X Jade Audio - KA11', 'https://www.headphonezone.in/cdn/shop/files/Headphone-Zone-FiiO-Jade-Audio-KA11-Midnight-Black-Type-C-03.jpg?v=1712211162&width=1000', 'BDKDIEEKD765', 'vsJtZQS4mGf65', 'fiio', FALSE, 345, 'Portable USB Amp & DAC', '<p>Portable USB Amp & DAC</p>', 'fiio', 39.99, 39.99, TRUE, 1000, 'FiiO X Jade Audio - KA11', 12, 2, 123456, NULL, 'f5e80e73-92b4-48a3-ad63-7b9f2917a317', 'dkdkdk', 0, 0, 0, '2024-05-28 10:38:11.136+00', '2024-06-17 10:38:45.13+00')
ON CONFLICT DO NOTHING;

-- BANNER
INSERT INTO "BANNER" ("id", "storeId", "title", "description", "img_mob", "img_desk", "status", "position", "createdAt", "updatedAt")
VALUES
(100, 123456, 'Welcome..', NULL, '', 'https://shopschoolgirlstyle.com/cdn/shop/products/ScreenShot2021-04-13at10.16.39PM.png?v=1618370220', TRUE, 0, '2024-06-18 00:16:43.173+05:30', '2024-06-18 00:16:43.173+05:30'),
(101, 123456, 'HELLO..', NULL, '', 'https://static.vecteezy.com/system/resources/previews/011/884/040/non_2x/siver-welcome-on-banner-vector.jpg', TRUE, 0, '2024-06-18 00:16:43.173+05:30', '2024-06-18 00:16:43.173+05:30')
ON CONFLICT DO NOTHING;

COMMIT;
