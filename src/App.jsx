import { useState, useEffect, useRef } from 'react';

/* ───────────────────────── CONFIG ───────────────────────── */
const TARIFFS = {
  residential: { label: 'Побутовий', now: 4.32, forecast: 6.64, night: 2.16, min: 100, max: 800, step: 50, unit: 'грн/кВт·год' },
  commercial:  { label: 'Комерційний', now: 7.50, forecast: 9.00, night: 5.25, min: 200, max: 10000, step: 100, unit: 'грн/кВт·год' },
};

const PRIMARY_COUNT = 6; // visible by default
const APPLIANCES = [
  // === PRIMARY (always visible) ===
  { name: 'Газовий котел', watts: 150, hours: 24 },
  { name: 'Роутер Wi-Fi', watts: 10, hours: 24 },
  { name: 'Зарядка телефону', watts: 20, hours: 3 },
  { name: "Комп'ютер", watts: 300, hours: 8 },
  { name: 'Пральна машина', watts: 500, hours: 1 },
  { name: 'Освітлення LED', watts: 50, hours: 6 },
  // === SECONDARY (collapsed) ===
  { name: 'Холодильник', watts: 150, hours: 24 },
  { name: 'Кондиціонер', watts: 1000, hours: 6 },
  { name: 'Телевізор', watts: 100, hours: 5 },
  { name: 'Ноутбук', watts: 65, hours: 6 },
  { name: 'Мікрохвильовка', watts: 800, hours: 0.3 },
  { name: 'Електроплита', watts: 2000, hours: 1 },
  { name: 'Електрочайник', watts: 2000, hours: 0.1 },
  { name: 'Посудомийка', watts: 1800, hours: 1 },
  { name: 'Праска', watts: 2200, hours: 0.3 },
  { name: 'Фен', watts: 1500, hours: 0.2 },
  { name: 'Пилосос', watts: 1400, hours: 0.3 },
  { name: 'Обігрівач', watts: 1500, hours: 4 },
  { name: 'Вентилятор', watts: 60, hours: 8 },
  { name: 'Сушильна машина', watts: 2500, hours: 1 },
];

/* ───────────────── GOOGLE SHEETS PRICES ─────────────────── */
// Prices fetched from /api/prices (server-side proxy)

// Default prices in UAH (fallback)
const DEFAULT_PRICES = {
  'EcoFlow STREAM AC Pro': 40000,
  'Zendure SolarFlow 2400 AC+': 50000,
  'Deye AE-FS2.0-2H2': 40000,
  'Anker SOLIX F3800': 151700,
};

function formatPrice(num) {
  return Math.round(num).toLocaleString('uk-UA') + ' грн';
}

const PRODUCTS_BASE = [
  { name: 'EcoFlow STREAM AC Pro', capacity: 1920, output: 1200, cycles: 6000, warranty: 2, price: 40000, color: '#4caf50', image: '/ecoflow.png', battery: 'LFP', ip: 'IP65', ups: false, maxPanels: 4, key: 'ecoflow' },
  { name: 'Zendure SolarFlow 2400 AC+', capacity: 2400, output: 2400, cycles: 6000, warranty: 10, price: 50000, color: '#5c6bc0', image: '/zendure.png', battery: 'LiFePO4', ip: 'IP65', ups: false, maxPanels: 4, key: 'zendure' },
  { name: 'Deye AE-FS2.0-2H2', capacity: 2000, output: 1000, cycles: 6000, warranty: 10, price: 40000, color: '#fbc02d', image: '/deye.png', battery: 'LiFePO4', ip: 'IP65', ups: true, maxPanels: 4, key: 'deye' },
  { name: 'Anker SOLIX F3800', capacity: 3840, output: 6000, cycles: 3000, warranty: 5, price: 151700, color: '#00a0e3', image: '/anker.png', battery: 'LFP', ip: 'IP65', ups: true, maxPanels: 2, key: 'anker' },
];

const ADVANTAGES = [
  { icon: '☀️', title: 'Чиста енергія', desc: 'Знижуйте вуглецевий слід вашого дому щодня' },
  { icon: '💰', title: 'Економія коштів', desc: 'Зменшіть рахунки за електроенергію до 80%' },
  { icon: '🔌', title: 'Легке підключення', desc: 'Plug & Play — встановлення за 30 хвилин' },
  { icon: '🏠', title: 'Для будь-якого балкону', desc: 'Компактні панелі під будь-який розмір' },
  { icon: '📱', title: 'Моніторинг 24/7', desc: 'Контроль через додаток у смартфоні' },
  { icon: '🏦', title: 'Кредит 0%', desc: 'Державна програма до 480,000 грн на 10 років' },
];

/* ───────────────────────── STYLES ───────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

:root {
  --green-900: #1a5c2a;
  --green-700: #2d7a3a;
  --green-600: #388e3c;
  --green-500: #4caf50;
  --green-400: #66bb6a;
  --green-300: #81c784;
  --green-200: #a5d6a7;
  --green-100: #c8e6c9;
  --green-50:  #e8f5e9;
  --yellow-600: #f9a825;
  --yellow-500: #fbc02d;
  --yellow-400: #fdd835;
  --yellow-300: #ffee58;
  --yellow-200: #fff59d;
  --yellow-100: #fff9c4;
  --white: #ffffff;
  --gray-50:  #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #eeeeee;
  --gray-300: #e0e0e0;
  --gray-400: #bdbdbd;
  --gray-500: #9e9e9e;
  --gray-600: #757575;
  --gray-700: #616161;
  --gray-800: #424242;
  --gray-900: #212121;
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Source Sans 3', 'Segoe UI', Tahoma, sans-serif;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.12);
  --shadow-xl: 0 16px 48px rgba(0,0,0,0.14);
  --radius: 12px;
  --radius-lg: 20px;
}

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

html { scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  background: var(--white);
  color: var(--gray-800);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* ANIMATIONS */
@keyframes fadeUp {
  from { opacity:0; transform:translateY(30px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fadeIn {
  from { opacity:0; }
  to   { opacity:1; }
}
@keyframes slideIn {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes pulse {
  0%,100% { transform:scale(1); }
  50%     { transform:scale(1.05); }
}
@keyframes float {
  0%,100% { transform:translateY(0); }
  50%     { transform:translateY(-8px); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.fade-up { animation: fadeUp 0.7s ease-out both; }
.fade-up-d1 { animation: fadeUp 0.7s ease-out 0.1s both; }
.fade-up-d2 { animation: fadeUp 0.7s ease-out 0.2s both; }
.fade-up-d3 { animation: fadeUp 0.7s ease-out 0.3s both; }
.fade-up-d4 { animation: fadeUp 0.7s ease-out 0.4s both; }

/* NAV */
.nav {
  position: fixed; top:0; left:0; right:0; z-index:100;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--gray-200);
  padding: 0 2rem;
  transition: box-shadow 0.3s;
}
.nav.scrolled { box-shadow: var(--shadow-md); }
.nav-inner {
  max-width: 1200px; margin:0 auto;
  display:flex; align-items:center; justify-content:space-between;
  height: 64px;
}
.nav-logo {
  font-family: var(--font-display);
  font-size: 1.5rem; font-weight: 800;
  color: var(--green-700);
  text-decoration: none;
  display:flex; align-items:center; gap:6px;
}
.nav-logo img {
  height: 32px; width: auto;
  object-fit: contain;
}
.nav-logo span { color: var(--yellow-600); }
.nav-links { display:flex; gap:2rem; list-style:none; }
.nav-links a {
  text-decoration:none; color:var(--gray-600);
  font-weight:500; font-size:0.95rem;
  transition: color 0.2s;
  position:relative;
}
.nav-links a:hover { color:var(--green-700); }
.nav-links a::after {
  content:''; position:absolute; bottom:-4px; left:0;
  width:0; height:2px; background:var(--green-500);
  transition: width 0.3s;
}
.nav-links a:hover::after { width:100%; }

/* HERO */
.hero {
  min-height:100vh; display:flex; align-items:center;
  padding: 100px 2rem 60px;
  background: linear-gradient(135deg, var(--green-50) 0%, var(--white) 40%, var(--yellow-100) 100%);
  position:relative; overflow:hidden;
}
.hero::before {
  content:''; position:absolute; top:-200px; right:-200px;
  width:600px; height:600px; border-radius:50%;
  background: radial-gradient(circle, rgba(76,175,80,0.08) 0%, transparent 70%);
}
.hero::after {
  content:''; position:absolute; right:-2%; top:5%;
  width:50%; height:65%;
  background: url('/hero-bg.png') no-repeat center center;
  background-size: contain;
  opacity: 0.18; pointer-events: none;
}
.hero-inner {
  max-width:1200px; margin:0 auto; width:100%;
  position:relative; z-index:1; text-align: left;
}
.hero-badge {
  display:inline-flex; align-items:center; gap:8px;
  background:var(--green-100); color:var(--green-700);
  padding:8px 16px; border-radius:50px;
  font-size:0.85rem; font-weight:600;
  margin-bottom:1.5rem;
}
.hero h1 {
  font-family:var(--font-display);
  font-size:clamp(2.4rem, 5vw, 4rem);
  font-weight:800; line-height:1.15;
  color:var(--gray-900);
  margin-bottom:1rem; max-width: 650px;
}
.hero h1 em {
  font-style:normal;
  background: linear-gradient(135deg, var(--green-600), var(--yellow-600));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
}
.hero-sub {
  font-size:1.2rem; color:var(--gray-600);
  max-width:600px; margin-bottom:2.5rem;
  line-height:1.7;
}
.hero-cta {
  display:inline-flex; align-items:center; gap:8px;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color:white; padding:14px 32px;
  border-radius:50px; font-size:1rem; font-weight:600;
  text-decoration:none; border:none; cursor:pointer;
  box-shadow: 0 4px 16px rgba(76,175,80,0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}
.hero-cta:hover {
  transform:translateY(-2px);
  box-shadow: 0 6px 24px rgba(76,175,80,0.4);
}

/* TARIFF TOGGLE */
.tariff-toggle {
  display:flex; gap:0; background:var(--gray-100);
  border-radius:50px; padding:4px; width:fit-content;
  margin: 0 auto 2rem;
}
.tariff-btn {
  padding:10px 24px; border-radius:50px;
  border:none; cursor:pointer;
  font-family:var(--font-body); font-weight:600;
  font-size:0.9rem;
  transition: all 0.3s;
  background:transparent; color:var(--gray-500);
}
.tariff-btn.active {
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color:white;
  box-shadow: 0 2px 8px rgba(76,175,80,0.3);
}

/* TARIFF CARDS */
.tariff-cards {
  display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap:1rem; max-width:700px; margin:0 auto 3rem;
}
.tariff-card {
  background:var(--white);
  border:1px solid var(--gray-200);
  border-radius:var(--radius);
  padding:1.25rem; text-align:center;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}
.tariff-card:hover {
  transform:translateY(-3px);
  box-shadow: var(--shadow-md);
}
.tariff-card-label {
  font-size:0.8rem; color:var(--gray-500);
  text-transform:uppercase; letter-spacing:0.5px;
  margin-bottom:0.5rem;
}
.tariff-card-value {
  font-family:var(--font-display);
  font-size:1.8rem; font-weight:700;
  color:var(--green-700);
}
.tariff-card-unit {
  font-size:0.75rem; color:var(--gray-400);
}

/* ADVANTAGES */
.advantages {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap:1.5rem; max-width:1200px; margin:0 auto;
}
.adv-card {
  display:flex; align-items:flex-start; gap:1rem;
  padding:1.5rem; border-radius:var(--radius);
  background:var(--white);
  border:1px solid var(--gray-200);
  transition: transform 0.2s, box-shadow 0.2s;
}
.adv-card:hover {
  transform:translateY(-3px);
  box-shadow: var(--shadow-md);
}
.adv-icon {
  font-size:2rem; width:56px; height:56px;
  display:flex; align-items:center; justify-content:center;
  background:var(--green-50); border-radius:var(--radius);
  flex-shrink:0;
}
.adv-title {
  font-family:var(--font-display);
  font-weight:700; font-size:1.05rem;
  color:var(--gray-900); margin-bottom:0.25rem;
}
.adv-desc { font-size:0.9rem; color:var(--gray-500); }

/* SECTIONS */
.section {
  padding: 80px 2rem;
}
.section-alt { background: var(--gray-50); }
.section-green { background: linear-gradient(135deg, var(--green-50), var(--yellow-100)); }
.section-title {
  font-family:var(--font-display);
  font-size:clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight:800; text-align:center;
  color:var(--gray-900);
  margin-bottom:0.5rem;
}
.section-sub {
  text-align:center; color:var(--gray-500);
  font-size:1.05rem; margin-bottom:3rem;
  max-width:600px; margin-left:auto; margin-right:auto;
}

/* CALCULATOR */
.calc-grid {
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap:0.75rem; max-width:1100px; margin:0 auto 2rem;
}
.calc-item {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px;
  border:1px solid var(--gray-200);
  border-radius:var(--radius);
  background:var(--white);
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor:pointer; user-select:none;
}
.calc-item:hover { border-color:var(--green-300); }
.calc-item.active {
  border-color:var(--green-500);
  background:var(--green-50);
  box-shadow: 0 0 0 2px rgba(76,175,80,0.15);
}
.calc-item-name {
  font-size:0.88rem; font-weight:500; color:var(--gray-700);
}
.calc-item-watts {
  font-size:0.78rem; color:var(--gray-400);
  font-weight:500;
}
.calc-result {
  max-width:800px; margin:0 auto;
  background: linear-gradient(135deg, var(--green-600), var(--green-700));
  border-radius:var(--radius-lg);
  padding:2rem; color:white;
  box-shadow: var(--shadow-lg);
}
.calc-result-grid {
  display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
  gap:1.5rem;
}
.calc-result-item { text-align:center; }
.calc-result-label {
  font-size:0.8rem; opacity:0.8;
  text-transform:uppercase; letter-spacing:0.5px;
  margin-bottom:0.3rem;
}
.calc-result-value {
  font-family:var(--font-display);
  font-size:2rem; font-weight:700;
}
.calc-result-note {
  text-align:center; margin-top:1rem;
  font-size:0.85rem; opacity:0.75;
}

/* PRODUCTS */
.products-grid {
  display:grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr));
  gap:1.25rem; max-width:1200px; margin:0 auto;
}
.product-card {
  background:var(--white);
  border:1px solid var(--gray-200);
  border-radius:var(--radius-lg);
  padding:2rem;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
  position:relative; overflow:hidden;
}
.product-card:hover {
  transform:translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.product-card::before {
  content:''; position:absolute; top:0; left:0; right:0;
  height:4px;
}
.product-name {
  font-family:var(--font-display);
  font-size:1.3rem; font-weight:700;
  color:var(--gray-900); margin-bottom:1rem;
}
.product-img-wrap {
  width:100%; height:180px;
  display:flex; align-items:center; justify-content:center;
  background:var(--gray-50); border-radius:var(--radius);
  margin-bottom:1.5rem; overflow:hidden;
}
.product-img-wrap img {
  max-width:80%; max-height:160px;
  object-fit:contain;
}
.product-img-placeholder {
  width:100%; height:180px;
  display:flex; align-items:center; justify-content:center;
  background:var(--gray-50); border-radius:var(--radius);
  margin-bottom:1.5rem; color:var(--gray-400);
  font-size:0.85rem;
}
.product-spec {
  display:flex; justify-content:space-between;
  padding:0.6rem 0; border-bottom:1px solid var(--gray-100);
}
.product-spec-label { font-size:0.88rem; color:var(--gray-500); }
.product-spec-value { font-size:0.88rem; font-weight:600; color:var(--gray-800); }
.product-bar-bg {
  height:8px; background:var(--gray-100);
  border-radius:4px; margin-top:6px; overflow:hidden;
}
.product-bar-fill {
  height:100%; border-radius:4px;
  transition: width 1s ease-out;
}
.product-price {
  margin-top:1.5rem; text-align:center;
  font-family:var(--font-display);
  font-size:1.4rem; font-weight:700;
}

/* EQUIPMENT */
.equip-grid {
  display:grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr));
  gap:1.5rem; max-width:1100px; margin:0 auto 2rem;
}
.equip-card {
  background:var(--white);
  border:1px solid var(--gray-200);
  border-radius:var(--radius-lg);
  padding:2rem;
  box-shadow: var(--shadow-sm);
}
.equip-card-title {
  font-family:var(--font-display);
  font-size:1.15rem; font-weight:700;
  color:var(--gray-900); margin-bottom:0.25rem;
}
.equip-card-subtitle {
  font-size:0.85rem; color:var(--gray-400);
  margin-bottom:1.25rem;
}
.equip-spec {
  display:flex; justify-content:space-between;
  padding:0.5rem 0; border-bottom:1px solid var(--gray-100);
  font-size:0.88rem;
}
.equip-spec-label { color:var(--gray-500); }
.equip-spec-value { font-weight:600; color:var(--gray-700); }

/* PRICING TABLE */
.pricing-table {
  max-width:800px; margin:0 auto;
  background:var(--white);
  border:1px solid var(--gray-200);
  border-radius:var(--radius-lg);
  overflow:hidden;
  box-shadow: var(--shadow-sm);
}
.pricing-row {
  display:grid; grid-template-columns: 2fr 1fr 1fr;
  padding:1rem 1.5rem;
  border-bottom:1px solid var(--gray-100);
  align-items:center;
}
.pricing-row:last-child { border-bottom:none; }
.pricing-header {
  background: linear-gradient(135deg, var(--green-600), var(--green-700));
  color:white; font-weight:700;
}
.pricing-header .pricing-cell { color:white; }
.pricing-cell {
  font-size:0.9rem; color:var(--gray-700);
}
.pricing-cell:not(:first-child) { text-align:center; font-weight:600; }
.pricing-total {
  background:var(--green-50);
  font-weight:700;
}
.pricing-total .pricing-cell { color:var(--green-700); font-size:1rem; }

/* CREDIT */
.credit-banner {
  max-width:800px; margin:2rem auto 0;
  background: linear-gradient(135deg, var(--yellow-500), var(--yellow-600));
  border-radius:var(--radius-lg);
  padding:2rem; text-align:center;
  box-shadow: var(--shadow-md);
}
.credit-banner h3 {
  font-family:var(--font-display);
  font-size:1.4rem; font-weight:700;
  color:var(--gray-900); margin-bottom:0.5rem;
}
.credit-banner p {
  color:var(--gray-800); font-size:0.95rem;
}
.credit-details {
  display:flex; gap:2rem; justify-content:center;
  margin-top:1rem; flex-wrap:wrap;
}
.credit-detail {
  text-align:center;
}
.credit-detail-value {
  font-family:var(--font-display);
  font-size:1.6rem; font-weight:800;
  color:var(--gray-900);
}
.credit-detail-label {
  font-size:0.78rem; color:var(--gray-700);
}

/* SAVINGS */
.savings-container { max-width:800px; margin:0 auto; }
.savings-slider-wrap {
  text-align:center; margin-bottom:2rem;
}
.savings-slider-label {
  font-size:0.9rem; color:var(--gray-500); margin-bottom:0.5rem;
}
.savings-slider-value {
  font-family:var(--font-display);
  font-size:2.2rem; font-weight:800;
  color:var(--green-700);
  margin-bottom:1rem;
}
.savings-slider {
  width:100%; max-width:500px;
  -webkit-appearance:none; appearance:none;
  height:8px; border-radius:4px;
  background: linear-gradient(90deg, var(--green-300), var(--yellow-400));
  outline:none;
  cursor:pointer;
}
.savings-slider::-webkit-slider-thumb {
  -webkit-appearance:none; appearance:none;
  width:24px; height:24px; border-radius:50%;
  background:var(--green-600);
  border:3px solid white;
  box-shadow: var(--shadow-md);
  cursor:pointer;
  transition: transform 0.15s;
}
.savings-slider::-webkit-slider-thumb:hover { transform:scale(1.15); }

.savings-cards {
  display:grid; grid-template-columns: 1fr 1fr;
  gap:1.5rem; margin-bottom:2rem;
}
.savings-card {
  padding:1.5rem; border-radius:var(--radius-lg);
  text-align:center;
}
.savings-card.before {
  background:var(--gray-100); border:1px solid var(--gray-200);
}
.savings-card.after {
  background:var(--green-50); border:1px solid var(--green-200);
}
.savings-card-label {
  font-size:0.85rem; color:var(--gray-500);
  text-transform:uppercase; letter-spacing:0.5px;
  margin-bottom:0.5rem;
}
.savings-card-value {
  font-family:var(--font-display);
  font-size:2rem; font-weight:700;
}
.savings-card.before .savings-card-value { color:var(--gray-700); }
.savings-card.after .savings-card-value { color:var(--green-700); }

.savings-stats {
  display:grid; grid-template-columns: repeat(3, 1fr);
  gap:1rem;
}
.savings-stat {
  text-align:center; padding:1.5rem;
  background:var(--white); border:1px solid var(--gray-200);
  border-radius:var(--radius);
}
.savings-stat-value {
  font-family:var(--font-display);
  font-size:1.6rem; font-weight:700;
  color:var(--green-700);
}
.savings-stat-label {
  font-size:0.8rem; color:var(--gray-500);
  margin-top:0.25rem;
}

/* COMMERCIAL INVERTERS */
.inv-filters {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; margin-bottom: 2rem;
}
.inv-phase-toggle {
  display: flex; gap: 0; background: var(--gray-100);
  border-radius: 50px; padding: 4px;
}
.inv-phase-btn {
  padding: 10px 28px; border-radius: 50px;
  border: none; cursor: pointer;
  font-family: var(--font-body); font-weight: 600;
  font-size: 0.9rem; transition: all 0.3s;
  background: transparent; color: var(--gray-500);
}
.inv-phase-btn.active {
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: white; box-shadow: 0 2px 8px rgba(76,175,80,0.3);
}
.inv-kw-buttons {
  display: flex; gap: 0.5rem; flex-wrap: wrap;
  justify-content: center;
}
.inv-kw-btn {
  padding: 8px 20px; border-radius: 50px;
  border: 2px solid var(--gray-200); cursor: pointer;
  font-family: var(--font-body); font-weight: 600;
  font-size: 0.9rem; transition: all 0.2s;
  background: var(--white); color: var(--gray-600);
}
.inv-kw-btn:hover { border-color: var(--green-300); color: var(--green-600); }
.inv-kw-btn.active {
  border-color: var(--green-500); background: var(--green-50);
  color: var(--green-700);
}
.inv-card {
  max-width: 900px; margin: 0 auto;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  display: grid; grid-template-columns: 1fr 1fr;
  transition: all 0.3s;
}
.inv-card-left {
  padding: 2rem;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background: var(--gray-50);
  min-height: 300px;
}
.inv-card-left img {
  max-width: 100%; max-height: 280px;
  object-fit: contain;
}
.inv-card-left img[src]::before {
  content: '';
}
.inv-card-left img:not([src]), .inv-card-left img[src=""] {
  display: none;
}
.inv-card-right { padding: 2rem; }
.inv-card-name {
  font-family: var(--font-display);
  font-size: 1.4rem; font-weight: 700;
  color: var(--gray-900); margin-bottom: 0.25rem;
}
.inv-card-model {
  font-size: 0.85rem; color: var(--gray-400);
  margin-bottom: 1rem; font-family: monospace;
}
.inv-card-badges {
  display: flex; gap: 0.5rem; margin-bottom: 1rem;
  flex-wrap: wrap;
}
.inv-badge {
  padding: 4px 12px; border-radius: 50px;
  font-size: 0.78rem; font-weight: 600;
}
.inv-badge-phase { background: #e3f2fd; color: #1565c0; }
.inv-badge-kw { background: var(--green-50); color: var(--green-700); }
.inv-badge-avail { background: #e8f5e9; color: #2e7d32; }
.inv-card-specs { margin-bottom: 1.25rem; }
.inv-card-spec {
  display: flex; justify-content: space-between;
  padding: 0.45rem 0; border-bottom: 1px solid var(--gray-100);
  font-size: 0.88rem;
}
.inv-card-spec-label { color: var(--gray-500); }
.inv-card-spec-value { font-weight: 600; color: var(--gray-700); }
.inv-card-price {
  font-family: var(--font-display);
  font-size: 2rem; font-weight: 800;
  color: var(--green-700); margin-bottom: 0.25rem;
}
.inv-card-price-eur {
  font-size: 0.85rem; color: var(--gray-400);
  margin-bottom: 1rem;
}
.inv-card-usp {
  background: var(--yellow-100); color: var(--gray-800);
  padding: 0.75rem 1rem; border-radius: var(--radius);
  font-size: 0.88rem; margin-bottom: 1.25rem;
  line-height: 1.5;
}
.inv-card-actions {
  display: flex; gap: 0.75rem; flex-wrap: wrap;
}
.inv-card-buy {
  flex: 1; padding: 12px 20px; border-radius: 50px;
  border: none; cursor: pointer;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: white; font-family: var(--font-body);
  font-size: 0.95rem; font-weight: 700;
  box-shadow: 0 4px 12px rgba(76,175,80,0.3);
  transition: all 0.2s;
}
.inv-card-buy:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76,175,80,0.4);
}
.inv-card-link {
  padding: 12px 20px; border-radius: 50px;
  border: 2px solid var(--gray-200); cursor: pointer;
  background: transparent; color: var(--gray-600);
  font-family: var(--font-body); font-size: 0.9rem;
  font-weight: 600; text-decoration: none;
  transition: all 0.2s; text-align: center;
}
.inv-card-link:hover {
  border-color: var(--green-400); color: var(--green-700);
}

/* FOOTER */
.footer {
  background:var(--gray-900); color:var(--gray-400);
  padding:3rem 2rem; text-align:center;
}
.footer-logo {
  font-family:var(--font-display);
  font-size:1.3rem; font-weight:800;
  color:white; margin-bottom:0.5rem;
  display:flex; align-items:center; justify-content:center; gap:6px;
}
.footer-logo img {
  height:28px; width:auto;
  object-fit:contain;
  filter: brightness(0) invert(1);
}
.footer-logo span { color:var(--yellow-500); }
.footer p { font-size:0.85rem; }

/* VIDEO CAROUSEL */
.video-section {
  padding: 60px 2rem;
  background: var(--gray-50);
}
.video-carousel {
  max-width: 900px; margin: 0 auto;
  position: relative;
}
.video-carousel-inner {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  aspect-ratio: 16/9;
}
.video-carousel-inner iframe {
  width: 100%; height: 100%; border: none;
}
.video-carousel-dots {
  display: flex; justify-content: center;
  gap: 10px; margin-top: 1rem;
}
.video-dot {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid var(--green-400);
  background: transparent; cursor: pointer;
  transition: all 0.2s;
}
.video-dot.active {
  background: var(--green-500);
  border-color: var(--green-500);
}
.video-carousel-label {
  text-align: center; margin-top: 0.5rem;
  font-size: 0.85rem; color: var(--gray-500);
  font-weight: 500;
}

/* PRODUCT DETAIL BUTTON */
.product-btn {
  display: block; width: 100%;
  margin-top: 1rem; padding: 12px;
  border: 2px solid; border-radius: 50px;
  font-family: var(--font-body);
  font-size: 0.9rem; font-weight: 600;
  cursor: pointer; background: transparent;
  transition: all 0.2s;
}
.product-btn:hover {
  color: white !important;
}

/* DETAIL PAGE */
.detail-page {
  padding-top: 64px;
}
.detail-back {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; margin: 1.5rem 2rem;
  border: 1px solid var(--gray-300); border-radius: 50px;
  background: var(--white); color: var(--gray-600);
  font-family: var(--font-body); font-size: 0.9rem;
  font-weight: 500; cursor: pointer;
  transition: all 0.2s; text-decoration: none;
}
.detail-back:hover { border-color: var(--green-400); color: var(--green-700); }
.detail-hero-section {
  padding: 2rem;
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 3rem; align-items: center;
}
.detail-hero-img {
  width: 100%; border-radius: var(--radius-lg);
  background: var(--gray-50); padding: 2rem;
}
.detail-hero-img img { width: 100%; object-fit: contain; }
.detail-hero-info h1 {
  font-family: var(--font-display);
  font-size: 2.2rem; font-weight: 800;
  color: var(--gray-900); margin-bottom: 0.5rem;
}
.detail-hero-info .detail-price {
  font-family: var(--font-display);
  font-size: 1.8rem; font-weight: 700;
  color: var(--green-700); margin-bottom: 1.5rem;
}
.detail-specs-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.detail-spec {
  display: flex; justify-content: space-between;
  padding: 0.6rem 0; border-bottom: 1px solid var(--gray-100);
  font-size: 0.9rem;
}
.detail-spec-label { color: var(--gray-500); }
.detail-spec-value { font-weight: 600; color: var(--gray-800); }
.detail-feature {
  max-width: 1200px; margin: 0 auto;
  padding: 4rem 2rem;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 3rem; align-items: center;
}
.detail-feature.reverse { direction: rtl; }
.detail-feature.reverse > * { direction: ltr; }
.detail-feature-img {
  width: 100%; border-radius: var(--radius-lg);
  overflow: hidden;
}
.detail-feature-img img { width: 100%; display: block; }
.detail-feature-text h2 {
  font-family: var(--font-display);
  font-size: 1.6rem; font-weight: 700;
  color: var(--gray-900); margin-bottom: 1rem;
}
.detail-feature-text p {
  font-size: 1rem; color: var(--gray-600);
  line-height: 1.7;
}
.detail-feature-full {
  max-width: 1200px; margin: 0 auto;
  padding: 3rem 2rem; text-align: center;
}
.detail-feature-full h2 {
  font-family: var(--font-display);
  font-size: 1.6rem; font-weight: 700;
  color: var(--gray-900); margin-bottom: 1.5rem;
}
.detail-feature-full img {
  width: 100%; max-width: 1000px;
  border-radius: var(--radius-lg);
}
.detail-video-wrap {
  max-width: 900px; margin: 0 auto;
  aspect-ratio: 16/9; border-radius: var(--radius-lg);
  overflow: hidden; box-shadow: var(--shadow-lg);
}
.detail-video-wrap iframe { width: 100%; height: 100%; border: none; }
.detail-video-wrap video { width: 100%; height: 100%; object-fit: cover; }
.detail-pdf-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px; margin-top: 1rem;
  border: 2px solid var(--green-500); border-radius: 50px;
  background: var(--green-500); color: white;
  font-family: var(--font-body); font-size: 1rem;
  font-weight: 600; cursor: pointer;
  text-decoration: none; transition: all 0.2s;
}
.detail-pdf-btn:hover {
  background: var(--green-700); border-color: var(--green-700);
}
.detail-buy-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 32px; margin-top: 1.5rem;
  border-radius: 50px; border: none;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color: white; font-family: var(--font-body);
  font-size: 1.1rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(76,175,80,0.3);
  width: 100%;
  justify-content: center;
}
.detail-buy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(76,175,80,0.4);
}

/* CONFIGURATOR */

/* CREDIT PAGE */

/* ORDER MODAL */
.order-overlay {
  position:fixed; top:0; left:0; right:0; bottom:0;
  background:rgba(0,0,0,0.5); z-index:200;
  display:flex; align-items:center; justify-content:center;
  padding:1rem; animation:fadeIn 0.2s ease-out;
}
.order-modal {
  background:var(--white); border-radius:var(--radius-lg);
  max-width:500px; width:100%;
  box-shadow:var(--shadow-xl);
  animation:fadeUp 0.3s ease-out;
  max-height:90vh; overflow-y:auto;
}
.order-modal-header {
  padding:1.5rem 2rem 0;
  display:flex; align-items:center; justify-content:space-between;
}
.order-modal-header h2 {
  font-family:var(--font-display);
  font-size:1.4rem; font-weight:700;
  color:var(--gray-900);
}
.order-close {
  width:36px; height:36px; border-radius:50%;
  border:none; background:var(--gray-100);
  font-size:1.2rem; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:var(--gray-500); transition:all 0.2s;
}
.order-close:hover { background:var(--gray-200); color:var(--gray-700); }
.order-modal-body { padding:1.5rem 2rem; }
.order-summary {
  background:var(--green-50); border:1px solid var(--green-200);
  border-radius:var(--radius); padding:1rem;
  margin-bottom:1.5rem; font-size:0.88rem;
}
.order-summary-row {
  display:flex; justify-content:space-between;
  padding:0.25rem 0; color:var(--gray-600);
}
.order-summary-row.total {
  border-top:1px solid var(--green-300);
  margin-top:0.5rem; padding-top:0.5rem;
  font-weight:700; color:var(--green-700);
  font-size:1rem;
}
.order-field { margin-bottom:1rem; }
.order-field label {
  display:block; font-size:0.85rem; font-weight:600;
  color:var(--gray-700); margin-bottom:0.35rem;
}
.order-field label span {
  color:var(--gray-400); font-weight:400;
}
.order-field input {
  width:100%; padding:12px 16px;
  border:1px solid var(--gray-300);
  border-radius:var(--radius);
  font-family:var(--font-body);
  font-size:0.95rem; color:var(--gray-800);
  transition:border-color 0.2s;
  outline:none;
}
.order-field input:focus {
  border-color:var(--green-400);
  box-shadow:0 0 0 3px rgba(76,175,80,0.1);
}
.order-field input::placeholder { color:var(--gray-400); }
.order-submit {
  width:100%; padding:14px;
  background:linear-gradient(135deg, var(--green-600), var(--green-500));
  color:white; border:none; border-radius:var(--radius);
  font-family:var(--font-body);
  font-size:1rem; font-weight:700;
  cursor:pointer; transition:all 0.2s;
  box-shadow:0 4px 16px rgba(76,175,80,0.3);
}
.order-submit:hover {
  transform:translateY(-1px);
  box-shadow:0 6px 20px rgba(76,175,80,0.4);
}
.order-submit:disabled {
  opacity:0.6; cursor:not-allowed;
  transform:none; box-shadow:none;
}
.order-success {
  text-align:center; padding:2rem;
}
.order-success-icon {
  font-size:3.5rem; margin-bottom:1rem;
}
.order-success h3 {
  font-family:var(--font-display);
  font-size:1.3rem; font-weight:700;
  color:var(--green-700); margin-bottom:0.5rem;
}
.order-success p {
  color:var(--gray-600); font-size:0.95rem;
  line-height:1.6;
}
.order-error {
  text-align:center; padding:1rem;
  background:var(--yellow-100);
  border-radius:var(--radius);
  margin-top:1rem;
}
.order-error p {
  color:var(--gray-700); font-size:0.9rem;
}

/* CREDIT PAGE */
.credit-page { padding-top: 64px; }
.credit-hero-section {
  padding: 4rem 2rem;
  background: linear-gradient(135deg, var(--yellow-100), var(--green-50));
  text-align: center;
}
.credit-hero-section h1 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800; color: var(--gray-900);
  margin-bottom: 1rem;
}
.credit-hero-section h1 em {
  font-style: normal;
  background: linear-gradient(135deg, var(--green-600), var(--yellow-600));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.credit-hero-sub {
  font-size: 1.15rem; color: var(--gray-600);
  max-width: 700px; margin: 0 auto 2rem; line-height: 1.7;
}
.credit-hero-stats {
  display: flex; gap: 2rem; justify-content: center;
  flex-wrap: wrap; margin-top: 2rem;
}
.credit-hero-stat {
  text-align: center; padding: 1.5rem 2rem;
  background: var(--white); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md); min-width: 140px;
}
.credit-hero-stat-value {
  font-family: var(--font-display);
  font-size: 2.2rem; font-weight: 800;
  color: var(--green-700);
}
.credit-hero-stat-label {
  font-size: 0.82rem; color: var(--gray-500);
  margin-top: 0.25rem;
}
.credit-content { max-width: 900px; margin: 0 auto; padding: 3rem 2rem; }
.credit-block {
  margin-bottom: 3rem;
}
.credit-block h2 {
  font-family: var(--font-display);
  font-size: 1.5rem; font-weight: 700;
  color: var(--gray-900); margin-bottom: 1rem;
  padding-left: 1rem;
  border-left: 4px solid var(--green-500);
}
.credit-block h3 {
  font-family: var(--font-display);
  font-size: 1.15rem; font-weight: 700;
  color: var(--gray-800); margin: 1.5rem 0 0.75rem;
}
.credit-block p {
  font-size: 0.95rem; color: var(--gray-600);
  line-height: 1.7; margin-bottom: 0.75rem;
}
.credit-steps {
  display: grid; gap: 0;
}
.credit-step {
  display: grid; grid-template-columns: 56px 1fr;
  gap: 1rem; padding: 1.25rem 0;
  border-bottom: 1px solid var(--gray-100);
}
.credit-step:last-child { border-bottom: none; }
.credit-step-num {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, var(--green-500), var(--green-600));
  color: white; font-family: var(--font-display);
  font-size: 1.2rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.credit-step-title {
  font-weight: 700; color: var(--gray-900);
  font-size: 1rem; margin-bottom: 0.25rem;
}
.credit-step-desc {
  font-size: 0.9rem; color: var(--gray-600); line-height: 1.6;
}
.credit-docs-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 0.75rem; margin: 1rem 0;
}
.credit-doc-item {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 1rem; background: var(--gray-50);
  border-radius: var(--radius); border: 1px solid var(--gray-200);
}
.credit-doc-icon {
  font-size: 1.5rem; flex-shrink: 0; margin-top: 2px;
}
.credit-doc-name {
  font-size: 0.9rem; font-weight: 600; color: var(--gray-800);
}
.credit-doc-note {
  font-size: 0.8rem; color: var(--gray-500); margin-top: 2px;
}
.credit-banks-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem; margin: 1rem 0;
}
.credit-bank-card {
  padding: 1.25rem; background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius); text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.credit-bank-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.credit-bank-name {
  font-weight: 700; font-size: 0.95rem;
  color: var(--gray-800); margin-bottom: 0.25rem;
}
.credit-bank-note {
  font-size: 0.8rem; color: var(--gray-500);
}
.credit-warning {
  background: var(--yellow-100);
  border: 1px solid var(--yellow-400);
  border-radius: var(--radius);
  padding: 1.25rem; margin: 1.5rem 0;
}
.credit-warning-title {
  font-weight: 700; color: var(--gray-900);
  font-size: 0.95rem; margin-bottom: 0.5rem;
}
.credit-warning-text {
  font-size: 0.88rem; color: var(--gray-700);
  line-height: 1.6;
}
.credit-company-box {
  background: linear-gradient(135deg, var(--green-50), var(--yellow-100));
  border: 2px solid var(--green-300);
  border-radius: var(--radius-lg);
  padding: 2rem; text-align: center;
  margin: 2rem 0;
}
.credit-company-box h3 {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 800;
  color: var(--green-700); margin-bottom: 0.75rem;
}
.credit-company-box p {
  color: var(--gray-600); max-width: 600px;
  margin: 0 auto 0.5rem; line-height: 1.7;
}
.credit-company-list {
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: 0.5rem; margin-top: 1rem;
}
.credit-company-tag {
  background: var(--green-500); color: white;
  padding: 6px 16px; border-radius: 50px;
  font-size: 0.85rem; font-weight: 600;
}

@media (max-width:768px) {
  .credit-docs-grid { grid-template-columns: 1fr; }
  .credit-banks-grid { grid-template-columns: 1fr 1fr; }
  .credit-hero-stats { gap: 1rem; }
  .credit-hero-stat { min-width: 120px; padding: 1rem; }
  .credit-hero-stat-value { font-size: 1.6rem; }
}

.config-systems {
  display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));
  gap:1rem; max-width:1100px; margin:0 auto 2rem;
}
.config-sys-btn {
  padding:1.25rem; border-radius:var(--radius-lg);
  border:2px solid var(--gray-200); background:var(--white);
  cursor:pointer; text-align:center;
  transition: all 0.2s;
  font-family:var(--font-body);
}
.config-sys-btn:hover { border-color:var(--green-300); }
.config-sys-btn.active {
  border-color:var(--green-500);
  background:var(--green-50);
  box-shadow: 0 0 0 3px rgba(76,175,80,0.15);
}
.config-sys-name {
  font-family:var(--font-display);
  font-size:1.05rem; font-weight:700;
  color:var(--gray-900); margin-bottom:0.25rem;
}
.config-sys-price {
  font-size:0.9rem; font-weight:600; color:var(--green-700);
}
.config-panel-toggle {
  display:flex; gap:0; background:var(--gray-100);
  border-radius:50px; padding:4px; width:fit-content;
  margin:0 auto 2rem;
}
.config-panel-btn {
  padding:10px 28px; border-radius:50px;
  border:none; cursor:pointer;
  font-family:var(--font-body); font-weight:600;
  font-size:0.9rem; transition:all 0.3s;
  background:transparent; color:var(--gray-500);
}
.config-panel-btn.active {
  background:linear-gradient(135deg, var(--green-600), var(--green-500));
  color:white;
  box-shadow:0 2px 8px rgba(76,175,80,0.3);
}
.config-section-label {
  font-family:var(--font-display);
  font-size:1.1rem; font-weight:700;
  color:var(--gray-800); margin-bottom:0.75rem;
  padding-left:0.5rem;
  border-left:3px solid var(--green-500);
}
.config-items {
  max-width:900px; margin:0 auto 1.5rem;
}
.config-item {
  display:grid; grid-template-columns:1fr auto auto;
  align-items:center; gap:1rem;
  padding:0.85rem 1.25rem;
  border-bottom:1px solid var(--gray-100);
  background:var(--white);
}
.config-item:first-child { border-radius:var(--radius) var(--radius) 0 0; }
.config-item:last-child { border-radius:0 0 var(--radius) var(--radius); border-bottom:none; }
.config-item:only-child { border-radius:var(--radius); }
.config-item-name { font-size:0.9rem; color:var(--gray-700); }
.config-item-name small { display:block; font-size:0.78rem; color:var(--gray-400); }
.config-item-qty {
  font-size:0.82rem; color:var(--gray-400);
  white-space:nowrap;
}
.config-item-price {
  font-weight:600; font-size:0.9rem; color:var(--gray-800);
  text-align:right; white-space:nowrap;
}
.config-opt-item {
  display:grid; grid-template-columns:auto 1fr auto auto;
  align-items:center; gap:1rem;
  padding:0.85rem 1.25rem;
  border-bottom:1px solid var(--gray-100);
  background:var(--white);
  cursor:pointer; user-select:none;
  transition: background 0.15s;
}
.config-opt-item:hover { background:var(--gray-50); }
.config-opt-item:first-child { border-radius:var(--radius) var(--radius) 0 0; }
.config-opt-item:last-child { border-radius:0 0 var(--radius) var(--radius); border-bottom:none; }
.config-checkbox {
  width:22px; height:22px; border-radius:6px;
  border:2px solid var(--gray-300);
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0; transition:all 0.2s;
  font-size:0.75rem; color:white;
}
.config-checkbox.checked {
  background:var(--green-500); border-color:var(--green-500);
}
.config-total-bar {
  max-width:900px; margin:2rem auto;
  background:linear-gradient(135deg, var(--green-600), var(--green-700));
  border-radius:var(--radius-lg);
  padding:1.5rem 2rem;
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:1rem;
  color:white; box-shadow:var(--shadow-lg);
}
.config-total-label {
  font-size:1rem; font-weight:500; opacity:0.9;
}
.config-total-value {
  font-family:var(--font-display);
  font-size:2rem; font-weight:800;
}
.config-total-credit {
  font-size:0.85rem; opacity:0.75;
}

/* NAV SOCIAL */
.nav-social {
  display:flex; align-items:center; gap:12px;
  margin-left:1.5rem;
}
.nav-social a {
  width:38px; height:38px;
  display:flex; align-items:center; justify-content:center;
  border-radius:50%;
  background:var(--gray-100);
  color:var(--gray-600);
  transition: all 0.2s;
  text-decoration:none;
}
.nav-social a:hover {
  transform:translateY(-2px);
}
.nav-social a.ig:hover {
  background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af);
  color:white;
}
.nav-social a.tg:hover {
  background:#2AABEE;
  color:white;
}
.nav-social svg { width:18px; height:18px; fill:currentColor; }

/* FOOTER SOCIAL */
.footer-social {
  display:flex; justify-content:center; gap:16px;
  margin:1rem 0 0.5rem;
}
.footer-social a {
  width:44px; height:44px;
  display:flex; align-items:center; justify-content:center;
  border-radius:50%;
  background:rgba(255,255,255,0.1);
  color:var(--gray-400);
  transition: all 0.2s;
  text-decoration:none;
}
.footer-social a:hover { transform:translateY(-2px); }
.footer-social a.ig:hover {
  background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af);
  color:white;
}
.footer-social a.tg:hover {
  background:#2AABEE;
  color:white;
}
.footer-social svg { width:20px; height:20px; fill:currentColor; }
.footer-contacts {
  display:flex; justify-content:center; gap:2rem;
  flex-wrap:wrap; margin-top:0.5rem;
}
.footer-contacts a {
  color:var(--gray-400); text-decoration:none;
  font-size:0.85rem; transition: color 0.2s;
}
.footer-contacts a:hover { color:var(--yellow-500); }

/* SHARE BAR */
.share-bar {
  display:flex; align-items:center; justify-content:center;
  gap:12px; padding:2rem;
  border-top:1px solid var(--gray-200);
  max-width:600px; margin:0 auto;
}
.share-bar-label {
  font-size:0.9rem; color:var(--gray-500);
  font-weight:500;
}
.share-btn {
  display:inline-flex; align-items:center; gap:8px;
  padding:10px 22px; border-radius:50px;
  font-family:var(--font-body); font-size:0.88rem;
  font-weight:600; text-decoration:none;
  border:none; cursor:pointer;
  transition: all 0.2s;
  color:white;
}
.share-btn:hover { transform:translateY(-2px); box-shadow: var(--shadow-md); }
.share-btn.tg { background:#2AABEE; }
.share-btn.tg:hover { background:#1a9ad9; }
.share-btn.copy-link {
  background:var(--green-600); color:white;
}
.share-btn.copy-link:hover { background:var(--green-700); }
.share-btn svg { width:18px; height:18px; fill:currentColor; }

/* MOBILE */
@media (max-width:768px) {
  .nav-links { display:none; }
  .nav-social { gap:10px; }
  .nav-social a { width:34px; height:34px; }
  .nav-social svg { width:16px; height:16px; }
  .hero { padding:100px 1.5rem 40px; }
  .hero::after { display: none; }
  .hero-inner { text-align: center; }
  .hero-sub { margin-left: auto; margin-right: auto; }
  .hero h1 { font-size:2rem; max-width: none; }
  .section { padding:50px 1.5rem; }
  .tariff-cards { grid-template-columns:1fr 1fr; }
  .calc-grid { grid-template-columns:1fr 1fr; }
  .savings-cards { grid-template-columns:1fr; }
  .savings-stats { grid-template-columns:1fr; }
  .products-grid { grid-template-columns:1fr; }
  .equip-grid { grid-template-columns:1fr; }
  .config-systems { grid-template-columns:1fr; }
  .config-item { grid-template-columns:1fr auto; gap:0.5rem; }
  .config-item-qty { display:none; }
  .config-opt-item { grid-template-columns:auto 1fr auto; gap:0.5rem; }
  .config-total-bar { flex-direction:column; text-align:center; }
  .pricing-row { grid-template-columns:1.5fr 1fr 1fr; padding:0.75rem 1rem; }
  .credit-details { gap:1rem; }
  .detail-hero-section { grid-template-columns:1fr; gap:1.5rem; }
  .detail-feature { grid-template-columns:1fr; gap:1.5rem; }
  .detail-feature.reverse { direction:ltr; }
  .detail-specs-grid { grid-template-columns:1fr; }
  .chat-window { width:calc(100vw - 2rem) !important; right:1rem !important; bottom:80px !important; max-height:70vh !important; }
  .inv-card { grid-template-columns: 1fr; }
  .inv-card-left { min-height: 200px; }
  .inv-card-actions { flex-direction: column; }
}

/* CHAT WIDGET */
.chat-toggle {
  position:fixed; bottom:24px; right:24px; z-index:9999;
  width:60px; height:60px; border-radius:50%;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color:white; border:none; cursor:pointer;
  box-shadow: 0 4px 20px rgba(76,175,80,0.4);
  display:flex; align-items:center; justify-content:center;
  font-size:1.6rem; transition: transform 0.3s, box-shadow 0.3s;
}
.chat-toggle:hover {
  transform:scale(1.08);
  box-shadow: 0 6px 28px rgba(76,175,80,0.5);
}
.chat-toggle.has-dot::after {
  content:''; position:absolute; top:4px; right:4px;
  width:14px; height:14px; border-radius:50%;
  background:var(--yellow-500); border:2px solid white;
}
.chat-window {
  position:fixed; bottom:96px; right:24px; z-index:9998;
  width:380px; max-height:520px;
  background:var(--white);
  border-radius:var(--radius-lg);
  box-shadow: 0 12px 48px rgba(0,0,0,0.18);
  display:flex; flex-direction:column;
  overflow:hidden;
  animation: chatOpen 0.3s ease-out;
  border:1px solid var(--gray-200);
}
@keyframes chatOpen {
  from { opacity:0; transform:translateY(16px) scale(0.95); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.chat-header {
  background: linear-gradient(135deg, var(--green-600), var(--green-700));
  color:white; padding:1rem 1.25rem;
  display:flex; align-items:center; gap:10px;
}
.chat-header-avatar {
  width:36px; height:36px; border-radius:50%;
  background:rgba(255,255,255,0.2);
  display:flex; align-items:center; justify-content:center;
  font-size:1.1rem;
}
.chat-header-info h4 {
  font-family:var(--font-display); font-size:0.95rem;
  font-weight:700; margin:0;
}
.chat-header-info span {
  font-size:0.75rem; opacity:0.8;
}
.chat-close {
  margin-left:auto; background:none; border:none;
  color:white; font-size:1.3rem; cursor:pointer;
  opacity:0.7; transition:opacity 0.2s;
}
.chat-close:hover { opacity:1; }
.chat-messages {
  flex:1; overflow-y:auto; padding:1rem;
  display:flex; flex-direction:column; gap:0.75rem;
  min-height:280px; max-height:340px;
  background:var(--gray-50);
}
.chat-msg {
  max-width:85%; padding:10px 14px;
  border-radius:16px; font-size:0.88rem;
  line-height:1.5; word-wrap:break-word;
  animation: fadeUp 0.3s ease-out;
}
.chat-msg.bot {
  align-self:flex-start;
  background:var(--white);
  color:var(--gray-800);
  border:1px solid var(--gray-200);
  border-bottom-left-radius:4px;
}
.chat-msg.user {
  align-self:flex-end;
  background: linear-gradient(135deg, var(--green-600), var(--green-500));
  color:white;
  border-bottom-right-radius:4px;
}
.chat-msg.typing {
  align-self:flex-start;
  background:var(--white);
  border:1px solid var(--gray-200);
  border-bottom-left-radius:4px;
  color:var(--gray-400);
  font-style:italic;
}
.chat-input-wrap {
  display:flex; gap:0; padding:0.75rem;
  border-top:1px solid var(--gray-200);
  background:var(--white);
}
.chat-input {
  flex:1; border:1px solid var(--gray-300);
  border-radius:50px 0 0 50px;
  padding:10px 16px; font-size:0.88rem;
  font-family:var(--font-body);
  outline:none; transition:border-color 0.2s;
}
.chat-input:focus { border-color:var(--green-400); }
.chat-input::placeholder { color:var(--gray-400); }
.chat-send {
  border:none; background:linear-gradient(135deg, var(--green-600), var(--green-500));
  color:white; padding:0 18px;
  border-radius:0 50px 50px 0;
  cursor:pointer; font-size:1.1rem;
  transition:opacity 0.2s;
}
.chat-send:hover { opacity:0.9; }
.chat-send:disabled { opacity:0.5; cursor:not-allowed; }
`;

const VIDEOS = [
  { id: 'MiwgNXLpEMU', label: 'EcoFlow STREAM — огляд системи' },
  { id: '7qATOYRR6Bc', label: 'Zendure SolarFlow — установка та робота' },
  { id: 'PKNENRY26Og', label: 'Anker SOLIX F3800 — огляд та можливості' },
];

const SOCIAL_ICONS = {
  ig: <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  tg: <svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
  link: <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>,
};

function ShareBar({ productName, url }) {
  const fullUrl = `https://solarbalkon.shop${url}`;
  const text = `${productName} — балконна сонячна електростанція ⚡ Дізнайся більше:`;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(text)}`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="share-bar">
      <span className="share-bar-label">Поділитися:</span>
      <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="share-btn tg">
        {SOCIAL_ICONS.tg} Telegram
      </a>
      <button className="share-btn copy-link" onClick={copyLink}>
        {SOCIAL_ICONS.link} {copied ? 'Скопійовано!' : 'Копіювати'}
      </button>
    </div>
  );
}

function SocialFooter() {
  return (
    <footer className="footer">
      <div className="footer-logo"><img src="/logo-bolt.png" alt="SolarBalkon" /> Solar<span>Balkon</span></div>
      <div className="footer-social">
        <a href="https://instagram.com/solarbalkon.shop" target="_blank" rel="noopener noreferrer" className="ig" title="Instagram">{SOCIAL_ICONS.ig}</a>
        <a href="https://t.me/solarbalkonshop" target="_blank" rel="noopener noreferrer" className="tg" title="Telegram">{SOCIAL_ICONS.tg}</a>
      </div>
      <div className="footer-contacts">
        <a href="mailto:manager@solarbalkon.shop">📧 manager@solarbalkon.shop</a>
        <a href="tel:+380674455669">📞 +380 67 445 5669</a>
        <a href="https://t.me/solarbalkon_bot" target="_blank" rel="noopener noreferrer">🤖 @solarbalkon_bot</a>
      </div>
      <p style={{ marginTop: '0.75rem' }}>© 2025 SolarBalkon.shop — Сонячна енергія для кожного балкону</p>
      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>📍 Київ, вул. Вікентія Хвойки, 15/15</p>
    </footer>
  );
}

function VideoCarousel() {
  const [idx, setIdx] = useState(0);
  return (
    <div className="video-carousel fade-up-d2">
      <div className="video-carousel-inner">
        <iframe
          key={idx}
          src={`https://www.youtube.com/embed/${VIDEOS[idx].id}`}
          title={VIDEOS[idx].label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="video-carousel-dots">
        {VIDEOS.map((_, i) => (
          <button key={i} className={`video-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />
        ))}
      </div>
      <div className="video-carousel-label">{VIDEOS[idx].label}</div>
    </div>
  );
}

/* ───────────────────────── COMPONENT ───────────────────────── */
export default function SolarBalkon() {
  const [tariffType, setTariffType] = useState('residential');
  const [selectedAppliances, setSelectedAppliances] = useState([0]);
  const [consumption, setConsumption] = useState(250);
  const [scrolled, setScrolled] = useState(false);
  const [showMoreAppliances, setShowMoreAppliances] = useState(false);
  const [sheetPrices, setSheetPrices] = useState(null);
  const [sheetComponents, setSheetComponents] = useState([]);
  const [configSystem, setConfigSystem] = useState('zendure');
  const [configPanels, setConfigPanels] = useState(2);
  const [configExtras, setConfigExtras] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '' });
  const [orderStatus, setOrderStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [directOrder, setDirectOrder] = useState(null); // { name, price } for buying system only from detail page
  const [commercialInverters, setCommercialInverters] = useState([]);
  const [invPhaseFilter, setInvPhaseFilter] = useState(1);
  const [invSelectedKw, setInvSelectedKw] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    if (path === '/ecoflow') return 'ecoflow';
    if (path === '/zendure') return 'zendure';
    if (path === '/deye') return 'deye';
    if (path === '/anker') return 'anker';
    if (path === '/credit') return 'credit';
    return 'home';
  });

  const goToPage = (page) => {
    const url = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({page}, '', url);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onPopState = (e) => {
      const page = e.state?.page || 'home';
      setCurrentPage(page);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Fetch prices + components from API
  useEffect(() => {
    fetch('/api/prices')
      .then(r => r.ok ? r.json() : Promise.reject('API unavailable'))
      .then(data => {
        if (data.prices && Object.keys(data.prices).length > 0) {
          setSheetPrices(data.prices);
        }
        if (data.components && data.components.length > 0) {
          setSheetComponents(data.components);
        }
        console.log(`✅ Ціни оновлено | EUR/UAH: ${data.eurRate} (ПриватБанк)`, data.prices);
      })
      .catch(err => console.log('⚠️ Ціни недоступні, базові ціни:', err));
  }, []);

  // Fetch commercial inverters from API
  useEffect(() => {
    fetch('/api/inverters')
      .then(r => r.ok ? r.json() : Promise.reject('API unavailable'))
      .then(data => {
        if (data.inverters && data.inverters.length > 0) {
          setCommercialInverters(data.inverters);
          // Set default selection to first matching inverter
          const first1ph = data.inverters.find(inv => inv.phases === 1);
          if (first1ph) setInvSelectedKw(first1ph.kw);
        }
        console.log(`✅ Інвертори завантажено: ${data.inverters?.length || 0} шт`);
      })
      .catch(err => console.log('⚠️ Інвертори недоступні:', err));
  }, []);

  // Merge sheet prices into products
  const PRODUCTS = PRODUCTS_BASE.map(p => ({
    ...p,
    price: (sheetPrices && sheetPrices[p.name]) || p.price,
  }));

  // Helper: get formatted price for detail pages
  const getPrice = (name) => {
    const num = (sheetPrices && sheetPrices[name]) || DEFAULT_PRICES[name];
    return num ? formatPrice(num) : '—';
  };

  // Reset extras when system changes
  useEffect(() => { setConfigExtras([]); }, [configSystem]);

  // Configurator: filter components for selected system
  const sysComponents = sheetComponents.filter(c => c.systems.includes(configSystem));

  // Smart plugs are always optional
  const isSmartPlug = (c) => c.name.toLowerCase().includes('розетка') || c.name.toLowerCase().includes('smart plug');
  const isPanel = (c) => c.name.toLowerCase().includes('панель');
  const isInverter = (c) => c.name.toLowerCase().includes('інвертор') || c.name.toLowerCase().includes('інвертер');
  const isMounting = (c) => c.name.toLowerCase().includes('кріплення') || c.name.toLowerCase().includes('кронштейн') || c.name.toLowerCase().includes('mount');

  const requiredComponents = sysComponents.filter(c => !c.optional && !isSmartPlug(c));
  const optionalComponents = [
    ...sysComponents.filter(c => c.optional && !isPanel(c)),
    ...sysComponents.filter(c => !c.optional && isSmartPlug(c)),
  ].map(c => {
    // Scale mounts by panel count
    if (isMounting(c)) {
      return { ...c, qty: configPanels };
    }
    return c;
  });

  // Separate panels (qty matches selected panel count)
  const panelItems = sysComponents.filter(c => c.qty === configPanels && isPanel(c));
  // Required non-panel components, adjust inverter & mounting qty for panel count
  const nonPanelRequired = requiredComponents.filter(c => !isPanel(c)).map(c => {
    if (isInverter(c) && configPanels === 4) {
      return { ...c, qty: 2 };
    }
    if (isMounting(c)) {
      return { ...c, qty: configPanels };
    }
    return c;
  });

  // Calculate config total
  const configSystemPrice = PRODUCTS.find(p => p.key === configSystem)?.price || 0;

  const configComponentsTotal = [...nonPanelRequired, ...panelItems].reduce((s, c) => s + (c.priceUah * c.qty), 0);
  const configExtrasTotal = configExtras.reduce((s, sku) => {
    const item = optionalComponents.find(c => c.sku === sku);
    return s + (item ? item.priceUah * item.qty : 0);
  }, 0);
  const configTotal = configSystemPrice + configComponentsTotal + configExtrasTotal;

  const toggleExtra = (sku) => {
    setConfigExtras(prev => prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]);
  };

  const openDirectOrder = (systemName) => {
    const product = PRODUCTS.find(p => p.name === systemName);
    if (!product) return;
    setDirectOrder({ name: product.name, price: product.price });
    setShowOrderForm(true);
    setOrderStatus(null);
    setOrderForm({ name: '', phone: '', address: '' });
  };

  const submitOrder = async () => {
    if (!orderForm.name.trim() || !orderForm.phone.trim()) return;
    setOrderStatus('sending');

    let orderData;

    if (directOrder) {
      orderData = {
        name: orderForm.name.trim(),
        phone: orderForm.phone.trim(),
        address: orderForm.address.trim() || null,
        system: directOrder.name,
        panels: 'Тільки система (без аксесуарів)',
        components: [],
        extras: [],
        total: formatPrice(directOrder.price),
      };
    } else {
      const systemProduct = PRODUCTS.find(p => p.key === configSystem);
      const allComponents = [...panelItems, ...nonPanelRequired].map(c => ({
        name: c.name, qty: c.qty, price: formatPrice(c.priceUah * c.qty),
      }));
      const allExtras = configExtras.map(sku => {
        const item = optionalComponents.find(c => c.sku === sku);
        return item ? { name: item.name, qty: item.qty, price: formatPrice(item.priceUah * item.qty) } : null;
      }).filter(Boolean);

      orderData = {
        name: orderForm.name.trim(),
        phone: orderForm.phone.trim(),
        address: orderForm.address.trim() || null,
        system: systemProduct?.name || configSystem,
        panels: `${configPanels} панелі`,
        components: allComponents,
        extras: allExtras,
        total: formatPrice(configTotal),
      };
    }

    try {
      const resp = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (resp.ok) {
        setOrderStatus('sent');
      } else {
        setOrderStatus('error');
      }
    } catch {
      setOrderStatus('error');
    }
  };

  // SEO: dynamic title & meta description per page
  useEffect(() => {
    const seo = {
      home: {
        title: 'SolarBalkon — Балконні сонячні електростанції в Україні',
        desc: 'Сонячна станція на вашому балконі. Енергонезалежність, економія до 80%, кредит 0% від держави. EcoFlow, Zendure, Deye.',
      },
      ecoflow: {
        title: 'EcoFlow STREAM AC Pro — Балконна сонячна станція | SolarBalkon',
        desc: 'EcoFlow STREAM AC Pro: 1.92 кВт·год, 1200 Вт вихід, 6000 циклів. Гібридна система все-в-одному. Ціна 40,000 грн. Кредит 0%.',
      },
      zendure: {
        title: 'Zendure SolarFlow 2400 AC+ — Балконна сонячна станція | SolarBalkon',
        desc: 'Zendure SolarFlow 2400 AC+: 2.4 кВт·год, 2400 Вт вихід, розширення до 16.8 кВт·год. 10 років гарантії. Ціна 50,000 грн.',
      },
      deye: {
        title: 'Deye AE-FS2.0-2H2 — Балконна сонячна станція | SolarBalkon',
        desc: 'Deye AE-FS2.0-2H2: 2.0 кВт·год, UPS за 4 мс, USB зарядка, розширення до 10 кВт·год. 10 років гарантії. Ціна 40,000 грн.',
      },
      anker: {
        title: 'Anker SOLIX F3800 — Потужна сонячна станція 6000 Вт | SolarBalkon',
        desc: 'Anker SOLIX F3800: 3,840 Вт·год, 6,000 Вт вихід, UPS, розширення до 53.8 кВт·год. 5 років гарантії. Ціна 151,700 грн.',
      },
      credit: {
        title: 'Кредит 0% на сонячну станцію — Програма «Джерела енергії» | SolarBalkon',
        desc: 'Державний кредит 0% на сонячні панелі до 480,000 грн на 10 років. Повний пакет документів від SolarBalkon. ПриватБанк, Ощадбанк, Укргазбанк.',
      },
    };
    const page = seo[currentPage] || seo.home;
    document.title = page.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = page.desc;
  }, [currentPage]);

  const tariff = TARIFFS[tariffType];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleAppliance = (idx) => {
    setSelectedAppliances(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Calculator
  const totalWatts = selectedAppliances.reduce((s, i) => s + APPLIANCES[i].watts, 0);
  const totalDailyKwh = selectedAppliances.reduce((s, i) => s + (APPLIANCES[i].watts * APPLIANCES[i].hours) / 1000, 0);
  const monthlyKwh = totalDailyKwh * 30;
  const panels2 = 2, panels4 = 4;
  const solarHours = 3.5;
  const gen2daily = panels2 * 455 * solarHours / 1000;
  const gen4daily = panels4 * 455 * solarHours / 1000;
  const coverage2 = totalDailyKwh > 0 ? Math.min(100, (gen2daily / totalDailyKwh) * 100) : 0;
  const coverage4 = totalDailyKwh > 0 ? Math.min(100, (gen4daily / totalDailyKwh) * 100) : 0;

  // Savings
  const billBefore = consumption * tariff.now;
  const solarGen = gen4daily * 30;
  const covered = Math.min(consumption, solarGen);
  const billAfter = (consumption - covered) * tariff.now;
  const monthlySaving = billBefore - billAfter;
  const yearlySaving = monthlySaving * 12;
  const systemCost = 70200;
  const paybackMonths = monthlySaving > 0 ? Math.ceil(systemCost / monthlySaving) : 0;
  const saving10y = yearlySaving * 10 - systemCost;

  return (
    <>
      <style>{css}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="/" className="nav-logo" onClick={(e) => { e.preventDefault(); goToPage('home'); }}><img src="/logo-bolt.png" alt="SolarBalkon" /> Solar<span>Balkon</span></a>
          <ul className="nav-links">
            <li><a href="/" onClick={(e) => { e.preventDefault(); goToPage('home'); }}>Головна</a></li>
            <li><a href="/#calc" onClick={(e) => { e.preventDefault(); goToPage('home'); setTimeout(() => document.getElementById('calc')?.scrollIntoView({behavior:'smooth'}), 100); }}>Калькулятор</a></li>
            <li><a href="/#systems" onClick={(e) => { e.preventDefault(); goToPage('home'); setTimeout(() => document.getElementById('systems')?.scrollIntoView({behavior:'smooth'}), 100); }}>Системи</a></li>
            <li><a href="/#equip" onClick={(e) => { e.preventDefault(); goToPage('home'); setTimeout(() => document.getElementById('equip')?.scrollIntoView({behavior:'smooth'}), 100); }}>Конфігуратор</a></li>
            <li><a href="/#savings" onClick={(e) => { e.preventDefault(); goToPage('home'); setTimeout(() => document.getElementById('savings')?.scrollIntoView({behavior:'smooth'}), 100); }}>Економія</a></li>
          </ul>
          <div className="nav-social">
            <a href="https://instagram.com/solarbalkon.shop" target="_blank" rel="noopener noreferrer" className="ig" title="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://t.me/solarbalkonshop" target="_blank" rel="noopener noreferrer" className="tg" title="Telegram">
              <svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      {currentPage === 'home' && (<>
      <section className="hero" id="home">
        <div className="hero-inner">
          <div className="hero-badge fade-up">🌿 Відновлювальна енергія для кожного</div>
          <h1 className="fade-up-d1">
            Сонячна електростанція<br />на <em>вашому балконі</em>
          </h1>
          <p className="hero-sub fade-up-d2">
            Перетворіть балкон на джерело чистої енергії. Зменште рахунки за світло
            до 80% з балконними сонячними панелями та державним кредитом 0%.
          </p>
          <a href="#calc" className="hero-cta fade-up-d3">
            Розрахувати економію →
          </a>

          {/* TARIFF CARDS */}
          <div style={{ marginTop: '4rem' }}>
            <div className="tariff-toggle">
              <button
                className={`tariff-btn ${tariffType === 'residential' ? 'active' : ''}`}
                onClick={() => setTariffType('residential')}
              >Побутовий</button>
              <button
                className={`tariff-btn ${tariffType === 'commercial' ? 'active' : ''}`}
                onClick={() => { setTariffType('commercial'); setConfigSystem('deye'); }}
              >Комерційний</button>
            </div>
            <div className="tariff-cards">
              <div className="tariff-card fade-up-d1">
                <div className="tariff-card-label">Поточний тариф</div>
                <div className="tariff-card-value">{tariff.now}</div>
                <div className="tariff-card-unit">{tariff.unit}</div>
              </div>
              <div className="tariff-card fade-up-d2">
                <div className="tariff-card-label">Прогноз</div>
                <div className="tariff-card-value" style={{ color: 'var(--yellow-600)' }}>{tariff.forecast}</div>
                <div className="tariff-card-unit">{tariff.unit}</div>
              </div>
              <div className="tariff-card fade-up-d3">
                <div className="tariff-card-label">Нічний тариф</div>
                <div className="tariff-card-value" style={{ color: 'var(--gray-500)' }}>{tariff.night}</div>
                <div className="tariff-card-unit">{tariff.unit}</div>
              </div>
            </div>
          </div>

          {/* ADVANTAGES */}
          <div className="advantages" style={{ marginTop: '2rem' }}>
            {ADVANTAGES.map((a, i) => (
              <div className={`adv-card fade-up-d${Math.min(i + 1, 4)}`} key={i}>
                <div className="adv-icon">{a.icon}</div>
                <div>
                  <div className="adv-title">{a.title}</div>
                  <div className="adv-desc">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO CAROUSEL */}
      <section className="video-section">
        <div className="section-title fade-up">Як це працює?</div>
        <div className="section-sub fade-up-d1">Подивіться відео про балконні сонячні електростанції</div>
        <VideoCarousel />
      </section>

      {/* CALCULATOR */}
      <section className="section section-alt" id="calc">
        <div className="section-title fade-up">Калькулятор споживання</div>
        <div className="section-sub fade-up-d1">Оберіть прилади, які ви використовуєте щодня</div>

        <div className="tariff-toggle" style={{ marginBottom: '2rem' }}>
          <button
            className={`tariff-btn ${tariffType === 'residential' ? 'active' : ''}`}
            onClick={() => setTariffType('residential')}
          >Побутовий</button>
          <button
            className={`tariff-btn ${tariffType === 'commercial' ? 'active' : ''}`}
            onClick={() => { setTariffType('commercial'); setConfigSystem('deye'); }}
          >Комерційний</button>
        </div>

        <div className="calc-grid">
          {APPLIANCES.slice(0, PRIMARY_COUNT).map((a, i) => (
            <div
              key={i}
              className={`calc-item ${selectedAppliances.includes(i) ? 'active' : ''}`}
              onClick={() => toggleAppliance(i)}
            >
              <span className="calc-item-name">{a.name}</span>
              <span className="calc-item-watts">{a.watts} Вт</span>
            </div>
          ))}
        </div>

        {showMoreAppliances && (
          <div className="calc-grid" style={{ marginTop: '0.75rem' }}>
            {APPLIANCES.slice(PRIMARY_COUNT).map((a, i) => {
              const idx = i + PRIMARY_COUNT;
              return (
                <div
                  key={idx}
                  className={`calc-item ${selectedAppliances.includes(idx) ? 'active' : ''}`}
                  onClick={() => toggleAppliance(idx)}
                >
                  <span className="calc-item-name">{a.name}</span>
                  <span className="calc-item-watts">{a.watts} Вт</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setShowMoreAppliances(p => !p)}
            style={{
              background: 'none', border: '1px solid var(--gray-300)',
              borderRadius: '50px', padding: '10px 24px',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontSize: '0.9rem', fontWeight: 600,
              color: 'var(--green-700)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = 'var(--green-50)'; e.target.style.borderColor = 'var(--green-400)'; }}
            onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.borderColor = 'var(--gray-300)'; }}
          >
            {showMoreAppliances ? 'Сховати ▲' : `Інші прилади (${APPLIANCES.length - PRIMARY_COUNT}) ▼`}
          </button>
        </div>

        {selectedAppliances.length > 0 && (
          <div className="calc-result fade-up">
            <div className="calc-result-grid">
              <div className="calc-result-item">
                <div className="calc-result-label">Потужність</div>
                <div className="calc-result-value">{totalWatts.toLocaleString()} Вт</div>
              </div>
              <div className="calc-result-item">
                <div className="calc-result-label">Щоденне споживання</div>
                <div className="calc-result-value">{totalDailyKwh.toFixed(1)} кВт·год</div>
              </div>
              <div className="calc-result-item">
                <div className="calc-result-label">Щомісячне</div>
                <div className="calc-result-value">{monthlyKwh.toFixed(0)} кВт·год</div>
              </div>
              <div className="calc-result-item">
                <div className="calc-result-label">Покриття (2 панелі)</div>
                <div className="calc-result-value">{coverage2.toFixed(0)}%</div>
              </div>
              <div className="calc-result-item">
                <div className="calc-result-label">Покриття (4 панелі)</div>
                <div className="calc-result-value">{coverage4.toFixed(0)}%</div>
              </div>
            </div>
            <div className="calc-result-note">
              * Розрахунок базується на середніх 3.5 сонячних годинах / день та панелях Trina 455 Вт
            </div>
          </div>
        )}
      </section>

      {/* PRODUCTS / SYSTEMS */}
      {tariffType !== 'commercial' && (
      <section className="section" id="systems">
        <div className="section-title fade-up">Системи накопичення</div>
        <div className="section-sub fade-up-d1">Порівняйте рішення для зберігання енергії</div>

        <div className="products-grid">
          {PRODUCTS.map((p, i) => (
            <div className={`product-card fade-up-d${Math.min(i + 1, 4)}`} key={i} style={{ borderTop: `4px solid ${p.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <div className="product-name" style={{ marginBottom: 0 }}>{p.name}</div>
                {p.ups && (
                  <span style={{ background: '#fbc02d', color: '#333', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '50px', whiteSpace: 'nowrap' }}>⚡ UPS</span>
                )}
              </div>

              <div className="product-img-wrap">
                <img src={p.image} alt={p.name} onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="color:var(--gray-400);font-size:0.85rem">Фото: ${p.name}</span>`; }} />
              </div>

              <div className="product-spec">
                <span className="product-spec-label">Ємність</span>
                <span className="product-spec-value">{p.capacity.toLocaleString()} Вт·год</span>
              </div>
              <div className="product-bar-bg">
                <div className="product-bar-fill" style={{ width: `${(p.capacity / 3840) * 100}%`, background: p.color }} />
              </div>

              <div className="product-spec" style={{ marginTop: '1rem' }}>
                <span className="product-spec-label">Вихідна потужність</span>
                <span className="product-spec-value">{p.output.toLocaleString()} Вт</span>
              </div>
              <div className="product-bar-bg">
                <div className="product-bar-fill" style={{ width: `${(p.output / 6000) * 100}%`, background: p.color }} />
              </div>

              <div className="product-spec" style={{ marginTop: '1rem' }}>
                <span className="product-spec-label">Цикли</span>
                <span className="product-spec-value">{p.cycles.toLocaleString()}</span>
              </div>
              <div className="product-bar-bg">
                <div className="product-bar-fill" style={{ width: `${(p.cycles / 6000) * 100}%`, background: p.color }} />
              </div>

              <div className="product-spec" style={{ marginTop: '1rem' }}>
                <span className="product-spec-label">Гарантія</span>
                <span className="product-spec-value">{p.warranty} років</span>
              </div>

              <div className="product-spec">
                <span className="product-spec-label">Батарея</span>
                <span className="product-spec-value">{p.battery}</span>
              </div>

              <div className="product-spec">
                <span className="product-spec-label">Захист</span>
                <span className="product-spec-value">{p.ip}</span>
              </div>

              <div className="product-price" style={{ color: p.color }}>{formatPrice(p.price)}</div>
              <button
                className="product-btn"
                style={{ color: p.color, borderColor: p.color }}
                onMouseEnter={e => { e.target.style.background = p.color; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = p.color; }}
                onClick={() => goToPage(p.key)}
              >
                Детальніше →
              </button>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* COMMERCIAL INVERTERS */}
      {tariffType === 'commercial' && commercialInverters.length > 0 && (
        <section className="section section-green" id="commercial">
          <div className="section-title fade-up">Комерційні інвертори Deye</div>
          <div className="section-sub fade-up-d1">Гібридні інвертори для дому та бізнесу — оберіть потужність та кількість фаз</div>

          <div className="inv-filters fade-up-d2">
            {/* Phase toggle */}
            <div className="inv-phase-toggle">
              <button
                className={`inv-phase-btn ${invPhaseFilter === 1 ? 'active' : ''}`}
                onClick={() => {
                  setInvPhaseFilter(1);
                  const first = commercialInverters.find(inv => inv.phases === 1);
                  if (first) setInvSelectedKw(first.kw);
                }}
              >1-фаза</button>
              <button
                className={`inv-phase-btn ${invPhaseFilter === 3 ? 'active' : ''}`}
                onClick={() => {
                  setInvPhaseFilter(3);
                  const first = commercialInverters.find(inv => inv.phases === 3);
                  if (first) setInvSelectedKw(first.kw);
                }}
              >3-фази</button>
            </div>

            {/* kW buttons */}
            <div className="inv-kw-buttons">
              {commercialInverters
                .filter(inv => inv.phases === invPhaseFilter)
                .map(inv => (
                  <button
                    key={inv.model}
                    className={`inv-kw-btn ${invSelectedKw === inv.kw ? 'active' : ''}`}
                    onClick={() => setInvSelectedKw(inv.kw)}
                  >
                    {inv.kw} кВт
                  </button>
                ))}
            </div>
          </div>

          {/* Selected inverter card */}
          {(() => {
            const inv = commercialInverters.find(i => i.phases === invPhaseFilter && i.kw === invSelectedKw);
            if (!inv) return null;

            // Parse specs string into key-value pairs
            const specPairs = inv.specs ? inv.specs.split(';').map(s => {
              const [k, ...v] = s.split(':');
              return k && v.length ? [k.trim(), v.join(':').trim()] : null;
            }).filter(Boolean) : [];

            return (
              <div className="inv-card fade-up" key={inv.model}>
                <div className="inv-card-left">
                  {(() => {
                    const imgFile = inv.model.replace(/^Deye\s+/i, '');
                    const imgUrl = `/inverters/${imgFile}.png`;
                    return (
                      <>
                        <img
                          key={imgUrl}
                          src={imgUrl}
                          alt={inv.name}
                          style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                        />
                        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-700)' }}>Deye {inv.kw} кВт</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{inv.phases === 1 ? '1-фаза' : '3-фази'}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="inv-card-right">
                  <div className="inv-card-name">{inv.name}</div>
                  <div className="inv-card-model">{inv.model}</div>

                  <div className="inv-card-badges">
                    <span className="inv-badge inv-badge-phase">{inv.phases === 1 ? '1-фаза' : '3-фази'}</span>
                    <span className="inv-badge inv-badge-kw">{inv.kw} кВт</span>
                    {inv.availability && <span className="inv-badge inv-badge-avail">{inv.availability}</span>}
                  </div>

                  {specPairs.length > 0 && (
                    <div className="inv-card-specs">
                      {specPairs.map(([k, v], j) => (
                        <div className="inv-card-spec" key={j}>
                          <span className="inv-card-spec-label">{k}</span>
                          <span className="inv-card-spec-value">{v}</span>
                        </div>
                      ))}
                      {inv.weight > 0 && (
                        <div className="inv-card-spec">
                          <span className="inv-card-spec-label">Вага</span>
                          <span className="inv-card-spec-value">{inv.weight} кг</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!specPairs.length && inv.weight > 0 && (
                    <div className="inv-card-specs">
                      <div className="inv-card-spec">
                        <span className="inv-card-spec-label">Потужність</span>
                        <span className="inv-card-spec-value">{inv.kw} кВт</span>
                      </div>
                      <div className="inv-card-spec">
                        <span className="inv-card-spec-label">Фази</span>
                        <span className="inv-card-spec-value">{inv.phases === 1 ? 'Однофазний' : 'Трифазний'}</span>
                      </div>
                      <div className="inv-card-spec">
                        <span className="inv-card-spec-label">Вага</span>
                        <span className="inv-card-spec-value">{inv.weight} кг</span>
                      </div>
                    </div>
                  )}

                  {inv.usp && <div className="inv-card-usp">💡 {inv.usp}</div>}

                  <div className="inv-card-price">{formatPrice(inv.priceUah)}</div>
                  <div className="inv-card-price-eur">{inv.clientEur.toFixed(2)} € · курс ПриватБанку</div>

                  <div className="inv-card-actions">
                    <button
                      className="inv-card-buy"
                      onClick={() => {
                        setDirectOrder({ name: inv.name + ' (' + inv.model + ')', price: inv.priceUah });
                        setShowOrderForm(true);
                        setOrderStatus(null);
                        setOrderForm({ name: '', phone: '', address: '' });
                      }}
                    >
                      🛒 Замовити
                    </button>
                    {inv.productUrl && (
                      <a className="inv-card-link" href={inv.productUrl} target="_blank" rel="noopener noreferrer">
                        🔗 Магазин
                      </a>
                    )}
                    {inv.sourceUrl && (
                      <a className="inv-card-link" href={inv.sourceUrl} target="_blank" rel="noopener noreferrer">
                        📋 Виробник
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* EQUIPMENT / CONFIGURATOR */}
      <section className="section section-alt" id="equip">
        <div className="section-title fade-up">Конфігуратор системи</div>
        <div className="section-sub fade-up-d1">Оберіть систему, кількість панелей та додаткові компоненти</div>

        {/* STEP 1: SYSTEM */}
        <div className="config-items" style={{ marginBottom: '1.5rem' }}>
          <div className="config-section-label">1. Оберіть систему накопичення</div>
        </div>
        <div className="config-systems">
          {PRODUCTS.filter(p => tariffType === 'commercial' ? p.key === 'deye' : true).map((p) => (
            <button
              key={p.key}
              className={`config-sys-btn ${configSystem === p.key ? 'active' : ''}`}
              onClick={() => { setConfigSystem(p.key); if (p.maxPanels < configPanels) setConfigPanels(p.maxPanels); }}
            >
              <div className="config-sys-name">{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <div className="config-sys-price">{formatPrice(p.price)}</div>
                {p.ups && <span style={{ background: '#fbc02d', color: '#333', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '50px' }}>⚡ UPS</span>}
              </div>
            </button>
          ))}
        </div>

        {/* STEP 2: PANELS */}
        <div className="config-items" style={{ marginBottom: '0.75rem' }}>
          <div className="config-section-label">2. Кількість сонячних панелей</div>
        </div>
        <div className="config-panel-toggle">
          <button className={`config-panel-btn ${configPanels === 2 ? 'active' : ''}`} onClick={() => setConfigPanels(2)}>2 панелі</button>
          {(PRODUCTS.find(p => p.key === configSystem)?.maxPanels || 4) >= 4 && (
            <button className={`config-panel-btn ${configPanels === 4 ? 'active' : ''}`} onClick={() => setConfigPanels(4)}>4 панелі</button>
          )}
        </div>

        {/* INCLUDED COMPONENTS */}
        {(sheetComponents.length > 0) && (<>
          {/* Panels */}
          {panelItems.length > 0 && (
            <div className="config-items">
              <div className="config-section-label">☀️ Сонячні панелі</div>
              {panelItems.map((c, i) => (
                <div className="config-item" key={`panel-${i}`} style={{ border: '1px solid var(--gray-200)', borderBottom: i < panelItems.length - 1 ? 'none' : '1px solid var(--gray-200)' }}>
                  <div className="config-item-name">{c.name}<small>{c.sku}</small></div>
                  <div className="config-item-qty">× {c.qty}</div>
                  <div className="config-item-price">{formatPrice(c.priceUah * c.qty)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Required components */}
          {nonPanelRequired.length > 0 && (
            <div className="config-items">
              <div className="config-section-label">🔧 Необхідні компоненти</div>
              {nonPanelRequired.map((c, i) => (
                <div className="config-item" key={`req-${i}`} style={{ border: '1px solid var(--gray-200)', borderBottom: i < nonPanelRequired.length - 1 ? 'none' : '1px solid var(--gray-200)' }}>
                  <div className="config-item-name">{c.name}<small>{c.sku}</small></div>
                  <div className="config-item-qty">× {c.qty}</div>
                  <div className="config-item-price">{formatPrice(c.priceUah * c.qty)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Optional components */}
          {optionalComponents.length > 0 && (
            <div className="config-items">
              <div className="config-section-label">🛒 Додатково (на вибір)</div>
              {optionalComponents.map((c, i) => {
                const checked = configExtras.includes(c.sku);
                return (
                  <div
                    className="config-opt-item"
                    key={`opt-${i}`}
                    onClick={() => toggleExtra(c.sku)}
                    style={{ border: '1px solid var(--gray-200)', borderBottom: i < optionalComponents.length - 1 ? 'none' : '1px solid var(--gray-200)' }}
                  >
                    <div className={`config-checkbox ${checked ? 'checked' : ''}`}>{checked ? '✓' : ''}</div>
                    <div className="config-item-name">{c.name}<small>{c.sku} · × {c.qty}</small></div>
                    <div className="config-item-price">{formatPrice(c.priceUah * c.qty)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* TOTAL */}
        <div className="config-total-bar">
          <div>
            <div className="config-total-label">Вартість комплекту «під ключ»</div>
            <div className="config-total-credit">🏦 Кредит 0% — від {configTotal > 0 ? formatPrice(Math.round(configTotal / 120)) : '—'} / міс</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="config-total-value">{configTotal > 0 ? formatPrice(configTotal) : '—'}</div>
            {configTotal > 0 && (
              <button
                onClick={() => { setDirectOrder(null); setShowOrderForm(true); setOrderStatus(null); setOrderForm({ name: '', phone: '', address: '' }); }}
                style={{
                  padding: '12px 28px', borderRadius: '50px', border: '2px solid white',
                  background: 'rgba(255,255,255,0.15)', color: 'white',
                  fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.target.style.background = 'white'; e.target.style.color = 'var(--green-700)'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.color = 'white'; }}
              >
                Замовити →
              </button>
            )}
          </div>
        </div>

        {/* CREDIT */}
        <div className="credit-banner" style={{ cursor: 'pointer' }} onClick={() => goToPage('credit')}>
          <h3>Державний кредит 0% — «Джерела енергії»</h3>
          <p>Програма для фізичних осіб через 43 банки-партнери</p>
          <div className="credit-details">
            <div className="credit-detail">
              <div className="credit-detail-value">0%</div>
              <div className="credit-detail-label">Ставка</div>
            </div>
            <div className="credit-detail">
              <div className="credit-detail-value">480,000</div>
              <div className="credit-detail-label">грн максимум</div>
            </div>
            <div className="credit-detail">
              <div className="credit-detail-value">10</div>
              <div className="credit-detail-label">років</div>
            </div>
            <div className="credit-detail">
              <div className="credit-detail-value">30%</div>
              <div className="credit-detail-label">Компенсація</div>
            </div>
          </div>
          <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--gray-900)' }}>Дізнатися більше →</p>
        </div>
      </section>

      {/* SAVINGS */}
      <section className="section section-green" id="savings">
        <div className="section-title fade-up">Калькулятор економії</div>
        <div className="section-sub fade-up-d1">
          Дізнайтесь, скільки ви зможете зекономити з системою на 4 панелі
        </div>

        <div className="savings-container">
          <div className="savings-slider-wrap">
            <div className="savings-slider-label">Ваше місячне споживання</div>
            <div className="savings-slider-value">{consumption} кВт·год</div>
            <input
              type="range"
              className="savings-slider"
              min={tariff.min}
              max={tariff.max}
              step={tariff.step}
              value={consumption}
              onChange={e => setConsumption(+e.target.value)}
            />
          </div>

          <div className="savings-cards">
            <div className="savings-card before">
              <div className="savings-card-label">Рахунок без панелей</div>
              <div className="savings-card-value">{billBefore.toFixed(0)} грн</div>
            </div>
            <div className="savings-card after">
              <div className="savings-card-label">Рахунок з панелями</div>
              <div className="savings-card-value">{billAfter.toFixed(0)} грн</div>
            </div>
          </div>

          <div className="savings-stats">
            <div className="savings-stat">
              <div className="savings-stat-value">{monthlySaving.toFixed(0)} грн</div>
              <div className="savings-stat-label">Економія / місяць</div>
            </div>
            <div className="savings-stat">
              <div className="savings-stat-value">
                {paybackMonths > 0 ? `${(paybackMonths / 12).toFixed(1)} р.` : '—'}
              </div>
              <div className="savings-stat-label">Окупність</div>
            </div>
            <div className="savings-stat">
              <div className="savings-stat-value">
                {saving10y > 0 ? `${(saving10y / 1000).toFixed(0)}k грн` : '—'}
              </div>
              <div className="savings-stat-label">Вигода за 10 років</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <SocialFooter />
      </>)}

      {/* ═══════ ECOFLOW DETAIL PAGE ═══════ */}
      {currentPage === 'ecoflow' && (
        <div className="detail-page">
          <a href="/" className="detail-back" onClick={(e) => { e.preventDefault(); goToPage('home'); }}>← Назад до головної</a>

          {/* HERO */}
          <div className="detail-hero-section">
            <div className="detail-hero-img">
              <img src="/ecoflow.png" alt="EcoFlow STREAM AC Pro" />
            </div>
            <div className="detail-hero-info">
              <h1>EcoFlow STREAM AC Pro</h1>
              <div className="detail-price">{getPrice('EcoFlow STREAM AC Pro')}</div>
              <button className="detail-buy-btn" onClick={() => openDirectOrder('EcoFlow STREAM AC Pro')}>
                🛒 Купити систему
              </button>
              <div className="detail-specs-grid">
                {[
                  ['Ємність', '1.92 кВт·год'],
                  ['AC Вихід', '1,200 Вт'],
                  ['AC Вхід', '1,050 Вт'],
                  ['Цикли', '6,000'],
                  ['Батарея', 'LFP (LiFePO4)'],
                  ['Захист', 'IP65'],
                  ['Шум', '< 30 дБ'],
                  ['Гарантія', '2 роки'],
                  ['Вага', '21.5 кг'],
                  ['Розміри', '255 × 254 × 458 мм'],
                  ['Підключення', 'Wi-Fi / Bluetooth'],
                  ['Температура', '-20°C — +55°C'],
                ].map(([l, v], j) => (
                  <div className="detail-spec" key={j}>
                    <span className="detail-spec-label">{l}</span>
                    <span className="detail-spec-value">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FEATURE 1: All-in-One */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>🔄 Гібридна система «все в одному»</h2>
                <p>
                  EcoFlow STREAM AC Pro легко інтегрується з будь-яким мікроінвертором завдяки
                  технології AC-зв'язку. Просто підключіть до розетки — система автоматично
                  зберігає сонячну енергію вдень та забезпечує безперебійне живлення вночі.
                  100% сумісність з усіма мікроінверторами на ринку.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="https://de.ecoflow.com/cdn/shop/files/PC_046fe521-021d-4db6-8873-a1f9e283c329.png?v=1745849558&width=1200" alt="All-in-One Hybrid System" />
              </div>
            </div>
          </div>

          {/* FEATURE 2: Dual-mode 2800W */}
          <div className="detail-feature reverse">
            <div className="detail-feature-text">
              <h2>⚡ Подвійний режим — до 2800 Вт сонячного входу</h2>
              <p>
                Масштабуйте свою систему від 1.92 кВт·год до 11.52 кВт·год, підключивши до 6
                пристроїв разом. Два STREAM AC Pro можна з'єднати для подвоєння ємності,
                або комбінувати з батареями серії EcoFlow DELTA для ще більшого запасу енергії.
              </p>
            </div>
            <div className="detail-feature-img">
              <img src="https://de.ecoflow.com/cdn/shop/files/PC_7eedf67f-30cc-4e20-8770-ac3289a0f646.png?v=1753188037&width=1200" alt="Scalable Storage" />
            </div>
          </div>

          {/* FEATURE 3: 2300W output */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>🔌 2,300 Вт AC вихід</h2>
                <p>
                  Живіть два пристрої одночасно — з потужністю 1,200 Вт на одну батарею
                  та автоматичним підсиленням до 2,300 Вт. Комбінуйте з іншим STREAM AC Pro
                  або STREAM Ultra для повної потужності. Вбудована батарея забезпечує роботу
                  навіть при відключенні електрики.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="https://de.ecoflow.com/cdn/shop/files/PC_b8a21f00-ddcc-43f3-9058-5a8fa2797e03.png?v=1745849568&width=1200" alt="2300W AC Output" />
              </div>
            </div>
          </div>

          {/* FEATURE 4: Big or Small */}
          <div className="detail-feature-full">
            <h2>💡 Великий чи малий — живить все</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1.5rem', lineHeight: '1.7' }}>
              Від роутера та освітлення до холодильника та чайника — EcoFlow STREAM забезпечує
              пристрої потужністю до 2,300 Вт повністю на сонячній енергії.
            </p>
            <img src="https://de.ecoflow.com/cdn/shop/files/PC_8ef6414a-2906-4004-8b38-f07dffb40cc2.png?v=1745849578&width=1200" alt="Big or Small Power It All" />
          </div>

          {/* FEATURE 5: Power flows + VIDEO */}
          <div style={{ background: 'var(--gray-50)', padding: '4rem 2rem' }}>
            <div className="detail-feature-full" style={{ padding: 0 }}>
              <h2>🏠 Енергія там, де ваші пристрої</h2>
              <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1.5rem', lineHeight: '1.7' }}>
                ШІ-система моніторить всі підключені пристрої в реальному часі. Коли батарея на кухні
                розряджається, інтелектуальне управління автоматично перенаправляє енергію від сусідніх
                пристроїв — ваш холодильник продовжує працювати на сонячній енергії без перебоїв.
              </p>
              <div className="detail-video-wrap" style={{ margin: '0 auto' }}>
                <iframe
                  src="https://www.youtube.com/embed/MiwgNXLpEMU"
                  title="EcoFlow STREAM AC Pro"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* FEATURE 6: Ready for any weather */}
          <div className="detail-feature-full">
            <h2>🌧 Готовий до будь-якої погоди</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1.5rem', lineHeight: '1.7' }}>
              Захист IP65, робоча температура від -20°C до +55°C, автоматичний підігрів батареї
              при низьких температурах. Тихий як шепіт — лише 30 дБ. Технологія LFP забезпечує
              до 6,000 циклів — це понад 15 років надійної роботи.
            </p>
            <img src="https://de.ecoflow.com/cdn/shop/files/02_PC_a6f2a87d-4fa5-4e4e-a726-f800a5ceb282.png?v=1745844265&width=1200" alt="Ready For Any Weather" />
          </div>

          {/* INSTALLATION MANUAL */}
          <div className="detail-feature-full" style={{ paddingBottom: '1rem' }}>
            <h2>📖 Інструкція з встановлення</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1rem', lineHeight: '1.7' }}>
              Завантажте офіційну інструкцію з встановлення EcoFlow STREAM AC Pro
              для покрокового керівництва з підключення та налаштування системи.
            </p>
            <a
              className="detail-pdf-btn"
              href="https://ecoflow-service-us-prod.oss-us-west-1.aliyuncs.com/cms/manual/1758263879628/EcoFlow%20STREAM%20AC%20Pro_User%20Manual.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Завантажити PDF інструкцію
            </a>
          </div>

          {/* SHARE & CTA */}
          <ShareBar productName="EcoFlow STREAM AC Pro" url="/ecoflow" />
          <div style={{ textAlign: 'center', padding: '1rem 2rem 4rem' }}>
            <button className="hero-cta" onClick={() => goToPage('home')}>
              ← Повернутися до калькулятора
            </button>
          </div>

          <SocialFooter />
        </div>
      )}

      {/* ═══════ ZENDURE DETAIL PAGE ═══════ */}
      {currentPage === 'zendure' && (
        <div className="detail-page">
          <a href="/" className="detail-back" onClick={(e) => { e.preventDefault(); goToPage('home'); }}>← Назад до головної</a>

          {/* HERO */}
          <div className="detail-hero-section">
            <div className="detail-hero-img">
              <img src="/zendure.png" alt="Zendure SolarFlow 2400 AC+" />
            </div>
            <div className="detail-hero-info">
              <h1>Zendure SolarFlow 2400 AC+</h1>
              <div className="detail-price">{getPrice('Zendure SolarFlow 2400 AC+')}</div>
              <button className="detail-buy-btn" onClick={() => openDirectOrder('Zendure SolarFlow 2400 AC+')}>
                🛒 Купити систему
              </button>
              <div className="detail-specs-grid">
                {[
                  ['Ємність', '2.4 кВт·год (до 16.8)'],
                  ['AC Вихід', '2,400 Вт'],
                  ['AC Вхід', '3,200 Вт макс.'],
                  ['Цикли', '6,000'],
                  ['Батарея', 'LiFePO4 48В'],
                  ['Захист', 'IP65'],
                  ['Ефективність', '93% AC'],
                  ['Гарантія', '10 років'],
                  ['Вага', '~11 кг (контролер)'],
                  ['Розміри', '448 × 304 × 88 мм'],
                  ['Підключення', 'Wi-Fi / Bluetooth'],
                  ['Температура', '-20°C — +55°C'],
                ].map(([l, v], j) => (
                  <div className="detail-spec" key={j}>
                    <span className="detail-spec-label">{l}</span>
                    <span className="detail-spec-value">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FEATURE 1: 2400W Bi-Directional AC + VIDEO */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>⚡ 2400 Вт двонаправлений AC</h2>
                <p>
                  Більшість побутових приладів працюють від сонця. Менше залежність від мережі.
                  SolarFlow 2400 AC+ забезпечує повний цикл: вдень заряджає батарею сонячною
                  енергією, ввечері — живить ваш дім. ШІ-система HEMS аналізує погоду, тарифи
                  та ваші звички, щоб економити до 42% на електроенергії щомісяця.
                </p>
              </div>
              <div className="detail-feature-img">
                <div className="detail-video-wrap" style={{ maxWidth: '100%', margin: 0, boxShadow: 'none' }}>
                  <video autoPlay muted loop playsInline>
                    <source src="https://zendure.com/cdn/shop/videos/c/vp/3b86b4a3ec5a4cfbb75b2e286b29061d/3b86b4a3ec5a4cfbb75b2e286b29061d.HD-1080p-2.5Mbps-73424824.mp4?v=0" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 2: Scalable 2.4–16.8 kWh */}
          <div className="detail-feature reverse">
            <div className="detail-feature-text">
              <h2>🔋 Від 2.4 до 16.8 кВт·год — масштабуйте під потреби</h2>
              <p>
                Починайте з одного модуля на 2.4 кВт·год і нарощуйте ємність до 16.8 кВт·год,
                додаючи батареї AB3000L. Кожен модуль має незалежну систему управління зарядом —
                без «ефекту бочки». Ідеально для тих, хто планує поступове розширення
                сонячної системи або підготовку до зарядки електромобіля.
              </p>
            </div>
            <div className="detail-feature-img">
              <img src="https://zendure.com/cdn/shop/files/PC_1.png?v=1770270189&width=1200" alt="Scalable Storage" />
            </div>
          </div>

          {/* FEATURE 3: Plug & Play */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>🔌 Просте встановлення — Plug & Play</h2>
                <p>
                  Три кроки: підключіть батарею до контролера, вставте вилку в розетку,
                  налаштуйте через додаток Zendure. Жодних спеціальних інструментів чи електриків.
                  Система автоматично розпізнає підключення та починає працювати.
                  Вся установка — менше 30 хвилин.
                </p>
              </div>
              <div className="detail-feature-img">
                <div className="detail-video-wrap" style={{ maxWidth: '100%', margin: 0, boxShadow: 'none' }}>
                  <iframe
                    src="https://www.youtube.com/embed/7qATOYRR6Bc"
                    title="Zendure SolarFlow 2400 AC+ Installation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 4: Intelligent Battery Self-Maintenance + VIDEO */}
          <div className="detail-feature reverse">
            <div className="detail-feature-text">
              <h2>🧠 Інтелектуальне самообслуговування батареї</h2>
              <p>
                Вбудована BMS моніторить стан батареї в реальному часі, а хмарний аналіз
                додає періодичну діагностику та прогнозування несправностей. Система автоматично
                запобігає надмірному розряду через розумне управління SOC, самонагрів при низьких
                температурах та комбіноване AC + PV заряджання.
              </p>
            </div>
            <div className="detail-feature-img">
                <img src="/zendure-bms.png" alt="Intelligent Battery Self-Maintenance BMS" />
              </div>
          </div>

          {/* FEATURE 5: Metering Accessories */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>📊 Аксесуари для точного контролю енергії</h2>
                <p>
                  Підключіть Smart Meter (Zendure 3CT, Shelly Pro 3EM або інший) для точного
                  моніторингу генерації та споживання в реальному часі. Система автоматично
                  коригує заряд/розряд відповідно до ваших потреб — нульовий експорт в мережу,
                  максимальне самоспоживання.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="/zendure-metering.webp" alt="Metering Accessories" />
              </div>
            </div>
          </div>

          {/* FEATURE 6: All-in-One Design */}
          <div className="detail-feature-full">
            <h2>📦 Дизайн «все в одному»</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1.5rem', lineHeight: '1.7' }}>
              Контролер та інвертор в одному компактному корпусі вагою лише 11 кг.
              Модульна конструкція дозволяє з'єднувати до 6 батарей без додаткового обладнання.
              Сумісний з усіма мікроінверторами до 2000 Вт. Підтримка Home Assistant,
              Homey, Shelly через MQTT.
            </p>
            <img src="/zendure-allinone.png" alt="All-in-One Design" />
          </div>

          {/* FEATURE 7: Weather-proof + Warranty */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>🌧 10 років гарантії, до 15 років служби</h2>
                <p>
                  IP65 захист для зовнішньої установки. Самонагрів батареї при низьких температурах.
                  Вбудована аерозольна система пожежогасіння ZenGuard™ активується при аномальному
                  нагріві. LiFePO4 акумулятори з 6,000 циклами забезпечують понад 15 років
                  безперервної роботи. Zendure надає 10 років повної гарантії.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="/zendure-weather.webp" alt="IP65 Weather Proof" />
              </div>
            </div>
          </div>

          {/* INSTALLATION MANUAL */}
          <div className="detail-feature-full" style={{ paddingBottom: '1rem' }}>
            <h2>📖 Інструкція з встановлення</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1rem', lineHeight: '1.7' }}>
              Завантажте офіційну інструкцію з встановлення Zendure SolarFlow 2400 AC+
              для покрокового керівництва з підключення та налаштування системи.
            </p>
            <a
              className="detail-pdf-btn"
              href="https://cdn.shopify.com/s/files/1/0720/4379/0616/files/SolarFlow_2400_AC__User_Manual_EN_FR_20260122.pdf?v=1770547505"
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Завантажити PDF інструкцію
            </a>
          </div>

          {/* SHARE & CTA */}
          <ShareBar productName="Zendure SolarFlow 2400 AC+" url="/zendure" />
          <div style={{ textAlign: 'center', padding: '1rem 2rem 4rem' }}>
            <button className="hero-cta" onClick={() => goToPage('home')}>
              ← Повернутися до калькулятора
            </button>
          </div>

          <SocialFooter />
        </div>
      )}

      {/* ═══════ DEYE DETAIL PAGE ═══════ */}
      {currentPage === 'deye' && (
        <div className="detail-page">
          <a href="/" className="detail-back" onClick={(e) => { e.preventDefault(); goToPage('home'); }}>← Назад до головної</a>

          {/* HERO */}
          <div className="detail-hero-section">
            <div className="detail-hero-img">
              <img src="/deye.png" alt="Deye AE-FS2.0-2H2" />
            </div>
            <div className="detail-hero-info">
              <h1>Deye AE-FS2.0-2H2</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div className="detail-price" style={{ marginBottom: 0 }}>{getPrice('Deye AE-FS2.0-2H2')}</div>
                <span style={{ background: '#fbc02d', color: '#333', fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '50px' }}>⚡ UPS</span>
              </div>
              <button className="detail-buy-btn" onClick={() => openDirectOrder('Deye AE-FS2.0-2H2')}>
                🛒 Купити систему
              </button>
              <div className="detail-specs-grid">
                {[
                  ['Ємність', '2.0 кВт·год (до 10)'],
                  ['AC Вихід', '1,000 Вт'],
                  ['PV Вхід', '1,000 Вт макс.'],
                  ['MPPT', '2 трекери'],
                  ['Батарея', 'LiFePO4 51.2В'],
                  ['Цикли', '6,000'],
                  ['Захист', 'IP65'],
                  ['UPS', '< 4 мс'],
                  ['Гарантія', '10 років'],
                  ['Вага', '~26 кг'],
                  ['Розміри', '450 × 210 × 321 мм'],
                  ['Температура', '-10°C — +50°C'],
                ].map(([l, v], j) => (
                  <div className="detail-spec" key={j}>
                    <span className="detail-spec-label">{l}</span>
                    <span className="detail-spec-value">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FEATURE 1: All-in-One */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>📦 Все в одному — інвертор + батарея + MPPT</h2>
                <p>
                  Deye AE-FS2.0-2H2 об'єднує мікроінвертор з 2 MPPT-трекерами, акумулятор
                  LiFePO4 на 2 кВт·год та систему управління в одному компактному корпусі.
                  Сумісний з 99% сонячних панелей на ринку. Підтримує AC-зв'язок для
                  інтеграції з існуючою PV-системою — заряд та розряд на стороні AC.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="https://www.deyestore.com/cdn/shop/files/Balcony-Portrait_2.png?v=1764921140&width=1200" alt="Deye All-in-One" />
              </div>
            </div>
          </div>

          {/* FEATURE 2: Battery 6000 cycles */}
          <div className="detail-feature reverse">
            <div className="detail-feature-text">
              <h2>🔋 2000 Вт·год батарея — 10 років служби</h2>
              <p>
                В основі системи — акумулятор LiFePO4 на 2 кВт·год, найбезпечніша та
                найдовговічніша літієва технологія. Вбудована Smart BMS моніторить кожну
                комірку за температурою, напругою та струмом. Понад 6,000 циклів заряду
                та 10 років гарантії від виробника.
              </p>
            </div>
            <div className="detail-feature-img">
              <img src="https://www.deyestore.com/cdn/shop/files/1222222.png?v=1765441573&width=1200" alt="Robust Battery" />
            </div>
          </div>

          {/* FEATURE 3: IP65 Weatherproof */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>🌧 IP65 — працює на відкритому повітрі цілий рік</h2>
                <p>
                  Повний захист від водяних струменів та пилу — дощ, сніг чи літні грози
                  не страшні. Робочий діапазон від -10°C до +50°C покриває навіть найсуворіші
                  зими та найспекотніші літа. Компактні розміри 450 × 210 × 321 мм та вага
                  всього 26 кг — підходить для будь-якого балкону без настінного кріплення.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="https://www.deyestore.com/cdn/shop/files/155555.png?v=1765441819&width=1200" alt="IP65 Weatherproof" />
              </div>
            </div>
          </div>

          {/* FEATURE 4: Smart LCD + App */}
          <div className="detail-feature reverse">
            <div className="detail-feature-text">
              <h2>📱 LCD-дисплей + додаток Deye Cloud</h2>
              <p>
                Вбудований LCD-дисплей показує стан батареї миттєво, а додаток Deye Cloud
                дозволяє детально моніторити систему зі смартфона. Відстежуйте генерацію
                сонячної енергії, потік потужності в реальному часі та налаштовуйте параметри
                віддалено. Підключення через Bluetooth та Wi-Fi.
              </p>
            </div>
            <div className="detail-feature-img">
              <img src="https://www.deyestore.com/cdn/shop/files/177777.png?v=1765441919&width=1200" alt="Smart LCD App Control" />
            </div>
          </div>

          {/* FEATURE 5: UPS */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>⚡ UPS — переключення за 4 мілісекунди</h2>
                <p>
                  При відключенні електромережі вбудований UPS активується менше ніж за
                  4 мілісекунди — ваше світло навіть не блимне. Холодильник, роутер та
                  зарядки продовжують працювати. Батарея на 2 кВт·год забезпечує годинами
                  роботи основних приладів під час блекауту.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="https://www.deyestore.com/cdn/shop/files/2e820d0d3cd46387a366f486056a04af.png?v=1764931162&width=1200" alt="UPS Function" />
              </div>
            </div>
          </div>

          {/* FEATURE 6: Expandable + USB */}
          <div className="detail-feature-full">
            <h2>🔌 Розширення до 10 кВт·год + USB зарядка</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1.5rem', lineHeight: '1.7' }}>
              Додайте до 4 модулів AE-F2.0 (по 2 кВт·год кожен) для загальної ємності 10 кВт·год.
              Вбудовані порти USB-A та Type-C перетворюють систему на зарядний хаб — заряджайте
              телефон, планшет чи ноутбук безпосередньо від сонячної енергії.
            </p>
            <img src="https://www.deyestore.com/cdn/shop/files/166666.png?v=1765441868&width=1200" alt="Expandable USB Charging" />
          </div>

          {/* INSTALLATION MANUAL */}
          <div className="detail-feature-full" style={{ paddingBottom: '1rem' }}>
            <h2>📖 Інструкція з встановлення</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1rem', lineHeight: '1.7' }}>
              Завантажте офіційну інструкцію з встановлення Deye AE-FS2.0-2H2
              для покрокового керівництва з підключення та налаштування системи.
            </p>
            <a
              className="detail-pdf-btn"
              href="https://deyeess.com/wp-content/uploads/2026/02/Deye-AE-FS2.0-2H2-User-Manual.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Завантажити PDF інструкцію
            </a>
          </div>

          {/* SHARE & CTA */}
          <ShareBar productName="Deye AE-FS2.0-2H2" url="/deye" />
          <div style={{ textAlign: 'center', padding: '1rem 2rem 4rem' }}>
            <button className="hero-cta" onClick={() => goToPage('home')}>
              ← Повернутися до калькулятора
            </button>
          </div>

          <SocialFooter />
        </div>
      )}

      {/* ═══════ ANKER F3800 DETAIL PAGE ═══════ */}
      {currentPage === 'anker' && (
        <div className="detail-page">
          <a href="/" className="detail-back" onClick={(e) => { e.preventDefault(); goToPage('home'); }}>← Назад до головної</a>

          {/* HERO */}
          <div className="detail-hero-section">
            <div className="detail-hero-img">
              <img src="/anker.png" alt="Anker SOLIX F3800" />
            </div>
            <div className="detail-hero-info">
              <h1>Anker SOLIX F3800</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="detail-price">{getPrice('Anker SOLIX F3800')}</div>
                <span style={{ background: '#fbc02d', color: '#333', fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '50px' }}>⚡ UPS</span>
              </div>
              <button className="detail-buy-btn" onClick={() => openDirectOrder('Anker SOLIX F3800')}>
                🛒 Купити систему
              </button>
              <div className="detail-specs-grid">
                {[
                  ['Ємність', '3,840 Вт·год (до 53.8)'],
                  ['AC Вихід', '6,000 Вт'],
                  ['Сонячний вхід', 'до 3,200 Вт'],
                  ['Цикли', '3,000+'],
                  ['Батарея', 'LFP (EV-grade)'],
                  ['Захист', 'IP65'],
                  ['Напруга', '120В / 240В'],
                  ['Гарантія', '5 років'],
                  ['Вага', '60 кг'],
                  ['Розміри', '507 × 318 × 565 мм'],
                  ['Підключення', 'Wi-Fi / Bluetooth'],
                  ['Температура', '-20°C — +45°C'],
                ].map(([l, v], j) => (
                  <div className="detail-spec" key={j}>
                    <span className="detail-spec-label">{l}</span>
                    <span className="detail-spec-value">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FEATURE 1: Whole-Home Backup */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>🏠 Резервне живлення всього будинку</h2>
                <p>
                  Anker SOLIX F3800 забезпечує потужність 6,000 Вт — достатньо для всіх
                  побутових приладів одночасно, включаючи кондиціонер, холодильник, електроплиту
                  та навіть зарядку електромобіля. Підтримка 120В/240В дозволяє підключити
                  будь-яке обладнання без обмежень. Автоматична UPS система перемикає живлення
                  за мілісекунди — ваші пристрої навіть не помітять відключення мережі.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="https://cdn.shopify.com/s/files/1/0522/5703/0332/files/90_P_KV_1x_1_1-tuya_3840x.jpg?v=1737604548" alt="Whole Home Backup" />
              </div>
            </div>
          </div>

          {/* FEATURE 2: Massive Solar Input */}
          <div className="detail-feature reverse">
            <div className="detail-feature-text">
              <h2>☀️ До 3,200 Вт сонячного входу</h2>
              <p>
                Два незалежних MPPT входи по 165В дозволяють підключити до 8 сонячних панелей
                та повністю зарядити систему за 1.5 години при оптимальному сонці.
                Для балконної установки ідеально підходять 2 панелі Trina 455 Вт —
                вони забезпечують щоденну генерацію для покриття базового споживання.
              </p>
            </div>
            <div className="detail-feature-img">
              <img src="https://cdn.shopify.com/s/files/1/0854/3820/2186/files/A1790112_listingimage_US_01_V1_1000x.png?v=1750215496" alt="Solar Input 3200W" />
            </div>
          </div>

          {/* FEATURE 3: Scalable */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>🔋 Від 3.8 до 53.8 кВт·год — масштабуйте без меж</h2>
                <p>
                  Починайте з одного модуля на 3.84 кВт·год та додавайте батареї розширення
                  до 53.8 кВт·год — це тижні автономної роботи. Два F3800 можна з'єднати
                  для подвоєння потужності до 12,000 Вт. Plug & Play підключення — жодних
                  електриків чи спеціальних інструментів.
                </p>
              </div>
              <div className="detail-feature-img">
                <img src="https://cdn.shopify.com/s/files/1/0854/3820/2186/files/A1790P-_1_1000x.png?v=1741603455" alt="Scalable Storage" />
              </div>
            </div>
          </div>

          {/* FEATURE 4: 4 Ways to Charge */}
          <div className="detail-feature-full">
            <h2>⚡ 4 способи зарядки</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1.5rem', lineHeight: '1.7' }}>
              Сонячні панелі (3,200 Вт), газовий генератор (6,000 Вт через байпас 240В),
              домашня мережа (1,800 Вт AC) або комбінований режим. Система Storm Guard
              автоматично починає зарядку перед штормом, аналізуючи прогноз погоди.
            </p>
            <img src="https://cdn.shopify.com/s/files/1/0854/3820/2186/files/A1790112_Product_Image_05_V1_1_1000x.png?v=1741603455" alt="4 Ways to Charge" />
          </div>

          {/* FEATURE 5: UPS */}
          <div style={{ background: 'var(--gray-50)' }}>
            <div className="detail-feature">
              <div className="detail-feature-text">
                <h2>🔌 Автоматична UPS система</h2>
                <p>
                  При відключенні мережі F3800 миттєво перемикається на батарею —
                  час перемикання менше 20 мс. Ваш холодильник, роутер, камери безпеки
                  та медичне обладнання продовжують працювати без перебоїв.
                  Інтелектуальне управління через додаток Anker дозволяє налаштувати
                  пріоритети живлення для кожного пристрою.
                </p>
              </div>
              <div className="detail-feature-img">
                <div className="detail-video-wrap" style={{ maxWidth: '100%', margin: 0, boxShadow: 'none' }}>
                  <iframe
                    src="https://www.youtube.com/embed/PKNENRY26Og"
                    title="Anker SOLIX F3800 UPS"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 6: Smart App + EV Charging */}
          <div className="detail-feature reverse">
            <div className="detail-feature-text">
              <h2>📱 Розумне управління та зарядка EV</h2>
              <p>
                Додаток Anker забезпечує повний моніторинг: заряд батареї, генерацію,
                споживання та історію в реальному часі. Вбудовані порти NEMA TT-30P та L14-30
                дозволяють напряму заряджати електромобіль або підключати RV.
                EV-grade акумулятори LFP гарантують 3,000+ циклів — понад 10 років
                щоденного використання.
              </p>
            </div>
            <div className="detail-feature-img">
              <img src="https://cdn.shopify.com/s/files/1/0854/3820/2186/files/A1790p-_30_1_ed7bb5aa-cda9-4ee7-b9f9-9c489eb0a800_1000x.png?v=1741603455" alt="Smart App and EV Charging" />
            </div>
          </div>

          {/* FEATURE 7: Weather-proof + Warranty */}
          <div className="detail-feature-full">
            <h2>🌧 5 років гарантії, 10+ років служби</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1.5rem', lineHeight: '1.7' }}>
              Захист IP65 для зовнішньої установки. Робоча температура від -20°C до +45°C.
              Акумулятори EV-grade LFP із 3,000+ циклами забезпечують понад 10 років
              безперервної роботи. Anker надає 5 років повної гарантії та довічну
              підтримку клієнтів.
            </p>
          </div>

          {/* INSTALLATION MANUAL */}
          <div className="detail-feature-full" style={{ paddingBottom: '1rem' }}>
            <h2>📖 Інструкція з встановлення</h2>
            <p style={{ color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto 1rem', lineHeight: '1.7' }}>
              Завантажте офіційну інструкцію з встановлення Anker SOLIX F3800
              для покрокового керівництва з підключення та налаштування системи.
            </p>
            <a
              className="detail-pdf-btn"
              href="https://salesforce-knowledge-download.s3.us-west-2.amazonaws.com/000014613/en_US/000014613.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Завантажити PDF інструкцію
            </a>
          </div>

          {/* SHARE & CTA */}
          <ShareBar productName="Anker SOLIX F3800" url="/anker" />
          <div style={{ textAlign: 'center', padding: '1rem 2rem 4rem' }}>
            <button className="hero-cta" onClick={() => goToPage('home')}>
              ← Повернутися до калькулятора
            </button>
          </div>

          <SocialFooter />
        </div>
      )}

      {/* ═══════ CREDIT PROGRAM PAGE ═══════ */}
      {currentPage === 'credit' && (
        <div className="credit-page">
          <a href="/" className="detail-back" onClick={(e) => { e.preventDefault(); goToPage('home'); }}>← Назад до головної</a>

          {/* HERO */}
          <div className="credit-hero-section">
            <h1>Кредит <em>0%</em> на сонячну електростанцію</h1>
            <p className="credit-hero-sub">
              Державна програма «Джерела енергії» дозволяє українцям встановити сонячну станцію
              без переплат. Держава повністю компенсує відсотки — ви платите лише тіло кредиту.
              SolarBalkon бере на себе всі документи та встановлення.
            </p>
            <div className="credit-hero-stats">
              <div className="credit-hero-stat">
                <div className="credit-hero-stat-value">0%</div>
                <div className="credit-hero-stat-label">Ставка кредиту</div>
              </div>
              <div className="credit-hero-stat">
                <div className="credit-hero-stat-value">480 000</div>
                <div className="credit-hero-stat-label">грн максимум</div>
              </div>
              <div className="credit-hero-stat">
                <div className="credit-hero-stat-value">10 років</div>
                <div className="credit-hero-stat-label">Термін кредиту</div>
              </div>
              <div className="credit-hero-stat">
                <div className="credit-hero-stat-value">30%</div>
                <div className="credit-hero-stat-label">Компенсація тіла</div>
              </div>
            </div>
          </div>

          <div className="credit-content">

            {/* WHAT IS THE PROGRAM */}
            <div className="credit-block">
              <h2>🏛 Що таке програма «Джерела енергії»?</h2>
              <p>
                «Джерела енергії» — це державна програма фінансової підтримки, затверджена Кабінетом Міністрів України.
                Вона дозволяє фізичним особам отримати кредит під 0% на придбання та встановлення гібридної системи
                електропостачання у власному домогосподарстві.
              </p>
              <p>
                Держава через Фонд розвитку підприємництва повністю компенсує банку відсоткову ставку за кредитом,
                а також до 30% тіла кредиту. Фактично — це чесна розстрочка без жодних переплат.
              </p>
              <p>
                Програма реалізується через банки-партнери. Кредит перераховується безпосередньо на рахунок
                компанії-установника (SolarBalkon), а клієнт оплачує щомісячні платежі банку.
              </p>
            </div>

            {/* WHO CAN GET */}
            <div className="credit-block">
              <h2>👤 Хто може отримати кредит?</h2>
              <p>Програма доступна для фізичних осіб, які відповідають таким умовам:</p>
              <div className="credit-docs-grid">
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">🎂</div>
                  <div>
                    <div className="credit-doc-name">Вік від 21 до 70 років</div>
                    <div className="credit-doc-note">На дату закінчення строку кредиту</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">🏠</div>
                  <div>
                    <div className="credit-doc-name">Власне домогосподарство</div>
                    <div className="credit-doc-note">Житловий будинок до 250 м² (без земельної ділянки)</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">💰</div>
                  <div>
                    <div className="credit-doc-name">Підтверджений дохід</div>
                    <div className="credit-doc-note">Сукупний дохід сім'ї до 210 000 грн/міс</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">⚡</div>
                  <div>
                    <div className="credit-doc-name">Особовий рахунок електроенергії</div>
                    <div className="credit-doc-note">Активний рахунок у постачальника</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">📏</div>
                  <div>
                    <div className="credit-doc-name">Потужність до 10 кВт</div>
                    <div className="credit-doc-note">Кожна складова системи — до 10 кВт</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">🔋</div>
                  <div>
                    <div className="credit-doc-name">Гібридна система</div>
                    <div className="credit-doc-note">Панелі + інвертор + накопичувач обов'язково</div>
                  </div>
                </div>
              </div>
            </div>

            {/* REQUIRED DOCUMENTS */}
            <div className="credit-block">
              <h2>📋 Необхідні документи</h2>
              <p>Для оформлення кредиту вам потрібно підготувати наступні документи:</p>
              <div className="credit-docs-grid">
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">🪪</div>
                  <div>
                    <div className="credit-doc-name">Паспорт громадянина України</div>
                    <div className="credit-doc-note">ID-картка або паспорт-книжечка</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">🔢</div>
                  <div>
                    <div className="credit-doc-name">Ідентифікаційний код (ІПН)</div>
                    <div className="credit-doc-note">Реєстраційний номер облікової картки</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">💼</div>
                  <div>
                    <div className="credit-doc-name">Довідка про доходи</div>
                    <div className="credit-doc-note">За останні 6 місяців (від роботодавця або з ДПС)</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">✅</div>
                  <div>
                    <div className="credit-doc-name">Довідка про несудимість</div>
                    <div className="credit-doc-note">Формується безкоштовно в додатку «Дія»</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">💍</div>
                  <div>
                    <div className="credit-doc-name">Свідоцтво про шлюб</div>
                    <div className="credit-doc-note">Укладення або розірвання (за наявності)</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">🏡</div>
                  <div>
                    <div className="credit-doc-name">Документи на нерухомість</div>
                    <div className="credit-doc-note">Право власності на будинок із зазначенням площі</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">📊</div>
                  <div>
                    <div className="credit-doc-name">Рахунок за електроенергію</div>
                    <div className="credit-doc-note">За останній місяць з номером особового рахунку</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">📝</div>
                  <div>
                    <div className="credit-doc-name">Додаткові документи</div>
                    <div className="credit-doc-note">Банк може запросити довідку про доходи подружжя</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SOLARBALKON PROVIDES */}
            <div className="credit-company-box">
              <h3>📦 SolarBalkon надає ВСІ технічні документи</h3>
              <p>
                Вам не потрібно шукати специфікації, сертифікати чи складати кошториси —
                ми готуємо повний пакет технічної документації для банку:
              </p>
              <div className="credit-company-list">
                <span className="credit-company-tag">Рахунок-фактура</span>
                <span className="credit-company-tag">Кошторис системи</span>
                <span className="credit-company-tag">Специфікації обладнання</span>
                <span className="credit-company-tag">Сертифікати якості</span>
                <span className="credit-company-tag">Договір поставки</span>
                <span className="credit-company-tag">Акт виконаних робіт</span>
                <span className="credit-company-tag">Фотозвіт установки</span>
                <span className="credit-company-tag">Гарантійні талони</span>
              </div>
            </div>

            {/* HOW IT WORKS - STEPS */}
            <div className="credit-block">
              <h2>🚀 Як отримати кредит — покрокова інструкція</h2>

              <div className="credit-steps">
                <div className="credit-step">
                  <div className="credit-step-num">1</div>
                  <div>
                    <div className="credit-step-title">Зв'яжіться з нами</div>
                    <div className="credit-step-desc">
                      Напишіть у Telegram, Instagram або зателефонуйте. Ми допоможемо обрати
                      оптимальну систему під ваші потреби та розрахуємо точну вартість.
                    </div>
                  </div>
                </div>
                <div className="credit-step">
                  <div className="credit-step-num">2</div>
                  <div>
                    <div className="credit-step-title">Ми готуємо документи для банку</div>
                    <div className="credit-step-desc">
                      SolarBalkon формує повний пакет технічних документів: кошторис, специфікації
                      обладнання, рахунок-фактуру, договір поставки. Все — безкоштовно.
                    </div>
                  </div>
                </div>
                <div className="credit-step">
                  <div className="credit-step-num">3</div>
                  <div>
                    <div className="credit-step-title">Ви подаєте заявку в банк</div>
                    <div className="credit-step-desc">
                      Зверніться до будь-якого банку-партнера зі своїми особистими документами
                      та нашим технічним пакетом. Попереднє рішення — за 2 хвилини онлайн
                      (ПриватБанк через Приват24).
                    </div>
                  </div>
                </div>
                <div className="credit-step">
                  <div className="credit-step-num">4</div>
                  <div>
                    <div className="credit-step-title">Банк перераховує кошти</div>
                    <div className="credit-step-desc">
                      Після схвалення банк перераховує суму кредиту безпосередньо на рахунок
                      SolarBalkon. Вам нічого додатково платити на цьому етапі.
                    </div>
                  </div>
                </div>
                <div className="credit-step">
                  <div className="credit-step-num">5</div>
                  <div>
                    <div className="credit-step-title">Ми доставляємо та встановлюємо</div>
                    <div className="credit-step-desc">
                      Наші спеціалісти погоджують зручну дату, доставляють обладнання, встановлюють
                      та підключають систему. Повне встановлення — від 1 до 3 днів.
                    </div>
                  </div>
                </div>
                <div className="credit-step">
                  <div className="credit-step-num">6</div>
                  <div>
                    <div className="credit-step-title">Фотозвіт для банку</div>
                    <div className="credit-step-desc">
                      Ми підготуємо фотозвіт про встановлення, який потрібно надіслати банку
                      протягом 90 днів. SolarBalkon формує його автоматично після монтажу.
                    </div>
                  </div>
                </div>
                <div className="credit-step">
                  <div className="credit-step-num">7</div>
                  <div>
                    <div className="credit-step-title">Користуєтесь сонячною енергією!</div>
                    <div className="credit-step-desc">
                      Система працює автоматично. Ви економите на електроенергії, а щомісячний платіж
                      по кредиту — 0% переплати, тільки тіло кредиту. Моніторинг — через додаток.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BANKS */}
            <div className="credit-block">
              <h2>🏦 Банки-партнери програми</h2>
              <p>
                Програма «Джерела енергії» реалізується через 43+ банки-партнери.
                Ось основні банки, де можна оформити кредит:
              </p>
              <div className="credit-banks-grid">
                {[
                  ['ПриватБанк', 'Онлайн через Приват24'],
                  ['Ощадбанк', 'У відділенні або онлайн'],
                  ['Укргазбанк', 'Програма «Еко-енергія»'],
                  ['Глобус Банк', 'Без першого внеску'],
                  ['Сенс Банк', '«Джерело Енергії»'],
                  ['Райффайзен Банк', 'У відділенні'],
                  ['ОТП Банк', 'Програма OTP Energy'],
                  ['Банк Львів', 'У відділенні'],
                ].map(([name, note], i) => (
                  <div className="credit-bank-card" key={i}>
                    <div className="credit-bank-name">{name}</div>
                    <div className="credit-bank-note">{note}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
                Повний список банків-партнерів — на сайті Фонду розвитку підприємництва.
                Умови можуть відрізнятися залежно від банку.
              </p>
            </div>

            {/* IMPORTANT TO KNOW */}
            <div className="credit-block">
              <h2>⚠️ Важливо знати</h2>

              <div className="credit-warning">
                <div className="credit-warning-title">❌ «Зелений тариф» — заборонено</div>
                <div className="credit-warning-text">
                  Підключення «зеленого тарифу» (продаж надлишків електроенергії в мережу)
                  є підставою для втрати права на компенсацію. Програма розрахована
                  виключно на власне споживання.
                </div>
              </div>

              <div className="credit-warning">
                <div className="credit-warning-title">⏰ Прострочення платежу — понад 30 днів</div>
                <div className="credit-warning-text">
                  У разі прострочення платежу більш ніж на 30 днів ви втрачаєте право на
                  державну компенсацію відсотків. Після цього банк нараховує ринкову ставку.
                </div>
              </div>

              <div className="credit-warning">
                <div className="credit-warning-title">📸 Введення в експлуатацію — 180 днів</div>
                <div className="credit-warning-text">
                  Протягом 180 днів після отримання кредиту необхідно підтвердити банку
                  введення обладнання в експлуатацію. SolarBalkon надає фотозвіт одразу
                  після встановлення — зазвичай протягом тижня.
                </div>
              </div>

              <div className="credit-warning">
                <div className="credit-warning-title">🔍 Перевірка кожні 6 місяців</div>
                <div className="credit-warning-text">
                  Кожні 6 місяців потрібно підтвердити банку цільове використання обладнання.
                  Це робиться через фото або через додаток моніторингу системи.
                </div>
              </div>
            </div>

            {/* BUSINESS */}
            <div className="credit-block">
              <h2>🏢 Для бізнесу та ОСББ</h2>
              <p>
                Для юридичних осіб, ФОП та ОСББ діє окрема програма —
                «Доступні кредити 5-7-9%»:
              </p>
              <div className="credit-docs-grid">
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">💵</div>
                  <div>
                    <div className="credit-doc-name">До 5 000 000 грн</div>
                    <div className="credit-doc-note">Максимальна сума кредиту</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">📅</div>
                  <div>
                    <div className="credit-doc-name">До 10 років</div>
                    <div className="credit-doc-note">Термін кредитування</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">📈</div>
                  <div>
                    <div className="credit-doc-name">5-9% річних</div>
                    <div className="credit-doc-note">Пільгова ставка з держпідтримкою</div>
                  </div>
                </div>
                <div className="credit-doc-item">
                  <div className="credit-doc-icon">🏗️</div>
                  <div>
                    <div className="credit-doc-name">Без обмежень потужності</div>
                    <div className="credit-doc-note">Проєкти будь-якого масштабу</div>
                  </div>
                </div>
              </div>
              <p>
                Зверніться до нас — ми підготуємо бізнес-план та повний пакет технічної
                документації для подачі в банк.
              </p>
            </div>

            {/* CTA */}
            <div className="credit-company-box">
              <h3>🤝 Готові оформити кредит 0%?</h3>
              <p>
                Зв'яжіться з нами — ми безкоштовно підберемо систему, підготуємо всі документи
                для банку та встановимо обладнання. Від заявки до встановлення — 2 тижні.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <a href="https://t.me/solarbalkonshop" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px',
                    background: '#0088cc', color: 'white', borderRadius: '50px', fontWeight: 600,
                    fontSize: '1rem', textDecoration: 'none', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.target.style.transform = 'none'}
                >
                  💬 Telegram
                </a>
                <a href="tel:+380XXXXXXXXX"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px',
                    background: 'var(--green-600)', color: 'white', borderRadius: '50px', fontWeight: 600,
                    fontSize: '1rem', textDecoration: 'none', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.target.style.transform = 'none'}
                >
                  📞 Зателефонувати
                </a>
                <a href="mailto:manager@solarbalkon.shop"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px',
                    border: '2px solid var(--green-500)', color: 'var(--green-700)', borderRadius: '50px', fontWeight: 600,
                    fontSize: '1rem', textDecoration: 'none', background: 'white', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.target.style.transform = 'none'}
                >
                  ✉️ Email
                </a>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0 3rem' }}>
              <button className="hero-cta" onClick={() => goToPage('home')}>
                ← Повернутися до калькулятора
              </button>
            </div>
          </div>

          <SocialFooter />
        </div>
      )}

      {/* ORDER FORM MODAL */}
      {showOrderForm && (
        <div className="order-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowOrderForm(false); }}>
          <div className="order-modal">
            <div className="order-modal-header">
              <h2>{orderStatus === 'sent' ? 'Дякуємо!' : 'Оформити замовлення'}</h2>
              <button className="order-close" onClick={() => setShowOrderForm(false)}>✕</button>
            </div>
            <div className="order-modal-body">

              {orderStatus === 'sent' ? (
                <div className="order-success">
                  <div className="order-success-icon">✅</div>
                  <h3>Замовлення відправлено!</h3>
                  <p>
                    Ми отримали вашу заявку і зв'яжемося з вами найближчим часом
                    для уточнення деталей та узгодження доставки.
                  </p>
                  <button
                    className="order-submit"
                    style={{ marginTop: '1.5rem' }}
                    onClick={() => setShowOrderForm(false)}
                  >
                    Закрити
                  </button>
                </div>
              ) : (
                <>
                  {/* ORDER SUMMARY */}
                  <div className="order-summary">
                    {directOrder ? (
                      <>
                        <div className="order-summary-row">
                          <span>Система:</span>
                          <span style={{ fontWeight: 600 }}>{directOrder.name}</span>
                        </div>
                        <div className="order-summary-row" style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                          <span>Без додаткового обладнання</span>
                          <span></span>
                        </div>
                        <div className="order-summary-row total">
                          <span>Разом:</span>
                          <span>{formatPrice(directOrder.price)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="order-summary-row">
                          <span>Система:</span>
                          <span style={{ fontWeight: 600 }}>
                            {PRODUCTS.find(p => p.key === configSystem)?.name}
                          </span>
                        </div>
                        <div className="order-summary-row">
                          <span>Панелі:</span>
                          <span>{configPanels} шт</span>
                        </div>
                        {nonPanelRequired.length > 0 && nonPanelRequired.map((c, i) => (
                          <div className="order-summary-row" key={`r-${i}`}>
                            <span>{c.name}</span>
                            <span>× {c.qty}</span>
                          </div>
                        ))}
                        {configExtras.length > 0 && configExtras.map((sku, i) => {
                          const item = optionalComponents.find(c => c.sku === sku);
                          return item ? (
                            <div className="order-summary-row" key={`e-${i}`}>
                              <span>{item.name}</span>
                              <span>× {item.qty}</span>
                            </div>
                          ) : null;
                        })}
                        <div className="order-summary-row total">
                          <span>Разом:</span>
                          <span>{formatPrice(configTotal)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* FORM FIELDS */}
                  <div className="order-field">
                    <label>Ім'я та прізвище *</label>
                    <input
                      type="text"
                      placeholder="Іван Петренко"
                      value={orderForm.name}
                      onChange={e => setOrderForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="order-field">
                    <label>Телефон *</label>
                    <input
                      type="tel"
                      placeholder="+380 XX XXX XX XX"
                      value={orderForm.phone}
                      onChange={e => setOrderForm(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div className="order-field">
                    <label>Адреса доставки <span>(за бажанням)</span></label>
                    <input
                      type="text"
                      placeholder="Місто, вулиця, будинок"
                      value={orderForm.address}
                      onChange={e => setOrderForm(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>

                  {orderStatus === 'error' && (
                    <div className="order-error">
                      <p>⚠️ Не вдалося відправити. Спробуйте ще раз або зв'яжіться через Telegram.</p>
                    </div>
                  )}

                  <button
                    className="order-submit"
                    disabled={!orderForm.name.trim() || !orderForm.phone.trim() || orderStatus === 'sending'}
                    onClick={submitOrder}
                  >
                    {orderStatus === 'sending' ? '⏳ Відправляємо...' : '📩 Відправити замовлення'}
                  </button>

                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '1rem' }}>
                    Або напишіть нам напряму в <a href="https://t.me/solarbalkonshop" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-600)' }}>Telegram</a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
