// /api/save-page.js
// POST → генерує HTML сторінку товару і зберігає в /public/products/{key}.html
// Body: { key, pageData } де pageData = { blocks: [...], seo: {...} }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!process.env.ADMIN_PASSWORD || token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER    = process.env.GITHUB_OWNER || 'hexisfit';
  const REPO     = process.env.GITHUB_REPO  || 'solarbalkon';

  if (!GH_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN not set' });

  try {
    const { key, pageData } = req.body;
    if (!key || !pageData) return res.status(400).json({ error: 'key and pageData required' });

    const html = generateHTML(key, pageData);
    const filePath = `public/products/${key}.html`;
    const fileUrl  = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

    const ghHeaders = {
      'Authorization': `Bearer ${GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };

    let sha;
    const checkRes = await fetch(fileUrl, { headers: ghHeaders });
    if (checkRes.ok) sha = (await checkRes.json()).sha;

    const putRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `admin: update product page ${key}`,
        content: Buffer.from(html).toString('base64'),
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || `GitHub PUT ${putRes.status}`);
    }

    return res.status(200).json({
      success: true,
      url: `https://solarbalkon.shop/${key}`,
      path: filePath,
    });
  } catch (err) {
    console.error('save-page error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function generateHTML(key, pageData) {
  const { seo = {}, blocks = [] } = pageData;
  const title       = seo.title       || 'SolarBalkon';
  const description = seo.description || '';
  const image       = seo.image       || '/og-image.jpg';
  const canonical   = `https://solarbalkon.shop/${key}`;

  // Schema.org Product markup
  const heroBlock   = blocks.find(b => b.type === 'hero') || {};
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: heroBlock.title || title,
    description: heroBlock.description || description,
    image: heroBlock.image ? `https://solarbalkon.shop${heroBlock.image}` : `https://solarbalkon.shop${image}`,
    brand: { '@type': 'Brand', name: heroBlock.brand || 'SolarBalkon' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'UAH',
      price: heroBlock.price || 0,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'SolarBalkon' },
    },
  });

  const blocksHtml = blocks.map(b => renderBlock(b)).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <!-- Open Graph -->
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(description)}">
  <meta property="og:image" content="https://solarbalkon.shop${image}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="product">
  <meta property="og:locale" content="uk_UA">
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(description)}">
  <meta name="twitter:image" content="https://solarbalkon.shop${image}">
  <!-- Schema.org -->
  <script type="application/ld+json">${schema}</script>
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${getCSS()}</style>
</head>
<body>
  <!-- NAV -->
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-logo">☀ Solar<span>Balkon</span></a>
      <div class="nav-links">
        <a href="/">Головна</a>
        <a href="/#systems">Системи</a>
        <a href="/#calc">Калькулятор</a>
        <a href="/blog">Блог</a>
      </div>
    </div>
  </nav>

  <!-- BREADCRUMBS -->
  <div class="breadcrumbs">
    <div class="breadcrumbs-inner">
      <a href="/">Головна</a>
      <span>›</span>
      <a href="/#systems">Системи</a>
      <span>›</span>
      <span>${escHtml(heroBlock.title || title)}</span>
    </div>
  </div>

  <!-- PAGE BLOCKS -->
  <main>${blocksHtml}</main>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-logo">☀ Solar<span>Balkon</span></div>
      <p class="footer-desc">Балконні сонячні електростанції для вашого дому</p>
      <div class="footer-links">
        <a href="/">Головна</a>
        <a href="/blog">Блог</a>
        <a href="/#calc">Калькулятор</a>
      </div>
      <p class="footer-copy">© ${new Date().getFullYear()} SolarBalkon. Всі права захищені.</p>
    </div>
  </footer>

  <script>
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const el = document.querySelector(a.getAttribute('href'));
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
      });
    });
    // FAQ accordion
    document.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-q').addEventListener('click', () => {
        item.classList.toggle('open');
      });
    });
    // Gallery lightbox
    document.querySelectorAll('.gallery-img').forEach(img => {
      img.addEventListener('click', () => {
        const lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.innerHTML = \`<div class="lightbox-bg"></div><img src="\${img.src}" alt=""><button onclick="this.parentElement.remove()">✕</button>\`;
        lb.querySelector('.lightbox-bg').onclick = () => lb.remove();
        document.body.appendChild(lb);
      });
    });
  </script>
</body>
</html>`;
}

function renderBlock(block) {
  switch (block.type) {
    case 'hero':       return renderHero(block);
    case 'specs':      return renderSpecs(block);
    case 'phototext':  return renderPhotoText(block);
    case 'features':   return renderFeatures(block);
    case 'video':      return renderVideo(block);
    case 'faq':        return renderFaq(block);
    case 'price':      return renderPrice(block);
    case 'gallery':    return renderGallery(block);
    default:           return '';
  }
}

function renderHero(b) {
  if (!b.title && !b.image) return '';
  return `
  <section class="hero-section">
    <div class="hero-inner">
      <div class="hero-content">
        ${b.badge ? `<div class="hero-badge">${escHtml(b.badge)}</div>` : ''}
        <h1 class="hero-title">${escHtml(b.title || '')}</h1>
        ${b.description ? `<p class="hero-desc">${escHtml(b.description)}</p>` : ''}
        ${b.price ? `<div class="hero-price">${formatPrice(b.price)} грн</div>` : ''}
        <div class="hero-actions">
          <a href="#order" class="btn-primary">🛒 Замовити</a>
          <a href="/#calc" class="btn-secondary">Розрахувати економію</a>
        </div>
      </div>
      ${b.image ? `<div class="hero-img"><img src="${escHtml(b.image)}" alt="${escHtml(b.title || '')}" loading="eager"></div>` : ''}
    </div>
  </section>`;
}

function renderSpecs(b) {
  if (!b.items?.length) return '';
  const rows = b.items.map(item =>
    `<tr><td class="spec-label">${escHtml(item.label)}</td><td class="spec-value">${escHtml(item.value)}</td></tr>`
  ).join('');
  return `
  <section class="section">
    <div class="container">
      ${b.title ? `<h2 class="section-title">${escHtml(b.title)}</h2>` : ''}
      <div class="specs-table-wrap">
        <table class="specs-table"><tbody>${rows}</tbody></table>
      </div>
    </div>
  </section>`;
}

function renderPhotoText(b) {
  if (!b.text && !b.image) return '';
  const reverse = b.imageRight ? 'flex-row-reverse' : '';
  return `
  <section class="section section-alt">
    <div class="container">
      <div class="phototext ${reverse}">
        ${b.image ? `<div class="phototext-img"><img src="${escHtml(b.image)}" alt="${escHtml(b.title || '')}" loading="lazy"></div>` : ''}
        <div class="phototext-content">
          ${b.title ? `<h2>${escHtml(b.title)}</h2>` : ''}
          ${b.text ? `<p>${escHtml(b.text).replace(/\n/g, '<br>')}</p>` : ''}
        </div>
      </div>
    </div>
  </section>`;
}

function renderFeatures(b) {
  if (!b.items?.length) return '';
  const items = b.items.map(f => `
    <div class="feature-item">
      <div class="feature-icon">${escHtml(f.icon || '✓')}</div>
      <div>
        <div class="feature-title">${escHtml(f.title || '')}</div>
        ${f.text ? `<div class="feature-text">${escHtml(f.text)}</div>` : ''}
      </div>
    </div>`).join('');
  return `
  <section class="section">
    <div class="container">
      ${b.title ? `<h2 class="section-title">${escHtml(b.title)}</h2>` : ''}
      <div class="features-grid">${items}</div>
    </div>
  </section>`;
}

function renderVideo(b) {
  if (!b.url) return '';
  const ytId = b.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/)?.[1];
  if (!ytId) return '';
  return `
  <section class="section section-alt">
    <div class="container">
      ${b.title ? `<h2 class="section-title">${escHtml(b.title)}</h2>` : ''}
      <div class="video-wrap">
        <iframe src="https://www.youtube.com/embed/${ytId}" title="${escHtml(b.title || 'Відео')}"
          frameborder="0" allowfullscreen loading="lazy"></iframe>
      </div>
    </div>
  </section>`;
}

function renderFaq(b) {
  if (!b.items?.length) return '';
  const items = b.items.map((f, i) => `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <div class="faq-q" itemprop="name">${escHtml(f.question || '')}<span class="faq-arrow">›</span></div>
      <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <div itemprop="text">${escHtml(f.answer || '').replace(/\n/g, '<br>')}</div>
      </div>
    </div>`).join('');
  return `
  <section class="section" itemscope itemtype="https://schema.org/FAQPage">
    <div class="container">
      ${b.title ? `<h2 class="section-title">${escHtml(b.title)}</h2>` : ''}
      <div class="faq-list">${items}</div>
    </div>
  </section>`;
}

function renderPrice(b) {
  if (!b.price) return '';
  return `
  <section class="section price-section" id="order">
    <div class="container">
      <div class="price-box">
        ${b.title ? `<h2 class="price-title">${escHtml(b.title)}</h2>` : ''}
        ${b.description ? `<p class="price-desc">${escHtml(b.description)}</p>` : ''}
        <div class="price-amount">${formatPrice(b.price)} грн</div>
        ${b.credit ? `<div class="price-credit">або ${formatPrice(Math.ceil(b.price/120))} грн/міс · кредит 0% на 10 років</div>` : ''}
        <div class="price-actions">
          <a href="/" class="btn-primary btn-lg">🛒 Замовити зараз</a>
          <a href="tel:+380" class="btn-secondary btn-lg">📞 Зателефонувати</a>
        </div>
      </div>
    </div>
  </section>`;
}

function renderGallery(b) {
  if (!b.images?.length) return '';
  const imgs = b.images.map(src =>
    `<div class="gallery-item"><img src="${escHtml(src)}" alt="Фото" class="gallery-img" loading="lazy"></div>`
  ).join('');
  return `
  <section class="section section-alt">
    <div class="container">
      ${b.title ? `<h2 class="section-title">${escHtml(b.title)}</h2>` : ''}
      <div class="gallery-grid">${imgs}</div>
    </div>
  </section>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatPrice(n) {
  return Number(n).toLocaleString('uk-UA');
}

function getCSS() {
  return `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--green:#2d7a3a;--green-dark:#1a5c2a;--green-light:#e8f5e9;--yellow:#fbc02d;--gray-50:#fafafa;--gray-100:#f5f5f5;--gray-200:#eeeeee;--gray-500:#9e9e9e;--gray-700:#616161;--gray-900:#212121;--font-body:'Source Sans 3',sans-serif;--font-display:'Playfair Display',serif;--radius:12px;--shadow:0 4px 20px rgba(0,0,0,0.08)}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);color:var(--gray-900);background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased}
/* NAV */
.nav{position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid var(--gray-200);padding:0 1.5rem}
.nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:64px}
.nav-logo{font-family:var(--font-display);font-size:1.3rem;font-weight:800;color:var(--green);text-decoration:none}
.nav-logo span{color:var(--yellow)}
.nav-links{display:flex;gap:1.5rem}
.nav-links a{text-decoration:none;color:var(--gray-700);font-weight:500;font-size:0.9rem;transition:color .15s}
.nav-links a:hover{color:var(--green)}
/* BREADCRUMBS */
.breadcrumbs{background:var(--gray-100);padding:0.6rem 1.5rem}
.breadcrumbs-inner{max-width:1100px;margin:0 auto;display:flex;gap:0.5rem;font-size:0.82rem;color:var(--gray-500);flex-wrap:wrap}
.breadcrumbs-inner a{color:var(--gray-700);text-decoration:none}.breadcrumbs-inner a:hover{color:var(--green)}
/* CONTAINERS */
.container{max-width:1100px;margin:0 auto;padding:0 1.5rem}
.section{padding:4rem 0}
.section-alt{background:var(--gray-50)}
.section-title{font-family:var(--font-display);font-size:1.8rem;font-weight:700;margin-bottom:2rem;text-align:center}
/* HERO */
.hero-section{background:linear-gradient(135deg,#f1f8f1 0%,#fff 60%);padding:4rem 1.5rem}
.hero-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}
.hero-badge{display:inline-block;background:var(--green-light);color:var(--green);padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:600;margin-bottom:1rem}
.hero-title{font-family:var(--font-display);font-size:2.4rem;font-weight:800;line-height:1.2;margin-bottom:1rem}
.hero-desc{font-size:1.05rem;color:var(--gray-700);margin-bottom:1.5rem;line-height:1.7}
.hero-price{font-size:2rem;font-weight:800;color:var(--green);margin-bottom:1.5rem}
.hero-actions{display:flex;gap:1rem;flex-wrap:wrap}
.hero-img img{width:100%;max-height:460px;object-fit:contain;border-radius:var(--radius)}
/* BUTTONS */
.btn-primary{display:inline-block;background:var(--green);color:#fff;padding:14px 28px;border-radius:var(--radius);font-weight:700;text-decoration:none;font-size:1rem;transition:background .15s}
.btn-primary:hover{background:var(--green-dark)}
.btn-secondary{display:inline-block;background:#fff;color:var(--green);border:2px solid var(--green);padding:12px 24px;border-radius:var(--radius);font-weight:600;text-decoration:none;font-size:0.95rem;transition:all .15s}
.btn-secondary:hover{background:var(--green-light)}
.btn-lg{padding:16px 36px;font-size:1.1rem}
/* SPECS */
.specs-table-wrap{overflow-x:auto}
.specs-table{width:100%;border-collapse:collapse;font-size:0.95rem}
.specs-table tr{border-bottom:1px solid var(--gray-200)}
.specs-table tr:last-child{border:none}
.spec-label{padding:12px 16px;color:var(--gray-700);font-weight:500;width:40%;background:var(--gray-50)}
.spec-value{padding:12px 16px;font-weight:600}
/* PHOTO+TEXT */
.phototext{display:flex;gap:3rem;align-items:center}
.phototext.flex-row-reverse{flex-direction:row-reverse}
.phototext-img{flex:1}.phototext-img img{width:100%;border-radius:var(--radius);box-shadow:var(--shadow)}
.phototext-content{flex:1}.phototext-content h2{font-family:var(--font-display);font-size:1.7rem;font-weight:700;margin-bottom:1rem}
.phototext-content p{font-size:1rem;color:var(--gray-700);line-height:1.8}
/* FEATURES */
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}
.feature-item{display:flex;gap:1rem;align-items:flex-start;padding:1.25rem;background:#fff;border-radius:var(--radius);box-shadow:var(--shadow)}
.feature-icon{font-size:1.8rem;flex-shrink:0}
.feature-title{font-weight:700;font-size:0.95rem;margin-bottom:4px}
.feature-text{font-size:0.87rem;color:var(--gray-700);line-height:1.6}
/* VIDEO */
.video-wrap{position:relative;padding-bottom:56.25%;height:0;border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
.video-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%}
/* FAQ */
.faq-list{max-width:800px;margin:0 auto}
.faq-item{border-bottom:1px solid var(--gray-200);overflow:hidden}
.faq-q{padding:1.1rem 0;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:1rem;user-select:none}
.faq-arrow{color:var(--green);font-size:1.4rem;transition:transform .2s}
.faq-item.open .faq-arrow{transform:rotate(90deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .2s}
.faq-item.open .faq-a{max-height:500px;padding-bottom:1rem}
.faq-a div{color:var(--gray-700);line-height:1.7}
/* PRICE SECTION */
.price-section{background:linear-gradient(135deg,var(--green) 0%,var(--green-dark) 100%);color:#fff}
.price-box{max-width:700px;margin:0 auto;text-align:center}
.price-title{font-family:var(--font-display);font-size:2rem;font-weight:700;margin-bottom:1rem}
.price-desc{font-size:1.05rem;opacity:.9;margin-bottom:1.5rem}
.price-amount{font-size:3rem;font-weight:800;margin-bottom:.5rem}
.price-credit{font-size:.9rem;opacity:.8;margin-bottom:2rem}
.price-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.price-section .btn-primary{background:var(--yellow);color:#333}
.price-section .btn-primary:hover{background:#f9a825}
.price-section .btn-secondary{background:transparent;color:#fff;border-color:rgba(255,255,255,.5)}
.price-section .btn-secondary:hover{background:rgba(255,255,255,.1)}
/* GALLERY */
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
.gallery-item img{width:100%;height:180px;object-fit:cover;border-radius:var(--radius);cursor:zoom-in;transition:transform .2s}
.gallery-item img:hover{transform:scale(1.03)}
/* LIGHTBOX */
.lightbox{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center}
.lightbox-bg{position:absolute;inset:0;background:rgba(0,0,0,.85)}
.lightbox img{position:relative;max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px}
.lightbox button{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.2);border:none;color:#fff;font-size:1.5rem;width:40px;height:40px;border-radius:50%;cursor:pointer}
/* FOOTER */
.footer{background:var(--gray-900);color:#fff;padding:2.5rem 1.5rem;text-align:center}
.footer-inner{max-width:1100px;margin:0 auto}
.footer-logo{font-family:var(--font-display);font-size:1.4rem;font-weight:800;margin-bottom:.5rem}
.footer-logo span{color:var(--yellow)}
.footer-desc{color:var(--gray-500);margin-bottom:1rem;font-size:.9rem}
.footer-links{display:flex;gap:1.5rem;justify-content:center;margin-bottom:1rem}
.footer-links a{color:var(--gray-500);text-decoration:none;font-size:.9rem}.footer-links a:hover{color:#fff}
.footer-copy{color:var(--gray-500);font-size:.8rem}
/* RESPONSIVE */
@media(max-width:768px){
  .hero-inner{grid-template-columns:1fr}
  .hero-title{font-size:1.8rem}
  .hero-img{display:none}
  .phototext,.phototext.flex-row-reverse{flex-direction:column}
  .section{padding:2.5rem 0}
  .section-title{font-size:1.4rem}
  .price-amount{font-size:2rem}
}
`;
}
