#!/usr/bin/env node
/**
 * Maharaja Decor — Instagram → stock.json sync.
 *
 * Pulls recent posts from the brand's Instagram *Business* account via the
 * official Instagram Graph API, reads the captions, and derives a
 * Disponível / Esgotado state per catalog product into assets/data/stock.json.
 *
 * IMPORTANT — what this can and cannot do:
 *   - Instagram exposes NO inventory/stock field. This script infers
 *     availability from CAPTION TEXT using the convention in scripts/stock-map.json
 *     (keywords tie a post to a product; markers like "esgotado"/"disponível"
 *     set the state). It is a best-effort heuristic, not a real stock feed.
 *   - It only reads accounts you own/manage (your own long-lived token).
 *   - It NEVER scrapes the public page. No token => it skips cleanly.
 *
 * Required env (set as GitHub Actions secrets):
 *   IG_TOKEN    long-lived Instagram Graph API access token
 *   IG_USER_ID  the Instagram Business account user id (numeric)
 * Optional env:
 *   GRAPH_VERSION (default v21.0), MEDIA_LIMIT (default 50)
 *
 * Exit codes: 0 = success or intentional skip (no creds); 1 = hard failure
 * (so a misconfigured token surfaces in the Actions run instead of silently
 * leaving stale stock).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STOCK_PATH = resolve(ROOT, 'assets/data/stock.json');
const MAP_PATH = resolve(ROOT, 'scripts/stock-map.json');

const TOKEN = process.env.IG_TOKEN;
const USER_ID = process.env.IG_USER_ID;
const GRAPH_VERSION = process.env.GRAPH_VERSION || 'v21.0';
const MEDIA_LIMIT = Number(process.env.MEDIA_LIMIT || 50);

const IN_STOCK = 'in_stock';
const SOLD_OUT = 'sold_out';

// Combining diacritical marks block — removed after NFD decomposition so
// "Disponível" matches "disponivel". Done by code point (no regex escapes).
const COMBINING_LOW = 0x300;
const COMBINING_HIGH = 0x36f;

/** Lowercase + strip accents. */
function normalize(text) {
    if (!text) return '';
    let out = '';
    for (const ch of text.normalize('NFD')) {
        const code = ch.codePointAt(0);
        if (code >= COMBINING_LOW && code <= COMBINING_HIGH) continue;
        out += ch;
    }
    return out.toLowerCase();
}

function readJson(path) {
    return readFile(path, 'utf8').then(JSON.parse);
}

async function fetchAllMedia() {
    const fields = 'id,caption,timestamp,permalink';
    let url =
        `https://graph.facebook.com/${GRAPH_VERSION}/${USER_ID}/media` +
        `?fields=${fields}&limit=${MEDIA_LIMIT}&access_token=${encodeURIComponent(TOKEN)}`;
    const media = [];

    // One page is plenty for a small catalog, but follow paging up to a cap.
    for (let page = 0; page < 4 && url; page += 1) {
        const res = await fetch(url);
        const body = await res.json();
        if (body.error) {
            throw new Error(`Graph API error: ${body.error.message} (code ${body.error.code})`);
        }
        if (Array.isArray(body.data)) media.push(...body.data);
        url = body.paging && body.paging.next ? body.paging.next : null;
        if (media.length >= MEDIA_LIMIT) break;
    }
    return media;
}

/** Decide a product's state from the most recent caption that mentions it. */
function deriveState(keywords, posts, markers) {
    for (const post of posts) {
        const caption = normalize(post.caption);
        if (!caption) continue;
        const mentioned = keywords.some((kw) => caption.includes(normalize(kw)));
        if (!mentioned) continue;

        if (markers.soldOut.some((m) => caption.includes(m))) return SOLD_OUT;
        if (markers.inStock.some((m) => caption.includes(m))) return IN_STOCK;
        // Mentioned but no availability marker → ambiguous, do not guess.
        return null;
    }
    return null; // no post mentioned this product
}

async function main() {
    if (!TOKEN || !USER_ID) {
        console.log('[stock-sync] IG_TOKEN / IG_USER_ID not set — skipping live sync. ' +
            'stock.json left untouched (edit it by hand to update availability).');
        return; // exit 0: intentional skip
    }

    const map = await readJson(MAP_PATH);
    const markers = {
        soldOut: map.soldOutMarkers.map(normalize),
        inStock: map.inStockMarkers.map(normalize)
    };

    let stock;
    try {
        stock = await readJson(STOCK_PATH);
    } catch {
        stock = { items: {} };
    }
    if (!stock.items) stock.items = {};

    const media = await fetchAllMedia();
    // Newest first (Graph returns reverse-chronological, but be explicit).
    media.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    console.log(`[stock-sync] fetched ${media.length} posts.`);

    const changes = [];
    for (const [slug, keywords] of Object.entries(map.products)) {
        const derived = deriveState(keywords, media, markers);
        if (!derived) continue; // keep current value
        const current = stock.items[slug];
        if (current !== derived) {
            changes.push(`${slug}: ${current || '—'} → ${derived}`);
        }
        stock.items[slug] = derived;
    }

    stock.updatedAt = new Date().toISOString();
    stock.source = 'instagram';

    await writeFile(STOCK_PATH, JSON.stringify(stock, null, 2) + '\n', 'utf8');

    if (changes.length) {
        console.log('[stock-sync] updated:\n  ' + changes.join('\n  '));
    } else {
        console.log('[stock-sync] no availability changes detected.');
    }
}

main().catch((err) => {
    console.error('[stock-sync] FAILED:', err.message);
    process.exit(1);
});
