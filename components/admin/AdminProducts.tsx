"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  LOW_STOCK,
  editableCategories,
  resetProducts,
  saveProduct,
  slugify,
  useAdminProducts,
  useHasProductEdits,
  type AdminProduct,
} from "@/lib/admin/product-store";
import { getCategory, type CategorySlug } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/local-store";
import { btnPrimary, btnSecondary, btnSmall, fieldInput, fieldLabel } from "../ui";
import { AdminHeading, EmptyNote, chip, searchInput, td, th } from "./ui";

type Draft = {
  slug?: string;
  added?: boolean;
  name: string;
  category: CategorySlug;
  price: string;
  salePrice: string;
  stock: string;
  status: "active" | "draft";
  colours: string;
  sizes: string;
  description: string;
  tone: string;
};
type Errors = Partial<Record<"name" | "price" | "salePrice" | "stock" | "colours", string>>;

const toDraft = (p: AdminProduct): Draft => ({
  slug: p.slug,
  added: p.added,
  name: p.name,
  category: p.category,
  price: String(p.price),
  salePrice: p.salePrice ? String(p.salePrice) : "",
  stock: String(p.stock),
  status: p.status,
  colours: p.colours.join(", "),
  sizes: p.sizes.join(", "),
  description: p.description,
  tone: p.tone,
});

const blank: Draft = { name: "", category: "lawn", price: "", salePrice: "", stock: "", status: "draft", colours: "", sizes: "", description: "", tone: "#E4DDCD", added: true };
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12);

export function AdminProducts() {
  const params = useSearchParams();
  return <ProductsView key={params.toString()} initialLow={params.get("view") === "low"} />;
}

function ProductsView({ initialLow }: { initialLow: boolean }) {
  const hydrated = useHydrated();
  const products = useAdminProducts();
  const edited = useHasProductEdits();
  const [lowOnly, setLowOnly] = useState(initialLow);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState("");

  if (!hydrated) return <div aria-busy="true" className="min-h-[70vh]" />;

  const q = query.trim().toLowerCase();
  const shown = products.filter((p) => (!lowOnly || p.stock <= LOW_STOCK) && (!q || `${p.name} ${p.category}`.toLowerCase().includes(q)));

  function open(d: Draft) {
    setErrors({});
    setSaved("");
    setDraft(d);
    requestAnimationFrame(() => document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const found: Errors = {};
    const price = Number(draft.price);
    const sale = draft.salePrice.trim() ? Number(draft.salePrice) : null;
    const stock = Number(draft.stock);
    if (draft.name.trim().length < 3) found.name = "Enter a product name.";
    if (!Number.isInteger(price) || price < 100 || price > 500000) found.price = "Enter a whole price in rupees.";
    if (sale !== null && (!Number.isInteger(sale) || sale <= 0 || sale >= price)) found.salePrice = "Sale price must be lower than the price.";
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) found.stock = "Enter stock as a whole number.";
    if (list(draft.colours).length === 0) found.colours = "Add at least one colour.";
    const slug = draft.slug ?? slugify(draft.name);
    if (!draft.slug && products.some((p) => p.slug === slug)) found.name = "A product with this name already exists.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    saveProduct({
      slug,
      added: draft.added,
      name: draft.name.trim(),
      category: draft.category,
      price,
      salePrice: sale,
      stock,
      status: draft.status,
      colours: list(draft.colours),
      sizes: list(draft.sizes),
      description: draft.description.trim(),
      tone: draft.tone,
    });
    setSaved(draft.slug ? `Saved changes to ${draft.name.trim()}.` : `Added ${draft.name.trim()}.`);
    setDraft(null);
  }

  const set = (key: keyof Draft) => (e: { target: { value: string } }) => {
    setDraft((d) => (d ? { ...d, [key]: e.target.value } : d));
    if (key in errors) setErrors((x) => ({ ...x, [key]: undefined }));
  };
  const err = (key: keyof Errors) => errors[key] && <p id={`pf-${key}-error`} className="mt-1.5 text-sm text-rust">{errors[key]}</p>;
  const a11y = (key: keyof Errors) => ({ "aria-invalid": errors[key] ? true : undefined, "aria-describedby": errors[key] ? `pf-${key}-error` : undefined });
  const border = (key: keyof Errors) => (errors[key] ? "border-rust" : "border-line-strong");

  return (
    <div className="flex flex-col gap-5">
      <AdminHeading title="Products">
        <button type="button" onClick={() => open(blank)} className={btnSmall}>
          + Add product
        </button>
      </AdminHeading>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Show products" className="flex gap-2">
          <button type="button" aria-pressed={!lowOnly} onClick={() => setLowOnly(false)} className={chip(!lowOnly)}>
            All ({products.length})
          </button>
          <button type="button" aria-pressed={lowOnly} onClick={() => setLowOnly(true)} className={chip(lowOnly)}>
            Low stock ({products.filter((p) => p.stock <= LOW_STOCK).length})
          </button>
        </div>
        <label className="w-full max-w-[280px]">
          <span className="sr-only">Search products</span>
          <input type="search" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} className={searchInput} />
        </label>
      </div>

      <p role="status" className="min-h-0 text-[15px] text-emerald empty:hidden">
        {saved}
      </p>

      <div className="overflow-x-auto border border-line bg-white">
        {shown.length === 0 ? (
          <EmptyNote>No products match.</EmptyNote>
        ) : (
          <table className="w-full min-w-[760px] border-collapse">
            <caption className="sr-only">Products</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Product</th>
                <th scope="col" className={th}>Category</th>
                <th scope="col" className={`${th} text-right`}>Price</th>
                <th scope="col" className={`${th} text-right`}>Stock</th>
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.slug}>
                  <td className={td}>
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" style={{ backgroundColor: p.tone }} className="h-12 w-9 shrink-0" />
                      <span>
                        {p.name}
                        <span className="block text-[13px] text-muted">{p.colours.join(", ")}{p.sizes.length > 0 && ` · ${p.sizes.join(" ")}`}</span>
                      </span>
                    </span>
                  </td>
                  <td className={td}>{getCategory(p.category)?.name ?? p.category}</td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    {p.salePrice ? (
                      <>
                        {formatPrice(p.salePrice)}
                        <span className="block text-[13px] text-muted line-through">
                          <span className="sr-only">Was </span>
                          {formatPrice(p.price)}
                        </span>
                      </>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </td>
                  <td className={`${td} text-right`}>
                    <span className={p.stock <= LOW_STOCK ? "font-medium text-rust" : undefined}>{p.stock}</span>
                    {p.stock <= LOW_STOCK && <span className="block text-[13px] text-rust">{p.stock === 0 ? "Sold out" : "Low"}</span>}
                  </td>
                  <td className={td}>{p.status === "active" ? "Active" : "Draft"}</td>
                  <td className={td}>
                    <button type="button" onClick={() => open(toDraft(p))} className={btnSmall} aria-label={`Edit ${p.name}`}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {draft && (
        <form id="product-form" onSubmit={handleSave} noValidate className="flex scroll-mt-6 flex-col gap-4 border border-line bg-white p-6">
          <h2 className="text-lg font-medium">{draft.slug ? `Edit ${draft.name}` : "Add product"}</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div>
              <label htmlFor="pf-name" className={fieldLabel}>Product name</label>
              <input id="pf-name" maxLength={80} {...a11y("name")} value={draft.name} onChange={set("name")} className={`${fieldInput} ${border("name")}`} />
              {err("name")}
            </div>
            <div>
              <label htmlFor="pf-category" className={fieldLabel}>Category</label>
              <select id="pf-category" value={draft.category} onChange={set("category")} className={`${fieldInput} border-line-strong`}>
                {editableCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            <div>
              <label htmlFor="pf-price" className={fieldLabel}>Price (Rs)</label>
              <input id="pf-price" inputMode="numeric" {...a11y("price")} value={draft.price} onChange={set("price")} className={`${fieldInput} ${border("price")}`} />
              {err("price")}
            </div>
            <div>
              <label htmlFor="pf-salePrice" className={fieldLabel}>Sale price <span className="font-normal text-muted">(optional)</span></label>
              <input id="pf-salePrice" inputMode="numeric" {...a11y("salePrice")} value={draft.salePrice} onChange={set("salePrice")} className={`${fieldInput} ${border("salePrice")}`} />
              {err("salePrice")}
            </div>
            <div>
              <label htmlFor="pf-stock" className={fieldLabel}>Stock</label>
              <input id="pf-stock" inputMode="numeric" {...a11y("stock")} value={draft.stock} onChange={set("stock")} className={`${fieldInput} ${border("stock")}`} />
              {err("stock")}
            </div>
            <div>
              <label htmlFor="pf-status" className={fieldLabel}>Status</label>
              <select id="pf-status" value={draft.status} onChange={set("status")} className={`${fieldInput} border-line-strong`}>
                <option value="active">Active (on the store)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div>
              <label htmlFor="pf-colours" className={fieldLabel}>Colours <span className="font-normal text-muted">(comma separated)</span></label>
              <input id="pf-colours" placeholder="Sage, Rust, Ivory" {...a11y("colours")} value={draft.colours} onChange={set("colours")} className={`${fieldInput} ${border("colours")}`} />
              {err("colours")}
            </div>
            <div>
              <label htmlFor="pf-sizes" className={fieldLabel}>Sizes <span className="font-normal text-muted">(empty for unstitched)</span></label>
              <input id="pf-sizes" placeholder="XS, S, M, L, XL" value={draft.sizes} onChange={set("sizes")} className={`${fieldInput} border-line-strong`} />
            </div>
          </div>
          <div>
            <label htmlFor="pf-description" className={fieldLabel}>Description and fabric details</label>
            <textarea id="pf-description" rows={3} maxLength={600} value={draft.description} onChange={set("description")} className={`${fieldInput} border-line-strong py-3`} />
          </div>
          <p className="text-[13px] text-muted">
            Photos, SEO title, web address and product schema are generated from the name when the store is connected to its
            database (Phase 6). In this demo, changes are saved in this browser and don&apos;t change the shop pages.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={btnPrimary}>
              {draft.slug ? "Save changes" : "Add product"}
            </button>
            <button type="button" onClick={() => setDraft(null)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {edited && (
        <button type="button" onClick={() => resetProducts()} className="self-start text-[13px] text-muted underline underline-offset-4">
          Undo all product changes (demo)
        </button>
      )}
    </div>
  );
}
