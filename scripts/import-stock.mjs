#!/usr/bin/env node
/**
 * Maharaja Decor — bulk stock import (P5).
 *
 * Reads a semicolon-separated CSV (pt-BR Excel default) and syncs it into the
 * production Medusa backend:
 *   - new handle  -> product created (images copied into the site, metadata,
 *                    price/mode, inventory, thumbnail, sitemap entry)
 *   - known handle -> price + quantity updated (title/description untouched)
 *
 * Empty "preco" column => piece is consultative: no price shown, WhatsApp mode.
 *
 * Usage:
 *   set MAHARAJA_ADMIN_EMAIL=...     (admin panel login)
 *   set MAHARAJA_ADMIN_PASSWORD=...
 *   node scripts/import-stock.mjs docs/estoque-modelo.csv
 *
 * After a run that created pieces: commit the new photos + sitemap.xml, push,
 * and deploy the storefront (vercel deploy --prod).
 */

import { readFile, writeFile, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, basename } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://backend-production-462f.up.railway.app';
const SITE = 'https://www.maharajadecor.com.br';
const IMG_DIR = resolve(ROOT, 'assets/img/maharaja/products');
const SITEMAP = resolve(ROOT, 'sitemap.xml');

const EMAIL = process.env.MAHARAJA_ADMIN_EMAIL;
const PASSWORD = process.env.MAHARAJA_ADMIN_PASSWORD;

// ---------------------------------------------------------------- helpers --

function fail(msg) { console.error('ERRO: ' + msg); process.exit(1); }

function slugify(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Minimal ;-separated CSV parser with quoted-field support. */
function parseCsv(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (ch === '"') inQuotes = false;
            else field += ch;
        } else if (ch === '"') inQuotes = true;
        else if (ch === ';') { row.push(field); field = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.some(c => c.trim() !== '')) rows.push(row);
            row = [];
        } else field += ch;
    }
    if (field !== '' || row.length) { row.push(field); if (row.some(c => c.trim() !== '')) rows.push(row); }
    return rows;
}

/** "980" | "980,00" | "R$ 980" -> 980 ; empty -> null (sob consulta). */
function parsePrice(raw) {
    const cleaned = (raw || '').replace(/[^\d,\.]/g, '').replace(/\./g, '').replace(',', '.');
    if (!cleaned) return null;
    const value = Number(cleaned);
    return Number.isFinite(value) && value > 0 ? value : null;
}

async function api(path, options = {}) {
    const res = await fetch(API + path, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}: ${data.message || JSON.stringify(data)}`);
    return data;
}

// ------------------------------------------------------------------- main --

async function main() {
    if (!EMAIL || !PASSWORD) {
        fail('defina MAHARAJA_ADMIN_EMAIL e MAHARAJA_ADMIN_PASSWORD no ambiente antes de rodar.');
    }
    const csvPath = resolve(process.cwd(), process.argv[2] || 'docs/estoque-modelo.csv');
    const rows = parseCsv(await readFile(csvPath, 'utf8'));
    const header = rows.shift().map(h => slugify(h));
    const idx = (name) => header.indexOf(name);
    for (const required of ['titulo', 'quantidade']) {
        if (idx(required) === -1) fail(`coluna obrigatoria ausente no CSV: ${required}`);
    }

    console.log(`Planilha: ${basename(csvPath)} — ${rows.length} linhas\n`);

    const { token } = await api('/auth/user/emailpass', {
        method: 'POST', body: { email: EMAIL, password: PASSWORD }
    });

    const [existing, cats, scs, sps, locs] = await Promise.all([
        api('/admin/products?limit=200&fields=id,handle,+metadata,*variants', { token }),
        api('/admin/product-categories?limit=50', { token }),
        api('/admin/sales-channels', { token }),
        api('/admin/shipping-profiles', { token }),
        api('/admin/stock-locations', { token })
    ]);
    const byHandle = new Map(existing.products.map(p => [p.handle, p]));
    const catByName = new Map(cats.product_categories.map(c => [slugify(c.name), c.id]));
    const salesChannelId = scs.sales_channels[0].id;
    const shippingProfileId = sps.shipping_profiles[0].id;
    const locationId = locs.stock_locations[0].id;

    const created = [], updated = [], failed = [];

    for (const row of rows) {
        const get = (name) => (idx(name) >= 0 ? (row[idx(name)] || '').trim() : '');
        const title = get('titulo');
        if (!title) continue;
        const handle = get('handle') || slugify(title);
        const price = parsePrice(get('preco'));
        const quantity = Math.max(0, parseInt(get('quantidade') || '0', 10) || 0);

        try {
            if (byHandle.has(handle)) {
                // ---- update price + quantity on existing piece ----
                const product = byHandle.get(handle);
                const variant = product.variants[0];
                const meta = { ...(product.metadata || {}) };
                meta.purchase_mode = price !== null ? 'checkout' : 'whatsapp';
                meta.placeholder_price = false;
                meta.stock_unconfirmed = false;

                await api(`/admin/products/${product.id}`, {
                    token, method: 'POST',
                    body: {
                        metadata: meta,
                        variants: [{ id: variant.id, prices: [{ currency_code: 'brl', amount: price !== null ? price : 1 }] }]
                    }
                });
                const inv = await api(`/admin/products/${product.id}/variants/${variant.id}?fields=*inventory_items`, { token });
                const invItemId = inv.variant.inventory_items[0].inventory_item_id;
                try {
                    await api(`/admin/inventory-items/${invItemId}/location-levels`, {
                        token, method: 'POST', body: { location_id: locationId, stocked_quantity: quantity }
                    });
                } catch {
                    await api(`/admin/inventory-items/${invItemId}/location-levels/${locationId}`, {
                        token, method: 'POST', body: { stocked_quantity: quantity }
                    });
                }
                updated.push(`${handle}: preco=${price !== null ? 'R$' + price : 'sob consulta'}, qtd=${quantity}`);
            } else {
                // ---- create new piece ----
                const description = get('descricao') || title;
                const weight = parseInt(get('peso-gramas') || '1000', 10) || 1000;
                const photoSrc = get('foto');
                const photoBack = get('foto-verso');

                const gallery = [];
                for (const src of [photoSrc, photoBack]) {
                    if (!src) continue;
                    const srcPath = resolve(dirname(csvPath), src);
                    const ext = (extname(src) || '.jpg').toLowerCase();
                    const destName = gallery.length === 0 ? `${handle}${ext}` : `${handle}-verso${ext}`;
                    const destPath = resolve(IMG_DIR, destName);
                    try { await access(destPath); } catch { await copyFile(srcPath, destPath); }
                    gallery.push(`assets/img/maharaja/products/${destName}`);
                }
                if (!gallery.length) throw new Error('sem foto (coluna "foto" vazia ou arquivo nao encontrado)');

                const categoryIds = get('categorias').split(',')
                    .map(c => catByName.get(slugify(c))).filter(Boolean);

                const createBody = {
                    title, handle, description, status: 'published', weight,
                    shipping_profile_id: shippingProfileId,
                    categories: categoryIds.map(id => ({ id })),
                    sales_channels: [{ id: salesChannelId }],
                    thumbnail: `${SITE}/${gallery[0]}`,
                    metadata: {
                        purchase_mode: price !== null ? 'checkout' : 'whatsapp',
                        placeholder_price: false,
                        stock_unconfirmed: false,
                        storefront_image: gallery[0],
                        storefront_gallery: gallery,
                        editorial: false
                    },
                    options: [{ title: 'Tamanho', values: ['Único'] }],
                    variants: [{
                        title, sku: handle, options: { Tamanho: 'Único' },
                        manage_inventory: true,
                        prices: [{ currency_code: 'brl', amount: price !== null ? price : 1 }]
                    }]
                };
                const { product } = await api('/admin/products', { token, method: 'POST', body: createBody });
                const inv = await api(`/admin/products/${product.id}/variants/${product.variants[0].id}?fields=*inventory_items`, { token });
                await api(`/admin/inventory-items/${inv.variant.inventory_items[0].inventory_item_id}/location-levels`, {
                    token, method: 'POST', body: { location_id: locationId, stocked_quantity: quantity }
                });

                // sitemap entry for the generic catalog page
                let sitemap = await readFile(SITEMAP, 'utf8');
                const loc = `${SITE}/loja/peca.html?slug=${handle}`;
                if (!sitemap.includes(loc)) {
                    sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><priority>0.8</priority></url>\n</urlset>`);
                    await writeFile(SITEMAP, sitemap, 'utf8');
                }
                created.push(`${handle}: R$${price !== null ? price : ' sob consulta'}, qtd=${quantity}, fotos=${gallery.length}`);
            }
        } catch (err) {
            failed.push(`${handle}: ${err.message}`);
        }
    }

    console.log(`\nCriadas (${created.length}):`); created.forEach(l => console.log('  + ' + l));
    console.log(`\nAtualizadas (${updated.length}):`); updated.forEach(l => console.log('  ~ ' + l));
    if (failed.length) { console.log(`\nFalhas (${failed.length}):`); failed.forEach(l => console.log('  ! ' + l)); }
    if (created.length) {
        console.log('\nPecas novas criadas — para publicar as fotos no site:');
        console.log('  git add assets/img sitemap.xml && git commit -m "estoque: novas pecas" && git push');
        console.log('  vercel deploy --prod --yes');
    }
}

main().catch(e => fail(e.message));
