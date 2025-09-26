import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';
import { reset, seed } from 'drizzle-seed';
import * as schema from '../db/schema';
import { createDb } from '../db';
import { SeedResponseSchema } from '../schemas';

const app = new Hono<{
  Bindings: CloudflareBindings;
}>();

app.post(
  '/',
  describeRoute({
    description: '使用 Drizzle Seed 生成測試資料填充資料庫',
    responses: {
      200: {
        description: 'Seeding 成功',
        content: {
          'application/json': {
            schema: resolver(SeedResponseSchema),
          },
        },
      },
      500: {
        description: 'Seeding 失敗',
        content: {
          'application/json': {
            schema: resolver(SeedResponseSchema),
          },
        },
      },
    },
  }),
  async c => {
    try {
      // 使用 Hyperdrive 連接
      const { db, client } = createDb(c.env.HYPERDRIVE.connectionString);

      // reset database
      await reset(db, schema);

      // seed database with initial data
      await seed(db, schema, { count: 1000 });

      // close connection
      await client.end();

      return c.json({ success: true, message: 'Database seeded successfully' });
    } catch (error) {
      console.error('Seeding error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
    }
  },
);

export default app;
