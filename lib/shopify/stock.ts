// Changes stock in Shopify when orders are placed, paid or cancelled here
// (Admin API, permission write_inventory). Each change says what the stock was
// before ("changeFromQuantity"), so if Shopify sold the same item in the meantime
// the change is refused and tried again with the new number: no overselling.

import { randomUUID } from "node:crypto";
import { OutOfStock } from "../db/products";
import type { OrderLine } from "../orders";
import { admin, ShopifyError } from "./client";
import { findVariantIds } from "./products";

type Line = Pick<OrderLine, "slug" | "name" | "colour" | "size" | "qty">;
/** take: refuse if short · take-anyway: an order already paid, down to zero at most · give-back: a cancel */
export type StockChange = "take" | "take-anyway" | "give-back";

const levelsQuery = `
  query JamazebInventory($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        inventoryPolicy
        inventoryItem {
          id
          tracked
          inventoryLevels(first: 10) {
            nodes { location { id } quantities(names: ["available"]) { name quantity } }
          }
        }
      }
    }
  }`;

const adjustMutation = `
  mutation JamazebAdjust($input: InventoryAdjustQuantitiesInput!, $key: String!) {
    inventoryAdjustQuantities(input: $input) @idempotent(key: $key) {
      userErrors { field message code }
    }
  }`;

type Level = { location: { id: string }; quantities: { name: string; quantity: number }[] };
type Levels = {
  nodes: ({ id: string; inventoryPolicy: "DENY" | "CONTINUE"; inventoryItem: { id: string; tracked: boolean; inventoryLevels: { nodes: Level[] } } } | null)[];
};

/** Changes Shopify stock for an order's lines; throws OutOfStock when taking more than is left. */
export async function changeShopifyStock(orderId: string, lines: Line[], change: StockChange): Promise<void> {
  // One change per Shopify variant (two lines can be the same colour and size).
  const variantOf = await findVariantIds(lines.map((l) => l.slug));
  const wanted = new Map<string, { qty: number; line: Line }>();
  for (const line of lines) {
    const id = variantOf.get(line.slug)?.(line.colour, line.size) ?? null;
    if (!id) {
      if (change === "take") throw new OutOfStock(line.slug, 0, variantLabel(line));
      continue; // the product was removed from Shopify: nothing to change
    }
    const entry = wanted.get(id);
    wanted.set(id, { qty: (entry?.qty ?? 0) + line.qty, line });
  }
  if (wanted.size === 0) return;

  for (let attempt = 1; ; attempt++) {
    const { nodes } = await admin<Levels>(levelsQuery, { ids: [...wanted.keys()] });
    const changes: { delta: number; inventoryItemId: string; locationId: string; changeFromQuantity: number }[] = [];

    for (const node of nodes) {
      if (!node?.inventoryItem.tracked) continue; // Shopify doesn't count this item's stock
      const level = pickLevel(node.inventoryItem.inventoryLevels.nodes);
      if (!level) continue;
      const available = level.quantities.find((q) => q.name === "available")?.quantity ?? 0;
      const { qty, line } = wanted.get(node.id)!;

      let delta: number;
      if (change === "give-back") delta = qty;
      else if (change === "take") {
        // "Continue selling when out of stock" in Shopify: the order goes through.
        if (available < qty && node.inventoryPolicy !== "CONTINUE") throw new OutOfStock(line.slug, Math.max(available, 0), variantLabel(line));
        delta = -qty;
      } else delta = -Math.min(qty, Math.max(available, 0));
      if (delta === 0) continue;

      changes.push({ delta, inventoryItemId: node.inventoryItem.id, locationId: level.location.id, changeFromQuantity: available });
    }
    if (changes.length === 0) return;

    type Answer = { inventoryAdjustQuantities: { userErrors: { field: string[] | null; message: string; code: string | null }[] } };
    const result = await admin<Answer>(adjustMutation, {
      input: {
        reason: change === "give-back" ? "restock" : "correction",
        name: "available",
        referenceDocumentUri: `jamazeb://order/${orderId}`,
        changes,
      },
      key: randomUUID(),
    });
    const errors = result.inventoryAdjustQuantities.userErrors;
    if (errors.length === 0) return;
    // Usually the stock changed between reading and writing: read again and retry.
    if (attempt >= 3) throw new ShopifyError(`Stock change refused: ${errors.map((e) => e.message).join("; ")}`);
  }
}

const variantLabel = (line: Line) => [line.colour === "As shown" ? "" : line.colour, line.size].filter(Boolean).join(", ");

/** The location stock is taken from: SHOPIFY_LOCATION_ID if set, otherwise the item's first location. */
function pickLevel(levels: Level[]): Level | undefined {
  const preferred = process.env.SHOPIFY_LOCATION_ID;
  if (preferred) {
    const gid = preferred.startsWith("gid://") ? preferred : `gid://shopify/Location/${preferred}`;
    return levels.find((l) => l.location.id === gid);
  }
  return levels[0];
}
