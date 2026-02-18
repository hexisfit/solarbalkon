import { useState, useEffect } from "react";

const APPLIANCES = [
  { id: "fridge", name: "🧊 Холодильник", watts: 150, hours: 24, defaultOn: true },
  { id: "led4", name: "💡 LED (4 шт)", watts: 40, hours: 6, defaultOn: true },
  { id: "tv", name: "📺 Телевізор", watts: 100, hours: 5, defaultOn: true },
  { id: "laptop", name: "💻 Ноутбук", watts: 65, hours: 8, defaultOn: true },
  { id: "router", name: "📡 Wi-Fi роутер", watts: 12, hours: 24, defaultOn: true },
  { id: "phone", name: "📱 Зарядка (2)", watts: 20, hours: 3, defaultOn: false },
  { id: "microwave", name: "🍽️ Мікрохвильовка", watts: 1000, hours: 0.3, defaultOn: false },
  { id: "kettle", name: "☕ Чайник", watts: 1800, hours: 0.15, defaultOn: false },
  { id: "washer", name: "👕 Пральна", watts: 500, hours: 1.5, defaultOn: false },
  { id: "iron", name: "👔 Праска", watts: 2000, hours: 0.3, defaultOn: false },
  { id: "heater", name: "🔥 Обігрівач", watts: 1500, hours: 4, defaultOn: false },
  { id: "fan", name: "🌀 Вентилятор", watts: 50, hours: 6, defaultOn: false },
  { id: "desktop", name: "🖥️ ПК", watts: 300, hours: 6, defaultOn: false },
  { id: "monitor", name: "🖥️ Монітор", watts: 40, hours: 6, defaultOn: false },
  { id: "cashier", name: "🧾 Каса", watts: 50, hours: 12, defaultOn: false },
  { id: "coffeem", name: "☕ Кавомашина", watts: 1200, hours: 1, defaultOn: false },
  { id: "projector", name: "📽️ Проектор", watts: 300, hours: 4, defaultOn: false },
  { id: "printer", name: "🖨️ Принтер", watts: 150, hours: 2, defaultOn: false },
  { id: "ac", name: "❄️ Кондиціонер", watts: 1200, hours: 6, defaultOn: false },
  { id: "security", name: "📹 Відеонагляд", watts: 30, hours: 24, defaultOn: false },
];

const PRODUCTS = [
  { id: "ecoflow", name: "EcoFlow DELTA 3", capacity: 1024, output: 1800, maxOutput: 2600, solar: 500, cycles: 4000, warranty: 5, chargeTime: "56 хв", solarCharge: "2 год", battery: "LiFePO4", expandable: "до 5 кВт·год", ups: "10 мс", features: ["X-Stream", "X-Boost 2600Вт", "13 портів", "Додаток"], color: "#22c55e", price: "від $799", img: "⚡" },
  { id: "anker", name: "Anker SOLIX C1000", capacity: 1024, output: 2000, maxOutput: 3000, solar: 600, cycles: 4000, warranty: 5, chargeTime: "49 хв", solarCharge: "1.8 год", battery: "LiFePO4", expandable: "Ні", ups: "10 мс", features: ["HyperFlash", "TOU режим", "10 портів", "Тиха"], color: "#38bdf8", price: "від $699", img: "🔋" },
  { id: "deye", name: "Deye AE-FS2.0-2H2", capacity: 2000, output: 800, maxOutput: 800, solar: 1000, cycles: 6000, warranty: 10, chargeTime: "~2.5 год", solarCharge: "2-3 год", battery: "LiFePO4", expandable: "до 10 кВт·год", ups: "4 мс", features: ["All-in-One", "2×MPPT", "IP65", "WiFi/BT", "10кВт розш."], color: "#f97316", price: "від €699", img: "☀️" },
];

const PANEL = {
  name: "Trina TSM-455 NEG9R.28",
  type: "Vertex S+ N-type",
  watts: 455,
  efficiency: "22.8%",
  length: 1762, width: 1134, depth: 30,
  weight: 21,
  cells: 144,
  voc: "53.4 В",
  isc: "10.77 А",
  warranty: "25 років продукт / 30 років продуктивність",
  ip: "IP68",
  tempRange: "-40°C — +85°C",
  price: 3450,
};

const INVERTER = {
  name: "Deye SUN-M80G4-EU-Q0",
  watts: 800,
  maxInput: 1200,
  mppt: 2,
  efficiency: "96.5%",
  ip: "IP67",
  wifi: true,
  dims: "280.5 × 190 × 40 мм",
  weight: 3,
  warranty: "15 років",
  tempRange: "-40°C — +65°C",
  price: 6200,
};

const SMARTMETER = {
  name: "Deye SUN-SMART-CT01",
  type: "3-фази, LoRa / RS485",
  range: "до 200 м бездротово",
  dims: "53 × 96 × 64 мм",
  weight: 0.15,
  warranty: "5 років",
  price: 4000,
};

const DEYE_STORAGE_PRICE = 40000;

const SOLAR = {
  2: { watts: 800, area: `~${((PANEL.length * PANEL.width * 2) / 1e6).toFixed(1)} м²`, desc: `2 × ${PANEL.watts} Вт`, panelCost: PANEL.price * 2, invCost: INVERTER.price, meterCost: SMARTMETER.price },
  4: { watts: 1600, area: `~${((PANEL.length * PANEL.width * 4) / 1e6).toFixed(1)} м²`, desc: `4 × ${PANEL.watts} Вт`, panelCost: PANEL.price * 4, invCost: INVERTER.price * 2, meterCost: SMARTMETER.price },
};

const TARIFFS = {
  household: { label: "🏠 Побутовий", current: 4.32, future: 6.64, night: 2.16, currentLabel: "4.32 грн", futureLabel: "6.64 грн", nightLabel: "2.16 грн", desc: "Фіксований тариф для населення (до 30.04.2026).", avgCons: 250, maxCons: 800 },
  commercial: { label: "🏢 Комерційний", current: 7.50, future: 9.00, night: 5.25, currentLabel: "~7.50 грн", futureLabel: "~9.00 грн", nightLabel: "~5.25 грн", desc: "РДН (~6.9грн) + передача (0.71грн) + розподіл (~2.7грн).", avgCons: 1500, maxCons: 10000 },
};
const SUN_H = 3.5;

function C({ value, suffix = "", decimals = 0 }) {
  const [d, setD] = useState(0);
  useEffect(() => { let s = Date.now(); const r = () => { let p = Math.min((Date.now() - s) / 600, 1); setD(value * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(r); }; r(); }, [value]);
  return <span>{d.toFixed(decimals)}{suffix}</span>;
}

export default function App() {
  const [sel, setSel] = useState(APPLIANCES.filter(a => a.defaultOn).map(a => a.id));
  const [prod, setProd] = useState("deye");
  const [panels, setPanels] = useState(2);
  const [page, setPage] = useState("hero");
  const [tt, setTt] = useState("household");
  const [cons, setCons] = useState(250);
  const [showAll, setShowAll] = useState(false);
  const [showFinancing, setShowFinancing] = useState(false);

  const t = TARIFFS[tt];
  const switchT = v => { setTt(v); setCons(TARIFFS[v].avgCons); };
  const toggle = id => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const product = PRODUCTS.find(p => p.id === prod);
  const solar = SOLAR[panels];
  const totalW = APPLIANCES.filter(a => sel.includes(a.id)).reduce((s, a) => s + a.watts, 0);
  const dailyWh = APPLIANCES.filter(a => sel.includes(a.id)).reduce((s, a) => s + a.watts * a.hours, 0);
  const runtime = product ? (product.capacity / (totalW || 1)).toFixed(1) : 0;
  const canPower = product ? totalW <= product.output : false;
  const dSolar = (solar.watts * SUN_H) / 1000;
  const mSolar = dSolar * 30;
  const savNow = mSolar * t.current;
  const savFut = mSolar * t.future;
  const selfPct = Math.min(100, Math.round((mSolar / (cons || 1)) * 100));
  const bill = cons * t.current;
  const billAfter = Math.max(0, cons - mSolar) * t.current;

  // Deye system pricing
  const sysTotal = DEYE_STORAGE_PRICE + solar.panelCost + solar.invCost + solar.meterCost;
  const payback = savNow > 0 ? (sysTotal / (savNow * 12)).toFixed(1) : "∞";
  const monthlyCredit = (sysTotal / 120).toFixed(0); // 10 years = 120 months at 0%
  const items = showAll ? APPLIANCES : APPLIANCES.slice(0, 10);

  const S = { bg: "#080c15", card: "rgba(255,255,255,0.03)", brd: "rgba(255,255,255,0.06)", gold: "#fbbf24", txt: "#e5e7eb", mut: "#6b7280", grn: "#34d399", pnk: "#f472b6", blu: "#60a5fa", org: "#f97316", vio: "#a78bfa" };

  const Pill = ({ active, color, children, onClick }) => (
    <button onClick={onClick} style={{ padding: "10px 20px", borderRadius: 12, border: `1.5px solid ${active ? color + "60" : S.brd}`, background: active ? color + "12" : "transparent", color: active ? color : S.mut, fontFamily: "Space Grotesk,sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.25s" }}>{children}</button>
  );
  const Cd = ({ children, style = {} }) => <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 18, padding: 24, ...style }}>{children}</div>;
  const Bar = ({ pct, color = S.gold, h = 8 }) => (
    <div style={{ height: h, borderRadius: h / 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: h / 2, transition: "width 0.6s", width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg,${color},${color}cc)` }} />
    </div>
  );
  const Spec = ({ label, value, color = S.txt }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${S.brd}`, fontSize: 12 }}>
      <span style={{ color: S.mut }}>{label}</span><span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", background: S.bg, color: S.txt, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#fbbf24;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{text-shadow:0 0 20px rgba(251,191,36,0.3)}50%{text-shadow:0 0 40px rgba(251,191,36,0.6)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        input[type=range]{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;background:rgba(255,255,255,0.08);outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fbbf24;cursor:pointer;box-shadow:0 2px 8px rgba(251,191,36,0.4)}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,12,21,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${S.brd}`, padding: "10px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 16 }}>
              <span style={{ color: S.gold }}>Solar</span><span>Balkon</span>
              <span style={{ color: S.mut, fontSize: 11, fontWeight: 400, marginLeft: 4 }}>.ua</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[["hero","🏠"],["calc","🔌"],["products","📊"],["solar","☀️"],["savings","💰"]].map(([id, l]) => (
              <button key={id} onClick={() => setPage(id)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Space Grotesk,sans-serif", fontSize: 13, fontWeight: 500, background: page === id ? "rgba(251,191,36,0.12)" : "transparent", color: page === id ? S.gold : S.mut, transition: "all 0.2s" }}>
                {l} {id === "hero" ? "Головна" : id === "calc" ? "Калькулятор" : id === "products" ? "Системи" : id === "solar" ? "Панелі" : "Економія"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      {page === "hero" && (
        <div style={{ animation: "fadeUp 0.5s", padding: "50px 16px", textAlign: "center", position: "relative", overflow: "hidden", minHeight: "85vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: "-30%", right: "-15%", width: "60%", height: "120%", background: "radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(251,191,36,0.1)", color: S.gold, border: "1px solid rgba(251,191,36,0.2)", marginBottom: 16 }}>🇺🇦 Для дому та бізнесу • Кредит 0% від держави</span>
            <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(34px,6vw,64px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 20, letterSpacing: "-2px" }}>
              Балконна<br /><span style={{ color: S.gold, animation: "glow 3s infinite" }}>електростанція</span>
            </h1>
            <p style={{ fontSize: "clamp(15px,2vw,18px)", color: S.mut, lineHeight: 1.7, maxWidth: 600, margin: "0 auto 36px" }}>
              Сонячні панелі + накопичувач. Державний кредит 0% до 480 000 грн на 10 років.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setPage("calc")} style={{ background: `linear-gradient(135deg, ${S.gold}, #f59e0b)`, color: "#080c15", border: "none", padding: "14px 32px", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Space Grotesk,sans-serif", boxShadow: "0 4px 20px rgba(251,191,36,0.25)" }}>🔌 Калькулятор</button>
              <button onClick={() => setPage("solar")} style={{ background: "transparent", color: S.gold, border: "2px solid rgba(251,191,36,0.3)", padding: "12px 28px", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "Space Grotesk,sans-serif" }}>☀️ Обладнання та ціни →</button>
            </div>

            {/* Tariff + financing cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, maxWidth: 850, margin: "46px auto 0" }}>
              <Cd style={{ textAlign: "center", padding: 20, borderTop: `3px solid ${S.blu}` }}>
                <div style={{ fontSize: 10, color: S.blu, fontWeight: 600, marginBottom: 4 }}>🏠 ПОБУТОВИЙ</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800, color: S.gold }}>4.32 грн</div>
                <div style={{ fontSize: 10, color: S.mut }}>→ 6.64 грн прогноз</div>
              </Cd>
              <Cd style={{ textAlign: "center", padding: 20, borderTop: `3px solid ${S.org}` }}>
                <div style={{ fontSize: 10, color: S.org, fontWeight: 600, marginBottom: 4 }}>🏢 КОМЕРЦІЙНИЙ</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800, color: S.org }}>~7.50 грн</div>
                <div style={{ fontSize: 10, color: S.mut }}>→ ~9.00 грн прогноз</div>
              </Cd>
              <Cd style={{ textAlign: "center", padding: 20, borderTop: `3px solid ${S.grn}` }}>
                <div style={{ fontSize: 10, color: S.grn, fontWeight: 600, marginBottom: 4 }}>🏦 КРЕДИТ 0%</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800, color: S.grn }}>480к грн</div>
                <div style={{ fontSize: 10, color: S.mut }}>на 10 років від держави</div>
              </Cd>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 32, maxWidth: 920, marginLeft: "auto", marginRight: "auto" }}>
              {[
                { i: "🛡️", t: "Блекаути", d: "UPS 4-10 мс", c: S.gold },
                { i: "📉", t: "Менші рахунки", d: "Дім -40%, бізнес -30%", c: S.grn },
                { i: "🔌", t: "Plug & Play", d: "Без електрика", c: S.blu },
                { i: "💼", t: "Для бізнесу", d: "Окупність 1.5-3 р.", c: S.org },
                { i: "🏦", t: "Кредит 0%", d: "Джерела енергії", c: S.grn },
                { i: "🌱", t: "10+ років", d: "LiFePO4, 6000 циклів", c: S.vio },
              ].map((f, i) => (
                <div key={i} style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 5, animation: `float ${3 + i * 0.4}s ease-in-out infinite` }}>{f.i}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: f.c, marginBottom: 2 }}>{f.t}</div>
                  <div style={{ fontSize: 10, color: S.mut }}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ CALCULATOR ============ */}
      {page === "calc" && (
        <div style={{ animation: "fadeUp 0.4s", padding: "40px 16px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, textAlign: "center", marginBottom: 4 }}>⚡ Калькулятор потреб</h2>
          <p style={{ color: S.mut, textAlign: "center", fontSize: 13, marginBottom: 20 }}>Тариф → прилади → система</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            <Pill active={tt === "household"} color={S.blu} onClick={() => switchT("household")}>🏠 Побутовий</Pill>
            <Pill active={tt === "commercial"} color={S.org} onClick={() => switchT("commercial")}>🏢 Комерційний</Pill>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 11, color: S.mut, marginBottom: 8 }}>{tt === "commercial" ? "Обладнання:" : "Прилади:"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {items.map(a => (
                  <button key={a.id} onClick={() => toggle(a.id)} style={{ padding: "7px 10px", borderRadius: 9, cursor: "pointer", border: `1px solid ${sel.includes(a.id) ? "rgba(251,191,36,0.4)" : S.brd}`, background: sel.includes(a.id) ? "rgba(251,191,36,0.08)" : S.card, color: sel.includes(a.id) ? S.gold : S.mut, fontSize: 11, fontFamily: "Space Grotesk,sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                    {a.name} <span style={{ fontSize: 9, opacity: 0.5 }}>{a.watts}Вт</span>
                  </button>
                ))}
              </div>
              {!showAll && <button onClick={() => setShowAll(true)} style={{ marginTop: 6, background: "none", border: "none", color: S.gold, cursor: "pointer", fontSize: 11 }}>+ Більше</button>}
              <Cd style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: S.mut }}>Потужність</span>
                  <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, color: totalW > (product?.output || 0) ? "#ef4444" : S.gold, fontSize: 16 }}><C value={totalW} suffix=" Вт" /></span>
                </div>
                <Bar pct={(totalW / (product?.output || 1800)) * 100} color={totalW > (product?.output || 0) ? "#ef4444" : S.gold} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: S.mut }}>Денне</span>
                  <span style={{ fontWeight: 700, color: S.grn }}><C value={dailyWh / 1000} suffix=" кВт·год" decimals={1} /></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: S.mut }}>Вартість/день</span>
                  <span style={{ fontWeight: 700, color: S.pnk }}><C value={(dailyWh / 1000) * t.current} suffix=" грн" decimals={1} /></span>
                </div>
                <div style={{ marginTop: 10, padding: 9, borderRadius: 10, background: canPower ? "rgba(52,211,153,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${canPower ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)"}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: canPower ? S.grn : "#ef4444" }}>{canPower ? "✅ Покриває" : "⚠️ Перевищено"}</div>
                  {canPower && totalW > 0 && <div style={{ fontSize: 11, color: S.mut, marginTop: 2 }}>Автономність: <strong style={{ color: S.gold }}>~{runtime} год</strong></div>}
                </div>
              </Cd>
            </div>
            <div>
              <div style={{ fontSize: 11, color: S.mut, marginBottom: 8 }}>Система:</div>
              {PRODUCTS.map(p => (
                <div key={p.id} onClick={() => setProd(p.id)} style={{ background: prod === p.id ? `${p.color}08` : S.card, border: `1px solid ${prod === p.id ? p.color + "50" : S.brd}`, borderRadius: 14, padding: 14, marginBottom: 7, cursor: "pointer", transition: "all 0.3s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 26 }}>{p.img}</span>
                      <div><div style={{ fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 800 }}>{p.name}</div><div style={{ fontSize: 10, color: S.mut }}>{p.capacity}Вт·год • {p.output}Вт</div></div>
                    </div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: 12, fontWeight: 800, color: p.color }}>{p.price}</div>
                  </div>
                  {prod === p.id && (
                    <div style={{ marginTop: 10, animation: "fadeUp 0.3s" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
                        {[["Ємність", `${p.capacity}Вт·год`], ["Вихід", `${p.output}Вт`], ["Макс", `${p.maxOutput}Вт`], ["Сонце", `${p.solar}Вт`], ["Зарядка", p.chargeTime], ["Батарея", p.battery], ["Цикли", `${p.cycles}`], ["Гарантія", `${p.warranty}р.`], ["UPS", p.ups]].map(([l, v]) => (
                          <div key={l} style={{ fontSize: 10 }}><span style={{ color: S.mut }}>{l}: </span><span style={{ fontWeight: 600 }}>{v}</span></div>
                        ))}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 6 }}>
                        {p.features.map(f => <span key={f} style={{ padding: "2px 6px", borderRadius: 10, fontSize: 9, fontWeight: 600, background: p.color + "12", color: p.color }}>{f}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ PRODUCTS ============ */}
      {page === "products" && (
        <div style={{ animation: "fadeUp 0.4s", padding: "40px 16px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, textAlign: "center", marginBottom: 26 }}>📊 Порівняння систем</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {PRODUCTS.map(p => (
              <div key={p.id} style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 16, borderTop: `3px solid ${p.color}`, padding: 20 }}>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 36, marginBottom: 6 }}>{p.img}</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 800 }}>{p.name}</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800, color: p.color, marginTop: 4 }}>{p.price}</div>
                </div>
                {[["Ємність", `${p.capacity}Вт·год`, p.capacity / 20], ["Вихід", `${p.output}Вт`, p.output / 20], ["Сонце", `${p.solar}Вт`, p.solar / 10], ["Цикли", `${p.cycles}`, p.cycles / 60], ["Гарантія", `${p.warranty}р.`, p.warranty * 10]].map(([l, v, b]) => (
                  <div key={l} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}><span style={{ color: S.mut }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                    <Bar pct={b} color={p.color} h={5} />
                  </div>
                ))}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 8 }}>
                  {p.features.map(f => <span key={f} style={{ padding: "2px 6px", borderRadius: 10, fontSize: 9, fontWeight: 600, background: p.color + "10", color: p.color }}>{f}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ SOLAR — with panel specs, pricing, financing ============ */}
      {page === "solar" && (
        <div style={{ animation: "fadeUp 0.4s", padding: "40px 16px", maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, textAlign: "center", marginBottom: 6 }}>☀️ Обладнання та ціни</h2>
          <p style={{ color: S.mut, textAlign: "center", fontSize: 13, marginBottom: 22 }}>Система Deye «під ключ» + державне кредитування 0%</p>

          {/* Panel selector */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <div style={{ display: "flex", background: S.card, borderRadius: 14, padding: 4, border: `1px solid ${S.brd}` }}>
              {[2, 4].map(n => <button key={n} onClick={() => setPanels(n)} style={{ padding: "10px 22px", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "Space Grotesk,sans-serif", fontWeight: 600, fontSize: 13, background: panels === n ? `linear-gradient(135deg,${S.gold},#f59e0b)` : "transparent", color: panels === n ? "#080c15" : S.mut, transition: "all 0.3s" }}>{n} панелі ({SOLAR[n].watts} Вт)</button>)}
            </div>
          </div>

          {/* ---- PANEL CARD with dimensions ---- */}
          <Cd style={{ marginBottom: 16, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: "1 1 320px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 32 }}>🔲</span>
                  <div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 800 }}>{PANEL.name}</div>
                    <div style={{ fontSize: 11, color: S.mut }}>{PANEL.type} • Монокристал 210мм • {PANEL.cells} комірок</div>
                  </div>
                </div>
                <Spec label="Потужність" value={`${PANEL.watts} Вт`} color={S.gold} />
                <Spec label="ККД" value={PANEL.efficiency} color={S.grn} />
                <Spec label="Напруга хол. ходу" value={PANEL.voc} />
                <Spec label="Струм к.з." value={PANEL.isc} />
                <Spec label="Захист" value={PANEL.ip} />
                <Spec label="Температура" value={PANEL.tempRange} />
                <Spec label="Гарантія" value={PANEL.warranty} color={S.grn} />
                <Spec label="Ціна" value={`${PANEL.price.toLocaleString()} грн / шт`} color={S.gold} />
              </div>

              {/* DIMENSIONS VISUAL */}
              <div style={{ flex: "0 0 280px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: S.gold, fontWeight: 600, marginBottom: 8 }}>📐 ГАБАРИТИ ПАНЕЛІ</div>
                <div style={{ position: "relative", width: 180, height: 250, margin: "0 auto", border: `2px solid ${S.gold}40`, borderRadius: 8, background: "rgba(251,191,36,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* Height label */}
                  <div style={{ position: "absolute", right: -54, top: "50%", transform: "translateY(-50%) rotate(90deg)", fontSize: 11, fontWeight: 700, color: S.gold, whiteSpace: "nowrap" }}>
                    {PANEL.length} мм
                  </div>
                  {/* Width label */}
                  <div style={{ position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: S.gold }}>
                    {PANEL.width} мм
                  </div>
                  {/* Depth */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>☀️</div>
                    <div style={{ fontSize: 10, color: S.mut }}>товщина</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: S.gold }}>{PANEL.depth} мм</div>
                    <div style={{ fontSize: 10, color: S.mut, marginTop: 4 }}>вага</div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{PANEL.weight} кг</div>
                  </div>
                  {/* Corner marks */}
                  {[[0,0],[1,0],[0,1],[1,1]].map(([x,y],i)=>(
                    <div key={i} style={{position:"absolute",[y?"bottom":"top"]:2,[x?"right":"left"]:2,width:12,height:12,borderColor:S.gold+"60",borderStyle:"solid",borderWidth:0,[`border${y?"Bottom":"Top"}Width`]:2,[`border${x?"Right":"Left"}Width`]:2,[`border${y?"Bottom":"Top"}${x?"Right":"Left"}Radius`]:3}} />
                  ))}
                </div>
                <div style={{ marginTop: 28, fontSize: 11, color: S.mut, lineHeight: 1.6 }}>
                  <strong style={{ color: S.txt }}>{panels} панелі:</strong><br />
                  {panels === 2 ? `${PANEL.length} × ${PANEL.width * 2} мм (в ряд)` : `${PANEL.length * 2} × ${PANEL.width * 2} мм (2×2)`}<br/>
                  Площа: <strong style={{ color: S.grn }}>{solar.area}</strong> • Вага: <strong>{PANEL.weight * panels} кг</strong>
                </div>
              </div>
            </div>
          </Cd>

          {/* ---- INVERTER + SMART METER ---- */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <Cd style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>⚡</span>
                <div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 800 }}>Мікроінвертор</div>
                  <div style={{ fontSize: 10, color: S.mut }}>{INVERTER.name}</div>
                </div>
              </div>
              <Spec label="Потужність" value={`${INVERTER.watts} Вт`} color={S.org} />
              <Spec label="Макс. вхід" value={`${INVERTER.maxInput} Вт`} />
              <Spec label="MPPT" value={`${INVERTER.mppt} трекери`} />
              <Spec label="ККД" value={INVERTER.efficiency} color={S.grn} />
              <Spec label="Захист" value={INVERTER.ip} />
              <Spec label="Розміри" value={INVERTER.dims} />
              <Spec label="Вага" value={`${INVERTER.weight} кг`} />
              <Spec label="WiFi" value="✅ Моніторинг через додаток" color={S.grn} />
              <Spec label="Гарантія" value={INVERTER.warranty} color={S.grn} />
              <Spec label="Ціна" value={`${INVERTER.price.toLocaleString()} грн / шт`} color={S.gold} />
              <div style={{ fontSize: 10, color: S.mut, marginTop: 6 }}>
                {panels === 2 ? "× 1 шт (2 входи для 2 панелей)" : "× 2 шт (для 4 панелей)"}
              </div>
            </Cd>
            <Cd style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>📊</span>
                <div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 800 }}>Смарт-лічильник</div>
                  <div style={{ fontSize: 10, color: S.mut }}>{SMARTMETER.name}</div>
                </div>
              </div>
              <Spec label="Тип" value={SMARTMETER.type} />
              <Spec label="Дальність" value={SMARTMETER.range} />
              <Spec label="Розміри" value={SMARTMETER.dims} />
              <Spec label="Вага" value={`${SMARTMETER.weight} кг`} />
              <Spec label="Гарантія" value={SMARTMETER.warranty} />
              <Spec label="Ціна" value={`${SMARTMETER.price.toLocaleString()} грн`} color={S.gold} />
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 26 }}>🔋</span>
                  <div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 800 }}>Накопичувач Deye</div>
                    <div style={{ fontSize: 10, color: S.mut }}>AE-FS2.0-2H2 • 2 кВт·год LiFePO4</div>
                  </div>
                </div>
                <Spec label="Ємність" value="2000 Вт·год" color={S.org} />
                <Spec label="Цикли" value="6000" />
                <Spec label="Ціна" value={`${DEYE_STORAGE_PRICE.toLocaleString()} грн`} color={S.gold} />
              </div>
            </Cd>
          </div>

          {/* ---- TOTAL PRICE ---- */}
          <Cd style={{ padding: 22, borderLeft: `3px solid ${S.gold}`, marginBottom: 16 }}>
            <div style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 12 }}>💰 Вартість системи «під ключ» ({panels} панелі)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4 }}>
              {[
                [`🔋 Накопичувач Deye AE-FS2.0-2H2`, `${DEYE_STORAGE_PRICE.toLocaleString()} грн`],
                [`☀️ Панелі ${PANEL.name} × ${panels} шт`, `${solar.panelCost.toLocaleString()} грн`],
                [`⚡ Інвертор ${INVERTER.name} × ${panels === 2 ? 1 : 2} шт`, `${solar.invCost.toLocaleString()} грн`],
                [`📊 Смарт-лічильник ${SMARTMETER.name}`, `${solar.meterCost.toLocaleString()} грн`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "contents" }}>
                  <div style={{ fontSize: 12, color: S.mut, padding: "4px 0" }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right", padding: "4px 0" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `2px solid ${S.gold}40`, marginTop: 8, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800 }}>Разом:</span>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800, color: S.gold }}>{sysTotal.toLocaleString()} грн</span>
            </div>
          </Cd>

          {/* ---- GOVERNMENT FINANCING ---- */}
          <Cd style={{ padding: 22, borderLeft: `3px solid ${S.grn}`, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 800, color: S.grn }}>🏦 Державна програма «Джерела енергії»</div>
                <div style={{ fontSize: 11, color: S.mut, marginTop: 3 }}>Безвідсотковий кредит від держави • 43+ банки-партнери</div>
              </div>
              <button onClick={() => setShowFinancing(!showFinancing)} style={{ background: "rgba(52,211,153,0.1)", border: `1px solid rgba(52,211,153,0.2)`, color: S.grn, padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {showFinancing ? "Згорнути" : "Детальніше ↓"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: showFinancing ? 16 : 0 }}>
              {[
                ["0%", "Ставка", "Повна компенсація відсотків державою"],
                [`${sysTotal.toLocaleString()} грн`, "Ваша система", `${panels} панелі + накопичувач + інвертор`],
                [`~${monthlyCredit} грн/міс`, "Платіж", "На 10 років без переплати"],
                [`~${payback} р.`, "Окупність", `При тарифі ${t.currentLabel}/кВт·год`],
              ].map(([val, label, desc]) => (
                <div key={label} style={{ textAlign: "center", padding: 12, borderRadius: 12, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.08)" }}>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, color: S.grn }}>{val}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{label}</div>
                  <div style={{ fontSize: 9, color: S.mut, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>

            {showFinancing && (
              <div style={{ animation: "fadeUp 0.3s" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: S.grn }}>Умови програми:</div>
                <div style={{ fontSize: 11, color: S.mut, lineHeight: 2 }}>
                  ✓ Кредит до <strong style={{ color: S.txt }}>480 000 грн</strong> на термін до <strong style={{ color: S.txt }}>10 років</strong><br />
                  ✓ Ставка <strong style={{ color: S.grn }}>0%</strong> — відсотки компенсує держава (ФРП)<br />
                  ✓ Компенсація до <strong style={{ color: S.txt }}>30% тіла кредиту</strong> (до ~244 000 грн)<br />
                  ✓ Без застави, без першого внеску (Глобус Банк та ін.)<br />
                  ✓ Потужність системи — до <strong style={{ color: S.txt }}>10 кВт</strong><br />
                  ✓ Площа будинку — до 300 м² (для приватних осіб)<br />
                  ✓ 43+ банки: ПриватБанк, Ощадбанк, Сенс Банк, Укргазбанк, Райффайзен, Глобус та ін.<br />
                  ✓ Фотозвіт про встановлення — протягом 90 днів<br />
                  ⚠️ Підключення «зеленого тарифу» не дозволяється
                </div>
                <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.1)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.org, marginBottom: 4 }}>💼 Для бізнесу: «Доступні кредити 5-7-9%»</div>
                  <div style={{ fontSize: 11, color: S.mut, lineHeight: 1.8 }}>
                    ✓ До 150 млн грн на термін до 10 років<br />
                    ✓ Ставка 5-9% (менше на прифронтових територіях)<br />
                    ✓ Кредитні «канікули» 6-12 місяців
                  </div>
                </div>
              </div>
            )}
          </Cd>

          {/* ---- WHERE TO INSTALL ---- */}
          <Cd style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📐 Де встановити ({panels} панелі — {solar.area})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { p: "Перила балкону", d: `${PANEL.length}×${PANEL.width}мм × ${panels} вертик.`, i: "🏗️", ok: panels <= 2 },
                { p: "Козирок / навіс", d: `Під кутом 30-45°, макс. ефект.`, i: "🏠", ok: true },
                { p: "Плоский дах", d: `${panels} панелі на кронштейнах`, i: "🏘️", ok: true },
                { p: "Фасад / стіна", d: `${panels} панелі вертикально`, i: "🏢", ok: true },
              ].map(x => (
                <div key={x.p} style={{ display: "flex", gap: 10, alignItems: "center", padding: 10, borderRadius: 10, background: x.ok ? "rgba(52,211,153,0.03)" : "transparent", border: `1px solid ${x.ok ? "rgba(52,211,153,0.1)" : S.brd}` }}>
                  <span style={{ fontSize: 20 }}>{x.i}</span>
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: x.ok ? S.grn : S.mut }}>{x.p} {x.ok && "✓"}</div><div style={{ fontSize: 10, color: S.mut }}>{x.d}</div></div>
                </div>
              ))}
            </div>
          </Cd>
        </div>
      )}

      {/* ============ SAVINGS ============ */}
      {page === "savings" && (
        <div style={{ animation: "fadeUp 0.4s", padding: "40px 16px", maxWidth: 780, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, textAlign: "center", marginBottom: 20 }}>💰 Розрахунок економії</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            <Pill active={tt === "household"} color={S.blu} onClick={() => switchT("household")}>🏠 Побутовий</Pill>
            <Pill active={tt === "commercial"} color={S.org} onClick={() => switchT("commercial")}>🏢 Комерційний</Pill>
          </div>

          <Cd style={{ marginBottom: 14, padding: 14, borderLeft: `3px solid ${tt === "commercial" ? S.org : S.blu}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 11, color: S.mut, maxWidth: 340 }}>{t.desc}</div>
              <div style={{ display: "flex", gap: 12 }}>
                {[["Зараз", t.currentLabel, S.gold], ["Ніч", t.nightLabel, S.grn], ["Прогноз", t.futureLabel, S.pnk]].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: S.mut }}>{l}</div><div style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 800, color: c }}>{v}</div></div>
                ))}
              </div>
            </div>
          </Cd>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", background: S.card, borderRadius: 12, padding: 3, border: `1px solid ${S.brd}` }}>
              {[2, 4].map(n => <button key={n} onClick={() => setPanels(n)} style={{ padding: "7px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Space Grotesk,sans-serif", fontWeight: 600, fontSize: 12, background: panels === n ? `linear-gradient(135deg,${S.gold},#f59e0b)` : "transparent", color: panels === n ? "#080c15" : S.mut }}>{n} пан. ({SOLAR[n].watts}Вт)</button>)}
            </div>
          </div>

          <Cd style={{ padding: 24 }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: S.mut }}>Споживання</span>
                <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, color: S.gold }}>{cons} кВт·год/міс</span>
              </div>
              <input type="range" min={tt === "commercial" ? 200 : 100} max={t.maxCons} value={cons} onChange={e => setCons(+e.target.value)} />
            </div>

            <div style={{ marginBottom: 18, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${S.brd}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#ef4444", fontWeight: 600 }}>Без системи</div><div style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, color: "#ef4444" }}><C value={bill} suffix=" грн" decimals={0} /></div></div>
                <div style={{ fontSize: 20, color: S.gold }}>→</div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: S.grn, fontWeight: 600 }}>З системою</div><div style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, color: S.grn }}><C value={billAfter} suffix=" грн" decimals={0} /></div></div>
              </div>
              <div style={{ textAlign: "center", marginTop: 6, fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 800, color: S.gold }}>
                Економія: <C value={savNow} suffix=" грн/міс" decimals={0} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[[`Зараз (${t.currentLabel})`, savNow, S.gold], [`Прогноз (${t.futureLabel})`, savFut, S.pnk]].map(([l, v, c]) => (
                <div key={l} style={{ padding: 12, borderRadius: 12, background: `${c}08`, border: `1px solid ${c}15`, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: c, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800, color: c }}><C value={v} suffix=" грн/міс" decimals={0} /></div>
                  <div style={{ fontSize: 10, color: S.mut }}><C value={v * 12} suffix=" грн/рік" decimals={0} /></div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: S.mut }}>Власна генерація</span>
                <span style={{ fontWeight: 700, color: S.grn }}>{selfPct}%</span>
              </div>
              <Bar pct={selfPct} color={S.grn} h={8} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                ["⏱️ Окупність", `~${payback} р.`, S.vio],
                ["💰 За 10 років", `${(savNow * 120).toLocaleString(undefined, { maximumFractionDigits: 0 })} грн`, S.grn],
                ["🏦 Кредит 0%", `~${monthlyCredit} грн/міс`, S.blu],
              ].map(([l, v, c]) => (
                <div key={l} style={{ padding: 10, borderRadius: 12, background: `${c}08`, border: `1px solid ${c}15`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: c, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </Cd>

          <div style={{ textAlign: "center", marginTop: 28, padding: 28, background: S.card, border: `1px solid ${S.brd}`, borderRadius: 16 }}>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              Готові? <span style={{ color: S.gold }}>Система від {sysTotal.toLocaleString()} грн</span>
            </h3>
            <p style={{ color: S.mut, fontSize: 12, marginBottom: 16 }}>
              Кредит 0% = ~{monthlyCredit} грн/міс. Економія з першого місяця!
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button style={{ background: `linear-gradient(135deg,${S.gold},#f59e0b)`, color: "#080c15", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Space Grotesk,sans-serif" }}>📞 Консультація</button>
              <button style={{ background: "transparent", color: S.gold, border: "2px solid rgba(251,191,36,0.3)", padding: "10px 18px", borderRadius: 12, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>📱 Telegram</button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ background: "#060910", padding: "20px 16px", borderTop: `1px solid ${S.brd}`, marginTop: page === "hero" ? 0 : 32 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 14, color: S.gold }}>⚡ SolarBalkon<span style={{ color: "#374151", fontSize: 11 }}>.ua</span></span>
          <span style={{ fontSize: 10, color: "#374151" }}>© 2026 — Балконні енергосистеми</span>
        </div>
      </footer>
    </div>
  );
}
