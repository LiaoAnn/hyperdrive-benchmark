import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { describeRoute, openAPIRouteHandler, resolver } from 'hono-openapi';
import ping from './routes/ping';
import seed from './routes/seed';
import {
  RunBenchmarkParamsSchema,
  TestDOParamsSchema,
  SingleDOTestResponseSchema,
  RunBenchmarkResponseSchema,
} from './schemas';
import type {
  BenchmarkMode,
  BenchmarkResult,
  DOQueryResponse,
  SingleDOTestResponse,
} from './types';

export { BenchmarkDO } from './durable-objects/BenchmarkDO';

const app = new Hono<{
  Bindings: CloudflareBindings;
}>();

app.route('/ping', ping);
app.route('/seed', seed);

// Cloudflare Durable Objects 支持的 location hints
const AVAILABLE_LOCATION_HINTS: DurableObjectLocationHint[] = [
  'wnam', // Western North America
  'enam', // Eastern North America
  'sam', // South America
  'weur', // Western Europe
  'eeur', // Eastern Europe
  'apac', // Asia-Pacific
  'oc', // Oceania
  'afr', // Africa
  'me', // Middle East
];

// 新路由來運行基準測試 - 支持多地區並行測試
app.get(
  '/run-benchmark',
  describeRoute({
    description: '在多個地區並行運行 Hyperdrive 基準測試',
    responses: {
      200: {
        description: '基準測試結果',
        content: {
          'application/json': {
            schema: resolver(RunBenchmarkResponseSchema),
          },
        },
      },
    },
  }),
  zValidator('query', RunBenchmarkParamsSchema),
  async c => {
    // pls set DIRECT_DB_URL first
    if (!c.env.DIRECT_DB_URL) {
      return c.json({ error: 'DIRECT_DB_URL is not set' }, 400);
    }

    const mode: BenchmarkMode = (c.req.query('mode') ||
      'hyperdrive') as BenchmarkMode;
    const regionsParam = c.req.query('regions');

    // 如果沒有指定地區，使用所有可用的 location hints
    const locationHints = regionsParam
      ? regionsParam.split(',').map(h => h.trim() as DurableObjectLocationHint)
      : AVAILABLE_LOCATION_HINTS;

    const results: BenchmarkResult[] = [];

    // 並行執行所有地區的測試
    const testPromises = locationHints.map(async locationHint => {
      try {
        // 使用 location hint 創建 DO
        const id = c.env.BENCHMARK_DO.idFromName(`benchmark-${locationHint}`);
        const stub = c.env.BENCHMARK_DO.get(id, { locationHint });

        // 創建帶有模式參數的請求（地區信息已經通過 location hint 隱含）
        const url = new URL(c.req.url);
        url.searchParams.set('mode', mode);
        url.pathname = '/query'; // 修改路徑為 DO 期望的 /query

        const request = new Request(url.toString(), {
          method: c.req.method,
          headers: c.req.raw.headers,
          body: c.req.raw.body,
        });

        // 調用 DO 的查詢
        const response = await stub.fetch(request);
        const result = (await response.json()) as DOQueryResponse;
        return { region: locationHint, mode, ...result, success: true };
      } catch (error) {
        console.error(`Error testing region ${locationHint}:`, error);
        return {
          region: locationHint,
          mode,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    });

    // 等待所有測試完成
    const allResults = await Promise.all(testPromises);
    results.push(...allResults);

    // 計算統計（只包含成功的測試）
    const successfulResults = results.filter(
      r => r.success && r.latency !== undefined && !isNaN(r.latency),
    );
    const latencies = successfulResults
      .map(r => r.latency!)
      .filter(l => l !== undefined);
    const avgLatency =
      latencies.length > 0
        ? latencies.reduce((a, b) => a! + b!, 0) / latencies.length
        : 0;
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

    // 構建各個地區的延遲映射
    const regionLatencies: Record<string, number> = {};
    for (const result of successfulResults) {
      regionLatencies[result.region] = result.latency!;
    }

    return c.json({
      results,
      summary: {
        mode,
        totalTests: results.length,
        successfulTests: successfulResults.length,
        failedTests: results.length - successfulResults.length,
        avgLatency,
        minLatency,
        maxLatency,
        testedRegions: locationHints,
        regionLatencies,
      },
    });
  },
);

// 新路由來測試 DO 而不使用 Hyperdrive
app.get(
  '/test-do',
  describeRoute({
    description: '測試單個 Durable Object 的查詢性能',
    responses: {
      200: {
        description: 'DO 測試結果',
        content: {
          'application/json': {
            schema: resolver(SingleDOTestResponseSchema),
          },
        },
      },
    },
  }),
  zValidator('query', TestDOParamsSchema),
  async c => {
    const region = c.req.query('region') || 'default';

    const id = c.env.BENCHMARK_DO.idFromName(`test-${region}`);
    const stub = c.env.BENCHMARK_DO.get(id);

    const response = await stub.fetch(
      new Request('http://dummy/query', { method: 'GET' }),
    );
    const result = (await response.json()) as DOQueryResponse;

    return c.json({ region, ...result } as SingleDOTestResponse);
  },
);

app.get('/openapi', (c, ...args) =>
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Hyperdrive Benchmark API',
        version: '1.0.0',
        description: 'Cloudflare Hyperdrive 性能基準測試 API',
      },
      servers: [{ url: new URL(c.req.url).origin }],
    },
  })(c, ...args),
);

export default app;
