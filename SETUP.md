# Hyperdrive Benchmark Setup

## 1. 設置 PostgreSQL 數據庫

你需要一個 PostgreSQL 數據庫來測試 Hyperdrive。可以是自托管的或雲服務。

### 示例：使用 Docker 運行本地 PostgreSQL

```bash
docker run --name postgres -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=testdb -p 5432:5432 -d postgres:15
```

### 創建測試表

連接到數據庫並運行：

```sql
-- 數據庫將通過 Drizzle migration 自動創建表結構
-- 只需要確保數據庫存在即可
```

## 2. 配置 Hyperdrive

### 創建 Hyperdrive 實例

使用 Wrangler CLI 創建 Hyperdrive 配置：

```bash
npx wrangler hyperdrive create hyperdrive-benchmark --connection-string="postgres://postgres:mypassword@localhost:5432/testdb"
```

這將輸出一個 ID，將其複製到 `wrangler.jsonc` 中的 `hyperdrive` 部分替換 `"your-hyperdrive-id-here"`。

### 更新 wrangler.jsonc

確保 `wrangler.jsonc` 中的 `hyperdrive` 部分有正確的 ID：

```jsonc
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "your-actual-hyperdrive-id-here"
  }
]
```

## 3. 設置數據庫 Schema

### 生成並應用 Migration

```bash
# 設置環境變量
export DATABASE_URL="postgres://postgres:mypassword@localhost:5432/testdb"

# 生成 migration 文件（如果 schema 發生變化）
drizzle-kit generate

# 應用 migration 到數據庫（創建表結構）
drizzle-kit migrate

# 填充初始測試數據（通過 API endpoint）
curl -X POST "https://your-worker.hyperdrive-benchmark.workers.dev/seed"
```

Migration 將自動創建表結構。然後運行 seed 腳本填充測試數據。包含的測試數據包括：

- 5 個產品分類
- 10 個測試用戶
- 15 個產品
- 10 個訂單
- 訂單項目和評論

## 4. 部署 Worker

```bash
pnpm deploy
```

## 5. 運行基準測試

### 單地區測試

```bash
curl "https://your-worker-url/benchmark?region=asia"
```

### 多地區並行基準測試

```bash
# 使用預設地區測試 (9 個 Cloudflare location hints)
curl "https://your-worker.hyperdrive-benchmark.workers.dev/run-benchmark"

# 指定特定地區測試
curl "https://your-worker.hyperdrive-benchmark.workers.dev/run-benchmark?regions=wnam,enam,eeur"

# 比較 Hyperdrive vs 直接連接
curl "https://your-worker.hyperdrive-benchmark.workers.dev/run-benchmark?mode=no-hyperdrive"
```

### 單地區測試

```bash
# 簡單計數查詢
curl "https://your-worker-url/benchmark?region=wnam&type=simpleCount"

# 複雜聚合查詢
curl "https://your-worker-url/benchmark?region=wnam&type=complexAggregation"

# 全文搜索
curl "https://your-worker-url/benchmark?region=wnam&type=fullTextSearch&search=laptop"

# 批量插入
curl "https://your-worker-url/benchmark?region=wnam&type=bulkInsert&count=50"
```

## 6. 理解結果

- `latency`: 從 DO 到數據庫的查詢延遲（毫秒）
- `queryType`: 執行的查詢類型
- `queryDescription`: 查詢描述
- `result`: 查詢結果（限制為前10個項目）
- `resultCount`: 總結果數量
- `region`: 地區標識符

## 7. Durable Object Location Hints

系統使用 Cloudflare Durable Objects 的 location hints 來確保 DO 在特定地區運行：

- `wnam`: Western North America
- `enam`: Eastern North America
- `sam`: South America
- `weur`: Western Europe
- `eeur`: Eastern Europe
- `apac`: Asia-Pacific
- `oc`: Oceania
- `afr`: Africa
- `me`: Middle East

## 8. 基準測試模式

### Hyperdrive 模式 (預設)

使用 Cloudflare Hyperdrive 進行數據庫連接，提供全局優化的連接池。

### No-Hyperdrive 模式

使用直接數據庫連接，繞過 Hyperdrive 以進行比較測試。

```bash
# Hyperdrive 模式
curl "https://your-worker/run-benchmark?mode=hyperdrive"

# 直接連接模式
curl "https://your-worker/run-benchmark?mode=no-hyperdrive"
```
