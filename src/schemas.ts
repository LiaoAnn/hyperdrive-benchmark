import { z } from 'zod';

// 查詢類型枚舉
export const QueryTypeSchema = z.enum([
  'simpleCount',
  'simpleSelect',
  'joinUsersOrders',
  'complexAggregation',
  'subquery',
  'fullTextSearch',
  'bulkInsert',
  'bulkUpdate',
  'transaction',
]);

// 測試模式枚舉
export const BenchmarkModeSchema = z.enum(['hyperdrive', 'no-hyperdrive']);

// 地區提示枚舉
export const LocationHintSchema = z.enum([
  'wnam', // Western North America
  'enam', // Eastern North America
  'sam', // South America
  'weur', // Western Europe
  'eeur', // Eastern Europe
  'apac', // Asia-Pacific
  'oc', // Oceania
  'afr', // Africa
  'me', // Middle East
]);

// 基準測試請求參數
export const RunBenchmarkParamsSchema = z.object({
  mode: BenchmarkModeSchema.optional().default('hyperdrive'),
  regions: z.string().optional(),
});

// 測試 DO 請求參數
export const TestDOParamsSchema = z.object({
  region: LocationHintSchema.optional().default('apac'),
});

// 基準測試結果 schema
export const BenchmarkResultSchema = z.object({
  region: LocationHintSchema,
  mode: BenchmarkModeSchema,
  success: z.boolean(),
  latency: z.number().optional(),
  queryType: QueryTypeSchema.optional(),
  queryDescription: z.string().optional(),
  result: z.unknown().optional(),
  resultCount: z.number().optional(),
  error: z.string().optional(),
});

// 單個 DO 測試響應 schema
export const SingleDOTestResponseSchema = z.object({
  region: LocationHintSchema,
  latency: z.number(),
  queryType: QueryTypeSchema.optional(),
  queryDescription: z.string().optional(),
  result: z.unknown().optional(),
  resultCount: z.number().optional(),
  error: z.string().optional(),
});

// 基準測試總結 schema
export const BenchmarkSummarySchema = z.object({
  mode: z.string(),
  totalTests: z.number(),
  successfulTests: z.number(),
  failedTests: z.number(),
  avgLatency: z.number(),
  minLatency: z.number(),
  maxLatency: z.number(),
  testedRegions: z.array(z.string()),
  regionLatencies: z.record(z.string(), z.number()),
});

// 運行基準測試響應 schema
export const RunBenchmarkResponseSchema = z.object({
  results: z.array(BenchmarkResultSchema),
  summary: BenchmarkSummarySchema,
});

// Seed 響應 schema
export const SeedResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});
