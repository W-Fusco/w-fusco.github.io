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
  header.innerHTML = `<div class="header-inner"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">WF</span><span class="brand-name"></span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Abrir menu">Menu ☰</button><nav class="nav" id="primary-nav" aria-label="Navegação principal"><a href="research.html" data-nav="research">Pesquisa</a><a href="publications.html" data-nav="publications">Publicações</a><a href="teaching.html" data-nav="teaching">Ensino</a><a href="talks.html" data-nav="talks">Apresentações</a><a href="cv.html" data-nav="cv">Currículo</a><a href="about.html" data-nav="about">Sobre</a><a class="nav-contact" href="contact.html" data-nav="contact">Contato ↗</a></nav></div>`;
  header.querySelector('.brand-name').textContent = name;
  const currentNav = header.querySelector(`[data-nav="${page}"]`);
  if (currentNav) { currentNav.classList.add('active'); currentNav.setAttribute('aria-current', 'page'); }
  const menu = header.querySelector('.menu-toggle');
  const nav = header.querySelector('.nav');
  const closeMenu = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Abrir menu'); };
  menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); });
  document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  $('#site-footer').innerHTML = `<div class="footer-inner"><p>© <span class="footer-year"></span> <span class="footer-name"></span></p><p>Pesquisa, ensino e colaboração.</p><a class="footer-email" href="contact.html">Contato ↗</a></div>`;
  const email = safeUrl(profile.links?.email);
  if (email) { const link = $('.footer-email'); link.href = email; link.textContent = email.replace(/^mailto:/, ''); }
  $('.footer-year').textContent = new Date().getFullYear(); $('.footer-name').textContent = name;
}

function renderLinks(container, links) {
  if (!container) return;
  const labels = { email:'E-mail', lattes:'Currículo Lattes', scholar:'Google Scholar', orcid:'ORCID', github:'GitHub', linkedin:'LinkedIn', university:'Fundaj', website:'Site' };
  Object.entries(links || {}).forEach(([key, value]) => { const href = safeUrl(value); if (!href) return; const label = key === 'email' && container.id === 'contact-links' ? href.replace(/^mailto:/, '') : labels[key] || key; const a = el('a', '', `${label} ↗`); a.href = href; if (!href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } container.append(a); });
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
function renderMetrics(container, stats, fields) {
  if (!container) return;
  fields.forEach(([key,label]) => {
    if (stats?.[key] == null || !Number.isFinite(Number(stats[key]))) return;
    const metric = el('div','metric');
    metric.append(el('strong','',Number(stats[key]).toLocaleString('pt-BR')),el('span','',label));
    container.append(metric);
  });
  if (!container.children.length) container.closest('.stat-source')?.setAttribute('hidden','');
}
function renderTimeline(container, items) {
  if (!container) return;
  (items || []).forEach(item => { const row=el('div','timeline-item'); row.append(el('span','theme-num',item.period || ''),el('div')); row.lastChild.append(el('h2','',item.title),el('p','',item.description || '')); container.append(row); });
}

async function init() {
  const profile = await readJson('data/profile.json') || {};
  renderShell(profile);
  setText('#hero-eyebrow',profile.heroEyebrow); setText('#hero-name-heading',profile.name); setText('#hero-title',profile.heroTitle); setText('#hero-lead',profile.heroLead);
  setText('#intro-heading',profile.introHeading); setText('#intro-text',profile.introText); setText('#about-lead',profile.aboutLead); setText('#about-bio',profile.bio); setText('#research-lead',profile.researchLead); setText('#teaching-lead',profile.teachingLead); setText('#cv-lead',profile.cvLead);
  if (profile.portrait && $('#portrait')) { const href = safeUrl(profile.portrait); if (href) { const img = el('img'); img.src=href; img.alt=`Retrato de ${profile.name}`; img.decoding='async'; img.fetchPriority='high'; $('#portrait').replaceChildren(img); } }
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
  renderMetrics($('#metrics'),data.stats,[['citationCount','Citações'],['paperCount','Trabalhos indexados'],['hIndex','Índice h'],['i10Index','Índice i10']]);
  if ($('#scholar-metrics')) {
    const scholar = await readJson('data/scholar_snapshot.json') || {};
    renderMetrics($('#scholar-metrics'),scholar.stats,[['citationCount','Citações'],['hIndex','Índice h'],['i10Index','Índice i10']]);
    const href = safeUrl(scholar.profileUrl);
    if (href) $('#scholar-profile').href = href;
    if (scholar.checkedOn) {
      const checked = new Date(`${String(scholar.checkedOn).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR');
      $('#scholar-note').textContent = `Valores consultados em ${checked}. Para números atuais, abra o perfil.`;
    }
  }
  if (data.updated && $('#data-note')) {
    const date = new Date(`${String(data.updated).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR');
    $('#data-note').textContent = data.source === 'OpenAlex'
      ? `Seleção de publicações e indicadores do OpenAlex atualizados em ${date}.`
      : `Seleção baseada no Currículo Lattes atualizado em ${date}.`;
  }
}
init();
