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

const PRODUCTS = [
  { name: 'EcoFlow DELTA 3', capacity: 1024, output: 1800, cycles: 4000, warranty: 5, price: 'від $799', color: '#4caf50' },
  { name: 'Anker SOLIX C1000', capacity: 1024, output: 2000, cycles: 4000, warranty: 5, price: 'від $699', color: '#8bc34a' },
  { name: 'Deye AE-FS2.0-2H2', capacity: 2000, output: 800, cycles: 6000, warranty: 10, price: 'від €699', color: '#fbc02d' },
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
  display:flex; align-items:center; gap:8px;
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
  content:''; position:absolute; bottom:-100px; left:-100px;
  width:400px; height:400px; border-radius:50%;
  background: radial-gradient(circle, rgba(251,192,45,0.1) 0%, transparent 70%);
}
.hero-inner {
  max-width:1200px; margin:0 auto; width:100%;
  position:relative; z-index:1;
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
  margin-bottom:1rem;
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
  display:grid; grid-template-columns: repeat(auto-fit, minmax(320px,1fr));
  gap:1.5rem; max-width:1100px; margin:0 auto;
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
  color:var(--gray-900); margin-bottom:1.5rem;
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

/* FOOTER */
.footer {
  background:var(--gray-900); color:var(--gray-400);
  padding:3rem 2rem; text-align:center;
}
.footer-logo {
  font-family:var(--font-display);
  font-size:1.3rem; font-weight:800;
  color:white; margin-bottom:0.5rem;
}
.footer-logo span { color:var(--yellow-500); }
.footer p { font-size:0.85rem; }

/* MOBILE */
@media (max-width:768px) {
  .nav-links { display:none; }
  .hero { padding:100px 1.5rem 40px; }
  .hero h1 { font-size:2rem; }
  .section { padding:50px 1.5rem; }
  .tariff-cards { grid-template-columns:1fr 1fr; }
  .calc-grid { grid-template-columns:1fr 1fr; }
  .savings-cards { grid-template-columns:1fr; }
  .savings-stats { grid-template-columns:1fr; }
  .products-grid { grid-template-columns:1fr; }
  .equip-grid { grid-template-columns:1fr; }
  .pricing-row { grid-template-columns:1.5fr 1fr 1fr; padding:0.75rem 1rem; }
  .credit-details { gap:1rem; }
}
`;

/* ───────────────────────── COMPONENT ───────────────────────── */
export default function SolarBalkon() {
  const [tariffType, setTariffType] = useState('residential');
  const [selectedAppliances, setSelectedAppliances] = useState([0]); // Газовий котел selected by default
  const [consumption, setConsumption] = useState(250);
  const [scrolled, setScrolled] = useState(false);
  const [showMoreAppliances, setShowMoreAppliances] = useState(false);

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
          <a href="#home" className="nav-logo">☀ Solar<span>Balkon</span></a>
          <ul className="nav-links">
            <li><a href="#home">Головна</a></li>
            <li><a href="#calc">Калькулятор</a></li>
            <li><a href="#systems">Системи</a></li>
            <li><a href="#equip">Обладнання</a></li>
            <li><a href="#savings">Економія</a></li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
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
                onClick={() => setTariffType('commercial')}
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
            onClick={() => setTariffType('commercial')}
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
      <section className="section" id="systems">
        <div className="section-title fade-up">Системи накопичення</div>
        <div className="section-sub fade-up-d1">Порівняйте три рішення для зберігання енергії</div>

        <div className="products-grid">
          {PRODUCTS.map((p, i) => (
            <div className={`product-card fade-up-d${i + 1}`} key={i} style={{ borderTop: `4px solid ${p.color}` }}>
              <div className="product-name">{p.name}</div>

              <div className="product-spec">
                <span className="product-spec-label">Ємність</span>
                <span className="product-spec-value">{p.capacity} Вт·год</span>
              </div>
              <div className="product-bar-bg">
                <div className="product-bar-fill" style={{ width: `${(p.capacity / 2000) * 100}%`, background: p.color }} />
              </div>

              <div className="product-spec" style={{ marginTop: '1rem' }}>
                <span className="product-spec-label">Вихідна потужність</span>
                <span className="product-spec-value">{p.output} Вт</span>
              </div>
              <div className="product-bar-bg">
                <div className="product-bar-fill" style={{ width: `${(p.output / 2000) * 100}%`, background: p.color }} />
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

              <div className="product-price" style={{ color: p.color }}>{p.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EQUIPMENT */}
      <section className="section section-alt" id="equip">
        <div className="section-title fade-up">Обладнання</div>
        <div className="section-sub fade-up-d1">Якісні компоненти для вашої системи</div>

        <div className="equip-grid">
          {/* Panel */}
          <div className="equip-card fade-up-d1">
            <div className="equip-card-title">Trina TSM-455 NEG9R.28</div>
            <div className="equip-card-subtitle">Сонячна панель 455 Вт</div>
            {[
              ['Потужність', '455 Вт'],
              ['ККД', '22.8%'],
              ['Розміри', '1762 × 1134 × 30 мм'],
              ['Площа', '~2.0 м²'],
              ['Тип', 'N-type монокристал'],
              ['Гарантія', '25 / 30 років'],
              ['Ціна', '3,450 грн / шт'],
            ].map(([l, v], j) => (
              <div className="equip-spec" key={j}>
                <span className="equip-spec-label">{l}</span>
                <span className="equip-spec-value">{v}</span>
              </div>
            ))}
          </div>

          {/* Inverter */}
          <div className="equip-card fade-up-d2">
            <div className="equip-card-title">Deye SUN-M80G4-EU-Q0</div>
            <div className="equip-card-subtitle">Мікроінвертор 800 Вт</div>
            {[
              ['Потужність', '800 Вт'],
              ['ККД', '96.5%'],
              ['MPPT трекери', '2'],
              ['Макс. вхід', '1200 Вт'],
              ['Захист', 'IP67'],
              ['Гарантія', '15 років'],
              ['Ціна', '6,200 грн / шт'],
            ].map(([l, v], j) => (
              <div className="equip-spec" key={j}>
                <span className="equip-spec-label">{l}</span>
                <span className="equip-spec-value">{v}</span>
              </div>
            ))}
          </div>

          {/* Smart Meter */}
          <div className="equip-card fade-up-d3">
            <div className="equip-card-title">Deye SUN-SMART-CT01</div>
            <div className="equip-card-subtitle">Smart Meter 3-фазний</div>
            {[
              ["Зв'язок", 'LoRa / RS485'],
              ['Дальність', 'до 200 м'],
              ['Дисплей', 'LCD'],
              ['Монтаж', 'DIN-рейка'],
              ['Захист', 'IP20'],
              ['Гарантія', '5 років'],
              ['Ціна', '4,000 грн / шт'],
            ].map(([l, v], j) => (
              <div className="equip-spec" key={j}>
                <span className="equip-spec-label">{l}</span>
                <span className="equip-spec-value">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING TABLE */}
        <div style={{ marginTop: '3rem' }}>
          <div className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            Ціна системи «під ключ»
          </div>
          <div className="pricing-table">
            <div className="pricing-row pricing-header">
              <div className="pricing-cell">Компонент</div>
              <div className="pricing-cell">2 панелі</div>
              <div className="pricing-cell">4 панелі</div>
            </div>
            {[
              ['Накопичувач Deye', '40,000 грн', '40,000 грн'],
              ['Панелі Trina', '6,900 грн', '13,800 грн'],
              ['Інвертор Deye', '6,200 грн', '12,400 грн'],
              ['Smart Meter', '4,000 грн', '4,000 грн'],
            ].map(([c, p2, p4], j) => (
              <div className="pricing-row" key={j}>
                <div className="pricing-cell">{c}</div>
                <div className="pricing-cell">{p2}</div>
                <div className="pricing-cell">{p4}</div>
              </div>
            ))}
            <div className="pricing-row pricing-total">
              <div className="pricing-cell">РАЗОМ</div>
              <div className="pricing-cell">57,100 грн</div>
              <div className="pricing-cell">70,200 грн</div>
            </div>
          </div>
        </div>

        {/* CREDIT */}
        <div className="credit-banner">
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
      <footer className="footer">
        <div className="footer-logo">☀ Solar<span>Balkon</span></div>
        <p>© 2025 SolarBalkon.shop — Сонячна енергія для кожного балкону</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}>
          Балконні сонячні електростанції в Україні
        </p>
      </footer>
    </>
  );
}
