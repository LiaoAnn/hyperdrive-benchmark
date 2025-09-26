# Hyperdrive benchmark

This repository contains the code and instructions to run the Hyperdrive benchmark, which evaluates the performance of global database connection with [Cloudflare Hyperdrive](https://www.cloudflare.com/developer-platform/products/hyperdrive/).

To evaluate the performance of Hyperdrive, we will simulate a scenario that connects to a PostgreSQL database from multiple regions using Cloudflare Workers and Hyperdrive. The benchmark will measure the latency and throughput of database queries executed from different geographic locations.

## Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform to run the benchmark code.
- [Cloudflare Hyperdrive](https://www.cloudflare.com/developer-platform/products/hyperdrive/) - Global database connection service.
- [Cloudflare Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects/) - State management for Workers.
- [PostgreSQL](https://www.postgresql.org/) - Relational database.
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe ORM for database interactions.
- [Zod](https://zod.dev/) - Schema validation and type safety.
- [@hono/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator) - Request validation middleware.

## API Documentation

The API includes automatic request validation and OpenAPI documentation:

- **OpenAPI Spec**: `GET /openapi.json` - Complete API specification
- **Request Validation**: All endpoints validate query parameters using Zod schemas
- **Type Safety**: Full TypeScript types for all API interactions

### Available Endpoints

- `GET /run-benchmark` - Run parallel benchmarks across multiple regions
- `GET /test-do` - Test a single Durable Object instance
- `GET /ping` - Health check endpoint
- `GET /openapi.json` - OpenAPI specification

## Architecture

The benchmark system consists of:

1. **Main Worker**: Receives benchmark requests and orchestrates tests across regions
2. **Durable Objects**: Execute database queries in different regions and measure latency
3. **Hyperdrive**: Provides optimized database connections
4. **PostgreSQL Database**: Target database for performance testing

## Database Schema

The benchmark uses a realistic e-commerce database schema with the following tables:

- **users**: User accounts
- **products**: Product catalog
- **orders**: Customer orders
- **order_items**: Order line items
- **reviews**: Product reviews
- **categories**: Product categories

## Available Benchmark Queries

- `simpleCount`: Count total users
- `simpleSelect`: Select products (limit 10)
- `joinUsersOrders`: Join users with their orders
- `complexAggregation`: Complex aggregation with multiple joins
- `subquery`: Subquery for high-value users
- `fullTextSearch`: Full-text search in products
- `bulkInsert`: Bulk insert test users
- `bulkUpdate`: Bulk update product stock
- `transaction`: Multi-table transaction

## Setup

See [SETUP.md](./SETUP.md) for detailed setup instructions.

## Usage

After setup, deploy the worker and run benchmarks:

```bash
# Get API documentation
curl "https://your-worker.hyperdrive-benchmark.workers.dev/openapi.json"

# Run benchmark across default regions (with Hyperdrive)
curl "https://your-worker.hyperdrive-benchmark.workers.dev/run-benchmark"

# Run benchmark across default regions (without Hyperdrive)
curl "https://your-worker.hyperdrive-benchmark.workers.dev/run-benchmark?mode=no-hyperdrive"

# Run benchmark across specific regions
curl "https://your-worker.hyperdrive-benchmark.workers.dev/run-benchmark?regions=wnam,enam,eeur&mode=hyperdrive"

# Single region test
curl "https://your-worker.hyperdrive-benchmark.workers.dev/test-do?region=wnam"
```

## Results

The benchmark returns latency measurements and statistics:

```json
{
  "results": [
    {
      "region": "asia",
      "latency": 45,
      "result": {
        "current_time": "2025-09-26T10:30:00.000Z",
        "message": "test"
      }
    }
  ],
  "summary": {
    "totalTests": 1,
    "avgLatency": 45,
    "minLatency": 45,
    "maxLatency": 45
  }
}
```
