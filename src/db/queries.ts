import { eq, sql, desc, count, avg, sum } from 'drizzle-orm';
import type { Database } from './index';
import { users, products, orders, orderItems, reviews } from './schema';

// 簡單查詢 - 獲取用戶數量
export async function benchmarkSimpleCount(db: Database) {
  const result = await db.select({ count: count() }).from(users);
  return result[0].count;
}

// 簡單查詢 - 獲取最新產品
export async function benchmarkSimpleSelect(db: Database) {
  const result = await db.select().from(products).limit(10);
  return result;
}

// 聯接查詢 - 用戶訂單
export async function benchmarkJoinUsersOrders(db: Database) {
  const result = await db
    .select({
      userName: users.name,
      userEmail: users.email,
      orderId: orders.id,
      orderTotal: orders.totalAmount,
      orderStatus: orders.status,
      orderDate: orders.createdAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .limit(20);

  return result;
}

// 複雜查詢 - 產品銷售統計
export async function benchmarkComplexAggregation(db: Database) {
  const result = await db
    .select({
      productId: products.id,
      productName: products.name,
      totalSold: sum(orderItems.quantity),
      totalRevenue: sum(sql`${orderItems.price} * ${orderItems.quantity}`),
      orderCount: count(orderItems.orderId),
      avgRating: avg(reviews.rating),
    })
    .from(products)
    .leftJoin(orderItems, eq(products.id, orderItems.productId))
    .leftJoin(reviews, eq(products.id, reviews.productId))
    .groupBy(products.id, products.name)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(10);

  return result;
}

// 子查詢 - 高價值用戶
export async function benchmarkSubquery(db: Database) {
  const result = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      totalSpent: sql<number>`(
        SELECT COALESCE(SUM(${orders.totalAmount}), 0)
        FROM ${orders}
        WHERE ${orders.userId} = ${users.id}
      )`,
      orderCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${orders}
        WHERE ${orders.userId} = ${users.id}
      )`,
    })
    .from(users)
    .orderBy(
      desc(sql`(
      SELECT COALESCE(SUM(${orders.totalAmount}), 0)
      FROM ${orders}
      WHERE ${orders.userId} = ${users.id}
    )`),
    )
    .limit(10);

  return result;
}

// 全文搜索 - 產品搜索
export async function benchmarkFullTextSearch(
  db: Database,
  searchTerm: string = 'laptop',
) {
  const result = await db
    .select()
    .from(products)
    .where(
      sql`${products.name} ILIKE ${`%${searchTerm}%`} OR ${products.description} ILIKE ${`%${searchTerm}%`}`,
    )
    .limit(20);

  return result;
}

// 批量插入測試
export async function benchmarkBulkInsert(db: Database, count: number = 100) {
  const testUsers = Array.from({ length: count }, (_, i) => ({
    email: `test${i}@example.com`,
    name: `Test User ${i}`,
  }));

  const result = await db.insert(users).values(testUsers).returning();
  return result;
}

// 批量更新測試
export async function benchmarkBulkUpdate(db: Database) {
  const result = await db
    .update(products)
    .set({ stock: sql`${products.stock} + 1` })
    .where(sql`${products.stock} < 10`)
    .returning();

  return result;
}

// 事務測試 - 創建訂單
export async function benchmarkTransaction(db: Database) {
  return await db.transaction(async tx => {
    // 創建用戶
    const [user] = await tx
      .insert(users)
      .values({
        email: `transaction-test-${Date.now()}@example.com`,
        name: 'Transaction Test User',
      })
      .returning();

    // 創建訂單
    const [order] = await tx
      .insert(orders)
      .values({
        userId: user.id,
        totalAmount: '99.99',
        status: 'pending',
      })
      .returning();

    // 添加訂單項目
    const [product] = await tx.select().from(products).limit(1);
    if (product) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        quantity: 1,
        price: product.price,
      });
    }

    return { user, order };
  });
}

// 導出所有 benchmark 函數
export const benchmarkQueries = {
  simpleCount: benchmarkSimpleCount,
  simpleSelect: benchmarkSimpleSelect,
  joinUsersOrders: benchmarkJoinUsersOrders,
  complexAggregation: benchmarkComplexAggregation,
  subquery: benchmarkSubquery,
  fullTextSearch: benchmarkFullTextSearch,
  bulkInsert: benchmarkBulkInsert,
  bulkUpdate: benchmarkBulkUpdate,
  transaction: benchmarkTransaction,
};
