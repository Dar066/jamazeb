// Orders and return requests in the database. Every query is scoped to the
// "jamazeb" schema created by db/jamazeb-schema.sql.

import type { Order } from "../orders";
import type { ReturnRequest } from "../returns";
import { db } from "./client";
import { takeStock } from "./products";

type Row = { data: Order };
type ReturnRow = { data: ReturnRequest };

function sql() {
  const s = db();
  if (!s) throw new Error("Database not configured");
  return s;
}

/**
 * Saves a new order. With `reserveStock`, the items are taken from stock in the
 * same transaction, so the order and the stock change happen together or not at
 * all (throws OutOfStock if an item ran out). Returns false if the order number
 * is already taken.
 */
export async function insertOrder(order: Order, reserveStock = false): Promise<boolean> {
  return sql().begin(async (tx) => {
    const rows = await tx`
      insert into jamazeb.orders (id, created_at, status, payment, phone, sample, data)
      values (${order.id}, ${order.createdAt}, ${order.status}, ${order.payment}, ${order.customer.phone},
              ${order.sample === true}, ${tx.json(order as never)})
      on conflict (id) do nothing
      returning id`;
    if (rows.length === 0) return false;
    if (reserveStock) await takeStock(tx, order.lines);
    return true;
  }) as Promise<boolean>;
}

export async function getOrder(id: string): Promise<Order | null> {
  const rows = await sql()<Row[]>`select data from jamazeb.orders where id = ${id}`;
  return rows[0]?.data ?? null;
}

/** An order only when the mobile number matches, so order numbers can't be guessed alone. */
export async function findOrder(id: string, phone: string): Promise<Order | null> {
  const rows = await sql()<Row[]>`select data from jamazeb.orders where id = ${id} and phone = ${phone}`;
  return rows[0]?.data ?? null;
}

export async function findOrders(pairs: { id: string; phone: string }[]): Promise<Order[]> {
  if (pairs.length === 0) return [];
  const ids = pairs.map((p) => p.id);
  const rows = await sql()<(Row & { phone: string })[]>`select data, phone from jamazeb.orders where id in ${sql()(ids)}`;
  return rows.filter((r) => pairs.some((p) => p.id === r.data.id && p.phone === r.phone)).map((r) => r.data);
}

export async function listOrders(limit = 1000): Promise<Order[]> {
  const rows = await sql()<Row[]>`select data from jamazeb.orders order by created_at desc limit ${limit}`;
  return rows.map((r) => r.data);
}

/**
 * Changes an order safely: the row is locked while `change` runs, so two
 * updates at once (say, the admin and a payment result) can't overwrite each other.
 * `change` returns the new order, or null to leave it as it is.
 */
export async function updateOrder(id: string, change: (order: Order) => Order | null): Promise<Order | null> {
  return sql().begin(async (tx) => {
    const rows = await tx<Row[]>`select data from jamazeb.orders where id = ${id} for update`;
    const current = rows[0]?.data;
    if (!current) return null;
    const next = change(current);
    if (!next) return current;
    await tx`
      update jamazeb.orders
      set data = ${tx.json(next as never)}, status = ${next.status}, updated_at = now()
      where id = ${id}`;
    return next;
  }) as Promise<Order | null>;
}

export async function insertReturn(request: ReturnRequest): Promise<boolean> {
  const rows = await sql()`
    insert into jamazeb.returns (id, order_id, created_at, status, sample, data)
    values (${request.id}, ${request.orderId}, ${request.createdAt}, ${request.status}, ${request.sample === true},
            ${sql().json(request as never)})
    on conflict (id) do nothing
    returning id`;
  return rows.length === 1;
}

export async function listReturns(limit = 1000): Promise<ReturnRequest[]> {
  const rows = await sql()<ReturnRow[]>`select data from jamazeb.returns order by created_at desc limit ${limit}`;
  return rows.map((r) => r.data);
}

export async function getReturn(id: string): Promise<ReturnRequest | null> {
  const rows = await sql()<ReturnRow[]>`select data from jamazeb.returns where id = ${id}`;
  return rows[0]?.data ?? null;
}

export async function returnsForOrders(orderIds: string[]): Promise<ReturnRequest[]> {
  if (orderIds.length === 0) return [];
  const rows = await sql()<ReturnRow[]>`select data from jamazeb.returns where order_id in ${sql()(orderIds)} order by created_at desc`;
  return rows.map((r) => r.data);
}

export async function setReturnStatus(id: string, status: ReturnRequest["status"]): Promise<ReturnRequest | null> {
  const decidedAt = new Date().toISOString();
  const rows = await sql()<ReturnRow[]>`
    update jamazeb.returns
    set status = ${status}, updated_at = now(),
        data = data || ${sql().json({ status, decidedAt } as never)}
    where id = ${id}
    returning data`;
  return rows[0]?.data ?? null;
}

/** Replaces all sample orders and requests with a fresh set. */
export async function replaceSampleData(orders: Order[], returns: ReturnRequest[]): Promise<void> {
  await sql().begin(async (tx) => {
    await tx`delete from jamazeb.orders where sample`;
    for (const o of orders) {
      await tx`
        insert into jamazeb.orders (id, created_at, status, payment, phone, sample, data)
        values (${o.id}, ${o.createdAt}, ${o.status}, ${o.payment}, ${o.customer.phone}, true, ${tx.json(o as never)})
        on conflict (id) do nothing`;
    }
    for (const r of returns) {
      await tx`
        insert into jamazeb.returns (id, order_id, created_at, status, sample, data)
        values (${r.id}, ${r.orderId}, ${r.createdAt}, ${r.status}, true, ${tx.json(r as never)})
        on conflict (id) do nothing`;
    }
  });
}

export async function clearSampleData(): Promise<void> {
  // Sample requests go with their orders (on delete cascade).
  await sql()`delete from jamazeb.orders where sample`;
}
