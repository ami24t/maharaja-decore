#!/usr/bin/env node
/**
 * Maharaja Decor — Meshy image-to-3D pipeline.
 *
 * Turns a product photo into a professional, web-ready GLB:
 *   photo -> Meshy /openapi/v1/image-to-3d (textured, PBR) -> download
 *         -> gltf-transform optimize (Draco + WebP) -> assets/models/<slug>.glb
 *
 * Requires a Meshy API key (Meshy Pro includes API access + commercial use):
 *   set it in the environment as MESHY_API_KEY (never commit it).
 *
 * Usage:
 *   node scripts/meshy-generate.mjs <slug>          # one product
 *   node scripts/meshy-generate.mjs all             # whole catalog
 *   node scripts/meshy-generate.mjs <slug> path.jpg # override source photo
 *
 * Options via env:
 *   MESHY_HD=1        request 4K HD textures (more credits, slower)
 *   MESHY_POLY=50000  target polycount (100..300000, default 50000)
 *   MESHY_NO_OPT=1    skip the gltf-transform optimize step
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IMG_DIR = resolve(ROOT, 'assets/img/maharaja/products');
const OUT_DIR = resolve(ROOT, 'assets/models');
const API = 'https://api.meshy.ai/openapi/v1/image-to-3d';
const KEY = process.env.MESHY_API_KEY;

// slug -> source photo. Ganesha uses the cleaner single-subject shot
// (the default catalog photo has two statues, which reconstructs poorly).
const PHOTOS = {
    'ganesha-de-resina': 'ganesha-jay.jpg',
    'fonte-de-lakshmi': 'fonte-lakshmi.jpg',
    'buda-de-bali': 'buda-bali.jpg',
    'elefantes-de-madeira': 'elefantes-madeira.jpg',
    'banco-pintado-a-mao': 'banco-madeira.jpg',
    'padmini-incenso-dhoop': 'incenso-padmini-dhoop.jpg',
    'luminaria-turca': 'luminaria-turca.jpg',
    'pecas-decorativas': 'hero-altar.jpg'
};

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

function authHeaders() {
    return { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
}

async function toDataUri(path) {
    const buf = await readFile(path);
    const mime = MIME[extname(path).toLowerCase()] || 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
}

async function createTask(dataUri) {
    const body = {
        image_url: dataUri,
        ai_model: 'latest',
        model_type: 'standard',
        should_texture: true,
        enable_pbr: true,
        hd_texture: process.env.MESHY_HD === '1',
        topology: 'triangle',
        target_polycount: Number(process.env.MESHY_POLY || 50000),
        target_formats: ['glb']
    };
    const res = await fetch(API, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(`create failed (${res.status}): ${JSON.stringify(json)}`);
    return json.result || json.id;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function pollTask(id, label) {
    let lastProgress = -1;
    for (;;) {
        const res = await fetch(`${API}/${id}`, { headers: authHeaders() });
        const t = await res.json();
        if (!res.ok) throw new Error(`poll failed (${res.status}): ${JSON.stringify(t)}`);
        if (t.progress !== lastProgress) {
            process.stdout.write(`\r  [${label}] ${t.status} ${t.progress || 0}%   `);
            lastProgress = t.progress;
        }
        if (t.status === 'SUCCEEDED') { process.stdout.write('\n'); return t; }
        if (t.status === 'FAILED' || t.status === 'CANCELED') {
            throw new Error(`task ${t.status}: ${JSON.stringify(t.task_error || t)}`);
        }
        await sleep(4000);
    }
}

async function download(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download failed (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    return buf.length;
}

function optimize(rawPath, outPath) {
    return new Promise((resolveOpt) => {
        const args = ['--yes', '@gltf-transform/cli', 'optimize', rawPath, outPath,
            '--compress', 'draco', '--texture-compress', 'webp'];
        const p = spawn('npx', args, { shell: true, stdio: 'ignore' });
        p.on('close', (code) => resolveOpt(code === 0));
    });
}

async function generate(slug, imageOverride) {
    const file = imageOverride || PHOTOS[slug];
    if (!file) throw new Error(`unknown slug "${slug}" and no image path given`);
    const imgPath = imageOverride ? resolve(process.cwd(), imageOverride) : resolve(IMG_DIR, file);

    console.log(`\n=== ${slug} ===  (source: ${file})`);
    const dataUri = await toDataUri(imgPath);
    const id = await createTask(dataUri);
    console.log(`  task ${id} created; generating...`);
    const task = await pollTask(id, slug);

    const glbUrl = task.model_urls && task.model_urls.glb;
    if (!glbUrl) throw new Error('no GLB in result: ' + JSON.stringify(task.model_urls));

    const raw = resolve(OUT_DIR, `${slug}.raw.glb`);
    const kb = Math.round((await download(glbUrl, raw)) / 1024);
    console.log(`  downloaded raw GLB: ${kb} KB; credits: ${task.consumed_credits ?? '?'}`);

    if (process.env.MESHY_NO_OPT === '1') {
        console.log(`  (skipping optimize) -> ${raw}`);
        return;
    }
    const out = resolve(OUT_DIR, `${slug}.glb`);
    const ok = await optimize(raw, out);
    if (ok) {
        const { rm, stat } = await import('node:fs/promises');
        const finalKb = Math.round((await stat(out)).size / 1024);
        await rm(raw);
        console.log(`  optimized -> assets/models/${slug}.glb (${finalKb} KB)`);
    } else {
        console.log(`  optimize failed; keeping raw at ${raw}`);
    }
}

async function main() {
    if (!KEY) {
        console.error('ERROR: set MESHY_API_KEY in the environment (Meshy dashboard -> Settings -> API Keys).');
        process.exit(1);
    }
    await mkdir(OUT_DIR, { recursive: true });

    const arg = process.argv[2];
    const imageOverride = process.argv[3];
    if (!arg) {
        console.error('Usage: node scripts/meshy-generate.mjs <slug|all> [imagePath]');
        process.exit(1);
    }

    const slugs = arg === 'all' ? Object.keys(PHOTOS) : [arg];
    const failures = [];
    for (const slug of slugs) {
        try {
            await generate(slug, slugs.length === 1 ? imageOverride : undefined);
        } catch (err) {
            console.error(`  FAILED ${slug}: ${err.message}`);
            failures.push(slug);
        }
    }
    console.log(`\nDone. ${slugs.length - failures.length}/${slugs.length} succeeded.` +
        (failures.length ? ` Failed: ${failures.join(', ')}` : ''));
}

main().catch((e) => { console.error(e); process.exit(1); });
