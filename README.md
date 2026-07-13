![Nest](assets/logo.png)

## Description

Starter kit project made with [Nest](https://github.com/nestjs/nest) that demonstrates CRUD user, JWT authentication, CRUD posts and e2e tests.

### Technologies implemented:

-   [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) (ORM) + [PostgreSQL](https://www.postgresql.org/)
-   [JWT](https://jwt.io/)
-   [Jest](https://jestjs.io/)
-   [Swagger](https://swagger.io/)

## Prerequisites

-   [Node.js](https://nodejs.org/) (>= 10.8.0)
-   [npm](https://www.npmjs.com/) (>= 6.5.0)

## Installation

```bash
$ npm install
```

## Setting up the database for development and test

PostgreSQL database connection options are shown in the following table:

| Option   | Development | Test      |
| -------- | ----------- | --------- |
| Host     | localhost   | localhost |
| Port     | 5432        | 5432      |
| Username | postgres    | postgres  |
| Password | postgres    | postgres  |
| Database | nest        | nest_test |

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# e2e tests
$ npm run test
```

## Other commands

```bash
# formatting code
$ npm run format

# run linter
$ npm run lint

# create database
$ npm run db:create

# run migrations
$ npm run db:migrate

# run seeders
$ npm run db:seed-dev

# reset database
$ npm run db:reset

# drop database
$ npm run db:drop

```

## Run production configuration

```
NODE_ENV=production \
DATABASE_HOST=db.host.com \
DATABASE_PORT=5432 \
DATABASE_USER=user \
DATABASE_PASSWORD=pass \
DATABASE_DATABASE=database \
JWT_PRIVATE_KEY=jwtPrivateKey \
ts-node -r tsconfig-paths/register src/main.ts
```

## Swagger API docs

This project uses the Nest swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger) - [www.swagger.io](https://swagger.io/)  
Swagger docs will be available at localhost:3000/documentation

## BudPay seller payout profile import

BudPay's documented API does not provide Paystack-style marketplace
subaccounts or automatic transaction split settlement. This importer therefore:

1. reads local seller settlement details;
2. enriches missing details from the seller's Paystack subaccount;
3. creates or reuses a BudPay customer;
4. creates or reuses a BudPay dedicated virtual account; and
5. retains the seller bank details as a payout profile for separate BudPay
   payouts.

The dedicated virtual account receives money into the platform BudPay wallet.
It is not the seller's settlement bank account and does not automatically split
checkout funds.

Required configuration:

```env
BUDPAY_SECRET_KEY=sk_test_xxx
BUDPAY_BASE_URL=https://api.budpay.com/api/v2
PAYMENT_PROVIDER=paystack
SPLIT_PROVIDER=paystack
BUDPAY_ALLOW_COMPANY_FALLBACK=false
```

Keep `SPLIT_PROVIDER=paystack` until seller payout operations have been
implemented and operationally approved. Setting it to `budpay` does not enable
automatic splitting; it only enforces that affected stores have imported
BudPay profiles. Missing profiles reject checkout unless
`BUDPAY_ALLOW_COMPANY_FALLBACK=true`.

Run the database migration first:

```bash
npm run db:migrate
```

All endpoints require an authenticated admin:

```text
GET  /budpay/admin/import-paystack-subaccounts/preview
POST /budpay/admin/import-paystack-subaccounts
GET  /budpay/admin/import-paystack-subaccounts/status
```

Recommended sequence:

```bash
# Preview only; never mutates Store rows or BudPay.
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_URL/budpay/admin/import-paystack-subaccounts/preview?limit=100"

# Equivalent dry run through the import endpoint.
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"limit":100}' \
  "$API_URL/budpay/admin/import-paystack-subaccounts"

# Real import in a bounded batch.
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":25}' \
  "$API_URL/budpay/admin/import-paystack-subaccounts"

# Retry failed records.
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"retryFailed":true,"limit":25}' \
  "$API_URL/budpay/admin/import-paystack-subaccounts"

# Reconcile one store. force=true may replace stored BudPay identifiers.
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"storeId":123,"force":true}' \
  "$API_URL/budpay/admin/import-paystack-subaccounts"
```

Rollback plan:

- Keep `PAYMENT_PROVIDER=paystack` and `SPLIT_PROVIDER=paystack`.
- BudPay import never deletes or overwrites Paystack identifiers.
- To retry an incorrect import, review `budpay_raw_response`, clear only the
  `budpay_*` Store fields for the affected store, and rerun a targeted import.
- The migration `down` removes only BudPay columns and indexes. Run it only
  after exporting `budpay_raw_response` for audit purposes.

## Structured logging and Grafana

The API uses Pino through `nestjs-pino`. The terminal output is readable in
development and JSON in production. The file configured by `LOG_FILE_PATH` is
always newline-delimited JSON so Promtail can ship it to Loki/Grafana in both
development and production. Every HTTP request gets an `X-Request-Id` response
header. A valid incoming `X-Request-Id` or `X-Correlation-Id` is preserved,
otherwise the API generates one.

Application logs should use `AppLogger` and include stable fields such as
`event`, `orderId`, `userId`, `storeId`, `paymentReference`,
`transactionReference`, and `gateway`. Do not log request bodies, webhook
payloads, authorization headers, credentials, tokens, card details, or
passwords. The logger also redacts common sensitive fields as a second layer of
protection.

Configuration:

```env
NODE_ENV=production
APP_NAME=alaba-market-backend
LOG_LEVEL=info
LOG_FILE_PATH=logs/backend.log
LOG_SLOW_REQUEST_MS=1000
```

Start the local observability stack:

```bash
mkdir -p logs
docker compose -f docker-compose.logging.yml up -d
```

Run the backend normally. It writes JSON logs to `logs/backend.log` while
keeping pretty terminal logs in development. Open Grafana at
<http://localhost:3001>. The local default credentials are `admin` / `admin`;
change `GRAFANA_ADMIN_PASSWORD` outside local development. Loki is provisioned
automatically and the **Alaba Backend Logs** dashboard is loaded at startup.

Useful queries in Grafana Explore:

```logql
# All errors
{job="alaba-market-backend"} | json | level >= 50

# One payment
{job="alaba-market-backend"} | json | paymentReference="PAYMENT_REFERENCE"

# One order
{job="alaba-market-backend"} | json | orderId=123

# One correlated request
{job="alaba-market-backend"} | json | requestId="REQUEST_ID"

# Paystack or BudPay webhook failures
{job="alaba-market-backend"} | json | gateway=~"paystack|budpay" | event=~"webhook_.*" | level >= 40

# Slow requests
{job="alaba-market-backend"} | json | msg="slow request completed"

# Failed order creation
{job="alaba-market-backend"} | json | event=~".*order.*failed"

# Node process warnings, for example TimeoutNegativeWarning
{job="alaba-market-backend"} | json | event="process_warning"

# Featured product rotation scheduler errors
{job="alaba-market-backend"} | json | event="featured_rotation_error"
```

Promtail labels only low-cardinality fields. IDs and payment references remain
JSON fields queried with `| json`, preventing excessive Loki label
cardinality. Promtail is retained here because this deployment explicitly
uses it; Grafana has moved Promtail into legacy support, so plan a later
migration to Grafana Alloy.

Stop the stack with:

```bash
docker compose -f docker-compose.logging.yml down
```
