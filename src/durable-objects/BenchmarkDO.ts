import { DurableObject } from 'cloudflare:workers';
import { createDb, type Database } from '../db';
import { benchmarkQueries } from '../db/queries';
import type postgres from 'postgres';

export class BenchmarkDO extends DurableObject<CloudflareBindings> {
  constructor(state: DurableObjectState, env: CloudflareBindings) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.pathname.split('/')[1];

    if (action === 'query') {
      return this.handleQuery(request);
    } else if (action === 'test') {
      return this.handleTest();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleQuery(request: Request): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'hyperdrive';

    try {
      let db: Database;
      let client: postgres.Sql;

      if (mode === 'hyperdrive') {
        // 使用 Hyperdrive 連接
        const connectionResult = createDb(this.env.HYPERDRIVE.connectionString);
        db = connectionResult.db;
        client = connectionResult.client;
      } else {
        // 使用直接數據庫連接 (no-hyperdrive mode)
        const connectionResult = createDb(this.env.DIRECT_DB_URL);
        db = connectionResult.db;
        client = connectionResult.client;
      }

      // 根據請求參數選擇查詢類型
      const queryType = url.searchParams.get('type') || 'simpleCount';

      let result: unknown;
      let queryDescription: string;

      switch (queryType) {
        case 'simpleCount': {
          result = await benchmarkQueries.simpleCount(db);
          queryDescription = 'Count users';
          break;
        }
        case 'simpleSelect': {
          result = await benchmarkQueries.simpleSelect(db);
          queryDescription = 'Select products';
          break;
        }
        case 'joinUsersOrders': {
          result = await benchmarkQueries.joinUsersOrders(db);
          queryDescription = 'Join users and orders';
          break;
        }
        case 'complexAggregation': {
          result = await benchmarkQueries.complexAggregation(db);
          queryDescription = 'Complex aggregation with joins';
          break;
        }
        case 'subquery': {
          result = await benchmarkQueries.subquery(db);
          queryDescription = 'Subquery for high-value users';
          break;
        }
        case 'fullTextSearch': {
          const searchTerm = url.searchParams.get('search') || 'laptop';
          result = await benchmarkQueries.fullTextSearch(db, searchTerm);
          queryDescription = `Full-text search for "${searchTerm}"`;
          break;
        }
        case 'bulkInsert': {
          const insertCount = parseInt(url.searchParams.get('count') || '10');
          result = await benchmarkQueries.bulkInsert(db, insertCount);
          queryDescription = `Bulk insert ${insertCount} users`;
          break;
        }
        case 'bulkUpdate': {
          result = await benchmarkQueries.bulkUpdate(db);
          queryDescription = 'Bulk update product stock';
          break;
        }
        case 'transaction': {
          result = await benchmarkQueries.transaction(db);
          queryDescription = 'Transaction with multiple operations';
          break;
        }
        default: {
          throw new Error(`Unknown query type: ${queryType}`);
        }
      }

      const endTime = Date.now();
      const latency = endTime - startTime;

      // 關閉連接
      await client.end();

      return new Response(
        JSON.stringify({
          latency,
          queryType,
          queryDescription,
          resultCount: Array.isArray(result) ? result.length : 1,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (error) {
      const endTime = Date.now();
      const latency = endTime - startTime;

      return new Response(
        JSON.stringify({
          error: (error as Error).message,
          latency,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  private async handleTest(): Promise<Response> {
    const startTime = Date.now();

    // 模擬一些處理
    await new Promise(resolve => setTimeout(resolve, 10));

    const endTime = Date.now();
    const latency = endTime - startTime;

    return new Response(
      JSON.stringify({
        latency,
        message: 'Test completed',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
