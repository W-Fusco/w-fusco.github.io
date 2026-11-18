import { readFile, writeFile } from 'node:fs/promises';

const ORCID = '0000-0002-1418-0423';
const EXPECTED_NAME = 'Wilson Fusco';
const OUTPUT = new URL('../data/auto/stats.json', import.meta.url);
const MANUAL = new URL('../data/manual_publications.json', import.meta.url);
const API_KEY = process.env.OPENALEX_API_KEY || '';
const ALLOWED_TYPES = new Set(['article', 'book', 'book-chapter', 'conference-paper']);
const FRONT_MATTER = new Set(['iniciais', 'apresentacao', 'agradecimentos', 'organizadores e autores', 'sumario']);

function normalized(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function apiUrl(path, params = {}) {
  const url = new URL(`https://api.openalex.org/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (API_KEY) url.searchParams.set('api_key', API_KEY);
  return url;
}

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'WilsonFuscoAcademicSite/1.0 (public website metadata refresh)' } });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`OpenAlex returned HTTP ${response.status}`);
    if (attempt === 2) throw new Error(`OpenAlex returned HTTP ${response.status} after retries`);
    const retryAfter = Number(response.headers.get('retry-after')) || 2 ** attempt;
    await new Promise(resolve => setTimeout(resolve, Math.min(retryAfter, 30) * 1000));
  }
}

function validWork(work) {
  const title = work.display_name?.trim();
  return Boolean(title && ALLOWED_TYPES.has(work.type) && !FRONT_MATTER.has(normalized(title)));
}

function formatWork(work) {
  const doiUrl = typeof work.doi === 'string' && work.doi.startsWith('https://doi.org/') ? work.doi : null;
  return {
    year: work.publication_year,
    title: work.display_name.trim(),
    authors: (work.authorships || []).map(item => item.author?.display_name).filter(Boolean),
    venue: work.primary_location?.source?.display_name || work.type,
    publicationDate: work.publication_date,
    doiValue: doiUrl?.slice('https://doi.org/'.length) || null,
    doiUrl,
    url: doiUrl || work.primary_location?.landing_page_url || work.id,
    citationCount: work.cited_by_count || 0,
    type: work.type
  };
}

function keyFor(work) {
  return work.doiValue?.toLowerCase() || normalized(work.title);
}

function unique(works) {
  const seen = new Set();
  return works.filter(work => { const key = keyFor(work); if (!key || seen.has(key)) return false; seen.add(key); return true; });
}

async function main() {
  const authorList = await getJson(apiUrl('authors', { filter: `orcid:${ORCID}`, per_page: '10' }));
  const matches = (authorList.results || []).filter(author => author.orcid === `https://orcid.org/${ORCID}` && normalized(author.display_name) === normalized(EXPECTED_NAME));
  if (matches.length !== 1) throw new Error(`Expected one OpenAlex profile for ${EXPECTED_NAME} and ORCID ${ORCID}; found ${matches.length}`);
  const author = matches[0];
  const authorId = author.id.split('/').pop();
  const fields = 'id,display_name,publication_date,publication_year,doi,cited_by_count,type,authorships,primary_location';
  const [recentResult, topResult] = await Promise.all([
    getJson(apiUrl('works', { filter: `author.id:${authorId}`, sort: 'publication_date:desc', per_page: '100', select: fields })),
    getJson(apiUrl('works', { filter: `author.id:${authorId}`, sort: 'cited_by_count:desc', per_page: '30', select: fields }))
  ]);
  const manual = JSON.parse(await readFile(MANUAL, 'utf8'));
  const recent = unique([
    ...(recentResult.results || []).filter(validWork).map(formatWork),
    ...manual
  ]).sort((a,b) => String(b.publicationDate || b.year).localeCompare(String(a.publicationDate || a.year))).slice(0, 20);
  const top = unique((topResult.results || []).filter(validWork).map(formatWork)).sort((a,b) => b.citationCount - a.citationCount).slice(0, 5);
  if (recent.length < 3 || top.length < 5) throw new Error('OpenAlex returned too few verified works; existing data was preserved');
  const output = {
    updated: new Date().toISOString(),
    source: 'OpenAlex',
    author: { name: EXPECTED_NAME, orcid: `https://orcid.org/${ORCID}`, openalexId: author.id },
    stats: {
      paperCount: author.works_count,
      citationCount: author.cited_by_count,
      hIndex: author.summary_stats?.h_index,
      i10Index: author.summary_stats?.i10_index
    },
    publications: recent,
    topPublications: top
  };
  await writeFile(OUTPUT, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`Updated ${recent.length} recent works and ${top.length} top works for ${author.display_name} (${authorId}).`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
