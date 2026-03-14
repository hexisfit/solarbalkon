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

/* ───────────────────────── ARTICLES / BLOG ───────────────────────── */
const ARTICLES = [
  {
    slug: 'yak-pravilno-pidibrati-akumulyatornu-batareyu-dlya-invertora',
    title: 'Як правильно підібрати акумуляторну батарею для інвертора?',
    excerpt: 'Повний гід з вибору акумулятора для гібридного інвертора — типи батарей, сумісність напруги, розрахунок ємності, цикли та на що звернути увагу перед покупкою.',
    date: '2026-02-24',
    author: 'SolarBalkon',
    category: 'Гід',
    tags: ['акумулятор', 'батарея', 'інвертор', 'LiFePO4', 'LV батарея', 'HV батарея', 'Deye', 'сумісність'],
    image: '/blog/battery-guide.jpg',
    readTime: 12,
    content: `
## Чому вибір батареї — це найважливіше рішення?

Акумуляторна батарея — це серце вашої сонячної системи. Саме вона визначає, скільки енергії ви зможете запасти, як довго ваш дім працюватиме при відключенні мережі, і коли система окупиться. Неправильний вибір батареї може призвести до несумісності з інвертором, передчасного зносу або навіть аварійних ситуацій.

У цій статті розглянемо усі ключові параметри, на які потрібно звернути увагу при виборі акумулятора для гібридного інвертора.

## Типи акумуляторних батарей

### LiFePO4 (літій-залізо-фосфатні) — найкращий вибір

Це стандарт для сучасних сонячних систем. LiFePO4 батареї мають кілька переваг, які роблять їх безальтернативним рішенням:

- **Безпека** — хімічно стабільні, не схильні до самозаймання навіть при пошкодженні
- **Довговічність** — 4,000–6,000 циклів заряду/розряду (10–15 років реальної експлуатації)
- **Стабільна напруга** — зберігають рівну напругу протягом 90% розряду
- **Широкий діапазон температур** — від -20°C до +55°C з функцією самопідігріву
- **Мінімальна деградація** — після 6,000 циклів зберігають 80% початкової ємності

### Li-ion NMC (літій-нікель-марганець-кобальт)

Використовуються рідше через меншу безпеку та коротший термін служби (2,000–3,000 циклів). Їх перевага — вища енергоємність при меншій вазі, але для стаціонарних систем це не критично.

### Свинцево-кислотні (AGM / GEL)

Застаріла технологія. Низька ціна компенсується суттєвими недоліками: лише 500–1,500 циклів, потрібна вентиляція, велика вага, глибина розряду лише 50%. Не рекомендуємо для нових систем.

**Висновок:** для сонячної системи обирайте виключно LiFePO4 батареї.

## Напруга: низьковольтна (LV) чи високовольтна (HV)?

Це **найважливіший параметр сумісності** з інвертором. Батарея і інвертор мають працювати на одній напрузі.

### Низьковольтні батареї (LV) — 48В

- Діапазон напруги: 40–60 В
- Підходять для інверторів серії Deye SG05LP1 та SG05LP3
- Простіше підключення, менше вимог до ізоляції
- Ідеально для побутових систем до 12 кВт
- Вищі струми заряду — швидше заповнення батареї

### Високовольтні батареї (HV) — 150–500В

- Діапазон напруги: 150–500 В (залежно від конфігурації)
- Підходять для інверторів серії Deye SG02HP3, SG01HP3
- Менші втрати на великих потужностях (30–50 кВт)
- Необхідні для комерційних систем
- Потрібна професійна установка

### Таблиця сумісності інверторів Deye з батареями

| Інвертор | Напруга батареї | Тип | Рекомендована ємність |
|---|---|---|---|
| SUN-3.6K-SG05LP1 | 48В (LV) | 1-фаза | 5–10 кВт·год |
| SUN-5K-SG05LP1 | 48В (LV) | 1-фаза | 5–15 кВт·год |
| SUN-6K-SG05LP1 | 48В (LV) | 1-фаза | 10–15 кВт·год |
| SUN-12K-SG02LP1 | 48В (LV) | 1-фаза | 10–30 кВт·год |
| SUN-6K-SG05LP3 | 48В (LV) | 3-фази | 10–15 кВт·год |
| SUN-8K-SG05LP3 | 48В (LV) | 3-фази | 10–20 кВт·год |
| SUN-12K-SG05LP3 | 48В (LV) | 3-фази | 15–30 кВт·год |
| SUN-30K-SG02HP3 | HV (150–500В) | 3-фази | 20–60 кВт·год |
| SUN-50K-SG01HP3 | HV (150–500В) | 3-фази | 30–100 кВт·год |

**Важливо:** підключення батареї невідповідної напруги до інвертора призведе до пошкодження обладнання та втрати гарантії.

## Як розрахувати необхідну ємність?

### Крок 1: Визначте добове споживання

Порахуйте, скільки кВт·год на день споживає ваш дім. Середня українська квартира — 8–12 кВт·год/день, будинок — 15–25 кВт·год/день. Для точного розрахунку скористайтесь нашим калькулятором на головній сторінці.

### Крок 2: Визначте бажану автономність

- **4–6 годин** (вечір + ніч без мережі) — мінімум для комфорту
- **8–12 годин** (повна ніч) — оптимальний варіант
- **24+ годин** (повний день) — для максимальної незалежності

### Крок 3: Формула розрахунку

**Ємність (кВт·год) = Добове споживання × (Години автономності / 24) / 0.85**

Коефіцієнт 0.85 враховує втрати на перетворення та те, що батарею не рекомендується розряджати до 0%.

### Приклади розрахунку

**Квартира:** споживання 10 кВт·год/день, автономність 8 годин
- 10 × (8/24) / 0.85 = **3.9 кВт·год** → батарея 5 кВт·год

**Будинок:** споживання 20 кВт·год/день, автономність 12 годин
- 20 × (12/24) / 0.85 = **11.8 кВт·год** → батарея 12–15 кВт·год

**Будинок з електроопаленням:** споживання 40 кВт·год/день, автономність 12 годин
- 40 × (12/24) / 0.85 = **23.5 кВт·год** → батарея 25–30 кВт·год

## Цикли заряду/розряду — показник реального ресурсу

Кількість циклів визначає, скільки разів батарея може повністю зарядитися і розрядитися до втрати 20% ємності.

- **3,000 циклів** — ~8 років при щоденному циклі
- **4,000 циклів** — ~11 років
- **6,000 циклів** — ~16 років

Якісні LiFePO4 батареї забезпечують 6,000 циклів. Це означає, що батарея переживе сам інвертор та сонячні панелі.

## Швидкість заряду та розряду (C-rate)

C-rate показує, наскільки швидко батарея може віддавати або приймати енергію:

- **0.5C** — батарея на 10 кВт·год віддає максимум 5 кВт
- **1C** — батарея на 10 кВт·год віддає максимум 10 кВт

Для побутових систем зазвичай достатньо 0.5C. Для систем з UPS-функцією (безперебійне живлення) важливо мати мінімум 1C, щоб батарея могла забезпечити пікове навантаження.

## Максимальний струм заряду інвертора

Зверніть увагу на максимальний струм заряду/розряду інвертора — це обмежує швидкість роботи з батареєю:

- **Deye SUN-3.6K:** макс. 80 А
- **Deye SUN-5K:** макс. 100 А
- **Deye SUN-6K:** макс. 135 А
- **Deye SUN-12K:** макс. 200 А

Батарея має підтримувати відповідний струм. Наприклад, для інвертора з максимальним струмом 135 А батарея на 48В забезпечить 135 × 48 = **6.48 кВт** потужності заряду/розряду.

## BMS — система управління батареєю

Battery Management System (BMS) — це «мозок» батареї. Якісна BMS забезпечує:

- **Балансування комірок** — вирівнює заряд між окремими елементами
- **Захист від перезаряду/перерозряду** — автоматичне відключення при досягненні меж
- **Температурний контроль** — підігрів при морозі, вимкнення при перегріві
- **Комунікація з інвертором** — протоколи CAN, RS485 для обміну даними
- **Моніторинг** — відстеження стану здоров'я (SOH) та заряду (SOC) кожної комірки

**Важливо:** обирайте батареї з активною BMS, що підтримує протокол зв'язку вашого інвертора. Для Deye це CAN або RS485.

## Захист та умови експлуатації

### Ступінь захисту (IP)

- **IP20** — тільки для внутрішнього використання (сухе приміщення)
- **IP55** — захист від пилу та бризок (напівзакрите приміщення)
- **IP65** — повний захист від пилу та водяних струменів (вулична установка)

Якщо батарея стоятиме на балконі чи у технічному приміщенні — обирайте мінімум IP55.

### Температурний діапазон

- **Зарядка:** зазвичай 0°C — +45°C (без самопідігріву)
- **Зарядка з підігрівом:** -20°C — +45°C
- **Розрядка:** -20°C — +55°C

Для України з її зимами функція самопідігріву батареї — обов'язкова при зовнішньому розміщенні.

## Масштабованість — можливість нарощування

Обирайте систему, яку можна розширити пізніше:

- **Deye AE-FS2.0-2H2:** від 2 до 10 кВт·год (модулі AE-F2.0 по 2 кВт·год)
- **Zendure SolarFlow:** від 2.4 до 16.8 кВт·год (модулі AB3000L)
- **EcoFlow STREAM:** від 1.92 до 11.52 кВт·год (до 6 пристроїв)
- **Стійкові батареї 48В:** як правило, від 5 до 30+ кВт·год

Початкова система на 5 кВт·год, яку можна розширити до 15 кВт·год — розумніший вибір, ніж одразу купувати 15 кВт·год.

## Чек-ліст перед покупкою

Перед тим як замовити батарею, перевірте:

1. **Напруга** — чи сумісна з вашим інвертором (LV 48В або HV)?
2. **Ємність** — чи достатньо для вашого добового споживання?
3. **Протокол зв'язку** — чи підтримує BMS протокол інвертора (CAN/RS485)?
4. **Цикли** — мінімум 4,000, ідеально 6,000+
5. **IP захист** — відповідний місцю встановлення
6. **Температура** — наявність самопідігріву при зовнішньому монтажі
7. **Гарантія** — мінімум 5 років, ідеально 10
8. **Сертифікація** — CE, UN38.3 для безпеки
9. **Масштабованість** — можливість додати модулі пізніше
10. **Максимальний струм** — відповідність параметрам інвертора

## Скільки коштує батарея?

Орієнтовні ціни на LiFePO4 батареї для гібридних інверторів у 2026 році:

- **2–3 кВт·год:** 15,000–25,000 грн (балконні системи)
- **5 кВт·год:** 30,000–45,000 грн
- **10 кВт·год:** 55,000–85,000 грн
- **15 кВт·год:** 80,000–120,000 грн
- **20+ кВт·год:** від 100,000 грн

Не забувайте про програму «Джерела енергії» — кредит 0% до 480,000 грн на 10 років з компенсацією 30%.

## Висновок

Вибір акумулятора — це баланс між ємністю, вартістю та сумісністю. Головне правило: **спочатку оберіть інвертор, потім підбирайте батарею під нього**. Не економте на якості BMS та кількості циклів — різниця у ціні між батареєю на 3,000 і 6,000 циклів часто складає лише 15–20%, а термін служби подвоюється.

Якщо вам потрібна допомога з підбором — зв'яжіться з нами через Telegram або скористайтесь конфігуратором на сайті. Ми підберемо оптимальну пару інвертор + батарея під ваші потреби та бюджет.
    `,
  },
  {
    slug: 'balkonna-soniachna-elektrostantsiia-shcho-tse-i-yak-pratsiuie',
    title: 'Балконна сонячна електростанція: що це і як працює?',
    excerpt: 'Усе, що потрібно знати про балконні сонячні електростанції — від принципу роботи до вибору обладнання. Повний гід для початківців.',
    date: '2026-02-20',
    author: 'SolarBalkon',
    category: 'Гід',
    tags: ['балконна електростанція', 'сонячні панелі', 'як працює', 'для початківців'],
    image: '/blog/balkonna-ses.jpg',
    readTime: 8,
    content: `
## Що таке балконна сонячна електростанція?

Балконна сонячна електростанція (БСЕ) — це компактна система генерації електроенергії, яку можна встановити на балконі, терасі або фасаді будинку. На відміну від класичних дахових станцій, БСЕ не потребує складного монтажу, дозволів чи значних площ.

### Основні компоненти системи

Типова балконна станція складається з кількох ключових елементів:

**Сонячні панелі** — перетворюють сонячне світло на постійний струм. Сучасні панелі, як Trina TSM-455 з ККД 22.8%, генерують до 455 Вт потужності кожна при площі лише 2 м².

**Мікроінвертор або накопичувач** — перетворює постійний струм на змінний 220В для домашньої мережі. Мікроінвертор Deye SUN-M80G4 має потужність 800 Вт та ККД 96.5%.

**Система накопичення (опційно)** — акумулятор, що зберігає надлишок енергії для використання вночі або під час відключень. Наприклад, EcoFlow STREAM AC Pro (1920 Вт·год) або Zendure SolarFlow 2400 AC+ (2400 Вт·год).

**Smart Meter** — пристрій моніторингу, що відстежує генерацію та споживання в реальному часі.

### Скільки електроенергії генерує балконна станція?

При середніх 3.5 сонячних годинах на день в Україні:

- **2 панелі (910 Вт):** ~84 кВт·год/місяць, ~1,008 кВт·год/рік
- **4 панелі (1,820 Вт):** ~168 кВт·год/місяць, ~2,016 кВт·год/рік

Цього достатньо для покриття 50-100% потреб типової квартири в електроенергії.

### Переваги балконної електростанції

1. **Простота встановлення** — Plug & Play, монтаж за 30 хвилин без електрика
2. **Не потрібен дозвіл** — для систем до 10 кВт
3. **Окупність 3-5 років** — при поточних тарифах на електроенергію
4. **Автономність** — системи з акумулятором працюють навіть при відключеннях
5. **Державна підтримка** — кредит 0% до 480,000 грн на 10 років

### Для кого підходить?

Балконна електростанція ідеально підходить для мешканців квартир, власників невеликих будинків та орендарів, які хочуть зменшити рахунки за електроенергію без складного монтажу на даху.

### Висновок

Балконна сонячна електростанція — це доступний, простий та ефективний спосіб перейти на чисту енергію. З державною програмою кредитування під 0% це стало ще вигідніше.
    `,
  },
  {
    slug: 'derzhavnyi-kredyt-0-na-soniachni-paneli-yak-otrymaty',
    title: 'Державний кредит 0% на сонячні панелі: як отримати у 2026 році?',
    excerpt: 'Детальна інструкція з оформлення кредиту за програмою «Джерела енергії» — від підготовки документів до отримання компенсації 30%.',
    date: '2026-02-18',
    author: 'SolarBalkon',
    category: 'Фінанси',
    tags: ['кредит 0%', 'Джерела енергії', 'державна програма', 'субсидія', 'компенсація'],
    image: '/blog/kredit-0.jpg',
    readTime: 6,
    content: `
## Програма «Джерела енергії» — кредит 0% на сонячні панелі

Державна програма «Джерела енергії» дозволяє українцям встановити сонячні електростанції з кредитом під 0% річних. Розповідаємо, як скористатися цією можливістю.

### Основні умови програми

- **Сума кредиту:** до 480,000 грн
- **Термін:** до 10 років
- **Ставка:** 0% (держава компенсує відсотки банку)
- **Компенсація:** до 30% тіла кредиту повертається державою
- **Потужність:** системи до 10 кВт
- **Площа житла:** до 300 м²

### Хто може отримати?

Кредит доступний для **фізичних осіб** — власників приватних будинків та квартир. Головна вимога — наявність права власності на житло та можливість встановлення сонячної електростанції.

### Список документів

1. Паспорт та ІПН
2. Документ на право власності на житло
3. Довідка про доходи або витяг з банку
4. Акт обстеження житла (видає проектна організація)
5. Проект електростанції від ліцензованого підрядника

### Банки-партнери програми

Програму підтримують **43 банки**, серед яких:

- ПриватБанк
- Ощадбанк
- Укргазбанк
- Райффайзен Банк
- Глобус Банк
- та інші

### Покроковий процес

**Крок 1.** Оберіть обладнання та отримайте комерційну пропозицію від постачальника (наприклад, SolarBalkon).

**Крок 2.** Зверніться до банку-партнера з документами для попереднього схвалення кредиту.

**Крок 3.** Отримайте акт обстеження та проект електростанції.

**Крок 4.** Підпишіть кредитний договір та договір на постачання обладнання.

**Крок 5.** Встановіть систему та введіть в експлуатацію.

**Крок 6.** Подайте документи на компенсацію 30% тіла кредиту.

### Приклад розрахунку

Система на 4 панелі з накопичувачем Deye: **70,200 грн**

- Щомісячний платіж: ~585 грн/місяць (10 років, 0%)
- Компенсація 30%: -21,060 грн повертається державою
- Фактична вартість: ~49,140 грн
- Економія на електриці: ~725 грн/місяць (при 250 кВт·год)

**Кредит окупається вже з першого місяця**, оскільки щомісячна економія перевищує платіж по кредиту.

### Важливі обмеження

- Не можна підключати «зелений тариф» одночасно з програмою
- Обладнання має бути сертифіковане в Україні
- Встановлення виконує ліцензований підрядник

### Висновок

Програма «Джерела енергії» робить сонячну енергію доступною для кожного українця. При щомісячній економії, що перевищує платіж по кредиту, це інвестиція, яка окупається з першого дня.
    `,
  },
  {
    slug: 'yak-obrati-nakopychuvach-ecoflow-zendure-deye',
    title: 'Як обрати накопичувач: EcoFlow vs Zendure vs Deye — порівняння 2026',
    excerpt: 'Детальне порівняння трьох найпопулярніших систем накопичення для балконних електростанцій. Що обрати саме для вашого дому?',
    date: '2026-02-15',
    author: 'SolarBalkon',
    category: 'Порівняння',
    tags: ['EcoFlow', 'Zendure', 'Deye', 'накопичувач', 'порівняння', 'акумулятор'],
    image: '/blog/porivnyannya.jpg',
    readTime: 10,
    content: `
## Порівняння накопичувачів для балконної електростанції

Вибір системи накопичення — одне з найважливіших рішень при плануванні балконної сонячної електростанції. Порівняємо три лідери ринку: EcoFlow STREAM AC Pro, Zendure SolarFlow 2400 AC+ та Deye AE-FS2.0-2H2.

### Загальне порівняння

| Параметр | EcoFlow STREAM | Zendure 2400 AC+ | Deye AE-FS2.0 |
|---|---|---|---|
| Ємність | 1,920 Вт·год | 2,400 Вт·год | 2,000 Вт·год |
| Вихід AC | 1,200 Вт | 2,400 Вт | 800 Вт |
| Цикли | 6,000 | 6,000 | 6,000 |
| Гарантія | 2 роки | 10 років | 10 років |
| UPS | Ні | Ні | Так (< 4 мс) |
| Масштабування | до 11.52 кВт·год | до 16.8 кВт·год | до 10 кВт·год |
| Захист | IP65 | IP65 | IP65 |
| Ціна | 40,000 грн | 50,000 грн | 40,000 грн |

### EcoFlow STREAM AC Pro — для тих, хто цінує простоту

**Плюси:**
- Найпростіше встановлення — дійсно Plug & Play
- Тихий (< 30 дБ) — можна ставити на балконі біля спальні
- Сумісний з будь-яким мікроінвертором
- Автопідігрів до -20°C

**Мінуси:**
- Коротка гарантія — лише 2 роки
- Менша ємність — 1,920 Вт·год
- Немає функції UPS

**Ідеально для:** квартир з невеликим споживанням, де важлива простота та тиша.

### Zendure SolarFlow 2400 AC+ — максимум потужності

**Плюси:**
- Найбільша ємність — 2,400 Вт·год (до 16.8 з модулями)
- Найпотужніший вихід — 2,400 Вт
- ШІ-система HEMS для оптимізації
- 10 років гарантії
- Пожежогасіння ZenGuard™

**Мінуси:**
- Найвища ціна — 50,000 грн
- Немає вбудованого UPS

**Ідеально для:** будинків з високим споживанням, де потрібна масштабованість.

### Deye AE-FS2.0-2H2 — вбудований UPS та інвертор

**Плюси:**
- Вбудований мікроінвертор — не потрібен окремий
- UPS з переключенням < 4 мс
- 10 років гарантії
- Порти USB-A та Type-C
- Найкраща ціна за функціональність

**Мінуси:**
- Найменший вихід — 800 Вт
- Вужчий діапазон температур (-10°C — +50°C)

**Ідеально для:** тих, кому важливе безперебійне живлення та вбудований інвертор.

### Що обрати?

- **Обмежений бюджет + UPS потрібен** → Deye AE-FS2.0-2H2
- **Максимум потужності + масштабування** → Zendure SolarFlow 2400 AC+
- **Простота + тихий + компактний** → EcoFlow STREAM AC Pro

### Висновок

Всі три системи — якісні рішення від провідних виробників. Вибір залежить від ваших пріоритетів: бюджет, потужність, UPS або простота встановлення. Скористайтеся нашим калькулятором на сайті, щоб розрахувати оптимальну конфігурацію для вашого дому.
    `,
  },
  {
    slug: 'taryfy-na-elektroenergiiu-v-ukraini-2026',
    title: 'Тарифи на електроенергію в Україні 2026: скільки платимо і що далі?',
    excerpt: 'Актуальні тарифи на електроенергію для побутових та комерційних споживачів. Прогнози зростання та як зменшити рахунки.',
    date: '2026-02-10',
    author: 'SolarBalkon',
    category: 'Аналітика',
    tags: ['тарифи', 'електроенергія', 'побутовий тариф', 'комерційний тариф', 'Україна 2026'],
    image: '/blog/taryfy.jpg',
    readTime: 5,
    content: `
## Тарифи на електроенергію в Україні у 2026 році

Розуміння поточних тарифів та прогнозів їх зростання — ключовий фактор при прийнятті рішення про встановлення сонячної електростанції.

### Побутовий тариф

Станом на 2026 рік побутовий тариф складає **4.32 грн/кВт·год**. За прогнозами НКРЕКП, очікується підвищення до **6.64 грн/кВт·год** протягом наступного року.

Для тих, хто має двозонний лічильник, нічний тариф складає **2.16 грн/кВт·год** (50% від денного).

### Комерційний тариф

Комерційні споживачі платять значно більше. Середній тариф складається з кількох компонентів:

- **РДН (ринок на добу наперед):** ~6.9 грн/кВт·год
- **Передача (Укренерго):** 0.71 грн/кВт·год
- **Розподіл:** ~2.7 грн/кВт·год (2-й клас напруги)
- **Загалом:** ~7.50 грн/кВт·год

Прогноз на найближчий рік — зростання до **~9.00 грн/кВт·год**.

### Як зростання тарифів впливає на окупність сонячних панелей?

Парадоксально, але зростання тарифів — це хороша новина для власників сонячних станцій. Чим вищий тариф — тим швидше окупається система:

- **При 4.32 грн/кВт·год:** окупність ~4.5 року
- **При 6.64 грн/кВт·год:** окупність ~3 роки
- **При 9.00 грн/кВт·год (комерц.):** окупність ~2 роки

### Скільки можна зекономити?

При споживанні 250 кВт·год/місяць та системі на 4 панелі:

- Рахунок без панелей: **1,080 грн/місяць**
- Рахунок з панелями: **354 грн/місяць**
- Економія: **726 грн/місяць** або **8,712 грн/рік**

За 10 років економія складає **87,120 грн** при вартості системи 70,200 грн.

### Висновок

Зростання тарифів на електроенергію робить інвестицію в сонячні панелі все більш вигідною. Чим раніше ви встановите систему — тим більше зекономите протягом її 25-30 років служби.
    `,
  },
];

/* Helper: format article date */
function formatArticleDate(dateStr) {
  const months = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* Helper: set SEO meta tags dynamically */
function setSEO({ title, description, url, image, type = 'website', article = null }) {
  document.title = title;
  const setMeta = (attr, key, val) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', val);
  };
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:site_name', 'SolarBalkon');
  if (image) setMeta('property', 'og:image', `https://solarbalkon.shop${image}`);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);

  // JSON-LD structured data
  let ldScript = document.getElementById('jsonld-seo');
  if (!ldScript) { ldScript = document.createElement('script'); ldScript.id = 'jsonld-seo'; ldScript.type = 'application/ld+json'; document.head.appendChild(ldScript); }

  if (article) {
    ldScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt,
      image: image ? `https://solarbalkon.shop${image}` : undefined,
      datePublished: article.date,
      author: { '@type': 'Organization', name: 'SolarBalkon', url: 'https://solarbalkon.shop' },
      publisher: { '@type': 'Organization', name: 'SolarBalkon', url: 'https://solarbalkon.shop', logo: { '@type': 'ImageObject', url: 'https://solarbalkon.shop/logo-bolt.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    });
  } else {
    ldScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SolarBalkon',
      url: 'https://solarbalkon.shop',
      description: 'Балконні сонячні електростанції в Україні — сонячні панелі, накопичувачі, інвертори з кредитом 0%',
      publisher: { '@type': 'Organization', name: 'SolarBalkon', url: 'https://solarbalkon.shop' },
    });
  }
}
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
.nav-links a.nav-audit { color:var(--yellow-600) !important; font-weight:700; }
.nav-links a.nav-audit:hover { color:var(--green-700) !important; }
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

/* CALC RECOMMENDATIONS */
.calc-reco {
  margin-top:1.5rem; padding-top:1.5rem;
  border-top:1px solid rgba(255,255,255,0.2);
}
.calc-reco-title {
  font-size:0.9rem; opacity:0.85; text-align:center;
  margin-bottom:1rem; font-weight:600; letter-spacing:0.5px;
}
.calc-reco-grid {
  display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));
  gap:0.75rem;
}
.calc-reco-card {
  background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
  border-radius:12px; padding:1rem; text-align:center;
  cursor:pointer; transition:all 0.25s;
}
.calc-reco-card:hover { background:rgba(255,255,255,0.2); transform:translateY(-2px); }
.calc-reco-card.best { background:rgba(255,255,255,0.22); border-color:rgba(255,255,255,0.5); }
.calc-reco-card-name { font-size:0.82rem; font-weight:700; margin-bottom:4px; }
.calc-reco-card-out { font-size:0.72rem; opacity:0.75; }
.calc-reco-card-price { font-size:0.9rem; font-weight:700; margin-top:6px; }
.calc-reco-card-badge {
  display:inline-block; font-size:0.65rem; font-weight:700;
  padding:2px 10px; border-radius:50px; margin-top:6px;
  background:rgba(251,192,45,0.3); color:#fff;
}
.calc-reco-commercial {
  background:rgba(255,255,255,0.1); border:1px dashed rgba(255,255,255,0.3);
  border-radius:12px; padding:1.25rem; text-align:center; margin-top:0.75rem;
}
.calc-reco-commercial p { font-size:0.85rem; opacity:0.85; margin-bottom:0.75rem; }
.calc-reco-commercial button {
  padding:10px 28px; border-radius:50px; border:2px solid white;
  background:rgba(255,255,255,0.15); color:white;
  font-family:var(--font-body); font-size:0.88rem; font-weight:600;
  cursor:pointer; transition:all 0.2s;
}
.calc-reco-commercial button:hover { background:white; color:var(--green-700); }

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

/* AUDIT BANNER */
.audit-banner {
  max-width:900px; margin:0 auto 0; padding:2.5rem;
  background:linear-gradient(135deg, #1a5c2a 0%, #2d7a3a 50%, #388e3c 100%);
  border-radius:20px; position:relative; overflow:hidden;
  display:flex; align-items:center; gap:2rem;
  box-shadow:0 8px 32px rgba(45,122,58,0.25);
  cursor:pointer; transition:transform 0.3s, box-shadow 0.3s;
}
.audit-banner:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(45,122,58,0.35); }
.audit-banner::before {
  content:''; position:absolute; top:-50%; right:-20%;
  width:300px; height:300px; border-radius:50%;
  background:rgba(251,192,45,0.12);
}
.audit-banner::after {
  content:''; position:absolute; bottom:-30%; left:-10%;
  width:200px; height:200px; border-radius:50%;
  background:rgba(255,255,255,0.05);
}
.audit-banner-content { flex:1; position:relative; z-index:1; }
.audit-banner-badge {
  display:inline-block; padding:4px 14px; border-radius:20px;
  background:rgba(251,192,45,0.2); color:#fdd835;
  font-size:0.75rem; font-weight:700; text-transform:uppercase;
  letter-spacing:1px; margin-bottom:0.75rem;
}
.audit-banner h3 {
  font-family:var(--font-display); font-size:clamp(1.3rem,3vw,1.8rem);
  font-weight:800; color:white; margin-bottom:0.5rem; line-height:1.3;
}
.audit-banner p { color:rgba(255,255,255,0.8); font-size:0.95rem; line-height:1.6; margin-bottom:1rem; }
.audit-banner-cta {
  display:inline-flex; align-items:center; gap:8px;
  padding:12px 28px; border-radius:50px;
  background:linear-gradient(135deg, #fbc02d, #f9a825);
  color:#1a5c2a; font-weight:700; font-size:0.95rem;
  text-decoration:none; transition:all 0.25s;
  box-shadow:0 4px 16px rgba(251,192,45,0.3);
}
.audit-banner-cta:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(251,192,45,0.4); }
.audit-banner-icon {
  font-size:3.5rem; position:relative; z-index:1;
  filter:drop-shadow(0 4px 12px rgba(0,0,0,0.2));
}
.audit-banner-features {
  display:flex; gap:1.5rem; margin-top:1rem;
}
.audit-banner-feat {
  display:flex; align-items:center; gap:6px;
  font-size:0.82rem; color:rgba(255,255,255,0.7);
}
.audit-banner-feat span { font-size:1rem; }
@media(max-width:768px) {
  .audit-banner { flex-direction:column; text-align:center; padding:2rem 1.5rem; }
  .audit-banner-icon { font-size:2.5rem; }
  .audit-banner-features { justify-content:center; flex-wrap:wrap; gap:1rem; }
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

/* BLOG */
.blog-page { padding-top: 64px; }
.blog-header {
  padding: 3rem 2rem 2rem;
  max-width: 1200px; margin: 0 auto;
}
.blog-header h1 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800; color: var(--gray-900);
  margin-bottom: 0.5rem;
}
.blog-header p {
  font-size: 1.1rem; color: var(--gray-500);
  max-width: 600px;
}
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
  max-width: 1200px; margin: 0 auto;
  padding: 0 2rem 4rem;
}
.blog-card {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.blog-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.blog-card-img {
  width: 100%; height: 200px;
  object-fit: cover;
  background: linear-gradient(135deg, var(--green-50), var(--yellow-100));
  display: flex; align-items: center; justify-content: center;
}
.blog-card-img-placeholder {
  width: 100%; height: 200px;
  background: linear-gradient(135deg, var(--green-50), var(--yellow-100));
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem;
}
.blog-card-body { padding: 1.5rem; }
.blog-card-meta {
  display: flex; align-items: center; gap: 1rem;
  margin-bottom: 0.75rem;
}
.blog-card-category {
  background: var(--green-50); color: var(--green-700);
  padding: 4px 12px; border-radius: 50px;
  font-size: 0.78rem; font-weight: 600;
}
.blog-card-date {
  font-size: 0.8rem; color: var(--gray-400);
}
.blog-card-title {
  font-family: var(--font-display);
  font-size: 1.2rem; font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}
.blog-card-excerpt {
  font-size: 0.9rem; color: var(--gray-500);
  line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}
.blog-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 1rem; padding-top: 1rem;
  border-top: 1px solid var(--gray-100);
}
.blog-card-read {
  font-size: 0.8rem; color: var(--gray-400);
}
.blog-card-link {
  font-size: 0.88rem; font-weight: 600;
  color: var(--green-600);
}

/* ARTICLE PAGE */
.article-page { padding-top: 64px; }
.article-header {
  max-width: 800px; margin: 0 auto;
  padding: 2rem 2rem 1rem;
}
.article-breadcrumbs {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; color: var(--gray-400);
  margin-bottom: 1.5rem;
}
.article-breadcrumbs a {
  color: var(--green-600); text-decoration: none;
}
.article-breadcrumbs a:hover { text-decoration: underline; }
.article-meta {
  display: flex; align-items: center; gap: 1rem;
  margin-bottom: 1rem; flex-wrap: wrap;
}
.article-header h1 {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: var(--gray-900);
  line-height: 1.25; margin-bottom: 1rem;
}
.article-header .article-excerpt {
  font-size: 1.15rem; color: var(--gray-500);
  line-height: 1.7;
}
.article-content {
  max-width: 800px; margin: 0 auto;
  padding: 1rem 2rem 3rem;
  font-size: 1.05rem; line-height: 1.8;
  color: var(--gray-700);
}
.article-content h2 {
  font-family: var(--font-display);
  font-size: 1.6rem; font-weight: 700;
  color: var(--gray-900);
  margin: 2.5rem 0 1rem;
}
.article-content h3 {
  font-family: var(--font-display);
  font-size: 1.25rem; font-weight: 700;
  color: var(--gray-800);
  margin: 2rem 0 0.75rem;
}
.article-content p { margin-bottom: 1.25rem; }
.article-content ul, .article-content ol {
  margin: 1rem 0 1.5rem 1.5rem;
}
.article-content li { margin-bottom: 0.5rem; }
.article-content strong { color: var(--gray-900); }
.article-content table {
  width: 100%; border-collapse: collapse;
  margin: 1.5rem 0; font-size: 0.95rem;
}
.article-content table th,
.article-content table td {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-200);
  text-align: left;
}
.article-content table th {
  background: var(--green-50);
  font-weight: 700; color: var(--gray-900);
}
.article-content table td { color: var(--gray-700); }
.article-tags {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
  max-width: 800px; margin: 0 auto;
  padding: 0 2rem 2rem;
}
.article-tag {
  background: var(--gray-100); color: var(--gray-600);
  padding: 6px 14px; border-radius: 50px;
  font-size: 0.8rem; font-weight: 500;
}
.article-share {
  max-width: 800px; margin: 0 auto;
  padding: 0 2rem 2rem;
  display: flex; align-items: center; gap: 1rem;
}
.article-share-label {
  font-size: 0.9rem; font-weight: 600;
  color: var(--gray-600);
}
.article-share a {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--gray-100); color: var(--gray-600);
  text-decoration: none; font-size: 1.1rem;
  transition: all 0.2s;
}
.article-share a:hover {
  background: var(--green-500); color: white;
}
.article-related {
  max-width: 800px; margin: 0 auto;
  padding: 2rem;
  border-top: 1px solid var(--gray-200);
}
.article-related h3 {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700;
  color: var(--gray-900); margin-bottom: 1.5rem;
}
.article-related-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.article-related-card {
  padding: 1rem;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}
.article-related-card:hover {
  border-color: var(--green-300);
  box-shadow: var(--shadow-sm);
}
.article-related-card-title {
  font-family: var(--font-display);
  font-size: 0.95rem; font-weight: 700;
  color: var(--gray-800); margin-bottom: 0.25rem;
  line-height: 1.3;
}
.article-related-card-date {
  font-size: 0.78rem; color: var(--gray-400);
}

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
  .blog-grid { grid-template-columns: 1fr; padding: 0 1.5rem 3rem; }
  .blog-header { padding: 2rem 1.5rem 1rem; }
  .article-header, .article-content, .article-tags, .article-share, .article-related { padding-left: 1.5rem; padding-right: 1.5rem; }
  .article-related-grid { grid-template-columns: 1fr; }
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

/* ═══════════════════════════════════════════════════════════════
   AUDIT WIZARD — Аудит об'єкта та Калькулятор СЕС v3
   BASIC + ADVANCED modes
   ═══════════════════════════════════════════════════════════════ */
const AUDIT_REGIONS = [
  { id:'kyiv',label:'Київська обл.',pvout:1150,avgT:21 },{ id:'odesa',label:'Одеська обл.',pvout:1350,avgT:24 },
  { id:'dnipro',label:'Дніпропетровська обл.',pvout:1280,avgT:23 },{ id:'kharkiv',label:'Харківська обл.',pvout:1200,avgT:22 },
  { id:'lviv',label:'Львівська обл.',pvout:1050,avgT:19 },{ id:'zaporizhzhia',label:'Запорізька обл.',pvout:1320,avgT:24 },
  { id:'poltava',label:'Полтавська обл.',pvout:1220,avgT:22 },{ id:'vinnytsia',label:'Вінницька обл.',pvout:1180,avgT:20 },
  { id:'cherkasy',label:'Черкаська обл.',pvout:1210,avgT:22 },{ id:'mykolaiv',label:'Миколаївська обл.',pvout:1340,avgT:24 },
  { id:'kherson',label:'Херсонська обл.',pvout:1370,avgT:25 },{ id:'khmelnytskyi',label:'Хмельницька обл.',pvout:1120,avgT:20 },
  { id:'zhytomyr',label:'Житомирська обл.',pvout:1100,avgT:20 },{ id:'sumy',label:'Сумська обл.',pvout:1150,avgT:21 },
  { id:'rivne',label:'Рівненська обл.',pvout:1070,avgT:19 },{ id:'ternopil',label:'Тернопільська обл.',pvout:1090,avgT:19 },
  { id:'ivano-frankivsk',label:'Івано-Франківська обл.',pvout:1060,avgT:18 },{ id:'volyn',label:'Волинська обл.',pvout:1050,avgT:19 },
  { id:'zakarpattia',label:'Закарпатська обл.',pvout:1080,avgT:20 },{ id:'chernivtsi',label:'Чернівецька обл.',pvout:1100,avgT:19 },
  { id:'chernihiv',label:'Чернігівська обл.',pvout:1120,avgT:20 },{ id:'kirovohrad',label:'Кіровоградська обл.',pvout:1250,avgT:23 },
];
const AUDIT_INSTALLS = [
  { id:'balcony',label:'Балкон',icon:'🏠',coeff:0.85,desc:'На перилах або стіні' },
  { id:'roof',label:'Дах',icon:'🏗️',coeff:1.0,desc:'Оптимальний кут на даху' },
  { id:'ground',label:'Земля',icon:'🌿',coeff:0.95,desc:'Наземний монтаж' },
  { id:'wall',label:'Стіна',icon:'🧱',coeff:0.70,desc:'Вертикальний монтаж' },
  { id:'fence',label:'Паркан',icon:'🔲',coeff:0.65,desc:'На паркані' },
];
const AUDIT_ORIENTS = [
  { id:'south',label:'Південь',icon:'⬇️',coeff:1.00 },{ id:'south_east',label:'Пд-Схід',icon:'↙️',coeff:0.95 },
  { id:'south_west',label:'Пд-Захід',icon:'↘️',coeff:0.95 },{ id:'east',label:'Схід',icon:'⬅️',coeff:0.80 },
  { id:'west',label:'Захід',icon:'➡️',coeff:0.80 },{ id:'north',label:'Північ',icon:'⬆️',coeff:0.55 },
];
const INCL_COEFF = {0:0.87,10:0.94,15:0.97,20:0.99,25:1.00,30:1.00,35:0.99,40:0.97,45:0.94,50:0.90,60:0.82,70:0.71,80:0.59,90:0.45};
function getInclCoeff(a){const k=Object.keys(INCL_COEFF).map(Number).sort((x,y)=>x-y);if(a<=k[0])return INCL_COEFF[k[0]];if(a>=k[k.length-1])return INCL_COEFF[k[k.length-1]];let lo=k[0],hi=k[k.length-1];for(let i=0;i<k.length-1;i++){if(a>=k[i]&&a<=k[i+1]){lo=k[i];hi=k[i+1];break;}}const t=(a-lo)/(hi-lo);return INCL_COEFF[lo]+t*(INCL_COEFF[hi]-INCL_COEFF[lo]);}
const AUDIT_BLACKOUTS = [{id:'none',label:'Немає',icon:'✅'},{id:'rare',label:'Рідко',icon:'⚡'},{id:'often',label:'Часто',icon:'🔴'}];
const AUDIT_PROFILES = [
  {id:'residential',label:'Житловий',icon:'🏠',desc:'Пік ранок/вечір',evening:0.35,morning:0.20,weekend:1.0},
  {id:'office',label:'Офіс',icon:'🏢',desc:'Пік вдень',evening:0.10,morning:0.10,weekend:0.15},
  {id:'industrial',label:'Виробництво',icon:'🏭',desc:'Рівномірно 24/7',evening:0.25,morning:0.25,weekend:0.80},
  {id:'shop',label:'Магазин/Сервіс',icon:'🛒',desc:'Пік вдень, без ночі',evening:0.15,morning:0.05,weekend:0.70},
];
const AUDIT_TARIFF_TYPES = [{id:'single',label:'Однозонний'},{id:'dayNight',label:'Двозонний (день/ніч)'}];
const AUDIT_DEF = {sysEff:0.80,battDoD:0.90,battEff:0.90,deg:0.005,resTariff:4.32,comTariff:7.50,resNightTariff:2.16,comNightTariff:5.25,tempCoeff:0.004,incl:33};
const AUDIT_PANELS = [{name:'Trina TSM-455 NEG9R.28',power:455,price:3450}];
const AUDIT_INV = {micro:[{name:'Deye SUN-M80G4-EU-Q0',power:800,price:6200,inputs:2}],string:[{name:'Deye SUN-3.6K-SG04LP3-EU',power:3600,price:28000,ph:1},{name:'Deye SUN-5K-SG04LP3-EU',power:5000,price:32000,ph:1},{name:'Deye SUN-8K-SG04LP3-EU',power:8000,price:42000,ph:3},{name:'Deye SUN-12K-SG04LP3-EU',power:12000,price:55000,ph:3}]};
const AUDIT_BATT = [{name:'Zendure SolarFlow 2400 AC+',cap:2.4,price:50000},{name:'EcoFlow STREAM AC Pro',cap:1.92,price:40000},{name:'Deye AE-FS2.0-2H2',cap:2.0,price:40000},{name:'Deye SE-G5.3 Pro',cap:5.3,price:45000},{name:'Deye SE-G5.3 Pro ×2',cap:10.6,price:90000}];
const AUDIT_MO_FAC = [0.04,0.05,0.08,0.10,0.12,0.13,0.13,0.12,0.09,0.07,0.04,0.03];
const AUDIT_MO_NAMES = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];
const AUDIT_TIPS = {clientType:'Побутовий — домогосподарства. Комерційний — бізнес, ФОП, ОСББ.',region:'Область визначає кількість сонячних годин (PVOUT) та середню температуру.',consumption:'Середнє місячне споживання. Подивіться в рахунку.',install:'Тип монтажу впливає на ефективність системи.',orient:'Напрямок панелей. Південь — найкраще.',incl:'Кут нахилу. Оптимум для України: 30-35°.',blackout:'Якщо є відключення — потрібен акумулятор.',phases:'1 фаза (220В) або 3 фази (380В).',autonomy:'Години автономної роботи при блекауті.',critLoad:'Потужність приладів при блекауті (кВт).',sysEff:'Загальна ефективність з урахуванням втрат (без температури).',battDoD:'Глибина розряду. LiFePO4 = 90%.',battEff:'ККД батареї. LiFePO4 = 90-95%.',deg:'Деградація панелей/рік. Якісні: 0.4-0.55%.',tariff:'Побутовий: 4.32 грн. Комерційний: 5-9 грн.',profile:'Профіль визначає розподіл споживання протягом доби. Впливає на розмір батареї.',tariffType:'Однозонний — єдиний тариф. Двозонний — різні тарифи вдень та вночі.',nightTariff:'Нічний тариф (23:00-7:00). Побутовий: 2.16 грн, комерційний: ~5.25 грн.'};

function AuditTip({text}){const[s,setS]=useState(false);return(<span style={{position:'relative',display:'inline-flex',marginLeft:6,cursor:'help'}} onMouseEnter={()=>setS(true)} onMouseLeave={()=>setS(false)} onClick={()=>setS(v=>!v)}><span style={{width:18,height:18,borderRadius:'50%',background:'#eee',color:'#9e9e9e',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700}}>?</span>{s&&(<span style={{position:'absolute',bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',background:'#212121',color:'white',padding:'10px 14px',borderRadius:8,fontSize:'0.78rem',lineHeight:1.5,width:260,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',zIndex:100}}>{text}<span style={{position:'absolute',bottom:-5,left:'50%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'6px solid transparent',borderRight:'6px solid transparent',borderTop:'6px solid #212121'}}/></span>)}</span>);}

function AuditWizard({ goToPage, liveInverters = [] }) {
  const [calcMode, setCalcMode] = useState('basic');
  const [step, setStep] = useState(0);
  const wizardRef = useRef(null);
  const [mode, setMode] = useState('residential');
  const [region, setRegion] = useState('');
  const [installType, setInstallType] = useState('');
  const [orientation, setOrientation] = useState('south');
  const [inclinationAngle, setInclinationAngle] = useState(AUDIT_DEF.incl);
  const [monthlyConsumption, setMonthlyConsumption] = useState(250);
  const [phases, setPhases] = useState(1);
  const [blackout, setBlackout] = useState('none');
  const [autonomyHours, setAutonomyHours] = useState(4);
  const [criticalLoad, setCriticalLoad] = useState(1.5);
  const [sysEff, setSysEff] = useState(AUDIT_DEF.sysEff);
  const [battDoD, setBattDoD] = useState(AUDIT_DEF.battDoD);
  const [battEff, setBattEff] = useState(AUDIT_DEF.battEff);
  const [degradation, setDegradation] = useState(AUDIT_DEF.deg);
  const [customTariff, setCustomTariff] = useState(0);
  const [consumptionProfile, setConsumptionProfile] = useState('residential');
  const [tariffType, setTariffType] = useState('single');
  const [nightTariff, setNightTariff] = useState(0);

  const effectiveTariff = customTariff > 0 ? customTariff : (mode === 'residential' ? AUDIT_DEF.resTariff : AUDIT_DEF.comTariff);
  const effectiveNightTariff = nightTariff > 0 ? nightTariff : (mode === 'residential' ? AUDIT_DEF.resNightTariff : AUDIT_DEF.comNightTariff);
  const BASIC_STEPS = ['Тип', "Об'єкт", 'Споживання', 'Результат'];
  const ADV_STEPS = ['Тип', "Об'єкт", 'Орієнтація', 'Мережа', 'Параметри', 'Результат'];
  const stepLabels = calcMode === 'basic' ? BASIC_STEPS : ADV_STEPS;
  const totalSteps = stepLabels.length;
  const isResult = step === totalSteps - 1;

  useEffect(() => { wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [step]);
  const switchMode = (m) => { setCalcMode(m); setStep(0); };

  const canProceed = () => {
    if (calcMode === 'basic') { return step === 0 ? !!mode : step === 1 ? !!region && !!installType : step === 2 ? monthlyConsumption > 0 : true; }
    return step === 0 ? !!mode : step === 1 ? !!region && !!installType : step === 2 ? !!orientation && monthlyConsumption > 0 : step === 3 ? !!blackout : true;
  };

  const calculate = () => {
    const rd = AUDIT_REGIONS.find(r => r.id === region) || AUDIT_REGIONS[0];
    const id = AUDIT_INSTALLS.find(t => t.id === installType) || AUDIT_INSTALLS[0];
    const od = AUDIT_ORIENTS.find(o => o.id === orientation) || AUDIT_ORIENTS[0];
    const pf = AUDIT_PROFILES.find(p => p.id === consumptionProfile) || AUDIT_PROFILES[0];
    const pvout = rd.pvout;
    const oC = calcMode === 'basic' ? 1.0 : od.coeff;
    const iC = id.coeff;
    const inC = calcMode === 'basic' ? 1.0 : getInclCoeff(inclinationAngle);
    const eff = calcMode === 'basic' ? AUDIT_DEF.sysEff : sysEff;
    const dod = calcMode === 'basic' ? AUDIT_DEF.battDoD : battDoD;
    const bE = calcMode === 'basic' ? AUDIT_DEF.battEff : battEff;
    const dg = calcMode === 'basic' ? AUDIT_DEF.deg : degradation;

    // #4 Температурний коефіцієнт
    const avgT = rd.avgT || 22;
    const tempLoss = avgT > 25 ? AUDIT_DEF.tempCoeff * (avgT - 25) : 0;
    const actualEff = eff * (1 - tempLoss);

    const yC = monthlyConsumption * 12;
    const tC = actualEff * oC * iC * inC;
    const recP = yC / (pvout * tC);
    const expGen = recP * pvout * tC;

    // #1 Формула батарей: emergency + self-consumption + limit
    const needBatt = blackout !== 'none';
    const bCL = calcMode === 'basic' ? 1.0 : criticalLoad;
    const bAH = calcMode === 'basic' ? (blackout === 'often' ? 6 : 3) : autonomyHours;

    // Emergency battery
    const battEmergency = needBatt ? (bCL * bAH) / (dod * bE) : 0;

    // #2 Self-consumption battery (shift solar to evening)
    const dailyC = yC / 365;
    const eveningPct = calcMode === 'basic' ? 0.30 : pf.evening;
    const dailyEvening = dailyC * eveningPct;
    const battSelfConsumption = dailyEvening / (dod * bE);

    // Battery limit by daily generation
    const maxDailyGen = expGen / 365;
    const maxBattLimit = maxDailyGen * 1.5;

    // Final battery: max(emergency, selfConsumption) capped by limit
    let battCap = 0;
    let battMode = 'none';
    if (needBatt) {
      if (battEmergency >= battSelfConsumption) {
        battCap = Math.min(battEmergency, maxBattLimit);
        battMode = 'emergency';
      } else {
        battCap = Math.min(battSelfConsumption, maxBattLimit);
        battMode = 'selfconsumption';
      }
    } else if (calcMode === 'advanced' && eveningPct > 0.15) {
      // Even without blackouts, suggest battery for self-consumption optimization
      const optBatt = Math.min(battSelfConsumption, maxBattLimit);
      if (optBatt >= 1.5) { battCap = optBatt; battMode = 'optimization'; }
    }

    const pP = AUDIT_PANELS[0].power / 1000;
    const pC = Math.max(1, Math.ceil(recP / pP));
    const tPW = pC * AUDIT_PANELS[0].power;

    // #8 Inverter sizing: ratio 0.8-1.0, phase logic
    // Build inverter list from live API data (Google Sheets), fallback to hardcoded
    const stringInverters = liveInverters.length > 0
      ? liveInverters.map(inv => ({ name: inv.name || inv.model, power: inv.kw * 1000, price: inv.priceUah, ph: inv.phases }))
          .sort((a, b) => a.power - b.power)
      : AUDIT_INV.string;

    let selInv = [];
    if (tPW <= 1600 && installType === 'balcony') {
      selInv = [{ ...AUDIT_INV.micro[0], qty: Math.ceil(pC / 2) }];
    } else {
      const ph = calcMode === 'basic' ? (recP > 10 ? 3 : 1) : phases;
      const invTargetW = tPW * 0.9;
      const cands = stringInverters.filter(v => ph === 3 ? v.ph === 3 : true).filter(v => v.power >= invTargetW * 0.7);
      if (cands.length > 0) {
        // Pick smallest that covers, or use multiple
        const best = cands[0];
        if (best.power >= invTargetW) {
          selInv = [{ ...best, qty: 1 }];
        } else {
          selInv = [{ ...best, qty: Math.ceil(invTargetW / best.power) }];
        }
      } else {
        const biggest = stringInverters[stringInverters.length - 1];
        selInv = [{ ...biggest, qty: Math.ceil(invTargetW / biggest.power) }];
      }
    }

    let selBatt = null;
    if (battCap > 0) {
      const sorted = [...AUDIT_BATT].sort((a, b) => a.cap - b.cap);
      selBatt = sorted.find(b => b.cap >= battCap) || sorted[sorted.length - 1];
      selBatt = { ...selBatt, qty: Math.ceil(battCap / selBatt.cap) };
    }

    const bom = [];
    bom.push({ cat: 'Панелі', name: AUDIT_PANELS[0].name, qty: pC, up: AUDIT_PANELS[0].price, tot: pC * AUDIT_PANELS[0].price });
    selInv.forEach(v => bom.push({ cat: 'Інвертор', name: v.name, qty: v.qty, up: v.price, tot: v.qty * v.price }));
    bom.push({ cat: 'Лічильник', name: 'Deye SUN-SMART-CT01', qty: 1, up: 4000, tot: 4000 });
    if (selBatt) bom.push({ cat: 'Акумулятор', name: selBatt.name, qty: selBatt.qty, up: selBatt.price, tot: selBatt.qty * selBatt.price });
    bom.push({ cat: 'Монтаж', name: 'Кріплення (' + id.label + ')', qty: pC, up: 1500, tot: pC * 1500 });
    bom.push({ cat: 'Кабелі', name: 'DC + AC кабелі', qty: 1, up: 3000 + pC * 500, tot: 3000 + pC * 500 });
    bom.push({ cat: 'Захист DC', name: 'Автомати DC', qty: 1, up: 2500, tot: 2500 });
    bom.push({ cat: 'Захист AC', name: 'Автомати AC, ДІФ', qty: 1, up: 2000, tot: 2000 });

    const totCost = bom.reduce((s, i) => s + i.tot, 0);

    // #5 Двозонний тариф — середньозважений
    let avgTariff = effectiveTariff;
    if (calcMode === 'advanced' && tariffType === 'dayNight') {
      const dayPct = 1 - eveningPct - (calcMode === 'basic' ? 0.15 : pf.morning);
      const nightPct = calcMode === 'basic' ? 0.15 : pf.morning;
      // Solar covers daytime → savings at day tariff; battery covers evening → savings at day tariff too
      // Night consumption stays on grid at night tariff
      // Weighted: solar+battery offset day tariff, remaining night at night tariff
      const solarOffsetPct = Math.min(1, expGen / yC);
      avgTariff = effectiveTariff * (1 - nightPct) + effectiveNightTariff * nightPct;
      // But savings are mostly at day tariff (solar generates during day)
      avgTariff = effectiveTariff * 0.85 + effectiveNightTariff * 0.15;
    }

    // #7 ROI з деградацією (не лінійний!)
    const moGen = AUDIT_MO_FAC.map(f => Math.round(expGen * f));
    const degTable = [];
    let totalGen25 = 0;
    for (let y = 1; y <= 25; y++) {
      const f = Math.pow(1 - dg, y - 1);
      const yG = expGen * f;
      totalGen25 += yG;
      const yS = yG * avgTariff;
      const cum = degTable.length > 0 ? degTable[degTable.length - 1].cum + yS : yS;
      degTable.push({ year: y, gen: Math.round(yG), sav: Math.round(yS), cum: Math.round(cum), net: Math.round(cum - totCost) });
    }
    const totalSav25 = degTable[24].cum;
    const annSavAvg = totalSav25 / 25;
    const annSav = expGen * avgTariff; // first year
    const payback = annSavAvg > 0 ? totCost / annSavAvg : 0; // adjusted payback
    const roi = totalSav25 > 0 ? ((totalSav25 - totCost) / totCost) * 100 : 0;
    const costOff = yC > 0 ? (expGen / yC) * 100 : 0;

    return {
      recP: recP.toFixed(2), expGen: Math.round(expGen), expGenMo: Math.round(expGen / 12),
      pC, battCap: battCap.toFixed(1), battMode, battEmergency: battEmergency.toFixed(1), battSelf: battSelfConsumption.toFixed(1),
      totCost, annSav: Math.round(annSav), moSav: Math.round(annSav / 12),
      payback: payback.toFixed(1), roi: roi.toFixed(0), costOff: Math.min(100, costOff).toFixed(0),
      bom, moGen, degTable, regLbl: rd.label, instLbl: id.label, oriLbl: od.label,
      needBatt: battCap > 0, tarUsed: avgTariff.toFixed(2), tempLoss: (tempLoss * 100).toFixed(1),
      profileLbl: pf.label, avgTariff, tariffType: calcMode === 'advanced' ? tariffType : 'single'
    };
  };

  const res = isResult ? calculate() : null;

  const wS = { card: { width: '100%', maxWidth: 830, background: 'white', border: '1px solid #eee', borderRadius: 20, padding: '2.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }, cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#4caf50,#fbc02d)' }, title: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#212121', marginBottom: '0.5rem' }, desc: { color: '#9e9e9e', fontSize: '0.95rem', marginBottom: '2rem' } };

  const OptionCard = ({ selected, onClick, icon, label, desc, coeff }) => (
    <div onClick={onClick} style={{ padding: '1.25rem', border: `2px solid ${selected ? '#4caf50' : '#eee'}`, borderRadius: 12, cursor: 'pointer', background: selected ? '#e8f5e9' : 'white', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', transition: 'all 0.25s' }}>
      {selected && <div style={{ position: 'absolute', top: 10, right: 12, width: 24, height: 24, borderRadius: '50%', background: '#4caf50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>✓</div>}
      {icon && <div style={{ fontSize: '1.8rem' }}>{icon}</div>}
      <div style={{ fontWeight: 600, color: '#424242', fontSize: '0.95rem' }}>{label}</div>
      {desc && <div style={{ fontSize: '0.8rem', color: '#9e9e9e' }}>{desc}</div>}
      {coeff && <div style={{ fontSize: '0.75rem', color: '#388e3c', fontWeight: 600, marginTop: 'auto', paddingTop: 8 }}>{coeff}</div>}
    </div>
  );

  const Slider = ({ label, tip, value, onChange, min, max, step: st, unit, marks }) => (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.9rem', color: '#757575', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{label} {tip && <AuditTip text={tip} />}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#2d7a3a' }}>{value} <small style={{ fontSize: '0.7rem', color: '#bdbdbd', fontWeight: 400 }}>{unit}</small></span>
      </div>
      <input type="range" className="savings-slider" min={min} max={max} step={st} value={value} onChange={e => onChange(+e.target.value)} style={{ width: '100%' }} />
      {marks && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#bdbdbd', marginTop: '0.3rem' }}>{marks.map((m, i) => <span key={i}>{m}</span>)}</div>}
    </div>
  );

  const InfoTip = ({ icon, children }) => (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: '#fff9c4', border: '1px solid #ffee58', borderRadius: 12, marginBottom: '1.5rem', fontSize: '0.85rem', color: '#616161', lineHeight: 1.5 }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span><div>{children}</div>
    </div>
  );

  return (
    <div ref={wizardRef} style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#e8f5e9 0%,white 35%,#fff9c4 100%)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <a href="/" onClick={(e) => { e.preventDefault(); goToPage('home'); }} style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#2d7a3a', textDecoration: 'none' }}>☀ Solar<span style={{ color: '#f9a825' }}>Balkon</span></a>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 800, color: '#212121', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Аудит об'єкта — <span style={{ background: 'linear-gradient(135deg,#388e3c,#f9a825)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>розрахунок СЕС</span></h1>
        <p style={{ color: '#9e9e9e', fontSize: '1.05rem', maxWidth: 600, margin: '0 auto' }}>Покроковий калькулятор сонячної електростанції для вашого об'єкта</p>
        <div style={{ display: 'flex', gap: 0, background: '#f5f5f5', borderRadius: 50, padding: 4, width: 'fit-content', margin: '1.5rem auto 0' }}>
          <button onClick={() => switchMode('basic')} style={{ padding: '10px 28px', borderRadius: 50, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.3s', background: calcMode === 'basic' ? 'linear-gradient(135deg,#388e3c,#4caf50)' : 'transparent', color: calcMode === 'basic' ? 'white' : '#9e9e9e' }}>Простий <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginLeft: 6, background: '#c8e6c9', color: '#2d7a3a' }}>BASIC</span></button>
          <button onClick={() => switchMode('advanced')} style={{ padding: '10px 28px', borderRadius: 50, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.3s', background: calcMode === 'advanced' ? 'linear-gradient(135deg,#388e3c,#4caf50)' : 'transparent', color: calcMode === 'advanced' ? 'white' : '#9e9e9e' }}>Розширений <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginLeft: 6, background: '#fff59d', color: '#f9a825' }}>PRO</span></button>
        </div>
      </div>

      {/* PROGRESS */}
      <div style={{ width: '100%', maxWidth: 780, marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          {stepLabels.map((l, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, border: `2px solid ${i < step ? '#4caf50' : i === step ? '#4caf50' : '#e0e0e0'}`, background: i < step ? '#4caf50' : i === step ? '#e8f5e9' : 'white', color: i < step ? 'white' : i === step ? '#2d7a3a' : '#bdbdbd' }}>{i < step ? '✓' : i + 1}</div>
              <span style={{ fontSize: '0.7rem', color: i === step ? '#2d7a3a' : '#bdbdbd', fontWeight: i === step ? 600 : 400 }}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 4, background: '#eee', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#4caf50,#fbc02d)', transition: 'width 0.6s', width: `${(step / (totalSteps - 1)) * 100}%` }} /></div>
      </div>

      {/* CARD */}
      <div style={wS.card} key={`${calcMode}-${step}`}>
        <div style={wS.cardBar} />

        {/* STEP 0: Client Type */}
        {step === 0 && (<div>
          <div style={wS.title}>Оберіть тип клієнта <AuditTip text={AUDIT_TIPS.clientType} /></div>
          <div style={wS.desc}>Тарифи та програми фінансування відрізняються</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '0.75rem' }}>
            <OptionCard selected={mode === 'residential'} onClick={() => setMode('residential')} icon="🏠" label="Побутовий" desc="Домогосподарство, квартира" coeff={`Тариф: ${AUDIT_DEF.resTariff} грн/кВт·год`} />
            <OptionCard selected={mode === 'commercial'} onClick={() => setMode('commercial')} icon="🏢" label="Комерційний" desc="Бізнес, ФОП, ОСББ" coeff={`Тариф: ${AUDIT_DEF.comTariff} грн/кВт·год`} />
          </div>
        </div>)}

        {/* STEP 1: Region + Install */}
        {step === 1 && (<div>
          <div style={wS.title}>Розташування та монтаж</div>
          <div style={wS.desc}>Регіон визначає сонячний ресурс, тип монтажу — ефективність</div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#616161', marginBottom: '0.5rem', display: 'block' }}>Область <AuditTip text={AUDIT_TIPS.region} /></label>
            <select value={region} onChange={e => setRegion(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: '1rem', color: region ? '#2d7a3a' : '#bdbdbd', fontWeight: region ? 600 : 400, outline: 'none' }}>
              <option value="">— Оберіть область —</option>
              {AUDIT_REGIONS.map(r => <option key={r.id} value={r.id}>{r.label} ({r.pvout} кВт·год/кВт·пік)</option>)}
            </select>
          </div>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#616161', marginBottom: '0.75rem', display: 'block' }}>Тип монтажу <AuditTip text={AUDIT_TIPS.install} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.75rem' }}>
            {(calcMode === 'basic' ? AUDIT_INSTALLS.filter(t => ['roof', 'ground', 'balcony'].includes(t.id)) : AUDIT_INSTALLS).map(t => (
              <OptionCard key={t.id} selected={installType === t.id} onClick={() => setInstallType(t.id)} icon={t.icon} label={t.label} desc={t.desc} coeff={`Ефективність: ${(t.coeff * 100).toFixed(0)}%`} />
            ))}
          </div>
        </div>)}

        {/* BASIC STEP 2: Consumption + Blackout */}
        {calcMode === 'basic' && step === 2 && (<div>
          <div style={wS.title}>Споживання та блекаути</div>
          <div style={wS.desc}>Базова інформація для розрахунку</div>
          <Slider label="Місячне споживання" tip={AUDIT_TIPS.consumption} value={monthlyConsumption} onChange={setMonthlyConsumption} min={mode === 'commercial' ? 200 : 50} max={mode === 'commercial' ? 10000 : 1500} step={mode === 'commercial' ? 100 : 25} unit="кВт·год" marks={[mode === 'commercial' ? '200' : '50', mode === 'commercial' ? '10,000' : '1,500']} />
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#616161', marginBottom: '0.75rem', display: 'block' }}>Відключення? <AuditTip text={AUDIT_TIPS.blackout} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {AUDIT_BLACKOUTS.map(b => <OptionCard key={b.id} selected={blackout === b.id} onClick={() => setBlackout(b.id)} icon={b.icon} label={b.label} />)}
          </div>
          <InfoTip icon="ℹ️"><strong>BASIC</strong>: орієнтація — південь, кут — 33°, ефективність — 80%.</InfoTip>
        </div>)}

        {/* ADVANCED STEP 2: Orientation + Inclination + Consumption */}
        {calcMode === 'advanced' && step === 2 && (<div>
          <div style={wS.title}>Орієнтація, кут нахилу та споживання</div>
          <div style={wS.desc}>Точні параметри для реальної генерації</div>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#616161', marginBottom: '0.75rem', display: 'block' }}>Орієнтація <AuditTip text={AUDIT_TIPS.orient} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {AUDIT_ORIENTS.map(o => <OptionCard key={o.id} selected={orientation === o.id} onClick={() => setOrientation(o.id)} icon={o.icon} label={o.label} coeff={`${(o.coeff * 100).toFixed(0)}%`} />)}
          </div>
          <Slider label="Кут нахилу" tip={AUDIT_TIPS.incl} value={inclinationAngle} onChange={setInclinationAngle} min={0} max={90} step={1} unit={`° (${(getInclCoeff(inclinationAngle) * 100).toFixed(0)}%)`} marks={['0° горизонт', '33° оптимум', '90° вертикаль']} />
          <Slider label="Місячне споживання" tip={AUDIT_TIPS.consumption} value={monthlyConsumption} onChange={setMonthlyConsumption} min={mode === 'commercial' ? 200 : 50} max={mode === 'commercial' ? 10000 : 1500} step={mode === 'commercial' ? 100 : 25} unit="кВт·год" marks={[mode === 'commercial' ? '200' : '50', mode === 'commercial' ? '10,000' : '1,500']} />
        </div>)}

        {/* ADVANCED STEP 3: Grid + Blackout */}
        {calcMode === 'advanced' && step === 3 && (<div>
          <div style={wS.title}>Мережа та автономність</div>
          <div style={wS.desc}>Параметри для підбору інвертора та акумулятора</div>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#616161', marginBottom: '0.75rem', display: 'block' }}>Фази <AuditTip text={AUDIT_TIPS.phases} /></label>
          <div style={{ display: 'flex', gap: 0, background: '#f5f5f5', borderRadius: 50, padding: 4, width: 'fit-content', marginBottom: '2rem' }}>
            <button onClick={() => setPhases(1)} style={{ padding: '10px 24px', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', background: phases === 1 ? 'linear-gradient(135deg,#388e3c,#4caf50)' : 'transparent', color: phases === 1 ? 'white' : '#9e9e9e' }}>1 фаза (220В)</button>
            <button onClick={() => setPhases(3)} style={{ padding: '10px 24px', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', background: phases === 3 ? 'linear-gradient(135deg,#388e3c,#4caf50)' : 'transparent', color: phases === 3 ? 'white' : '#9e9e9e' }}>3 фази (380В)</button>
          </div>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#616161', marginBottom: '0.75rem', display: 'block' }}>Відключення <AuditTip text={AUDIT_TIPS.blackout} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
            {AUDIT_BLACKOUTS.map(b => <OptionCard key={b.id} selected={blackout === b.id} onClick={() => setBlackout(b.id)} icon={b.icon} label={b.label} />)}
          </div>
          {blackout !== 'none' && <Slider label="Автономність" tip={AUDIT_TIPS.autonomy} value={autonomyHours} onChange={setAutonomyHours} min={1} max={24} step={1} unit="год" marks={['1', '12', '24 год']} />}
        </div>)}

        {/* ADVANCED STEP 4: Profile + Tariff + Coefficients */}
        {calcMode === 'advanced' && step === 4 && (<div>
          <div style={wS.title}>Параметри та коефіцієнти</div>
          <div style={wS.desc}>Професійне налаштування для точного розрахунку</div>

          {/* Consumption Profile */}
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#616161', marginBottom: '0.75rem', display: 'block' }}>Профіль споживання <AuditTip text={AUDIT_TIPS.profile} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {AUDIT_PROFILES.map(p => <OptionCard key={p.id} selected={consumptionProfile === p.id} onClick={() => setConsumptionProfile(p.id)} icon={p.icon} label={p.label} desc={p.desc} coeff={`Вечір: ${(p.evening * 100).toFixed(0)}%`} />)}
          </div>

          {/* Tariff type */}
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#616161', marginBottom: '0.75rem', display: 'block' }}>Тип тарифу <AuditTip text={AUDIT_TIPS.tariffType} /></label>
          <div style={{ display: 'flex', gap: 0, background: '#f5f5f5', borderRadius: 50, padding: 4, width: 'fit-content', marginBottom: '1.5rem' }}>
            {AUDIT_TARIFF_TYPES.map(tt => (
              <button key={tt.id} onClick={() => setTariffType(tt.id)} style={{ padding: '10px 24px', borderRadius: 50, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s', background: tariffType === tt.id ? 'linear-gradient(135deg,#388e3c,#4caf50)' : 'transparent', color: tariffType === tt.id ? 'white' : '#9e9e9e' }}>{tt.label}</button>
            ))}
          </div>

          {blackout !== 'none' && <Slider label="Критичне навантаження" tip={AUDIT_TIPS.critLoad} value={criticalLoad} onChange={setCriticalLoad} min={0.3} max={10} step={0.1} unit="кВт" marks={['0.3', '5', '10 кВт']} />}

          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#424242', marginBottom: '1rem', marginTop: '0.5rem' }}>⚙️ Системні коефіцієнти</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {[{ l: 'Ефективність', t: AUDIT_TIPS.sysEff, v: sysEff, s: setSysEff, st: 0.01, d: AUDIT_DEF.sysEff },
              { l: 'DoD батареї', t: AUDIT_TIPS.battDoD, v: battDoD, s: setBattDoD, st: 0.01, d: AUDIT_DEF.battDoD },
              { l: 'ККД батареї', t: AUDIT_TIPS.battEff, v: battEff, s: setBattEff, st: 0.01, d: AUDIT_DEF.battEff },
              { l: 'Деградація/рік', t: AUDIT_TIPS.deg, v: degradation, s: setDegradation, st: 0.001, d: AUDIT_DEF.deg },
              { l: 'Денний тариф грн', t: AUDIT_TIPS.tariff, v: customTariff || effectiveTariff, s: setCustomTariff, st: 0.01, d: effectiveTariff },
              ...(tariffType === 'dayNight' ? [{ l: 'Нічний тариф грн', t: AUDIT_TIPS.nightTariff, v: nightTariff || effectiveNightTariff, s: setNightTariff, st: 0.01, d: effectiveNightTariff }] : []),
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: '0.82rem', color: '#757575', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{p.l} <AuditTip text={p.t} /></div>
                <input type="number" step={p.st} value={p.v} onChange={e => p.s(+e.target.value || p.d)} style={{ padding: '10px 14px', border: '2px solid #eee', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, color: '#2d7a3a', outline: 'none', textAlign: 'center', width: '100%' }} />
              </div>
            ))}
          </div>
        </div>)}

        {/* RESULTS */}
        {isResult && res && (<div>
          <div style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg,#388e3c,#2d7a3a)', borderRadius: 20, color: 'white', marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>🌞 Ваша сонячна електростанція</h2>
            <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>{res.regLbl} · {res.instLbl}{calcMode === 'advanced' ? ` · ${res.oriLbl} · ${inclinationAngle}°` : ''} · {mode === 'residential' ? 'Побутовий' : 'Комерційний'} · {res.tarUsed} грн/кВт·год{calcMode === 'advanced' && res.tariffType === 'dayNight' ? ' (двозонний)' : ''}</p>
            {calcMode === 'advanced' && <p style={{ opacity: 0.65, fontSize: '0.8rem', marginTop: 6 }}>{res.profileLbl} профіль{res.tempLoss !== '0.0' ? ` · Температурні втрати: −${res.tempLoss}%` : ''}{res.needBatt ? ` · Батарея: ${res.battMode === 'emergency' ? 'аварійна' : res.battMode === 'selfconsumption' ? 'самоспоживання' : 'оптимізація'}` : ''}</p>}
          </div>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', margin: '2rem 0' }}>
            {[{ v: res.recP, l: 'кВт рекомендовано' }, { v: res.pC + ' шт', l: 'Панелей 455 Вт' }, { v: res.expGen.toLocaleString(), l: 'кВт·год / рік' },
              ...(calcMode === 'advanced' ? [{ v: res.expGenMo.toLocaleString(), l: 'кВт·год / місяць' }] : []),
              ...(res.needBatt ? [{ v: res.battCap, l: `кВт·год батарея${calcMode === 'advanced' ? (res.battMode === 'emergency' ? ' (аварійна)' : res.battMode === 'selfconsumption' ? ' (самоспож.)' : ' (оптимізація)') : ''}` }] : []),
              { v: res.totCost.toLocaleString(), l: 'грн вартість' }
            ].map((k, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '1.25rem', background: 'white', border: '1px solid #eee', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#2d7a3a' }}>{k.v}</div>
                <div style={{ fontSize: '0.72rem', color: '#9e9e9e', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* FINANCE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: 20, textAlign: 'center', background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: '#2d7a3a' }}>{res.annSav.toLocaleString()} грн</div>
              <div style={{ fontSize: '0.78rem', color: '#9e9e9e', marginTop: 4 }}>Річна економія</div>
              <div style={{ fontSize: '0.8rem', color: '#388e3c', marginTop: 6 }}>~{res.moSav.toLocaleString()} грн/міс</div>
            </div>
            <div style={{ padding: '1.25rem', borderRadius: 20, textAlign: 'center', background: '#fff9c4', border: '1px solid #ffee58' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: '#f9a825' }}>{res.payback} р.</div>
              <div style={{ fontSize: '0.78rem', color: '#9e9e9e', marginTop: 4 }}>Окупність</div>
            </div>
            {calcMode === 'advanced' && <>
              <div style={{ padding: '1.25rem', borderRadius: 20, textAlign: 'center', background: 'linear-gradient(135deg,#e8f5e9,#fff9c4)', border: '1px solid #a5d6a7' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: '#388e3c' }}>{res.roi}%</div>
                <div style={{ fontSize: '0.78rem', color: '#9e9e9e', marginTop: 4 }}>ROI (25 років)</div>
              </div>
              <div style={{ padding: '1.25rem', borderRadius: 20, textAlign: 'center', background: '#fafafa', border: '1px solid #eee' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: '#424242' }}>{res.costOff}%</div>
                <div style={{ fontSize: '0.78rem', color: '#9e9e9e', marginTop: 4 }}>Компенсація</div>
              </div>
            </>}
          </div>

          {/* BOM */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#212121', marginBottom: '1rem' }}>📦 Специфікація (BOM)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
                <thead><tr>{['Категорія', 'Компонент', 'К-сть', 'Ціна/шт', 'Сума'].map((h, i) => <th key={i} style={{ background: 'linear-gradient(135deg,#388e3c,#2d7a3a)', color: 'white', padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, textAlign: i > 1 ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {res.bom.map((item, i) => (
                    <tr key={i}><td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f5f5f5', fontSize: '0.68rem', color: '#bdbdbd', textTransform: 'uppercase' }}>{item.cat}</td><td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f5f5f5', fontSize: '0.88rem', color: '#616161' }}>{item.name}</td><td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f5f5f5', textAlign: 'right' }}>{item.qty}</td><td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f5f5f5', textAlign: 'right' }}>{item.up.toLocaleString()}</td><td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f5f5f5', textAlign: 'right', fontWeight: 600 }}>{item.tot.toLocaleString()} грн</td></tr>
                  ))}
                  <tr><td colSpan={4} style={{ padding: '0.75rem 1rem', background: '#e8f5e9', fontWeight: 700, color: '#2d7a3a', fontSize: '1rem' }}>РАЗОМ</td><td style={{ padding: '0.75rem 1rem', background: '#e8f5e9', textAlign: 'right', fontWeight: 700, color: '#2d7a3a', fontSize: '1rem' }}>{res.totCost.toLocaleString()} грн</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SEASONAL (advanced) */}
          {calcMode === 'advanced' && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#212121', marginBottom: '1rem' }}>📊 Сезонна генерація</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
                {res.moGen.map((v, i) => { const mx = Math.max(...res.moGen); return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: '0.6rem', color: '#bdbdbd' }}>{v}</div>
                    <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg,#fdd835,#66bb6a)', height: `${mx > 0 ? (v / mx) * 100 : 0}%`, minWidth: 20, transition: 'height 0.6s' }} />
                    <div style={{ fontSize: '0.65rem', color: '#9e9e9e', fontWeight: 600 }}>{AUDIT_MO_NAMES[i]}</div>
                  </div>
                ); })}
              </div>
            </div>
          )}

          {/* 25y DEGRADATION (advanced) */}
          {calcMode === 'advanced' && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#212121', marginBottom: '1rem' }}>📉 25-річна симуляція</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
                  <thead><tr>{['Рік', 'Генерація', 'Економія/рік', 'Накопичено', 'Чистий прибуток'].map((h, i) => <th key={i} style={{ background: '#f5f5f5', padding: '0.6rem 0.8rem', fontSize: '0.72rem', fontWeight: 600, color: '#757575', textAlign: 'center' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {res.degTable.filter((_, i) => i < 5 || (i + 1) % 5 === 0).map((d, i) => (
                      <tr key={i} style={d.net >= 0 && (i === 0 || res.degTable[d.year - 2]?.net < 0) ? { background: '#e8f5e9' } : {}}>
                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid #f5f5f5' }}>{d.year}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #f5f5f5' }}>{d.gen.toLocaleString()}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #f5f5f5' }}>{d.sav.toLocaleString()}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', borderBottom: '1px solid #f5f5f5' }}>{d.cum.toLocaleString()}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600, color: d.net >= 0 ? '#2d7a3a' : '#9e9e9e', borderBottom: '1px solid #f5f5f5' }}>{d.net >= 0 ? '+' : ''}{d.net.toLocaleString()} грн</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CREDIT */}
          {mode === 'residential' && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg,#fbc02d,#f9a825)', borderRadius: 20, textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#212121', marginBottom: 4 }}>🏦 Кредит 0% — «Джерела енергії»</h3>
              <p style={{ color: '#424242', fontSize: '0.9rem' }}>До 480,000 грн на 10 років. Компенсація до 30%.{res.totCost <= 480000 ? ` Ваша система (${res.totCost.toLocaleString()} грн) покривається!` : ''}</p>
            </div>
          )}
          {mode === 'commercial' && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg,#fbc02d,#f9a825)', borderRadius: 20, textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#212121', marginBottom: 4 }}>🏢 «Доступні кредити 5-7-9%»</h3>
              <p style={{ color: '#424242', fontSize: '0.9rem' }}>До 5 млн грн на 10 років під 5-9% для юр. осіб та ФОП.</p>
            </div>
          )}

          <InfoTip icon="⚠️">Попередній розрахунок. Для точної оцінки потрібен виїзний аудит. Зв'яжіться для безкоштовної консультації.</InfoTip>
        </div>)}

        {/* NAV */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f5f5f5' }}>
          {step > 0 ? <button onClick={() => setStep(s => s - 1)} style={{ padding: '12px 28px', borderRadius: 50, background: 'white', border: '1px solid #e0e0e0', color: '#757575', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>← Назад</button>
            : <button onClick={() => goToPage('home')} style={{ padding: '12px 28px', borderRadius: 50, background: 'white', border: '1px solid #e0e0e0', color: '#757575', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>← На головну</button>}
          {!isResult ? (
            <button disabled={!canProceed()} onClick={() => setStep(s => s + 1)} style={{ padding: '12px 28px', borderRadius: 50, background: canProceed() ? 'linear-gradient(135deg,#388e3c,#4caf50)' : '#e0e0e0', color: 'white', fontWeight: 600, cursor: canProceed() ? 'pointer' : 'not-allowed', fontSize: '0.95rem', border: 'none', boxShadow: canProceed() ? '0 4px 16px rgba(76,175,80,0.3)' : 'none' }}>
              {step === totalSteps - 2 ? '🔍 Розрахувати' : 'Далі →'}
            </button>
          ) : (
            <button onClick={() => { setStep(0); }} style={{ padding: '12px 28px', borderRadius: 50, background: 'linear-gradient(135deg,#388e3c,#4caf50)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', border: 'none', boxShadow: '0 4px 16px rgba(76,175,80,0.3)' }}>🔄 Знову</button>
          )}
        </div>
      </div>
    </div>
  );
}
/* ═══════════ END AUDIT WIZARD ═══════════ */

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
  const [nkonBatteries, setNkonBatteries] = useState([]);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    if (path === '/ecoflow') return 'ecoflow';
    if (path === '/zendure') return 'zendure';
    if (path === '/deye') return 'deye';
    if (path === '/anker') return 'anker';
    if (path === '/credit') return 'credit';
    if (path === '/audit') return 'audit';
    if (path === '/blog') return 'blog';
    if (path.startsWith('/blog/')) return 'article:' + path.slice(6);
    return 'home';
  });

  const goToPage = (page) => {
    let url;
    if (page === 'home') url = '/';
    else if (page.startsWith('article:')) url = `/blog/${page.slice(8)}`;
    else url = `/${page}`;
    window.history.pushState({page}, '', url);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onPopState = (e) => {
      if (e.state?.page) {
        setCurrentPage(e.state.page);
      } else {
        const path = window.location.pathname;
        if (path === '/blog') setCurrentPage('blog');
        else if (path === '/audit') setCurrentPage('audit');
        else if (path.startsWith('/blog/')) setCurrentPage('article:' + path.slice(6));
        else if (path === '/') setCurrentPage('home');
        else setCurrentPage(path.slice(1));
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // SEO — update meta tags on page change
  useEffect(() => {
    if (currentPage === 'blog') {
      setSEO({
        title: 'Блог — SolarBalkon | Статті про сонячну енергію',
        description: 'Корисні статті про балконні сонячні електростанції, тарифи на електроенергію, державні програми кредитування та порівняння обладнання.',
        url: 'https://solarbalkon.shop/blog',
        type: 'website',
      });
    } else if (currentPage.startsWith('article:')) {
      const slug = currentPage.slice(8);
      const article = ARTICLES.find(a => a.slug === slug);
      if (article) {
        setSEO({
          title: `${article.title} — SolarBalkon`,
          description: article.excerpt,
          url: `https://solarbalkon.shop/blog/${slug}`,
          image: article.image,
          type: 'article',
          article,
        });
      }
    } else {
      setSEO({
        title: 'SolarBalkon — Балконні сонячні електростанції в Україні',
        description: 'Сонячні панелі, накопичувачі EcoFlow, Zendure, Deye для балкону. Кредит 0% до 480,000 грн. Калькулятор економії та конфігуратор системи.',
        url: 'https://solarbalkon.shop',
        type: 'website',
      });
    }
  }, [currentPage]);

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
          // Inverters only (category Інвертор), batteries separately
          // Inverters: anything that is NOT explicitly a battery
          const inverters = data.inverters.filter(d => {
            const cat = (d.category || '').toLowerCase();
            return !cat.includes('батар') && !cat.includes('battery') && !cat.includes('bms');
          });
          // Batteries: explicitly marked as battery/BMS
          const batteries = data.inverters.filter(d => {
            const cat = (d.category || '').toLowerCase();
            return cat.includes('батар') || cat.includes('battery') || cat.includes('bms');
          });
          setCommercialInverters(inverters);
          if (batteries.length > 0) {
            setNkonBatteries(batteries);
            setSelectedBattery(batteries[0]);
          }
          const first1ph = inverters.find(inv => inv.phases === 1);
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
      audit: {
        title: 'Аудит об\'єкта — Розрахунок СЕС | SolarBalkon',
        desc: 'Безкоштовний онлайн-калькулятор сонячної електростанції. Розрахунок потужності, генерації, окупності та специфікації обладнання для вашого об\'єкта в Україні.',
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
            <li><a href="/#equip" onClick={(e) => { e.preventDefault(); goToPage('home'); setTimeout(() => document.getElementById('equip')?.scrollIntoView({behavior:'smooth'}), 100); }}>{tariffType === 'commercial' ? 'Аудит СЕС' : 'Конфігуратор'}</a></li>
            <li><a href="/#savings" onClick={(e) => { e.preventDefault(); goToPage('home'); setTimeout(() => document.getElementById('savings')?.scrollIntoView({behavior:'smooth'}), 100); }}>Економія</a></li>
            <li><a href="/audit" className="nav-audit" onClick={(e) => { e.preventDefault(); goToPage('audit'); }}>⚡ Аудит СЕС</a></li>
            <li><a href="/blog" onClick={(e) => { e.preventDefault(); goToPage('blog'); }}>Блог</a></li>
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

            {/* RECOMMENDATION */}
            {(() => {
              const fittingProducts = PRODUCTS.filter(p => p.output >= totalWatts);
              const needCommercial = fittingProducts.length === 0;
              const bestFit = fittingProducts.length > 0
                ? fittingProducts.reduce((a, b) => a.output <= b.output && a.price <= b.price ? a : b)
                : null;

              // Find best matching commercial inverters for current load
              const bestInv1ph = commercialInverters.filter(inv => inv.phases === 1 && inv.kw * 1000 >= totalWatts)[0] || null;
              const bestInv3ph = commercialInverters.filter(inv => inv.phases === 3 && inv.kw * 1000 >= totalWatts)[0] || null;
              const showCommercialCards = commercialInverters.length > 0 && (bestInv1ph || bestInv3ph);

              const scrollToCommercial = (phases, kw) => {
                setTariffType('commercial');
                setConfigSystem('deye');
                setInvPhaseFilter(phases);
                setInvSelectedKw(kw);
                setTimeout(() => {
                  const el = document.getElementById('commercial');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 400);
              };

              return (
                <div className="calc-reco">
                  {needCommercial ? (
                    /* ── Навантаження > 6 кВт: тільки комерційні ── */
                    <div className="calc-reco-commercial">
                      <div className="calc-reco-title">
                        🏢 Навантаження {totalWatts.toLocaleString()} Вт — потрібна комерційна СЕС
                      </div>
                      <p style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.75rem' }}>
                        Рекомендуємо гібридний інвертор Deye:
                      </p>
                      {showCommercialCards && (
                        <div className="calc-reco-grid">
                          {bestInv1ph && (
                            <div className="calc-reco-card best" onClick={() => scrollToCommercial(1, bestInv1ph.kw)}>
                              <div className="calc-reco-card-name">{bestInv1ph.kw} кВт · 1-фаза</div>
                              <div className="calc-reco-card-out">{bestInv1ph.model}</div>
                              <div className="calc-reco-card-price">{formatPrice(bestInv1ph.priceUah)}</div>
                              <div className="calc-reco-card-badge">Рекомендовано</div>
                            </div>
                          )}
                          {bestInv3ph && (
                            <div className="calc-reco-card" onClick={() => scrollToCommercial(3, bestInv3ph.kw)}>
                              <div className="calc-reco-card-name">{bestInv3ph.kw} кВт · 3-фази</div>
                              <div className="calc-reco-card-out">{bestInv3ph.model}</div>
                              <div className="calc-reco-card-price">{formatPrice(bestInv3ph.priceUah)}</div>
                              <div className="calc-reco-card-badge">3-фази</div>
                            </div>
                          )}
                        </div>
                      )}
                      <button style={{ marginTop: '1rem' }} onClick={() => scrollToCommercial(1, bestInv1ph?.kw || invSelectedKw)}>
                        Переглянути всі інвертори →
                      </button>
                    </div>
                  ) : (
                    /* ── Побутові системи підходять ── */
                    <>
                      <div className="calc-reco-title">
                        ⚡ {fittingProducts.length === PRODUCTS.length
                          ? 'Усі наші системи підходять — оберіть за потребами'
                          : `Рекомендовані системи для ${totalWatts.toLocaleString()} Вт навантаження`}
                      </div>
                      <div className="calc-reco-grid">
                        {fittingProducts.map(p => (
                          <div
                            key={p.key}
                            className={`calc-reco-card ${p.key === bestFit?.key ? 'best' : ''}`}
                            onClick={() => goToPage(p.key)}
                          >
                            <div className="calc-reco-card-name">{p.name}</div>
                            <div className="calc-reco-card-out">{p.output.toLocaleString()} Вт · {p.capacity.toLocaleString()} Вт·год</div>
                            <div className="calc-reco-card-price">{formatPrice(p.price)}</div>
                            {p.ups && <div className="calc-reco-card-badge">⚡ UPS</div>}
                            {p.key === bestFit?.key && <div className="calc-reco-card-badge" style={{ background: 'rgba(76,175,80,0.4)' }}>✓ Оптимальний</div>}
                          </div>
                        ))}
                      </div>
                      {fittingProducts.length < PRODUCTS.length && (
                        <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.7 }}>
                          💡 Системи з виходом менше {totalWatts.toLocaleString()} Вт не підходять
                        </div>
                      )}
                      {/* Commercial inverters block — shown when load >2400W */}
                      {totalWatts > 2400 && showCommercialCards && (
                        <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(251,192,45,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(251,192,45,0.35)' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-800)' }}>
                            💼 Також розгляньте комерційні інвертори Deye:
                          </div>
                          <div className="calc-reco-grid">
                            {bestInv1ph && (
                              <div className="calc-reco-card" onClick={() => scrollToCommercial(1, bestInv1ph.kw)}>
                                <div className="calc-reco-card-name">{bestInv1ph.kw} кВт · 1-фаза</div>
                                <div className="calc-reco-card-out">{bestInv1ph.model}</div>
                                <div className="calc-reco-card-price">{formatPrice(bestInv1ph.priceUah)}</div>
                                <div className="calc-reco-card-badge">Deye</div>
                              </div>
                            )}
                            {bestInv3ph && (
                              <div className="calc-reco-card" onClick={() => scrollToCommercial(3, bestInv3ph.kw)}>
                                <div className="calc-reco-card-name">{bestInv3ph.kw} кВт · 3-фази</div>
                                <div className="calc-reco-card-out">{bestInv3ph.model}</div>
                                <div className="calc-reco-card-price">{formatPrice(bestInv3ph.priceUah)}</div>
                                <div className="calc-reco-card-badge">3-фази</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
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
        <section className="section section-green" id="commercial" style={{ scrollMarginTop: '80px' }}>
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


      {/* BATTERIES DEYE — shown after inverters on commercial tariff */}
      {tariffType === 'commercial' && nkonBatteries.length > 0 && (
        <section className="section" id="batteries" style={{ background: '#fffde7' }}>
          <div className="section-title fade-up">Акумуляторні батареї Deye</div>
          <div className="section-sub fade-up-d1">Накопичувачі енергії LiFePO4 — оберіть модель для вашого інвертора</div>

          {/* Battery selector tabs */}
          <div className="inv-kw-buttons fade-up-d2" style={{ marginBottom: '1.5rem' }}>
            {nkonBatteries.map(bat => (
              <button
                key={bat.model}
                className={`inv-kw-btn ${selectedBattery?.model === bat.model ? 'active' : ''}`}
                onClick={() => setSelectedBattery(bat)}
                style={{ fontSize: '0.82rem' }}
              >
                {bat.model}
              </button>
            ))}
          </div>

          {/* Battery card */}
          {selectedBattery && (() => {
            const bat = selectedBattery;
            const specPairs = bat.specs ? bat.specs.split(';').map(s => {
              const [k, ...v] = s.split(':');
              return k && v.length ? [k.trim(), v.join(':').trim()] : null;
            }).filter(Boolean) : [];

            return (
              <div className="inv-card fade-up">
                <div className="inv-card-left">
                  <div style={{ width: 160, height: 160, background: 'var(--yellow-100)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                    🔋
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--gray-700)' }}>{bat.model}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{bat.category}</div>
                  </div>
                </div>
                <div className="inv-card-right">
                  <div className="inv-card-name">{bat.name}</div>
                  <div className="inv-card-model">{bat.model}</div>

                  <div className="inv-card-badges">
                    <span className="inv-badge" style={{ background: '#e8f5e9', color: '#2d7a3a' }}>LiFePO4</span>
                    <span className="inv-badge" style={{ background: '#e3f2fd', color: '#1565c0' }}>Deye</span>
                    {bat.availability && (
                      <span className={`inv-badge ${bat.availability === 'В наявності' ? 'inv-badge-avail' : ''}`}
                        style={bat.availability !== 'В наявності' ? { background: '#fff3e0', color: '#e65100' } : {}}>
                        {bat.availability}
                      </span>
                    )}
                  </div>

                  {specPairs.length > 0 && (
                    <div className="inv-card-specs">
                      {specPairs.map(([k, v], j) => (
                        <div className="inv-card-spec" key={j}>
                          <span className="inv-card-spec-label">{k}</span>
                          <span className="inv-card-spec-value">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {bat.usp && <div className="inv-card-usp">💡 {bat.usp}</div>}

                  <div className="inv-card-price">{formatPrice(bat.priceUah)}</div>
                  <div className="inv-card-price-eur">{bat.clientEur?.toFixed(2)} € · курс ПриватБанку</div>

                  <div className="inv-card-actions">
                    <button
                      className="inv-card-buy"
                      onClick={() => {
                        setDirectOrder({ name: bat.name + ' (' + bat.model + ')', price: bat.priceUah });
                        setShowOrderForm(true);
                        setOrderStatus(null);
                        setOrderForm({ name: '', phone: '', address: '' });
                      }}
                    >
                      🛒 Замовити
                    </button>
                    {bat.productUrl && (
                      <a className="inv-card-link" href={bat.productUrl} target="_blank" rel="noopener noreferrer">
                        🔗 Магазин
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* EQUIPMENT / CONFIGURATOR or AUDIT */}
      {tariffType !== 'commercial' ? (
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
      ) : (
      <div id="equip" style={{ scrollMarginTop: '80px' }}>
        {/* Commercial tariff: configurator replaced by AuditWizard CTA */}
        <section className="section section-alt">
          <div className="section-title fade-up">Розрахунок комерційної СЕС</div>
          <div className="section-sub fade-up-d1">Повний енергоаудит об'єкта — розрахунок окупності, підбір інвертора та батарей</div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              className="hero-cta"
              onClick={() => goToPage('audit')}
              style={{ display: 'inline-block' }}
            >
              🔍 Розпочати аудит об'єкта →
            </button>
            <p style={{ marginTop: '1rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
              Або прокрутіть вгору щоб переглянути інвертори та батареї Deye
            </p>
          </div>
        </section>
      </div>
      )}

      {/* AUDIT BANNER — only show for residential (commercial already has AuditWizard inline) */}
      {tariffType !== 'commercial' && (
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="audit-banner fade-up" onClick={() => goToPage('audit')}>
          <div className="audit-banner-content">
            <div className="audit-banner-badge">🆕 Новий інструмент</div>
            <h3>Аудит об'єкта — Розрахунок СЕС</h3>
            <p>
              Не знаєте з чого почати? Наш покроковий калькулятор розрахує оптимальну 
              систему для вашого об'єкта: потужність, генерацію, обладнання та окупність.
            </p>
            <div className="audit-banner-features">
              <div className="audit-banner-feat"><span>📊</span> Детальний BOM</div>
              <div className="audit-banner-feat"><span>💰</span> Розрахунок окупності</div>
              <div className="audit-banner-feat"><span>🔋</span> Підбір батареї</div>
              <div className="audit-banner-feat"><span>📍</span> 22 області України</div>
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <span className="audit-banner-cta">🔍 Розрахувати систему →</span>
            </div>
          </div>
          <div className="audit-banner-icon">🏗️</div>
        </div>
      </section>
      )}

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

      {/* BLOG PREVIEW */}
      <section className="section section-alt">
        <div className="section-title fade-up">Корисні статті</div>
        <div className="section-sub fade-up-d1">Дізнайтесь більше про сонячну енергію та як зекономити</div>
        <div className="blog-grid" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: 0 }}>
          {ARTICLES.slice(0, 3).map((a) => (
            <div className="blog-card fade-up-d2" key={a.slug} onClick={() => goToPage('article:' + a.slug)}>
              <div className="blog-card-img-placeholder" style={a.image ? { backgroundImage: `url(${a.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                {!a.image && (
                  <>
                    {a.category === 'Гід' && '📖'}
                    {a.category === 'Фінанси' && '💰'}
                    {a.category === 'Порівняння' && '⚖️'}
                    {a.category === 'Аналітика' && '📊'}
                  </>
                )}
              </div>
              <div className="blog-card-body">
                <div className="blog-card-meta">
                  <span className="blog-card-category">{a.category}</span>
                  <span className="blog-card-date">{formatArticleDate(a.date)}</span>
                </div>
                <div className="blog-card-title">{a.title}</div>
                <div className="blog-card-excerpt">{a.excerpt}</div>
                <div className="blog-card-footer">
                  <span className="blog-card-read">🕐 {a.readTime} хв</span>
                  <span className="blog-card-link">Читати →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button onClick={() => goToPage('blog')} style={{ background: 'none', border: '2px solid var(--green-500)', borderRadius: '50px', padding: '12px 32px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--green-700)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = 'var(--green-500)'; e.target.style.color = 'white'; }}
            onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--green-700)'; }}
          >Усі статті →</button>
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

      {/* ═══════ BLOG LISTING PAGE ═══════ */}
      {currentPage === 'blog' && (
        <div className="blog-page">
          <div className="blog-header">
            <a href="/" onClick={(e) => { e.preventDefault(); goToPage('home'); }} style={{ color: 'var(--green-600)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, display: 'inline-block', marginBottom: '1rem' }}>← Головна</a>
            <h1>Блог SolarBalkon</h1>
            <p>Корисні статті про сонячну енергію, обладнання, тарифи та державні програми</p>
          </div>

          <div className="blog-grid">
            {ARTICLES.map((a) => (
              <div className="blog-card" key={a.slug} onClick={() => goToPage('article:' + a.slug)}>
                <div className="blog-card-img-placeholder" style={a.image ? { backgroundImage: `url(${a.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                  {!a.image && (
                    <>
                      {a.category === 'Гід' && '📖'}
                      {a.category === 'Фінанси' && '💰'}
                      {a.category === 'Порівняння' && '⚖️'}
                      {a.category === 'Аналітика' && '📊'}
                    </>
                  )}
                </div>
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="blog-card-category">{a.category}</span>
                    <span className="blog-card-date">{formatArticleDate(a.date)}</span>
                  </div>
                  <div className="blog-card-title">{a.title}</div>
                  <div className="blog-card-excerpt">{a.excerpt}</div>
                  <div className="blog-card-footer">
                    <span className="blog-card-read">🕐 {a.readTime} хв читання</span>
                    <span className="blog-card-link">Читати →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <SocialFooter />
        </div>
      )}

      {/* ═══════ ARTICLE DETAIL PAGE ═══════ */}
      {currentPage.startsWith('article:') && (() => {
        const slug = currentPage.slice(8);
        const article = ARTICLES.find(a => a.slug === slug);
        if (!article) return (
          <div className="article-page" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gray-900)', marginBottom: '1rem' }}>Статтю не знайдено</h1>
            <a href="/blog" onClick={(e) => { e.preventDefault(); goToPage('blog'); }} style={{ color: 'var(--green-600)', fontWeight: 600 }}>← Повернутися до блогу</a>
          </div>
        );

        // Simple markdown-like rendering
        const renderContent = (md) => {
          const lines = md.trim().split('\n');
          const html = [];
          let inTable = false;
          let tableRows = [];
          let inList = false;
          let listItems = [];
          let listType = 'ul';

          const flushList = () => {
            if (listItems.length > 0) {
              html.push(`<${listType}>${listItems.join('')}</${listType}>`);
              listItems = [];
              inList = false;
            }
          };

          const flushTable = () => {
            if (tableRows.length > 0) {
              const headerCells = tableRows[0].split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
              const bodyRows = tableRows.slice(2).map(row => {
                const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
              }).join('');
              html.push(`<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`);
              tableRows = [];
              inTable = false;
            }
          };

          for (const line of lines) {
            const trimmed = line.trim();

            // Table detection
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
              if (!inTable) { flushList(); inTable = true; }
              tableRows.push(trimmed);
              continue;
            } else if (inTable) {
              flushTable();
            }

            // Headings
            if (trimmed.startsWith('## ')) {
              flushList();
              html.push(`<h2>${trimmed.slice(3)}</h2>`);
            } else if (trimmed.startsWith('### ')) {
              flushList();
              html.push(`<h3>${trimmed.slice(4)}</h3>`);
            }
            // List items
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              if (!inList) { inList = true; listType = 'ul'; }
              const content = trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
              listItems.push(`<li>${content}</li>`);
            }
            // Numbered list
            else if (/^\d+\.\s/.test(trimmed)) {
              if (!inList) { inList = true; listType = 'ol'; }
              const content = trimmed.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
              listItems.push(`<li>${content}</li>`);
            }
            // Paragraph
            else if (trimmed.length > 0) {
              flushList();
              const content = trimmed
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:var(--green-600)">$1</a>');
              html.push(`<p>${content}</p>`);
            }
            // Empty line
            else {
              flushList();
            }
          }
          flushList();
          flushTable();
          return html.join('\n');
        };

        const related = ARTICLES.filter(a => a.slug !== slug).slice(0, 3);
        const articleUrl = `https://solarbalkon.shop/blog/${slug}`;

        return (
          <div className="article-page">
            <div className="article-header">
              <div className="article-breadcrumbs">
                <a href="/" onClick={(e) => { e.preventDefault(); goToPage('home'); }}>Головна</a>
                <span>/</span>
                <a href="/blog" onClick={(e) => { e.preventDefault(); goToPage('blog'); }}>Блог</a>
                <span>/</span>
                <span>{article.category}</span>
              </div>

              <div className="article-meta">
                <span className="blog-card-category">{article.category}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>{formatArticleDate(article.date)}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>🕐 {article.readTime} хв</span>
              </div>

              <h1>{article.title}</h1>
              <p className="article-excerpt">{article.excerpt}</p>
            </div>

            <div className="article-content" dangerouslySetInnerHTML={{ __html: renderContent(article.content) }} />

            {/* Tags */}
            <div className="article-tags">
              {article.tags.map((tag, i) => (
                <span className="article-tag" key={i}>#{tag}</span>
              ))}
            </div>

            {/* Share */}
            <div className="article-share">
              <span className="article-share-label">Поділитися:</span>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" title="Telegram">📨</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`} target="_blank" rel="noopener noreferrer" title="Facebook">📘</a>
              <a href={`viber://forward?text=${encodeURIComponent(article.title + ' ' + articleUrl)}`} title="Viber">💬</a>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="article-related">
                <h3>Читайте також</h3>
                <div className="article-related-grid">
                  {related.map(r => (
                    <div className="article-related-card" key={r.slug} onClick={() => goToPage('article:' + r.slug)}>
                      <div className="article-related-card-title">{r.title}</div>
                      <div className="article-related-card-date">{formatArticleDate(r.date)} · {r.readTime} хв</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <SocialFooter />
          </div>
        );
      })()}

      {/* ═══════ AUDIT PAGE ═══════ */}
      {currentPage === 'audit' && <AuditWizard goToPage={goToPage} liveInverters={commercialInverters} />}

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
