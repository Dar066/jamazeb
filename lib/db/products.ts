// Products and stock in the database ("jamazeb.products"). Stock lives in its
// own column so it can be changed safely when orders are placed or cancelled.

import type { TransactionSql } from "postgres";
import { products as builtIn, type Product } from "../catalog";
import type { OrderLine } from "../orders";
import { db } from "./client";

type Row = { slug: string; status: "active" | "draft"; stock: number; data: Product };

function sql() {
  const s = db();
  if (!s) throw new Error("Database not configured");
  return s;
}

const toProduct = (r: Row): Product => ({ ...r.data, slug: r.slug, stock: r.stock });

let seeded = false;

/** The first time, fills an empty table with the built-in catalogue. */
async function ensureSeeded() {
  if (seeded) return;
  const [{ count }] = await sql()<{ count: number }[]>`select count(*)::int as count from jamazeb.products`;
  if (count === 0) {
    for (const p of builtIn) {
      await sql()`
        insert into jamazeb.products (slug, status, stock, data)
        values (${p.slug}, 'active', ${p.stock}, ${sql().json(p as never)})
        on conflict (slug) do nothing`;
    }
  }
  seeded = true;
}

/** Products shown in the shop. */
export async function listActiveProducts(): Promise<Product[]> {
  await ensureSeeded();
  const rows = await sql()<Row[]>`select slug, status, stock, data from jamazeb.products where status = 'active'`;
  return rows.map(toProduct);
}

/** Every product, drafts included, with its status (admin). */
export async function listAllProducts(): Promise<{ product: Product; status: "active" | "draft" }[]> {
  await ensureSeeded();
  const rows = await sql()<Row[]>`select slug, status, stock, data from jamazeb.products order by updated_at desc`;
  return rows.map((r) => ({ product: toProduct(r), status: r.status }));
}

export async function getProductRow(slug: string): Promise<{ product: Product; status: "active" | "draft" } | null> {
  const rows = await sql()<Row[]>`select slug, status, stock, data from jamazeb.products where slug = ${slug}`;
  return rows[0] ? { product: toProduct(rows[0]), status: rows[0].status } : null;
}

export async function upsertProduct(product: Product, status: "active" | "draft"): Promise<void> {
  await sql()`
    insert into jamazeb.products (slug, status, stock, data, updated_at)
    values (${product.slug}, ${status}, ${product.stock}, ${sql().json(product as never)}, now())
    on conflict (slug) do update
      set status = excluded.status, stock = excluded.stock, data = excluded.data, updated_at = now()`;
}

export class OutOfStock extends Error {
  constructor(public slug: string, public available: number) {
    super(`Not enough stock for ${slug}`);
  }
}

type Tx = TransactionSql;

/** Takes stock for an order inside a transaction; throws OutOfStock if any line can't be covered. */
export async function takeStock(tx: Tx, lines: Pick<OrderLine, "slug" | "qty">[]): Promise<void> {
  for (const [slug, qty] of totals(lines)) {
    const rows = await tx<{ stock: number }[]>`
      update jamazeb.products set stock = stock - ${qty}, updated_at = now()
      where slug = ${slug} and status = 'active' and stock >= ${qty}
      returning stock`;
    if (rows.length === 0) {
      const [row] = await tx<{ stock: number }[]>`select stock from jamazeb.products where slug = ${slug}`;
      throw new OutOfStock(slug, row?.stock ?? 0);
    }
  }
}

/** Takes stock without refusing (a payment already made): never goes below zero. */
export async function takeStockAnyway(lines: Pick<OrderLine, "slug" | "qty">[]): Promise<void> {
  for (const [slug, qty] of totals(lines)) {
    await sql()`update jamazeb.products set stock = greatest(stock - ${qty}, 0), updated_at = now() where slug = ${slug}`;
  }
}

/** Puts stock back, e.g. when an order is cancelled. */
export async function returnStock(lines: Pick<OrderLine, "slug" | "qty">[]): Promise<void> {
  for (const [slug, qty] of totals(lines)) {
    await sql()`update jamazeb.products set stock = stock + ${qty}, updated_at = now() where slug = ${slug}`;
  }
}

function totals(lines: Pick<OrderLine, "slug" | "qty">[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const l of lines) map.set(l.slug, (map.get(l.slug) ?? 0) + l.qty);
  return map;
}
