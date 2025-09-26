// 基準測試相關的類型定義

// 查詢類型枚舉
export type QueryType =
  | 'simpleCount'
  | 'simpleSelect'
  | 'joinUsersOrders'
  | 'complexAggregation'
  | 'subquery'
  | 'fullTextSearch'
  | 'bulkInsert'
  | 'bulkUpdate'
  | 'transaction';

// 測試模式枚舉
export type BenchmarkMode = 'hyperdrive' | 'no-hyperdrive';

// DO 查詢響應 - 成功情況
export interface QuerySuccessResponse {
  latency: number;
  queryType: QueryType;
  queryDescription: string;
  result: unknown;
  resultCount: number;
}

// DO 查詢響應 - 錯誤情況
export interface QueryErrorResponse {
  error: string;
  latency: number;
}

// DO 測試響應
export interface TestResponse {
  latency: number;
  message: string;
}

// DO 響應的聯集類型
export type DOQueryResponse = QuerySuccessResponse | QueryErrorResponse;
export type DOTestResponse = TestResponse;

// Worker 層的基準測試結果
export interface BenchmarkResult {
  region: DurableObjectLocationHint;
  mode: BenchmarkMode;
  success: boolean;
  latency?: number; // 在錯誤情況下可能沒有 latency
  queryType?: QueryType;
  queryDescription?: string;
  result?: unknown;
  resultCount?: number;
  error?: string;
}

// 單個 DO 測試響應 (用於 /test-do 路由)
export interface SingleDOTestResponse {
  region: string;
  latency: number;
  queryType?: QueryType;
  queryDescription?: string;
  result?: unknown;
  resultCount?: number;
  error?: string;
}
