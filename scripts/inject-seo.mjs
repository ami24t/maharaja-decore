#!/usr/bin/env node
/**
 * Maharaja Decor — SEO head-tag injection.
 *
 * Injects canonical + Open Graph + Twitter Card tags into every static page,
 * derived from each page's existing <title> and <meta name="description">.
 * Idempotent: pages already carrying og:url are skipped, so it can run after
 * any content change (re-run whenever pages are added).
 *
 *   node scripts/inject-seo.mjs
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, sep } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.maharajadecor.com.br';
const DEFAULT_IMAGE = `${SITE}/assets/img/maharaja/maharaja-brand-banner.png`;

// Per-page OG images: product pages show the piece itself; ambiente/coleção
// pages show their editorial scene. Everything else uses the brand banner.
const PAGE_IMAGES = {
    'produto/ganesha-de-resina.html': 'assets/img/maharaja/products/ganesha-resina.jpg',
    'produto/fonte-de-lakshmi.html': 'assets/img/maharaja/products/fonte-lakshmi.jpg',
    'produto/buda-de-bali.html': 'assets/img/maharaja/products/buda-bali.jpg',
    'produto/elefantes-de-madeira.html': 'assets/img/maharaja/products/elefantes-madeira.jpg',
    'produto/banco-pintado-a-mao.html': 'assets/img/maharaja/products/banco-madeira.jpg',
    'produto/padmini-incenso-dhoop.html': 'assets/img/maharaja/products/incenso-padmini-dhoop.jpg',
    'produto/luminaria-turca.html': 'assets/img/maharaja/products/luminaria-turca.jpg',
    'produto/pecas-decorativas.html': 'assets/img/maharaja/products/hero-altar.jpg',
    'ambientes/sala.html': 'assets/img/maharaja/editorial/living-ganesha.jpg',
    'ambientes/jardim.html': 'assets/img/maharaja/editorial/garden-lakshmi.jpg',
    'ambientes/piscina.html': 'assets/img/maharaja/editorial/pool-buda.jpg',
    'ambientes/entrada.html': 'assets/img/maharaja/editorial/entrance-elephants.jpg',
    'ambientes/altar.html': 'assets/img/maharaja/products/hero-altar.jpg',
    'colecoes/sagrado.html': 'assets/img/maharaja/editorial/living-ganesha.jpg',
    'colecoes/estatuas.html': 'assets/img/maharaja/products/buda-bali.jpg',
    'colecoes/fontes.html': 'assets/img/maharaja/editorial/garden-lakshmi.jpg',
    'colecoes/artesanato.html': 'assets/img/maharaja/products/elefantes-madeira.jpg',
    'colecoes/aromas.html': 'assets/img/maharaja/products/incenso-padmini-dhoop.jpg',
    'colecoes/decoracao.html': 'assets/img/maharaja/products/luminaria-turca.jpg'
};

// Checkout-flow pages: noindex, no OG needed beyond basics.
const NOINDEX = new Set(['loja/checkout.html', 'loja/carrinho.html', 'loja/pedido.html']);

function pageUrl(rel) {
    if (rel === 'index.html') return `${SITE}/`;
    return `${SITE}/${rel.replace(/\\/g, '/')}`;
}

function extract(html, regex) {
    const match = html.match(regex);
    return match ? match[1].trim() : '';
}

async function processFile(absPath) {
    const rel = relative(ROOT, absPath).split(sep).join('/');
    let html = await readFile(absPath, 'utf8');

    if (html.includes('property="og:url"')) return `skip (has og) ${rel}`;
    if (!html.includes('</head>')) return `skip (no head) ${rel}`;

    const title = extract(html, /<title>([^<]*)<\/title>/i) || 'Maharaja Decor';
    const description = extract(html, /<meta name="description" content="([^"]*)"/i) ||
        'Decoração, presentes, artesanato e moda da Índia em Alto Paraíso de Goiás, Chapada dos Veadeiros.';
    const image = PAGE_IMAGES[rel] ? `${SITE}/${PAGE_IMAGES[rel]}` : DEFAULT_IMAGE;
    const url = pageUrl(rel);
    const noindex = NOINDEX.has(rel);

    const block = [
        `    <link rel="canonical" href="${url}">`,
        noindex ? '    <meta name="robots" content="noindex">' : null,
        `    <meta property="og:type" content="website">`,
        `    <meta property="og:site_name" content="Maharaja Decor">`,
        `    <meta property="og:locale" content="pt_BR">`,
        `    <meta property="og:title" content="${title}">`,
        `    <meta property="og:description" content="${description}">`,
        `    <meta property="og:url" content="${url}">`,
        `    <meta property="og:image" content="${image}">`,
        `    <meta name="twitter:card" content="summary_large_image">`,
        `    <meta name="twitter:title" content="${title}">`,
        `    <meta name="twitter:description" content="${description}">`,
        `    <meta name="twitter:image" content="${image}">`
    ].filter(Boolean).join('\n');

    // Avoid double-noindex on pages that already carry one.
    const finalBlock = html.includes('name="robots"')
        ? block.replace('    <meta name="robots" content="noindex">\n', '')
        : block;

    html = html.replace('</head>', `${finalBlock}\n</head>`);
    await writeFile(absPath, html, 'utf8');
    return `ok   ${rel}`;
}

const files = ['index.html'];
for (const dir of ['produto', 'colecoes', 'ambientes', 'loja']) {
    for (const name of await readdir(resolve(ROOT, dir))) {
        if (name.endsWith('.html')) files.push(`${dir}/${name}`);
    }
}
const results = [];
for (const entry of files) {
    results.push(await processFile(resolve(ROOT, entry)));
}
console.log(results.join('\n'));
console.log(`\n${results.filter(r => r.startsWith('ok')).length} pages updated.`);
