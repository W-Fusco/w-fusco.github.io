const page = document.body.dataset.page;
const $ = (selector) => document.querySelector(selector);
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const setText = (selector, value) => { if ($(selector) && value) $(selector).textContent = value; };
const safeUrl = (value) => { if (typeof value !== 'string' || !value.trim()) return null; try { const url = new URL(value, location.href); return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null; } catch { return null; } };
const readJson = async (path) => { try { const response = await fetch(path, { cache: 'no-store' }); if (!response.ok) throw new Error(response.status); return await response.json(); } catch { return null; } };

function renderShell(profile) {
  const name = profile.name || 'Wilson Fusco';
  document.title = `${({home:'Início',about:'Sobre',research:'Pesquisa',publications:'Publicações',teaching:'Ensino',talks:'Apresentações',cv:'Currículo',contact:'Contato'})[page] || 'Página'} · ${name}`;
  const header = $('#site-header');
  header.innerHTML = `<div class="header-inner"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">✳</span><span></span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">Menu ☰</button><nav class="nav" id="primary-nav" aria-label="Navegação principal"><a href="index.html" data-nav="home">Início</a><div class="nav-group"><button type="button" aria-expanded="false">Pesquisa</button><div class="dropdown"><a href="research.html" data-nav="research">Linhas de pesquisa</a><a href="publications.html" data-nav="publications">Publicações</a></div></div><div class="nav-group"><button type="button" aria-expanded="false">Acadêmico</button><div class="dropdown"><a href="teaching.html" data-nav="teaching">Ensino</a><a href="talks.html" data-nav="talks">Apresentações</a><a href="cv.html" data-nav="cv">Currículo</a></div></div><div class="nav-group"><button type="button" aria-expanded="false">Sobre</button><div class="dropdown"><a href="about.html" data-nav="about">Perfil</a><a href="contact.html" data-nav="contact">Contato</a></div></div></nav></div>`;
  header.querySelector('.brand span:last-child').textContent = name;
  header.querySelector(`[data-nav="${page}"]`)?.classList.add('active');
  const menu = header.querySelector('.menu-toggle');
  const nav = header.querySelector('.nav');
  menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  header.querySelectorAll('.nav-group > button').forEach(button => button.addEventListener('click', () => {
    const group = button.parentElement;
    const open = !group.classList.contains('open');
    header.querySelectorAll('.nav-group').forEach(item => { item.classList.remove('open'); item.querySelector('button').setAttribute('aria-expanded', 'false'); });
    group.classList.toggle('open', open); button.setAttribute('aria-expanded', String(open));
  }));
  document.addEventListener('click', event => { if (!header.contains(event.target)) header.querySelectorAll('.nav-group').forEach(item => { item.classList.remove('open'); item.querySelector('button').setAttribute('aria-expanded', 'false'); }); });
  $('#site-footer').innerHTML = `<div class="footer-inner"><p>© <span class="footer-year"></span> <span class="footer-name"></span></p><p>Pesquisa, ensino e colaboração.</p><a href="contact.html">Contato ↗</a></div>`;
  $('.footer-year').textContent = new Date().getFullYear(); $('.footer-name').textContent = name;
}

function renderLinks(container, links) {
  if (!container) return;
  const labels = { email:'E-mail', lattes:'Currículo Lattes', scholar:'Google Scholar', orcid:'ORCID', github:'GitHub', linkedin:'LinkedIn', university:'Fundaj', website:'Site' };
  Object.entries(links || {}).forEach(([key, value]) => { const href = safeUrl(value); if (!href) return; const a = el('a', '', `${labels[key] || key} ↗`); a.href = href; if (!href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } container.append(a); });
}
function renderThemes(container, themes) {
  if (!container) return;
  if (!themes?.length) { container.append(el('p','muted','As linhas de pesquisa serão incluídas após a confirmação do perfil.')); return; }
  themes.forEach((theme, index) => { const row = el('div','theme-row'); row.append(el('span','theme-num',String(index+1).padStart(2,'0')), el('h3','',theme.title), el('p','',theme.description || ''), el('span','theme-arrow','↗')); container.append(row); });
}
function renderPublications(container, publications, name) {
  if (!container) return;
  container.replaceChildren();
  if (!publications?.length) { container.append(el('p','muted','As publicações serão exibidas aqui quando os dados estiverem disponíveis.')); return; }
  publications.forEach(pub => {
    const row = el('article','publication'); row.append(el('span','pub-year',String(pub.year || '')));
    const body = el('div'); const heading = el('h3');
    const href = safeUrl(pub.doiUrl || (pub.doiValue ? `https://doi.org/${pub.doiValue}` : pub.url));
    const title = el(href ? 'a' : 'span','',pub.title || 'Publicação');
    if (href) { title.href = href; title.target='_blank'; title.rel='noopener noreferrer'; } heading.append(title); body.append(heading);
    const venue = ({ article:'Artigo', 'book-chapter':'Capítulo de livro', book:'Livro', 'conference-paper':'Trabalho em congresso' })[pub.venue] || pub.venue;
    body.append(el('p','pub-meta',[venue, pub.publicationDate].filter(Boolean).join(' · ')));
    const authors = Array.isArray(pub.authors) ? pub.authors : typeof pub.authors === 'string' ? pub.authors.split(/,\s*/) : [];
    if (authors.length) { const line = el('p','pub-authors'); authors.forEach((author,index) => { if (index) line.append(document.createTextNode(', ')); const part = el((name && author.toLocaleLowerCase() === name.toLocaleLowerCase()) ? 'strong' : 'span','',author); line.append(part); }); body.append(line); }
    row.append(body); if (pub.citationCount != null && Number(pub.citationCount) > 0) row.append(el('span','pub-citations',`${pub.citationCount} ${Number(pub.citationCount) === 1 ? 'citação' : 'citações'}`)); container.append(row);
  });
}
function byRecent(a,b) { return String(b.publicationDate || b.publication_date || b.year || '').localeCompare(String(a.publicationDate || a.publication_date || a.year || '')); }
function byCitations(a,b) { return Number(b.citationCount || 0) - Number(a.citationCount || 0); }
function renderTimeline(container, items) {
  if (!container) return;
  (items || []).forEach(item => { const row=el('div','timeline-item'); row.append(el('span','theme-num',item.period || ''),el('div')); row.lastChild.append(el('h2','',item.title),el('p','',item.description || '')); container.append(row); });
}

async function init() {
  const profile = await readJson('data/profile.json') || {};
  renderShell(profile);
  setText('#hero-eyebrow',profile.heroEyebrow); setText('#hero-title',profile.heroTitle); setText('#hero-lead',profile.heroLead); setText('#hero-name',profile.name); setText('#hero-role',profile.role);
  setText('#intro-heading',profile.introHeading); setText('#intro-text',profile.introText); setText('#about-lead',profile.aboutLead); setText('#about-bio',profile.bio); setText('#research-lead',profile.researchLead); setText('#teaching-lead',profile.teachingLead); setText('#cv-lead',profile.cvLead);
  if (profile.portrait && $('#portrait')) { const href = safeUrl(profile.portrait); if (href) { const img = el('img'); img.src=href; img.alt=`Retrato de ${profile.name}`; $('#portrait').replaceChildren(img); } }
  renderLinks($('#hero-links'),profile.links); renderLinks($('#contact-links'),profile.links);
  renderThemes($('#theme-list'),profile.themes); renderThemes($('#research-themes'),profile.themes);
  (profile.facts || []).forEach(fact => { $('#about-facts')?.append(el('dt','',fact.label),el('dd','',fact.value)); });
  (profile.teaching || []).forEach(item => { const row=el('div','simple-item'); row.append(el('h2','',item.title),el('p','',item.description)); $('#teaching-items')?.append(row); });
  renderTimeline($('#cv-timeline'),profile.cv);
  renderTimeline($('#research-projects'),profile.projects);
  renderTimeline($('#talks-list'),profile.talks);
  if ($('#teaching-items') && !$('#teaching-items').children.length) $('#teaching-items').append(el('p','muted','As informações de ensino e orientação serão incluídas após a confirmação do currículo.'));
  if ($('#cv-timeline') && !$('#cv-timeline').children.length) $('#cv-timeline').append(el('p','muted','A trajetória será incluída após o recebimento do currículo.'));
  if ($('#contact-links') && !$('#contact-links').children.length) $('#contact-links').append(el('p','muted','Os canais de contato serão adicionados com suas informações profissionais.'));
  const data = await readJson('data/auto/stats.json') || {};
  const publications = Array.isArray(data.publications) ? data.publications : [];
  const top = (Array.isArray(data.topPublications) ? data.topPublications : []).slice(0,5);
  renderPublications($('#recent-publications'),[...publications].sort(byRecent).slice(0,3),profile.name);
  if (top.length) renderPublications($('#top-publications'),top,profile.name);
  else if ($('#top-section')) $('#top-section').hidden = true;
  renderPublications($('#all-publications'),[...publications].sort(byRecent),profile.name);
  const stats = data.stats || {}; const metrics = $('#metrics');
  if (metrics) { [['citationCount','Citações'],['paperCount','Trabalhos indexados'],['hIndex','Índice h'],['i10Index','Índice i10']].forEach(([key,label]) => { if (stats[key] == null) return; const metric=el('div','metric'); metric.append(el('strong','',Number(stats[key]).toLocaleString('pt-BR')),el('span','',label)); metrics.append(metric); }); if (!metrics.children.length) metrics.hidden=true; }
  if (data.updated && $('#data-note')) {
    const date = new Date(`${String(data.updated).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR');
    $('#data-note').textContent = data.source === 'OpenAlex'
      ? `Indicadores e publicações indexados pelo OpenAlex, atualizados em ${date}. Os totais podem diferir de outras bases.`
      : `Seleção baseada no Currículo Lattes atualizado em ${date}.`;
  }
}
init();
