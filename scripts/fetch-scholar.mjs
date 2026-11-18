import { readFile, writeFile } from 'node:fs/promises';

const PROFILE = 'https://scholar.google.com/citations?user=2N7kn54AAAAJ';
const ROBOTS = 'https://scholar.google.com/robots.txt';
const OUTPUT = new URL('../data/scholar_snapshot.json', import.meta.url);
const HEADERS = { 'User-Agent': 'WilsonFuscoAcademicSite/1.0 (+https://w-fusco.github.io/)' };

async function getText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: HEADERS });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned HTTP ${response.status}`);
  const charset = response.headers.get('content-type')?.match(/charset=([^;]+)/i)?.[1] || 'utf-8';
  return new TextDecoder(charset).decode(await response.arrayBuffer());
}

function parseProfile(html) {
  const name = html.match(/id="gsc_prf_in"[^>]*>([^<]+)</)?.[1]?.trim();
  const affiliation = html.match(/class="gsc_prf_il"[^>]*>([^<]+)</)?.[1]?.trim();
  if (name !== 'Wilson Fusco' || affiliation !== 'Fundação Joaquim Nabuco') {
    throw new Error(`Google Scholar profile identity did not match: ${JSON.stringify(name)} / ${JSON.stringify(affiliation)}`);
  }
  const table = html.match(/<table id="gsc_rsb_st">([\s\S]*?)<\/table>/)?.[1];
  if (!table) throw new Error('Google Scholar metrics table was not found');
  const values = [...table.matchAll(/<td class="gsc_rsb_std">([\d,]+)<\/td>/g)].map(match => Number(match[1].replaceAll(',', '')));
  if (values.length !== 6) throw new Error('Google Scholar metrics table changed format');
  const stats = { citationCount: values[0], hIndex: values[2], i10Index: values[4] };
  if (stats.citationCount < 1 || stats.hIndex < 1 || stats.i10Index < 1 || stats.hIndex ** 2 > stats.citationCount || stats.i10Index * 10 > stats.citationCount) {
    throw new Error('Google Scholar metrics failed validation');
  }
  return stats;
}

async function main() {
  const robots = await getText(ROBOTS);
  if (!/^Allow:\s*\/citations\?user=\s*$/m.test(robots)) throw new Error('Google Scholar no longer permits profile crawling');
  const stats = parseProfile(await getText(PROFILE));
  const previous = JSON.parse(await readFile(OUTPUT, 'utf8'));
  if (previous.stats?.citationCount && Math.abs(stats.citationCount - previous.stats.citationCount) > Math.max(100, previous.stats.citationCount * 0.25)) {
    throw new Error('Google Scholar citation count changed unexpectedly; last valid snapshot was preserved');
  }
  const checkedAt = new Date().toISOString();
  const snapshot = {
    source: 'Google Acadêmico',
    profileUrl: previous.profileUrl,
    checkedOn: checkedAt.slice(0, 10),
    checkedAt,
    stats
  };
  await writeFile(OUTPUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.log(`Google Scholar: ${stats.citationCount} citations, h ${stats.hIndex}, i10 ${stats.i10Index}.`);
}

main().catch(error => console.warn(`Google Scholar update skipped: ${error.message}. Last verified snapshot was preserved.`));
