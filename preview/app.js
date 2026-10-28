import { categories, accounts, localDateKey, addMonths, makeDemo, forMonth, totals, categoryTotals, makeWealthHistory, deletionPolicy, monthChange, attentionStory, pace, trendsComparison, monthlySeries } from './model.js?v=b09b612087';
import { RETIREMENT, demoRetirementPlan, parseRetirementPlan, retirementProjection, retirementEligibleBalance, statusLabel, parseLoans, demoLoans, loanResult, payoffScenario, debtPortfolio, loanKindName, parseOwnership, ownershipLens } from './planning.js?v=b09b612087';

const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  activity: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  trends: '<path d="M3 3v18h18M6 16l5-6 4 3 6-9"/>',
  wealth: '<path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M2 20h20"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  cart: '<path d="M2 3h3l3 12h11l3-8H6M9 20h.01M18 20h.01"/>',
  utensils: '<path d="M5 3v6q0 3 3 3t3-3V3M8 3v18M20 21V3q-5 1-5 9h5"/>',
  car: '<path d="m5 7 2-4h10l2 4 2 4v8H3v-8ZM3 11h18M7 15h.01M17 15h.01M5 19v2M19 19v2"/>',
  play: '<rect x="3" y="4" width="18" height="16" rx="4"/><path d="m10 8 6 4-6 4Z"/>',
  bag: '<path d="M4 7h16l1 14H3ZM8 8V6a4 4 0 0 1 8 0v2"/>',
  repeat: '<path d="m17 2 4 4-4 4M21 6H7a4 4 0 0 0-4 4M7 22l-4-4 4-4M3 18h14a4 4 0 0 0 4-4"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7Z"/>',
  income: '<path d="M12 3v18M16 7H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6"/>',
  arrowIn: '<path d="M18 6 6 18M6 6v12h12"/>',
  arrowOut: '<path d="M6 18 18 6M6 6h12v12"/>',
  settings: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
  bank: '<path d="m2 8 10-6 10 6ZM3 21h18M5 10v8M10 10v8M14 10v8M19 10v8"/>',
  spark: '<path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  minusCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.1"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  down: '<path d="M3 3v18h18M6 8l5 5 4-3 6 7"/>',
  person: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/>',
  doc: '<path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8C9 8 7 4 9.5 3.5S12 8 12 8s.5-5 2.5-4.5S15 8 12 8"/>',
  family: '<circle cx="7" cy="5" r="2"/><circle cx="17" cy="5" r="2"/><circle cx="12" cy="11" r="1.6"/><path d="M5 21v-6l-1-5h6l-1 5v6M15 21v-6l-1-5h6l-1 5v6M11 21v-4h2v4"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10M14 9l3 2v7a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2Z"/><path d="m4 4 5 5M3 7l2-2"/>',
  personOne: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  heart: '<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.5-9 9-9 9Z"/>',
  plane: '<path d="M10 14 3 12l1-2 7 1 4-6 2 1-2 6 5 2v2l-6-1-3 5h-2l1-5Z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
  paw: '<circle cx="6" cy="10" r="2"/><circle cx="18" cy="10" r="2"/><circle cx="9.5" cy="5.5" r="2"/><circle cx="14.5" cy="5.5" r="2"/><path d="M12 12c-3 0-6 4-6 6.5S8 21 12 19.5c4 1.5 6 1 6-1S15 12 12 12Z"/>',
  dumbbell: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  cup: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM17 11h1.5a2.5 2.5 0 0 1 0 5H17M3 22h16M8 2v4M12 2v4"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 16.5v.1"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.bank}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
// Whole dollars, like Double.asRoundedCurrency on iOS: NumberFormatter's
// default half-even rounding, and cents only for amounts under $1.
const wholeCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, roundingMode: 'halfEven' });
const minus = text => text.replace(/^-/, '−');
const money = cents => minus(Math.abs(cents) >= 100 || cents === 0 ? wholeCurrency.format(cents / 100) : currency.format(cents / 100));
// Exact amounts where the app uses asCurrency (transaction detail, chart scrubbing).
const exactMoney = cents => minus(currency.format(cents / 100));
const roundMoney = money;
const compact = cents => Math.abs(cents) >= 100000 ? `$${(cents / 100000).toFixed(1).replace(/\.0$/, '')}K` : roundMoney(cents);
const longMonth = month => new Date(`${month}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long' });
const dateLabel = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const monthLabel = month => new Date(`${month}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const shortMonth = month => new Date(`${month}-01T12:00:00`).toLocaleDateString('en-US', { month: 'short' });
const today = new Date();
const asOf = localDateKey(today);
const currentMonth = asOf.slice(0, 7);
const isLivePage = document.documentElement.dataset.mode === 'live';
const demoCategories = categories.map(category => ({ ...category }));
let liveConnection = null, liveConfiguration = null;
let liveMessage = () => 'Could not finish this request. Please try again.';
const rows = makeDemo(today);
const wealthAccounts = accounts.map(account => ({ ...account }));
const wealthHistory = makeWealthHistory(today);
function savedTheme() { try { const value = localStorage.getItem('averlen.theme'); return ['light', 'dark'].includes(value) ? value : null; } catch { return null; } }
const samplePlanning = () => ({ retirement: demoRetirementPlan(), retirementBalance: RETIREMENT.demoBalance, loans: demoLoans(today), debtExtra: 200, split: false, share: 50, lens: 'household' });
const months = [...new Set(rows.map(tx => tx.date.slice(0, 7)))].sort().reverse();
const state = { route: 'login', session: false, liveData: null, phase: 'signed-out', liveError: null, liveDeleted: false, month: currentMonth, query: '', category: '', type: '', ...samplePlanning(), deletedPreview: false, theme: savedTheme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') };
const main = document.querySelector('#main');
const dialog = document.querySelector('#detail');
const catFor = id => categories.find(cat => cat.id === id) || { name: 'Uncategorized', color: '#6C6E73', icon: 'bag' };
const selectedRows = () => forMonth(rows, state.month);
const announce = message => { document.querySelector('#announcement').textContent = message; };
const empty = message => `<div class="empty">${esc(message)}</div>`;

// SF Symbol names stored by the iPhone app, mapped to this page's icons.
const sfIcons = { 'house.fill': 'home', 'creditcard.fill': 'card', 'cart.fill': 'cart', 'bag.fill': 'bag', 'fork.knife': 'utensils', 'gift.fill': 'gift', 'chart.line.uptrend.xyaxis': 'trends', 'bolt.fill': 'bolt', 'figure.2.and.child.holdinghands': 'family', 'fuelpump.fill': 'fuel', 'wrench.and.screwdriver.fill': 'wrench', 'person.fill': 'personOne', 'heart.fill': 'heart', 'tv.fill': 'play', airplane: 'plane', 'car.fill': 'car', 'arrow.down.circle.fill': 'income', iphone: 'phone', 'graduationcap.fill': 'cap', 'pawprint.fill': 'paw', 'dumbbell.fill': 'dumbbell', 'music.note': 'music', 'cup.and.saucer.fill': 'cup', 'tag.fill': 'tag', 'arrow.left.arrow.right': 'repeat', 'dollarsign.circle.fill': 'income', 'questionmark.circle': 'question' };
// A merchant logo sits over the category icon, which stays as the fallback
// until the image loads (and if it fails), as in TransactionRowView.
function catIcon(cat, logo = '') { return `<span class="category-icon" style="--category-color:${cat.color}">${icon(sfIcons[cat.icon] || cat.icon)}${logo ? `<img class="merchant-logo" src="${esc(logo)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}</span>`; }
document.addEventListener('load', event => { if (event.target.classList?.contains('merchant-logo')) event.target.parentElement.classList.add('logo-loaded'); }, true);
document.addEventListener('error', event => { if (event.target.classList?.contains('merchant-logo')) event.target.remove(); }, true);
function txRow(tx, detailed = false) {
  const cat = catFor(tx.category);
  return `<button class="tx-row" data-tx="${esc(tx.id)}" aria-label="${esc(tx.merchant)}, ${money(tx.cents)}, ${esc(cat.name)}, ${dateLabel(tx.date)}">${catIcon(cat, tx.logo)}<span><span class="merchant">${esc(tx.merchant)}</span><span class="tx-meta">${detailed ? `<span class="meta-category">${esc(cat.name)}</span>${tx.transfer ? '<span class="meta-note">Transfer, not in totals</span>' : tx.excluded ? '<span class="meta-note">Excluded from totals</span>' : ''}` : `${dateLabel(tx.date)} · ${esc(cat.name)}`}</span></span>${detailed ? `<span class="table-category">${esc(cat.name)}</span>` : ''}<span class="tx-amount ${tx.income ? 'positive' : ''}">${tx.income ? '+' : '−'}${money(tx.cents)}</span></button>`;
}
function categoryList(data, limit = 7) {
  const cats = categoryTotals(data).slice(0, limit);
  const total = totals(data).spending;
  return cats.map(cat => {
    const share = total ? Math.round(cat.cents / total * 100) : 0;
    return `<button class="category-row" data-category="${esc(cat.id)}" style="--category-color:${cat.color}">${catIcon(cat)}<span><span class="category-name">${esc(cat.name)}</span><span class="category-track" style="display:block"><span class="category-fill" style="display:block;width:${share}%"></span></span></span><span><span class="category-amount">${money(cat.cents)}</span><span class="category-share" style="display:block">${share}%</span></span></button>`;
  }).join('') || empty('No sample spending in this month.');
}
function header(title, subtitle = '', action = '') {
  return `<div class="section-heading"><div><h2>${esc(title)}</h2>${subtitle ? `<p class="card-subtitle">${esc(subtitle)}</p>` : ''}</div>${action}</div>`;
}
function summary(data, { compact: tight = false } = {}) {
  const sum = totals(data);
  return `<div class="summary-strip${tight ? ' tight' : ''}">${[['Income', sum.income, 'arrowIn'], ['Spending', sum.spending, 'arrowOut'], [tight ? 'Net' : 'Net cash flow', sum.net, 'trends']].map(([name, cents, symbol]) => `<div class="card"><div class="stat-label">${icon(symbol)}${name}</div><div class="stat-value ${name === 'Net cash flow' && cents >= 0 ? 'positive' : ''}">${money(cents)}</div></div>`).join('')}</div>`;
}
function paceChart(result) {
  const { length, day, current, typical } = result;
  const top = Math.max(...current, ...(typical || []), 10000);
  const step = 10 ** Math.floor(Math.log10(top / 2)), ceiling = Math.ceil(top / step / 2) * step * 2;
  const x = i => 48 + (i + 1) / length * 486, y = cents => 160 - cents / ceiling * 140;
  const path = values => values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const line = `48,160 ${path(current)}`;
  const ticks = [0, ceiling / 2, ceiling];
  const days = [1, 8, 15, 22].filter(d => d <= length);
  const label = state.liveData ? '' : 'sample ';
  return `<svg class="chart pace-chart" viewBox="0 0 540 186" role="img" aria-label="Cumulative ${label}spending: ${money(result.spent)} through day ${day}${typical ? `, typical ${money(result.typicalToday)} by this day` : ''}"><defs><linearGradient id="pace-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--chart)" stop-opacity=".28"/><stop offset="100%" stop-color="var(--chart)" stop-opacity="0"/></linearGradient></defs>${ticks.map(t => `<line class="gridline" x1="48" x2="540" y1="${y(t)}" y2="${y(t)}"/><text x="0" y="${y(t) + 3}">${compact(t)}</text>`).join('')}${typical ? `<polyline class="typical-line" points="48,160 ${path(typical)}"/>` : ''}<polygon points="${line} ${x(current.length - 1).toFixed(1)},160" fill="url(#pace-fill)"/><polyline points="${line}" class="spending-line"/>${days.map(d => `<text x="${x(d - 1)}" y="182" text-anchor="middle">${d}</text>`).join('')}</svg>${typical ? '<div class="chart-legend"><span><i class="swatch solid"></i>This month</span><span><i class="swatch dashed"></i>Typical history</span></div>' : ''}`;
}
function home() {
  if (state.liveData && !rows.length) { main.innerHTML = '<section class="card account-gate"><h2>No saved transactions yet</h2><p class="note">Open the iPhone app and let it sync. Then reload your saved records here.</p><button class="button" data-action="reload-live">Reload saved records</button></section>'; return; }
  const data = selectedRows();
  const sum = totals(data);
  const change = monthChange(rows, state.month, today);
  const story = attentionStory(rows, state.month, today);
  const paced = pace(rows, state.month, today);
  const purchases = data.filter(tx => !tx.income).length;
  const vsTypical = paced.typicalToday != null ? paced.spent - paced.typicalToday : null;
  const badge = change ? `<span class="delta-pill">${Math.abs(change.percent) < 5 ? `≈ About the same ${change.label}` : `${change.percent > 0 ? '↗' : '↘'} ${Math.abs(change.percent) > 999 ? '999+' : Math.round(Math.abs(change.percent))}% ${change.label}`}</span>` : '<span class="delta-pill quiet">Not enough prior-month data</span>';
  main.innerHTML = `<div class="grid"><div class="stack"><section class="card hero"><div class="overline">Spent in ${longMonth(state.month)}</div><div class="hero-number">${money(sum.spending)}</div>${badge}<p class="subtle">${purchases} ${state.liveData ? '' : 'sample '}purchase${purchases === 1 ? '' : 's'}${state.month === currentMonth ? ` through ${dateLabel(asOf)}` : ''}</p><div class="stats"><div class="stat-tile"><div class="stat-label">Income</div><div class="stat-value positive">${money(sum.income)}</div></div><div class="stat-tile"><div class="stat-label">Net</div><div class="stat-value ${sum.net >= 0 ? 'positive' : ''}">${sum.net >= 0 ? '+' : '−'}${money(Math.abs(sum.net))}</div></div></div></section>${story ? `<button class="card attention" data-category="${esc(story.id)}"><span class="attention-label">Worth a look</span><span class="attention-body">${catIcon(story)}<span><strong>${esc(story.name)} changed most</strong><small>${roundMoney(story.delta)} more than ${longMonth(story.prior)}${story.comparison ? ` ${story.comparison}` : ''}</small></span><span class="chevron" aria-hidden="true">›</span></span></button>` : ''}<section class="card"><div class="section-heading"><div><h2>Monthly pace</h2><p class="card-subtitle">Cumulative spending through day ${paced.day}</p></div>${paced.projected != null ? `<div class="projected"><span>Projected</span><strong>${compact(paced.projected)}</strong></div>` : ''}</div>${vsTypical != null && Math.abs(vsTypical) >= 100 ? `<p class="pace-note">${vsTypical > 0 ? '↗' : '↘'} ${roundMoney(Math.abs(vsTypical))} ${vsTypical > 0 ? 'above' : 'below'} typical today</p>` : ''}${paceChart(paced)}</section></div><div class="stack"><section class="card">${header('Spending by category', 'Follow the numbers into your activity')}<div>${categoryList(data)}</div></section><section class="card">${header('Recent activity', 'The details behind your month', '<a class="text-button" href="#activity">View all activity →</a>')}<div class="transaction-list">${data.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(tx => txRow(tx)).join('') || empty('No transactions in this month.')}</div></section></div></div>`;
}
function activity() {
  main.innerHTML = `<p class="intro">Explore your transactions, follow a category, or find a particular purchase.</p>${summary(selectedRows())}<div class="filters"><div class="search-wrap">${icon('search')}<label class="sr-only" for="search">Search transactions</label><input id="search" type="search" placeholder="Search transactions…" value="${esc(state.query)}" autocomplete="off"></div><label class="sr-only" for="category-filter">Category</label><select id="category-filter"><option value="">All categories</option>${categories.map(cat => `<option value="${esc(cat.id)}" ${state.category === cat.id ? 'selected' : ''}>${esc(cat.name)}</option>`).join('')}</select><label class="sr-only" for="type-filter">Transaction type</label><select id="type-filter"><option value="">All activity</option><option value="spending" ${state.type === 'spending' ? 'selected' : ''}>Spending</option><option value="income" ${state.type === 'income' ? 'selected' : ''}>Income</option><option value="transfers" ${state.type === 'transfers' ? 'selected' : ''}>Transfers</option></select></div><section class="card activity"><p class="result-count" id="result-count" role="status"></p><div class="table-header"><span>Transaction</span><span>Category</span><span class="right">Amount</span></div><div id="activity-rows"></div></section>`;
  document.querySelector('#search').addEventListener('input', event => { state.query = event.target.value; activityRows(); });
  document.querySelector('#category-filter').addEventListener('change', event => { state.category = event.target.value; activityRows(); });
  document.querySelector('#type-filter').addEventListener('change', event => { state.type = event.target.value; activityRows(); });
  activityRows();
}
function activityRows() {
  // Like the iPhone's Activity, transfers between your own accounts stay out
  // of the list (and its count) unless you ask for them.
  const showTransfers = state.type === 'transfers' || catFor(state.category).transfer === true;
  const typeMatch = tx => state.type === 'transfers' ? tx.transfer : !state.type || (!tx.transfer && !tx.excluded && tx.income === (state.type === 'income'));
  const data = rows.filter(tx => tx.date.slice(0, 7) === state.month && (showTransfers || !tx.transfer) && (!state.category || tx.category === state.category) && typeMatch(tx) && `${tx.merchant} ${catFor(tx.category).name}`.toLowerCase().includes(state.query.toLowerCase().trim())).sort((a, b) => b.date.localeCompare(a.date));
  const hiddenTransfers = showTransfers ? 0 : rows.filter(tx => tx.transfer && tx.date.slice(0, 7) === state.month).length;
  document.querySelector('#result-count').textContent = `${data.length} ${state.liveData ? '' : 'sample '}transaction${data.length === 1 ? '' : 's'} · ${monthLabel(state.month)}${hiddenTransfers ? ` · ${hiddenTransfers} transfer${hiddenTransfers === 1 ? '' : 's'} hidden` : ''}`;
  const days = [...new Set(data.map(tx => tx.date))];
  document.querySelector('#activity-rows').innerHTML = days.map(date => {
    const group = data.filter(tx => tx.date === date);
    const label = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    return `<div class="day-group"><div class="day-header"><span>${label}</span><span>${group.length} transaction${group.length === 1 ? '' : 's'}</span></div>${group.map(tx => txRow(tx, true)).join('')}</div>`;
  }).join('') || `${empty('No transactions match these filters.')}<button class="text-button" id="clear-filters">Clear filters</button>`;
  document.querySelector('#clear-filters')?.addEventListener('click', () => { state.query = ''; state.category = ''; state.type = ''; activity(); });
}
function trends() {
  const trendRows = rows.filter(row => !row.trendExcluded);
  const comparison = trendsComparison(trendRows, state.month, today);
  // Like the iPhone, the chart keeps a fixed 12-month window ending this
  // month; choosing a month only moves the highlight.
  const anchor = state.month < addMonths(currentMonth, -11) ? addMonths(state.month, 11) : currentMonth;
  const series = monthlySeries(trendRows, anchor, today);
  const isCurrent = anchor === currentMonth;
  const max = Math.max(...series.bars.map(bar => bar.spending), series.typical || 0, 1);
  const selected = series.bars.find(bar => bar.month === state.month) || series.bars.at(-1);
  const summaryLine = !comparison.available ? 'Building your comparison.' : Math.abs(comparison.totalDelta) < 1000 ? 'Overall spending is close to your typical level.' : `${roundMoney(Math.abs(comparison.totalDelta))} ${comparison.totalDelta > 0 ? 'above' : 'below'} your typical level.`;
  const drivers = comparison.drivers.map(cat => {
    const scale = Math.max(cat.current, cat.typical, 1);
    return `<button class="change-row" data-category="${esc(cat.id)}">${catIcon(cat)}<span><strong>${esc(cat.name)}</strong><span class="driver-track"><span style="width:${(cat.current / scale * 100).toFixed(1)}%"></span></span></span><span class="change-amount">${cat.delta > 0 ? '+' : '−'}${roundMoney(Math.abs(cat.delta))}<small>${roundMoney(cat.current)} now · ${roundMoney(cat.typical)} typical</small></span></button>`;
  }).join('');
  main.innerHTML = `${summary(forMonth(trendRows, state.month))}<div class="grid"><section class="card"><div class="section-heading"><div><h2>Spending over time</h2><p class="card-subtitle">${isCurrent ? `Through day ${series.cutoff} of each month` : 'Spending by month'}</p></div><div class="projected"><strong>${compact(selected.spending)}</strong><span>${monthLabel(state.month)}</span></div></div><div class="bars${state.month !== currentMonth ? ' has-selection' : ''}" style="--t:${series.typical ? (series.typical / max).toFixed(3) : 0}">${series.typical ? '<span class="typical-rule" aria-hidden="true"></span>' : ''}${series.bars.map(bar => `<div class="bar-group"><button class="bar-button ${bar.month === state.month && state.month !== currentMonth ? 'selected' : ''}" data-month="${bar.month}" style="--h:${(bar.spending / max).toFixed(3)}" aria-label="Explore ${monthLabel(bar.month)}, ${money(bar.spending)} spending" title="${monthLabel(bar.month)} · ${money(bar.spending)}"></button><span class="bar-month">${shortMonth(bar.month)}</span></div>`).join('')}</div>${series.typical ? `<div class="chart-legend"><span><i class="swatch dashed"></i>${compact(series.typical)} typical</span></div>` : ''}<p class="legend">Only months covered from day 1 are shown${isCurrent ? '; every month stops at the same day' : ''}. Select a bar to explore that month.</p></section><section class="card"><div class="section-heading"><div><h2>What changed</h2><p class="card-subtitle">${esc(summaryLine)}</p></div><span class="comparison-label">${esc(comparison.label)}</span></div>${comparison.available ? drivers || empty('No category moved meaningfully from your typical level.') : empty('A full prior month of saved history is needed for a fair comparison.')}${drivers ? '<p class="legend">Select a category to review the transactions behind the change.</p>' : ''}</section><section class="card report-card full"><div class="insight-icon">${icon('activity')}</div><div><h2>Your monthly report</h2><p class="subtle">See income, spending, and the purchases behind ${monthLabel(state.month)} in one place.</p></div><button class="button" data-action="monthly-report">Open report →</button></section></div>`;
}
// ── Wealth (mirrors WealthView.swift: hero, Progress, Next steps, Accounts) ──
// Same "$1.1M" / "$12.5K" rules as Double.asCompactCurrency on iOS.
function compactDollars(value) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value), sign = value < 0 ? '-' : '';
  if (abs >= 1e6) { const m = abs / 1e6; return `${sign}$${Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1)}M`; }
  if (abs >= 1e4) { const k = abs / 1e3; return `${sign}$${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}K`; }
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}
const dollars = value => roundMoney(Math.round(value * 100));
const monthYear = date => date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
const isoMonthYear = iso => monthYear(new Date(`${iso}T12:00:00`));
const chevron = '<span class="row-chevron" aria-hidden="true">›</span>';
const groupOrder = [['Cash', true, 'cash'], ['Investments', true, 'trends'], ['Credit Cards', false, 'card'], ['Loans', false, 'bank'], ['Other Assets', true, 'plusCircle'], ['Other Liabilities', false, 'minusCircle']];
const bankGroup = { depository: 'Cash', investment: 'Investments', credit: 'Credit Cards', loan: 'Loans' };
// Manual accounts are grouped by the icon chosen in the app, as on iOS.
function manualGroup(account) {
  if (!state.liveData && groupOrder.some(([title]) => title === account.type)) return account.type;
  if (account.asset) return account.icon === 'dollarsign.circle.fill' ? 'Cash' : account.icon === 'chart.line.uptrend.xyaxis' ? 'Investments' : 'Other Assets';
  return account.icon === 'creditcard.fill' ? 'Credit Cards' : ['house.fill', 'car.fill', 'graduationcap.fill'].includes(account.icon) ? 'Loans' : 'Other Liabilities';
}
function wealthModel() {
  const live = state.liveData;
  const nicknames = live?.plans.nicknames || {};
  const nickname = id => { const key = Object.keys(nicknames).find(candidate => candidate.toLowerCase() === String(id).toLowerCase()); const value = key && nicknames[key]; return typeof value === 'string' && value.trim() ? value.trim() : null; };
  const banks = live ? live.bankAccounts : wealthAccounts.filter(account => !account.manual).map(account => ({ id: account.id, name: account.name, institution: account.institution, mask: account.mask, type: account.asset ? 'depository' : 'credit', subtype: account.asset ? (account.id === 'savings' ? 'savings' : 'checking') : 'credit card', balance: account.cents / 100, asset: account.asset }));
  const current = live ? live.billing.hasAccess && !live.banksUnavailable : true;
  const split = live ? parseOwnership(live.plans.ownership) : state.split ? { mode: state.share === 50 ? 'even' : 'custom', anchorUserId: null, defaultPercent: state.share, perAccount: {} } : null;
  const lens = ownershipLens(split, live?.profile.user.id ?? null);
  // Without fresh bank balances the per-account shares can't be applied.
  const mine = lens.active && current && state.lens === 'mine';
  const entries = [
    ...banks.map(account => ({ id: account.id, name: nickname(account.id) || account.name, originalName: account.name, detail: `${account.institution}${account.mask ? ` · ••${account.mask}` : ''}`, group: bankGroup[account.type], asset: account.asset, cents: Math.round((account.asset ? account.balance : Math.abs(account.balance)) * 100), manual: false, subtype: account.subtype })),
    ...wealthAccounts.filter(account => account.manual).map(account => ({ id: account.id, name: nickname(account.id) || account.name, originalName: account.name, detail: 'Added manually', group: manualGroup(account), asset: account.asset, cents: account.cents, manual: true, updatedAt: account.updatedAt })),
  ].map(entry => { const percent = mine ? lens.percentFor(entry.id) : 100; return { ...entry, percent, shareCents: Math.round(entry.cents * percent / 100) }; });
  const sum = (list, key) => list.reduce((total, entry) => total + entry[key], 0);
  const assetEntries = entries.filter(entry => entry.asset), liabilityEntries = entries.filter(entry => !entry.asset);
  const household = { assets: sum(assetEntries, 'cents'), liabilities: sum(liabilityEntries, 'cents') };
  const shown = { assets: sum(assetEntries, 'shareCents'), liabilities: sum(liabilityEntries, 'shareCents') };
  // Snapshots store household totals only, so history uses today's blended
  // asset and liability shares (the app's approximation; today is exact).
  const fallback = lens.defaultPercent / 100;
  const assetRatio = !mine ? 1 : Math.abs(household.assets) > 1 ? shown.assets / household.assets : fallback;
  const liabilityRatio = !mine ? 1 : Math.abs(household.liabilities) > 1 ? shown.liabilities / household.liabilities : fallback;
  const byDate = new Map(wealthHistory.map(point => [point.date, { date: point.date, cents: Math.round(point.assets != null ? point.assets * assetRatio - point.liabilities * liabilityRatio : point.cents * assetRatio), assets: point.assets, liabilities: point.liabilities }]));
  if (current) byDate.set(asOf, { date: asOf, cents: shown.assets - shown.liabilities });
  const points = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const groups = groupOrder.map(([title, asset, glyph]) => ({ title, asset, glyph, accounts: entries.filter(entry => entry.group === title && Math.abs(entry.cents) >= 1) })).filter(group => group.accounts.length);
  const latest = points.at(-1);
  const totals = current ? shown : { assets: latest?.assets ?? 0, liabilities: latest?.liabilities ?? 0 };
  const change = points.length >= 2 ? { cents: points.at(-1).cents - points[0].cents, percent: Math.abs(points[0].cents) > 1 ? (points.at(-1).cents - points[0].cents) / Math.abs(points[0].cents) * 100 : null, start: points[0].date } : null;
  return { live, current, lens, mine, entries, groups, points, change, totals, net: current ? shown.assets - shown.liabilities : latest?.cents ?? 0, tracked: groups.reduce((count, group) => count + group.accounts.length, 0), latest };
}
function changeBadge(change) {
  const recent = (today - new Date(`${change.start}T12:00:00`)) / 864e5 < 90;
  const flat = Math.abs(change.cents) < 50, up = change.cents > 0, since = recent ? dateLabel(change.start) : isoMonthYear(change.start);
  return `<span class="change-badge ${flat ? 'flat' : up ? 'up' : 'down'}">${flat ? '=' : up ? '↗' : '↘'} ${flat ? `Steady since ${since}` : `${up ? 'Up' : 'Down'} ${compactDollars(Math.abs(change.cents) / 100)} since ${since}`}</span>`;
}
function changeChip(change) {
  const flat = Math.abs(change.cents) < 50, up = change.cents > 0;
  const label = flat ? 'Steady' : change.percent != null ? `${up ? '+' : '−'}${Math.round(Math.min(Math.abs(change.percent), 999))}%` : `${up ? '+' : '−'}${compactDollars(Math.abs(change.cents) / 100)}`;
  return `<span class="change-chip ${flat ? 'flat' : up ? 'up' : 'down'}">${label}</span>`;
}
function historyChart(points) {
  const values = points.map(point => point.cents), min = Math.min(...values), max = Math.max(...values);
  const pad = Math.max((max - min) * .12, 5000), low = min - pad, high = max + pad;
  const first = new Date(`${points[0].date}T12:00:00`).getTime(), span = Math.max(new Date(`${points.at(-1).date}T12:00:00`).getTime() - first, 1);
  const x = point => (new Date(`${point.date}T12:00:00`).getTime() - first) / span * 600, y = cents => 170 - (cents - low) / (high - low) * 155;
  const line = points.map(point => `${x(point).toFixed(1)},${y(point.cents).toFixed(1)}`).join(' ');
  const multiYear = points[0].date.slice(0, 4) !== points.at(-1).date.slice(0, 4);
  const axis = [...new Set([0, Math.floor(points.length / 2), points.length - 1])].map(i => new Date(`${points[i].date}T12:00:00`).toLocaleDateString('en-US', multiYear ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' }));
  const zero = min < 0 && max > 0 ? `<line class="zero-rule" x1="0" x2="600" y1="${y(0)}" y2="${y(0)}"/>` : '';
  const last = points.at(-1);
  return `<div class="history-wrap"><svg class="chart history-chart" viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Net worth history from ${money(points[0].cents)} to ${money(last.cents)}" data-points='${esc(JSON.stringify(points.map(point => [point.date, point.cents, +x(point).toFixed(1), +y(point.cents).toFixed(1)])))}'><defs><linearGradient id="wealth-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--green)" stop-opacity=".22"/><stop offset="1" stop-color="var(--green)" stop-opacity="0"/></linearGradient></defs>${[15, 92, 170].map(level => `<line class="gridline" x1="0" x2="600" y1="${level}" y2="${level}"/>`).join('')}${zero}<polygon class="history-area" points="0,180 ${line} 600,180"/><polyline class="history-line" points="${line}"/><line class="scrub-rule" x1="0" x2="0" y1="0" y2="180" hidden/></svg><span class="history-dot" style="left:${x(last) / 6}%;top:${y(last.cents) / 1.8}%"></span></div><div class="chart-axis">${axis.map(label => `<span>${label}</span>`).join('')}</div>`;
}
// Hover/touch scrubbing swaps the card title for the point's value, as on iOS.
function attachHistoryScrub() {
  const svg = main.querySelector('.history-chart'); if (!svg) return;
  const points = JSON.parse(svg.dataset.points), title = main.querySelector('#history-title'), resting = title.innerHTML;
  const dot = main.querySelector('.history-dot'), rule = svg.querySelector('.scrub-rule'), restingDot = dot.getAttribute('style');
  const move = event => {
    const box = svg.getBoundingClientRect(), position = (event.clientX - box.left) / box.width * 600;
    const point = points.reduce((best, candidate) => Math.abs(candidate[2] - position) < Math.abs(best[2] - position) ? candidate : best);
    title.innerHTML = `<strong class="scrub-value">${exactMoney(point[1])}</strong><span class="card-subtitle">${new Date(`${point[0]}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>`;
    rule.hidden = false; rule.setAttribute('x1', point[2]); rule.setAttribute('x2', point[2]);
    dot.style.left = `${point[2] / 6}%`; dot.style.top = `${point[3] / 1.8}%`;
  };
  const leave = () => { title.innerHTML = resting; rule.hidden = true; dot.setAttribute('style', restingDot); };
  svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', leave); svg.addEventListener('pointercancel', leave);
}
function retirementModel() {
  const live = state.liveData;
  if (!live) return { plan: state.retirement, balance: state.retirementBalance, result: retirementProjection(state.retirement, state.retirementBalance) };
  const plan = parseRetirementPlan(live.plans.retirement);
  if (!plan) return { plan: null, unreadable: live.plans.retirement != null };
  const balance = retirementEligibleBalance(plan, { bankAccounts: live.bankAccounts, manualAccounts: wealthAccounts });
  return { plan, balance, result: retirementProjection(plan, balance), partial: !(live.billing.hasAccess && !live.banksUnavailable) };
}
const debtLoans = () => state.liveData ? parseLoans(state.liveData.plans.loans) : state.loans;
const gapHeadline = gap => gap > 0 ? `${compactDollars(Math.abs(gap))} ahead of goal` : gap < 0 ? `${compactDollars(Math.abs(gap))} behind goal` : 'Right on goal';
const statusIcon = { onTrack: 'check', needsAttention: 'alert', offTrack: 'xCircle' };
function debtSubline(portfolio) {
  if (portfolio.debtFreeDate) return `Debt-free by ${monthYear(portfolio.debtFreeDate)}`;
  if (portfolio.anyNeverPaysOff) return 'A payment is too low to reach payoff';
  if (portfolio.anyHorizonExceeded) return 'Payoff exceeds the 100-year estimate';
  return `${compactDollars(portfolio.totalInterest)} in interest remaining`;
}
function planningCards() {
  const retirement = retirementModel(), loans = debtLoans();
  const retirementCard = retirement.result
    ? `<button class="plan-card" data-action="retirement"><span class="plan-icon status-${retirement.result.status}">${icon(statusIcon[retirement.result.status])}</span><span><small class="plan-kicker">Retirement · <b class="status-${retirement.result.status}">${statusLabel[retirement.result.status]}</b></small><strong>${gapHeadline(retirement.result.gap)}</strong><small>Projected ${compactDollars(retirement.result.projectedBalance)} ${retirement.plan.includesPartner ? 'when you turn' : 'at age'} ${retirement.result.laterRetirementAge}</small></span>${chevron}</button>`
    : `<button class="plan-card" data-action="retirement"><span class="plan-icon">${icon('trends')}</span><span><strong>Plan your retirement</strong><small>${retirement.unreadable ? 'Open Retirement in the iPhone app to review your saved plan.' : 'Answer a short survey in the iPhone app to see if you’re on track.'}</small></span>${chevron}</button>`;
  const portfolio = loans.length ? debtPortfolio(loans, today) : null;
  const debtCard = portfolio
    ? `<button class="plan-card" data-action="debt"><span class="plan-icon">${icon('down')}</span><span><small class="plan-kicker">Debt Payoff · ${portfolio.loanCount === 1 ? '1 loan' : `${portfolio.loanCount} loans`}</small><strong>${compactDollars(portfolio.totalBalance)} owed</strong><small>${debtSubline(portfolio)}</small></span>${chevron}</button>`
    : `<button class="plan-card" data-action="debt"><span class="plan-icon">${icon('down')}</span><span><strong>Simulate your debt payoff</strong><small>Add a loan ${state.liveData ? 'in the iPhone app ' : ''}to see interest paid and how to pay it off faster.</small></span>${chevron}</button>`;
  return retirementCard + debtCard;
}
function wealth() {
  const model = wealthModel(), { lens, mine } = model;
  const title = mine ? 'Your net worth' : lens.active ? 'Household net worth' : 'Net worth';
  const notice = model.live && !model.current
    ? `<section class="card notice-card full"><span class="plan-icon status-needsAttention">${icon('alert')}</span><div><strong>${model.live.billing.hasAccess ? 'Bank balances couldn’t be refreshed' : 'Bank balances need an active plan'}</strong><p class="subtle">${model.latest ? `Showing your last saved net worth from ${dateLabel(model.latest.date)}. ` : ''}${model.live.billing.hasAccess ? 'Try reloading in a moment.' : 'Your saved history and manual accounts are still here.'}</p></div>${model.live.billing.hasAccess ? '<button class="button" data-action="reload-live">Reload</button>' : ''}</section>`
    : '';
  const hero = `<section class="card hero wealth-hero full"><div class="wealth-hero-top"><div><div class="overline">${title.toUpperCase()}</div><small class="subtle">${model.tracked ? `Across ${model.tracked} tracked account${model.tracked === 1 ? '' : 's'}` : 'No tracked accounts yet'}</small></div><button class="share-pill" data-action="ownership">${icon('percent')}${lens.label}</button></div><div class="hero-number">${model.current || model.latest ? roundMoney(model.net) : '—'}</div>${model.change && model.current ? changeBadge(model.change) : `<span class="change-badge flat">${model.points.length ? 'Historical progress is shown below' : 'Tracking starts with your first balance snapshot'}</span>`}<div class="metric-pills"><div class="metric-pill asset"><span>↗ Assets</span><strong>${compactDollars(model.totals.assets / 100)}</strong></div><div class="metric-pill liability"><span>↘ Liabilities</span><strong>${compactDollars(model.totals.liabilities / 100)}</strong></div></div>${lens.active && model.current ? `<div class="segmented lens-toggle" aria-label="Ownership view"><button data-lens="household" aria-pressed="${!mine}">Household</button><button data-lens="mine" aria-pressed="${mine}">Your share</button></div>` : ''}</section>`;
  const progress = model.points.length >= 2
    ? `<section class="card full"><div class="section-heading"><div id="history-title"><h2>Net worth history</h2><p class="card-subtitle">${isoMonthYear(model.points[0].date) === isoMonthYear(model.points.at(-1).date) ? isoMonthYear(model.points[0].date) : `${isoMonthYear(model.points[0].date)} – ${isoMonthYear(model.points.at(-1).date)}`}</p></div>${model.change ? changeChip(model.change) : ''}</div>${historyChart(model.points)}${mine ? '<p class="note">Earlier points apply today’s ownership mix; today’s value is exact.</p>' : ''}</section>`
    : `<section class="card notice-card full"><span class="plan-icon">${icon('trends')}</span><div><strong>Your trend is still taking shape</strong><p class="subtle">We’ll show direction after balances have been captured on at least two dates.</p></div></section>`;
  const ledger = model.groups.length
    ? `<section class="card ledger full">${model.groups.map(group => `<div class="ledger-group ${group.asset ? 'asset' : 'liability'}"><div class="ledger-head">${icon(group.glyph)}<span>${group.title}</span><strong>${roundMoney(group.accounts.reduce((total, account) => total + account.shareCents, 0))}</strong></div>${group.accounts.map(account => `<button class="ledger-row" data-account="${esc(account.id)}"><span class="ledger-icon">${icon(group.glyph)}</span><span class="ledger-name">${esc(account.name)}</span><strong>${roundMoney(account.shareCents)}</strong>${chevron}</button>`).join('')}</div>`).join('')}</section>`
    : `<section class="card notice-card full"><span class="plan-icon">${icon('bank')}</span><div><strong>No accounts yet</strong><p class="subtle">${model.live ? 'Connect a bank or add a manual account in the iPhone app.' : 'Add a manual account to start your picture.'}</p></div></section>`;
  main.innerHTML = `<p class="intro">${model.live ? 'Your net worth, from your connected banks and saved accounts.' : 'Your progress, your next steps, and your complete financial picture.'}</p><div class="wealth-layout"><div class="wealth-column"><div class="section-label">OVERVIEW</div>${hero}${notice}<div class="section-label">PROGRESS</div>${progress}</div><div class="wealth-column"><div class="section-label">NEXT STEPS</div><div class="plan-cards">${planningCards()}</div><div class="accounts-heading"><div class="section-label">ACCOUNTS${model.tracked ? `<small>${model.tracked} tracked</small>` : ''}</div>${model.live ? '' : '<button class="button" data-action="add-account">+ Add manual account</button>'}</div>${ledger}</div></div>`;
  attachHistoryScrub();
}
function showAccount(id) {
  const model = wealthModel(), account = model.entries.find(entry => entry.id === id);
  if (!account) return;
  if (account.manual && !state.liveData) { showManualAccount(wealthAccounts.find(row => row.id === id)); return; }
  const share = model.lens.active && model.current ? model.lens.percentFor(account.id) : 100;
  openDialog(account.name, `<p class="subtle">${esc(account.detail)}</p><div class="dialog-value">${roundMoney(account.cents)}</div>${account.name !== account.originalName ? `<div class="definition"><span>Bank name</span><strong>${esc(account.originalName)}</strong></div>` : ''}<div class="definition"><span>Group</span><strong>${esc(account.group)}</strong></div><div class="definition"><span>Net worth</span><strong>${account.asset ? 'Asset' : 'Liability'}</strong></div>${share < 100 ? `<div class="definition"><span>Your ${Math.round(share)}%</span><strong>${roundMoney(Math.round(account.cents * share / 100))}</strong></div>` : ''}${account.updatedAt ? `<div class="definition"><span>Last updated</span><strong>${dateLabel(account.updatedAt.slice(0, 10))}</strong></div>` : ''}<p class="note">${state.liveData ? 'Rename, edit, or remove accounts in the iPhone app.' : 'This is a synthetic account; no bank is connected.'}</p>`);
}
function showOwnership() {
  const model = wealthModel(), { lens } = model;
  if (state.liveData) {
    const body = lens.active
      ? `<p class="subtle">Your household uses ${lens.label === '50% share' ? 'an even 50/50 split' : 'a split set account by account'}. “Your share” applies your percentage to every balance; Household shows the full picture. Both are true.</p>${model.current ? model.entries.filter(entry => Math.abs(entry.cents) >= 1).map(entry => `<div class="definition"><span>${esc(entry.name)}</span><strong>${Math.round(lens.percentFor(entry.id))}%</strong></div>`).join('') : '<p class="note">Account percentages appear when bank balances are available.</p>'}`
      : `<p class="subtle">Show your share of the household picture, account by account. ${parseOwnership(state.liveData.plans.ownership) ? 'Your household’s split is waiting for your household details. Open Wealth in the iPhone app once to finish setting it up.' : 'Set up an ownership split from Wealth in the iPhone app.'}</p>`;
    openDialog('Ownership split', `${body}<p class="note">Splits are a display lens. They never change balances or history, and changes are made in the iPhone app.</p>`);
    return;
  }
  openDialog('Ownership split', `<p class="subtle">Show your share of the household picture. This is a display view; it does not change balances or history.</p><form id="ownership-form"><label class="toggle-row"><input type="checkbox" id="ownership-enabled" ${state.split ? 'checked' : ''}><span>Split ownership with a partner</span></label>${formField('ownership-share', 'Your share of each account (%)', state.share, { min: 0, max: 100, step: 1 })}<p class="note">In the app you can also set a different share for each account. Your partner automatically sees the other side.</p><button class="button primary" type="submit">Save sample split</button></form>`);
  document.querySelector('#ownership-form').addEventListener('submit', event => {
    event.preventDefault();
    state.split = document.querySelector('#ownership-enabled').checked; state.share = Math.min(100, Math.max(0, Math.round(Number(document.querySelector('#ownership-share').value) || 0)));
    state.lens = state.split ? 'mine' : 'household'; dialog.close(); wealth(); announce(state.split ? 'Showing your share.' : 'Ownership split turned off.');
  });
}
function retirementDialogBody(model) {
  const { plan, result } = model, b = result.breakdown;
  const top = Math.max(result.requiredNestEgg, ...result.points.map(point => point.balance), 1);
  const x = i => i / Math.max(result.points.length - 1, 1) * 600, y = value => 170 - value / top * 155;
  const line = result.points.map((point, i) => `${x(i).toFixed(1)},${y(point.balance).toFixed(1)}`).join(' ');
  const chart = `<svg class="chart projection-chart" viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Projected savings from ${dollars(result.points[0].balance)} at age ${result.points[0].age} to ${dollars(result.projectedBalance)} at age ${result.laterRetirementAge}; goal ${dollars(result.requiredNestEgg)}"><line class="goal-line" x1="0" x2="600" y1="${y(result.requiredNestEgg)}" y2="${y(result.requiredNestEgg)}"/><polygon class="history-area" points="0,180 ${line} 600,180"/><polyline class="history-line" points="${line}"/></svg><div class="chart-axis"><span>Age ${result.points[0].age}</span><span>Goal ${compactDollars(result.requiredNestEgg)}</span><span>Age ${result.laterRetirementAge}</span></div>`;
  const row = (label, value, sign = '') => value > 0.5 ? `<div class="definition"><span>${label}</span><strong>${sign}${dollars(value)}</strong></div>` : '';
  return `<div class="retirement-status status-${result.status}"><span class="plan-icon status-${result.status}">${icon(statusIcon[result.status])}</span><div><small>${statusLabel[result.status]}</small><strong>${gapHeadline(result.gap)}</strong></div></div><div class="stats"><div><div class="stat-label">Projected at ${result.laterRetirementAge}</div><div class="stat-value">${compactDollars(result.projectedBalance)}</div></div><div><div class="stat-label">Your goal</div><div class="stat-value">${compactDollars(result.requiredNestEgg)}</div></div></div>${chart}<h3 class="dialog-subhead">How it adds up</h3>${row('Today’s savings grow to', b.currentBalance)}${row('Contributions add', b.contributions)}${row('Spending you’ll need', b.spending)}${row('Education costs', b.education)}${row('Healthcare before Medicare', b.healthcare)}${row('Social Security reduces the need by', b.socialSecurity, '−')}<h3 class="dialog-subhead">Your plan</h3><div class="definition"><span>Retirement savings today</span><strong>${dollars(model.balance)}</strong></div><div class="definition"><span>Age · retire at</span><strong>${plan.currentAge} · ${plan.targetRetirementAge}${plan.includesPartner && plan.spouseCurrentAge != null ? ` (partner ${plan.spouseCurrentAge} · ${plan.spouseTargetRetirementAge})` : ''}</strong></div><div class="definition"><span>Salary · contribution</span><strong>${dollars(plan.annualSalary)} · ${plan.contributionPercent}%</strong></div><div class="definition"><span>Yearly spending in retirement</span><strong>${dollars(plan.targetAnnualSpending)}</strong></div>`;
}
function showRetirement() {
  const model = retirementModel();
  if (state.liveData) {
    if (!model.result) { openDialog('Plan your retirement', `<p class="subtle">${model.unreadable ? 'Your saved plan needs a quick review in the iPhone app before it can be shown here.' : 'Answer a short survey in the iPhone app to see whether you’re on track. Your plan will appear here once it syncs.'}</p>`); return; }
    openDialog('Retirement', `${retirementDialogBody(model)}${model.partial ? '<p class="preview-note">Bank balances weren’t available, so only saved manual investment accounts are counted in today’s savings.</p>' : ''}<p class="note">Today’s dollars, ${Math.round(model.plan.realGrowthRate * 1000) / 10}% yearly growth after inflation, and the 4% rule. An estimate, not a guarantee. Edit your plan in the iPhone app.</p>`);
    return;
  }
  const plan = state.retirement;
  openDialog('Retirement', `${retirementDialogBody(model)}<h3 class="dialog-subhead">Try different numbers</h3><form id="retirement-form"><div class="form-grid">${formField('age', 'Current age', plan.currentAge, { min: 18, max: 89, step: 1 })}${formField('retirement-age', 'Retire at', plan.targetRetirementAge, { min: 19, max: 90, step: 1 })}${formField('retirement-balance', 'Retirement savings ($)', state.retirementBalance)}${formField('salary', 'Yearly salary ($)', plan.annualSalary)}${formField('contribution', 'Contribution (%)', plan.contributionPercent, { min: 0, max: 50, step: '.5' })}${formField('spending', 'Yearly spending in retirement ($)', plan.targetAnnualSpending, { min: 1 })}</div><p class="form-error" id="retirement-error" role="alert"></p><button class="button primary" type="submit">Update projection</button></form><p class="note">Sample plan using the app’s model: today’s dollars, 5% yearly growth after inflation, IRS contribution limits, Social Security from 67, and the 4% rule. An estimate, not a guarantee.</p>`);
  document.querySelector('#retirement-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget, read = name => Number(form.elements.namedItem(name).value);
    const next = { ...plan, currentAge: read('age'), targetRetirementAge: read('retirement-age'), annualSalary: read('salary'), contributionPercent: read('contribution'), targetAnnualSpending: read('spending') };
    const balance = read('retirement-balance');
    const valid = Number.isInteger(next.currentAge) && Number.isInteger(next.targetRetirementAge) && next.currentAge >= 18 && next.targetRetirementAge > next.currentAge && next.targetRetirementAge <= 90
      && [balance, next.annualSalary, next.targetAnnualSpending].every(value => Number.isFinite(value) && value >= 0 && value <= 1e9) && next.targetAnnualSpending > 0 && next.contributionPercent >= 0 && next.contributionPercent <= 50;
    if (!valid) { document.querySelector('#retirement-error').textContent = 'Check the ages and amounts. Retirement must come after your current age, by 90.'; return; }
    state.retirement = next; state.retirementBalance = balance; wealth(); showRetirement(); announce('Sample projection updated.');
  });
}
function showDebt() {
  const loans = debtLoans();
  if (!loans.length) { openDialog('Simulate your debt payoff', `<p class="subtle">${state.liveData ? 'Add a loan in the iPhone app to see the interest you’ll pay and how extra payments help. Your loans will appear here once they sync.' : 'Add a loan to see interest paid and how to pay it off faster.'}</p>`); return; }
  const portfolio = debtPortfolio(loans, today);
  const loanCard = loan => {
    const base = loanResult(loan, today);
    const extra = state.liveData ? loan.savedExtraMonthlyPayment : state.debtExtra, lump = state.liveData ? loan.savedLumpSumPayment : 0;
    const scenario = (extra > 0 || lump > 0) && !base.neverPaysOff && !base.isPaidOff ? payoffScenario(base, { extraMonthly: extra, lumpSum: lump }, today) : null;
    const payoff = base.isPaidOff ? 'Paid off' : base.neverPaysOff ? 'Payment doesn’t cover the interest' : base.horizonExceeded ? 'Beyond the 100-year estimate' : `Paid off ${monthYear(base.payoffDate)}`;
    return `<section class="loan-card"><div class="loan-head"><div><strong>${esc(loan.name)}</strong><small>${loanKindName(loan.kind)} · ${loan.annualInterestRate}% APR</small></div><strong>${dollars(base.currentBalance)}</strong></div><div class="definition"><span>Monthly payment${base.usedComputedPayment ? ' (estimated)' : ''}</span><strong>${dollars(base.payment)}</strong></div><div class="definition"><span>Payoff</span><strong>${payoff}</strong></div><div class="definition"><span>Interest remaining</span><strong>${dollars(base.interestRemaining)}</strong></div>${scenario ? `<div class="success-note">With ${extra > 0 ? `${dollars(extra)}/mo extra` : ''}${extra > 0 && lump > 0 ? ' and ' : ''}${lump > 0 ? `${dollars(lump)} now` : ''}: ${scenario.monthsSaved} month${scenario.monthsSaved === 1 ? '' : 's'} sooner · ${dollars(scenario.interestSaved)} less interest</div>` : ''}</section>`;
  };
  openDialog('Debt payoff', `<div class="stats debt-stats"><div><div class="stat-label">Owed</div><div class="stat-value">${compactDollars(portfolio.totalBalance)}</div></div><div><div class="stat-label">Monthly</div><div class="stat-value">${compactDollars(portfolio.monthlyTotal)}</div></div></div><p class="subtle">${debtSubline(portfolio)}.</p>${state.liveData ? '' : `<form id="debt-form" class="inline-form">${formField('debt-extra', 'Try an extra monthly payment ($)', state.debtExtra)}<button class="button" type="submit">Compare</button></form>`}${loans.map(loanCard).join('')}<p class="note">A fixed rate with monthly interest; the final payment is trimmed to the balance. No fees, new charges, or rate changes. ${state.liveData ? 'Saved extra payments come from the iPhone app, where loans are edited.' : 'Sample loans match the iPhone app’s demo.'}</p>`);
  document.querySelector('#debt-form')?.addEventListener('submit', event => {
    event.preventDefault(); const value = Number(document.querySelector('#debt-extra').value);
    if (!Number.isFinite(value) || value < 0 || value > 1e7) return;
    state.debtExtra = value; showDebt();
  });
}
const initialsFor = name => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'A';
// ── Settings (mirrors SettingsView.swift's profile card and sections) ──
function planBadge(billing) {
  if (!billing) return { glyph: 'spark', label: 'Sample account' };
  if (billing.hasAccess && billing.isPurchaser === false) return { glyph: 'person', label: 'Household plan' };
  if (billing.hasAccess && billing.trialEndsAt && new Date(billing.trialEndsAt) > today) return { glyph: 'clock', label: 'Free Trial' };
  if (billing.hasAccess) return { glyph: 'check', label: /annual|year/i.test(billing.productId || '') ? 'Annual' : 'Monthly' };
  return { glyph: 'spark', label: 'No active plan' };
}
const settingsRow = (glyph, title, subtitle, attributes) => `<${attributes.startsWith('href') ? 'a' : 'button'} class="settings-row" ${attributes}><span class="settings-icon">${icon(glyph)}</span><span><strong>${title}</strong><small>${subtitle}</small></span>${chevron}</${attributes.startsWith('href') ? 'a' : 'button'}>`;
function settings() {
  const live = state.liveData, profile = live?.profile;
  const name = live ? profile.user.display_name || 'Add your name' : 'Sample account';
  const initials = initialsFor(name);
  const badge = planBadge(live?.billing);
  const banks = live ? [...new Map(live.bankAccounts.map(account => [account.itemId, account.institution])).values()] : ['First Horizon', 'Apex Card'];
  main.innerHTML = `<p class="intro">Your account, your data, and your preferences.</p><div class="settings-stack"><button class="card profile-card" data-action="manage-account"><span class="avatar" aria-hidden="true">${esc(initials)}</span><span><strong>${esc(name)}</strong><small>Account, plan, and household</small><span class="plan-badge">${icon(badge.glyph)}${badge.label}</span></span>${chevron}</button>
<div class="settings-columns"><div class="settings-column"><div class="section-label">EXPERIENCE</div><section class="card settings-card">${settingsRow(state.theme === 'light' ? 'moon' : 'sun', 'Appearance', `${state.theme === 'light' ? 'Light' : 'Dark'} · choose how Averlen looks in this browser`, 'data-theme-action')}${settingsRow('spark', 'Values & core spending', 'Set in the iPhone app for Mindful Mode reflections', 'data-action="values-info"')}</section>
<div class="section-label">MONEY &amp; DATA</div><section class="card settings-card">${settingsRow('bank', 'Connected banks', live && live.banksUnavailable ? 'Couldn’t load bank connections right now' : banks.length ? `${banks.length} connected · ${esc(banks.slice(0, 2).join(', '))}${banks.length > 2 ? '…' : ''}` : 'No banks connected', 'data-action="banks-info"')}${settingsRow('activity', 'Categories', `${categories.length} categories · labels used across Activity and Trends`, 'data-action="categories-info"')}${settingsRow('arrowOut', 'Export your data', 'Download a portable copy of your saved records', 'data-action="manage-account"')}${live ? '' : settingsRow('repeat', 'Reset sample changes', 'Restore the original transactions, accounts, and plans', 'data-action="reset-sample"')}</section></div>
<div class="settings-column"><div class="section-label">SECURITY &amp; SUPPORT</div><section class="card settings-card">${settingsRow('shield', 'Saved data & account', 'Export, manage your plan, or delete your account', 'data-action="manage-account"')}${settingsRow('doc', 'Privacy policy', 'See how Averlen handles your information', 'href="https://averlen.app/privacy.html" target="_blank" rel="noopener"')}${settingsRow('doc', 'Terms of service', 'Review the terms for using Averlen', 'href="https://averlen.app/terms.html" target="_blank" rel="noopener"')}${settingsRow('spark', 'Help & feedback', 'Share an idea or tell us what is not working', 'href="https://averlen.app/support.html" target="_blank" rel="noopener"')}${settingsRow('activity', live ? 'About web access' : 'About this preview', live ? 'What the website can and can’t do' : 'How the sample preview works', 'data-action="about"')}</section>
<button class="button sign-out" data-action="logout">Sign out</button><p class="settings-footer">${live ? 'Averlen for the web · Read-only access to your saved records' : 'Averlen web preview · Sample data, resets on reload'}</p></div></div></div>`;
}
function showSettingsInfo(kind) {
  const live = state.liveData;
  if (kind === 'values') { openDialog('Values & core spending', '<p class="subtle">Tell Averlen what you want your spending to support, and which costs are harder to change month to month. Mindful Mode uses these for reflection and context. It never scores you or creates a budget.</p><p class="note">Set these in the iPhone app under Settings → Values & Core Spending.</p>'); return; }
  if (kind === 'categories') { openDialog('Categories', `<p class="subtle">The labels used across Activity and Trends.${live ? ' Edit names, colors, and rules in the iPhone app.' : ''}</p>${categories.map(category => `<div class="definition"><span class="category-chip"><span class="swatch" style="background:${category.color}"></span>${esc(category.name)}</span><strong>${category.excluded ? 'Excluded from totals' : category.transfer ? 'Transfers' : category.income ? 'Income' : 'Spending'}</strong></div>`).join('')}`); return; }
  if (!live) { openDialog('Connected banks', '<p class="subtle">The sample connects to two fictional institutions, First Horizon and Apex Card. No real bank is connected in this preview.</p>'); return; }
  const byItem = new Map(); for (const account of live.bankAccounts) { if (!byItem.has(account.itemId)) byItem.set(account.itemId, { name: account.institution, accounts: [] }); byItem.get(account.itemId).accounts.push(account); }
  openDialog('Connected banks', `${live.banksUnavailable ? '<p class="preview-note">Bank connections couldn’t be loaded right now. Your saved records are unaffected.</p>' : byItem.size ? [...byItem.values()].map(bank => `<h3 class="dialog-subhead">${esc(bank.name)}</h3>${bank.accounts.map(account => `<div class="definition"><span>${esc(account.name)}${account.mask ? ` ••${esc(account.mask)}` : ''}</span><strong>${esc(bankGroup[account.type])}</strong></div>`).join('')}`).join('') : '<p class="subtle">No banks are connected to your household.</p>'}<p class="note">Connect, reconnect, or remove banks in the iPhone app. The website only reads balances.</p>`);
}

function resetSample() {
  rows.splice(0, rows.length, ...makeDemo(today));
  wealthAccounts.splice(0, wealthAccounts.length, ...accounts.map(account => ({ ...account })));
  Object.assign(state, samplePlanning()); state.query = ''; state.category = ''; state.type = '';
}
function login() {
  if (isLivePage) { liveLogin(); return; }
  main.innerHTML = `<div class="auth-shell"><section class="auth-story"><a href="#login" class="brand"><img src="../averlen-logo.png" width="40" height="40" alt=""><span>Averlen</span></a><span class="overline">YOUR SPACE FOR CLARITY</span><h2>A clearer picture.<br>A little more possibility.</h2><p>See where your money goes, share the bigger picture, and make room for what comes next.</p><div class="auth-illustration" aria-hidden="true"><span class="overline">THE BIGGER PICTURE</span><div class="illustration-number">Room to move forward.</div><div class="illustration-bars"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><span class="subtle">Spend with awareness. Plan with perspective.</span></div></section><section class="auth-form card"><span class="overline">WELCOME TO AVERLEN</span><h1>Welcome back.</h1><p class="subtle">Your financial picture, on a bigger screen.</p>${state.deletedPreview ? '<p class="success-note" role="status">Deletion preview complete. The sample session was cleared. No real account or bank connection was changed.</p>' : ''}<div class="preview-note">Sign-in design preview. Live authentication is not connected; please use the sample account below.</div><button class="button apple-button" disabled>Continue with Apple</button><div class="auth-divider">or use email</div><label for="login-email">Email</label><input id="login-email" type="email" placeholder="you@example.com" disabled autocomplete="off"><label for="login-password">Password</label><input id="login-password" type="password" placeholder="Your password" disabled autocomplete="off"><div class="login-assistance"><button class="text-button" data-action="reset-password-info">Forgot password?</button></div><button class="button" disabled>Sign in</button><button class="button primary" data-action="start-demo">Explore sample account →</button><p class="note">Already use Averlen on iPhone? The live web version will use your existing account. No additional account is needed.</p><div class="auth-links"><a href="#account">Saved data & account</a><a href="https://averlen.app/support.html">Support</a><button class="text-button" data-theme-action>Appearance</button></div></section></div>`;
}
function account() {
  if (state.liveData) { liveAccount(); return; }
  if (isLivePage) {
    main.innerHTML = '<section class="card account-gate"><h2>Saved data & account</h2><p class="note">Sign in to view saved records, export your information, or delete your Averlen account. These controls remain available without an active plan.</p><div class="button-row"><a class="button primary" href="#login">Sign in to your account</a><a class="button" href="../preview/">Explore sample preview</a></div></section>'; return;
  }
  if (!state.session) {
    main.innerHTML = `<section class="card account-gate">${header('Saved data & account')}<p class="subtle">Sign in to view saved records, export your data, or delete your Averlen account. These options should remain available when a subscription expires.</p><p class="note">Live sign-in is not connected in this preview. Explore the sample account to try the account-management flow.</p><div class="button-row"><button class="button primary" data-action="start-demo-account">Explore sample account</button><a class="button" href="#login">Back to sign-in</a></div></section>`;
    return;
  }
  main.innerHTML = `<p class="intro">You’re in control of your account and saved information.</p><div class="grid"><section class="card">${header('Your account', 'Sample account · solo household')}<div class="definition"><span>Household role</span><strong>Owner · 1 member</strong></div><div class="definition"><span>Account access</span><strong>Preview only</strong></div><div class="button-row"><button class="button" data-action="export-sample">Export sample data</button><button class="button" data-action="logout">Sign out</button></div><p class="note">Viewing, exporting, and deleting an account remain accessible even without an active plan.</p></section><section class="card">${header('Subscription')}<p class="subtle">Subscriptions purchased through Apple are managed with Apple. Deleting an Averlen account does not cancel its App Store subscription.</p><div class="button-row"><a href="https://apps.apple.com/account/subscriptions" class="button" target="_blank" rel="noopener">Manage Apple subscription ↗</a></div></section><section class="card danger-zone full">${header('Delete account', 'This preview lets you explore the confirmation steps')}<p class="subtle">Real deletion must verify your identity, disconnect your bank connections, and remove your account’s data. A shared household owner must transfer ownership first so their partner’s account and data remain available.</p><div class="button-row"><button class="button danger" data-action="delete-account">Preview account deletion</button></div></section></div>`;
}
function render() {
  const titles = { login: 'Sign in', home: 'Home', activity: 'Activity', trends: 'Trends', wealth: 'Wealth', settings: 'Settings', account: 'Your account' };
  document.querySelector('.layout').classList.toggle('auth-mode', state.route === 'login');
  document.querySelector('#page-title').textContent = titles[state.route];
  document.title = `${titles[state.route]} · Averlen${isLivePage ? '' : ' web preview'}`;
  document.querySelector('#navigation').innerHTML = ['home', 'activity', 'trends', 'wealth'].map(key => `<a href="#${key}" ${state.route === key ? 'aria-current="page"' : ''}>${icon(key)}<span>${titles[key]}</span></a>`).join('');
  document.querySelector('#settings-link').innerHTML = `${icon('settings')}Settings`;
  document.querySelector('#account-settings').innerHTML = icon('settings');
  document.querySelector('#month').hidden = ['login', 'wealth', 'settings', 'account'].includes(state.route);
  if (isLivePage && ['loading', 'error'].includes(state.phase)) { liveStatus(); return; }
  if (state.liveData?.recordsUnavailable && ['home', 'activity', 'trends', 'wealth'].includes(state.route)) {
    main.innerHTML = '<section class="card account-gate"><h2>Your saved records could not be loaded</h2><p class="note">Your account controls are still available. Try reloading your records, or continue to account management.</p><div class="button-row"><button class="button primary" data-action="reload-live">Reload records</button><button class="button" data-action="manage-account">Manage account</button></div></section>'; return;
  }
  ({ login, home, activity, trends, wealth, settings, account }[state.route])();
}
function setTheme() {
  document.documentElement.dataset.theme = state.theme;
  try { localStorage.setItem('averlen.theme', state.theme); } catch { /* per-browser convenience only */ }
}
function openDialog(title, body) {
  document.querySelector('#dialog-title').textContent = title;
  document.querySelector('#dialog-body').innerHTML = body;
  if (!dialog.open) dialog.showModal();
  else document.querySelector('#close-dialog').focus();
}
function openAbout() {
  if (isLivePage) { openDialog('Averlen on the web', '<p class="subtle">Your saved iPhone records are available here using your existing account. This first web connection is read-only. Bank refresh, editing, and planning changes remain in the iPhone app.</p><p class="note">Account deletion and data export use the same server permissions as the app and require you to confirm your identity.</p>'); return; }
  openDialog('Averlen for the web', `<p class="subtle">Explore Home, Activity, Trends, Wealth, and account management using synthetic data. Sample changes reset on reload.</p><p class="note">Live sign-in, bank access, and actual account deletion are not connected. The login screen and deletion sequence demonstrate those flows without asking for real credentials.</p><div class="button-row">${state.session ? '<a href="#settings" class="button">Preview settings</a><a href="#account" class="button">Account management</a>' : '<button class="button primary" data-action="start-demo">Explore sample account</button>'}</div>`);
}

function formField(id, label, value, { min = 0, max = 1000000000, step = '.01', type = 'number' } = {}) {
  return `<div class="form-field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(value)}" min="${min}" max="${max}" step="${step}" required></div>`;
}
function showManualAccount(account = null) {
  const types = ['Cash', 'Investments', 'Credit Cards', 'Loans', 'Other Assets', 'Other Liabilities'];
  openDialog(account ? 'Edit manual account' : 'Add a manual account', `<p class="subtle">Add something that helps complete the sample picture.</p><form id="manual-account-form"><div class="form-field"><label for="manual-name">Account name</label><input id="manual-name" name="manual-name" maxlength="80" value="${esc(account?.name || '')}" placeholder="e.g. Home value" required></div><div class="form-grid"><div class="form-field"><label for="manual-type">Account type</label><select id="manual-type">${types.map(type => `<option ${type === account?.type ? 'selected' : ''}>${type}</option>`).join('')}</select></div>${formField('manual-balance', 'Balance ($)', (account?.cents || 0) / 100)}</div><p class="form-error" id="manual-error" role="alert"></p><div class="button-row"><button type="submit" class="button primary">${account ? 'Save sample account' : 'Add sample account'}</button>${account ? '<button type="button" class="button danger" id="remove-manual">Remove sample account</button>' : ''}</div></form><p class="note">Enter positive balances for assets and liabilities. These sample changes reset on reload and never sync to your real account.</p>`);
  document.querySelector('#manual-account-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#manual-name').value.trim(), cents = Math.round(Number(document.querySelector('#manual-balance').value) * 100), type = document.querySelector('#manual-type').value;
    if (!name || !Number.isSafeInteger(cents) || cents < 0 || cents > 100000000000) { document.querySelector('#manual-error').textContent = 'Enter a name and a valid nonnegative balance.'; return; }
    const next = { name, cents, type, asset: !['Credit Cards', 'Loans', 'Other Liabilities'].includes(type), manual: true, institution: 'Manual', mask: '' };
    if (account) Object.assign(account, next); else wealthAccounts.push({ id: `manual-${crypto.randomUUID()}`, ...next });
    dialog.close(); wealth(); announce('Sample account saved. Net worth updated.');
  });
  document.querySelector('#remove-manual')?.addEventListener('click', () => { wealthAccounts.splice(wealthAccounts.indexOf(account), 1); dialog.close(); wealth(); announce('Sample manual account removed.'); });
}
function showDeletion() {
  if (state.liveData) { liveAccountAction('delete'); return; }
  const policy = deletionPolicy({ owner: true, memberCount: 1, freshIdentity: false });
  if (policy.reason === 'transfer_ownership') { openDialog('Transfer ownership first', '<p class="subtle">A shared-household owner must transfer ownership to another member before deleting their own account. Their partner’s account and data must remain intact.</p>'); return; }
  openDialog('Delete your Averlen account?', `<p class="subtle">In the live service, deletion permanently removes your account and its data and disconnects your bank access. A partner’s account must remain intact.</p><div class="preview-note">This is a sample-only walkthrough. No real account, stored financial record, or bank connection will be deleted.</div><p class="note">Deleting your account does not cancel an App Store subscription. <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noopener">Manage it with Apple</a> to stop future charges.</p><div class="button-row"><button class="button" id="cancel-deletion">Keep account</button><button class="button danger" id="reauth-preview">Continue deletion preview</button></div>`);
  document.querySelector('#cancel-deletion').addEventListener('click', () => dialog.close());
  document.querySelector('#reauth-preview').addEventListener('click', () => {
    openDialog('Confirm your identity', '<p class="subtle">A real deletion requires a fresh sign-in using your account’s password or Apple identity. This preview uses a sample confirmation without collecting credentials.</p><div class="button-row"><button class="button primary" id="confirm-sample-identity">Confirm sample identity</button><button class="button" id="cancel-identity">Cancel</button></div>');
    document.querySelector('#cancel-identity').addEventListener('click', () => dialog.close());
    document.querySelector('#confirm-sample-identity').addEventListener('click', () => {
      const verifiedPolicy = deletionPolicy({ owner: true, memberCount: 1, freshIdentity: true });
      if (!verifiedPolicy.allowed) return;
      openDialog('Final deletion preview', '<p class="subtle">Type DELETE to finish the walkthrough. Only this sample session will be reset.</p><label for="delete-confirmation" class="dialog-label">Type DELETE</label><input id="delete-confirmation" type="text" autocomplete="off" spellcheck="false"><div class="button-row"><button class="button danger" id="simulate-deletion" disabled>Simulate deletion</button><button class="button" id="cancel-final-deletion">Keep account</button></div>');
      document.querySelector('#cancel-final-deletion').addEventListener('click', () => dialog.close());
      document.querySelector('#delete-confirmation').addEventListener('input', event => { document.querySelector('#simulate-deletion').disabled = event.target.value !== 'DELETE'; });
      document.querySelector('#simulate-deletion').addEventListener('click', () => { resetSample(); state.session = false; state.deletedPreview = true; dialog.close(); navigate('login'); });
    });
  });
}
function exportSample() {
  if (state.liveData) { liveAccountAction('export'); return; }
  const content = JSON.stringify({ sample_data_only: true, transactions: rows, accounts: wealthAccounts }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'averlen-sample-data.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); announce('Sample data exported.');
}
function navigate(destination) { if (dialog.open) dialog.close(); if (location.hash === `#${destination}`) route(); else location.hash = destination; }
function showMonthlyReport() {
  const data = forMonth(rows.filter(row => !row.trendExcluded), state.month);
  openDialog(`${monthLabel(state.month)} report`, `${summary(data, { compact: true })}<p class="subtle">${state.month === currentMonth ? `Month to date through ${dateLabel(asOf)}.` : 'Completed month.'} ${state.liveData ? 'Saved records; your Trends exclusions are applied.' : 'Sample transactions only.'}</p><div class="report-categories">${categoryList(data)}</div>`);
}

function clearLiveRecords() {
  rows.length = 0; categories.length = 0; wealthAccounts.length = 0; wealthHistory.length = 0; months.length = 0;
  state.liveData = null; state.session = false; state.query = ''; state.category = ''; state.type = '';
  Object.assign(state, samplePlanning());
  if (dialog.open) dialog.close();
  document.querySelector('#dialog-body').replaceChildren();
}
function updateMonths() {
  document.querySelector('#month').innerHTML = months.map(month => `<option value="${month}">${monthLabel(month)}</option>`).join('');
  document.querySelector('#month').value = state.month;
}
export function attachLiveConnection(configuration, factory, message) {
  liveConfiguration = configuration; liveMessage = message;
  clearLiveRecords();
  if (configuration.enabled && factory) {
    liveConnection = factory(event => {
      clearLiveRecords(); state.phase = event.phase; state.liveError = event.error || null;
      if (event.phase === 'deleted') state.liveDeleted = true;
      if (event.phase === 'deletion-unconfirmed') state.liveDeleted = 'unconfirmed';
      if (event.phase === 'ready') {
        const data = event.data;
        state.liveData = data; state.session = true;
        rows.push(...data.transactions); categories.push(...data.categories); wealthAccounts.push(...data.accounts); wealthHistory.push(...data.history);
        months.push(...new Set([currentMonth, ...rows.map(row => row.date.slice(0, 7))])); months.sort().reverse();
        if (!months.includes(state.month)) state.month = months[0];
        document.querySelector('.profile strong').textContent = data.profile.user.display_name || 'Your Averlen account';
        document.querySelector('.profile .avatar').textContent = initialsFor(data.profile.user.display_name);
        document.querySelector('.profile small').textContent = data.profile.household.name || 'Household';
      } else {
        document.querySelector('.profile strong').textContent = 'Averlen'; document.querySelector('.profile small').textContent = 'Your account'; document.querySelector('.profile .avatar').textContent = 'A';
      }
      updateMonths();
      document.querySelector('.preview-banner>span').textContent = state.session ? 'Saved records · Read-only web access' : 'Averlen for the web';
      if (['deleted', 'deletion-unconfirmed'].includes(event.phase) || (event.phase === 'signed-out' && state.liveDeleted)) navigate('login');
      else if (state.session && ['', '#login'].includes(location.hash)) navigate('home');
      else route();
    });
  }
  render();
}
function liveStatus() {
  if (state.phase === 'loading') {
    main.innerHTML = '<section class="loading-state" role="status"><img src="../averlen-logo.png" width="56" height="56" alt=""><span class="spinner" aria-hidden="true"></span><h2>Opening your Averlen account…</h2><p class="subtle">Loading your saved records and balances.</p></section>';
    return;
  }
  main.innerHTML = `<section class="card account-gate"><h2>We couldn’t open your saved records</h2><p class="note">${esc(liveMessage(state.liveError))}</p><div class="button-row"><button class="button primary" data-action="reload-live">Try again</button><button class="button" data-action="logout">Sign out</button></div></section>`;
}
function liveLogin() {
  const available = Boolean(liveConfiguration?.enabled && liveConnection);
  const appleAvailable = available && liveConfiguration.appleEnabled;
  main.innerHTML = `<div class="auth-shell"><section class="auth-story"><a href="#login" class="brand"><img src="../averlen-logo.png" width="40" height="40" alt=""><span>Averlen</span></a><span class="overline">YOUR SPACE FOR CLARITY</span><h2>Your picture.<br>Wherever you are.</h2><p>Open your saved Averlen records using the account you already use on iPhone.</p></section><section class="auth-form card"><span class="overline">WELCOME TO AVERLEN</span><h1>Welcome back.</h1><p class="subtle">Sign in with your existing Averlen account.</p>${state.liveDeleted ? `<p class="success-note" role="status">${state.liveDeleted === 'unconfirmed' ? 'We could not confirm whether deletion finished. Your session was cleared. Sign in again to check, or contact support. The website will not retry deletion automatically.' : 'Your account was deleted. Bank disconnection and remaining provider cleanup are being processed.'}</p>` : ''}${!available ? '<div class="preview-note">Web sign-in is being prepared. The sample preview is available while the secure connection is completed.</div>' : '<p class="note">This first web version shows saved records. Editing and bank refresh remain in the iPhone app.</p>'}<button class="button apple-button" id="apple-signin" ${appleAvailable ? '' : 'disabled'}>Continue with Apple</button>${!appleAvailable && available ? '<p class="note">Apple web sign-in is still being configured. Use the iPhone app if your account uses Apple.</p>' : ''}<div class="auth-divider">or use email</div><form id="live-login-form"><div class="form-field"><label for="live-email">Email</label><input id="live-email" type="email" autocomplete="username" required ${available ? '' : 'disabled'}></div><div class="form-field"><label for="live-password">Password</label><input id="live-password" type="password" autocomplete="current-password" required ${available ? '' : 'disabled'}></div><p id="login-error" class="form-error" role="alert"></p><button type="submit" class="button primary" ${available ? '' : 'disabled'}>Sign in</button><button type="button" class="text-button" id="live-reset-password" ${available ? '' : 'disabled'}>Forgot password?</button></form><a href="../preview/" class="button">Explore sample preview →</a><p class="note">Use your original account and sign-in method. The website will not create or link accounts automatically.</p><div class="auth-links"><a href="#account">Saved data & account</a><a href="https://averlen.app/support.html">Support</a><button class="text-button" data-theme-action>Appearance</button></div></section></div>`;
  document.querySelector('#live-login-form').addEventListener('submit', async event => {
    event.preventDefault(); if (!available) return;
    const form = event.currentTarget, email = form.querySelector('#live-email').value.trim(), passwordField = form.querySelector('#live-password');
    const password = passwordField.value; passwordField.value = ''; const button = form.querySelector('[type=submit]'); button.disabled = true;
    try { state.liveDeleted = false; await liveConnection.signIn(email, password); }
    catch (error) { if (form.isConnected) form.querySelector('#login-error').textContent = liveMessage(error); }
    finally { button.disabled = false; }
  });
  document.querySelector('#apple-signin').addEventListener('click', async event => {
    if (!appleAvailable) return; const button = event.currentTarget; button.disabled = true;
    try { state.liveDeleted = false; await liveConnection.signInApple(); } catch (error) { const target = document.querySelector('#login-error'); if (target) target.textContent = liveMessage(error); } finally { button.disabled = false; }
  });
  document.querySelector('#live-reset-password').addEventListener('click', async () => {
    const email = document.querySelector('#live-email'); if (!email.reportValidity() || !email.value) { email.focus(); return; }
    try { await liveConnection.resetPassword(email.value.trim()); const target = document.querySelector('#login-error'); if (target) target.textContent = 'If a password account exists for that email, a reset link will be sent.'; }
    catch (error) { const target = document.querySelector('#login-error'); if (target) target.textContent = liveMessage(error); }
  });
}
function liveAccount() {
  const data = state.liveData, profile = data.profile;
  const blocked = profile.household.is_owner && profile.members.length > 1;
  main.innerHTML = `<p class="intro">Manage your Averlen account and saved records.</p><div class="grid"><section class="card">${header('Your account')}<div class="definition"><span>Name</span><strong>${esc(profile.user.display_name || 'Your account')}</strong></div><div class="definition"><span>Email</span><strong class="account-email">${esc(profile.user.email || 'Apple account')}</strong></div><div class="definition"><span>Household</span><strong>${esc(profile.household.name || 'Your household')}</strong></div><div class="definition"><span>Role</span><strong>${profile.household.is_owner ? 'Owner' : 'Member'} · ${profile.members.length} member${profile.members.length === 1 ? '' : 's'}</strong></div><div class="button-row"><button class="button" data-action="export-sample">Export my data</button><button class="button" data-action="logout">Sign out</button></div></section><section class="card">${header('Plan & access')}<p class="subtle">${data.billing.hasAccess ? 'Your household currently has access through its Averlen plan.' : 'An active plan was not confirmed. Your saved records, export, and account deletion remain available.'}</p><p class="note">This first web version is read-only. Manage or restore purchases in the iPhone app. Deleting your account does not cancel an App Store subscription.</p><div class="button-row"><a class="button" href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noopener">Manage Apple subscription ↗</a></div></section><section class="card danger-zone full">${header('Delete account')}<p class="subtle">${blocked ? 'You own a shared household. Transfer ownership to your partner in the iPhone app before deleting your account. Their account and data must stay available.' : 'Your account and its Averlen data will be permanently deleted. Your identity must be confirmed first. Bank disconnection is queued by the server as part of deletion.'}</p><div class="button-row"><button class="button danger" data-action="delete-account" ${blocked ? 'disabled' : ''}>${blocked ? 'Transfer ownership first' : 'Delete my account'}</button></div></section></div>`;
}
async function liveSignOut() {
  try { await liveConnection?.signOut(); navigate('login'); }
  catch (error) { state.phase = 'error'; state.liveError = { code: error.code }; render(); }
}
function liveAccountAction(kind) {
  const profile = state.liveData?.profile; if (!profile || !liveConnection) return;
  if (kind === 'delete' && profile.household.is_owner && profile.members.length > 1) { openDialog('Transfer ownership first', '<p class="subtle">Transfer household ownership in the iPhone app before deleting your account.</p>'); return; }
  const usesPassword = liveConnection.provider() === 'password';
  openDialog(kind === 'delete' ? 'Permanently delete your account?' : 'Export your account data', `<p class="subtle">${esc(profile.user.email || profile.user.display_name || 'Your Averlen account')}</p><p class="note">${kind === 'delete' ? 'This permanently removes your Averlen account and its data. Bank access is disconnected through server cleanup. Your partner’s account must remain available. Deleting does not cancel an App Store subscription.' : 'Download your server-filtered records. Shared-household access does not include your partner’s private history.'}</p><form id="live-account-action">${usesPassword ? '<div class="form-field"><label for="confirm-password">Confirm your Averlen password</label><input id="confirm-password" type="password" autocomplete="current-password" required></div>' : '<p class="note">Apple will ask you to confirm your identity.</p>'}${kind === 'delete' ? '<div class="form-field"><label for="confirm-delete">Type DELETE to confirm</label><input id="confirm-delete" autocomplete="off" spellcheck="false" required pattern="DELETE"></div>' : ''}<p id="account-action-error" role="alert" class="form-error"></p><div class="button-row"><button type="submit" class="button ${kind === 'delete' ? 'danger' : 'primary'}">${kind === 'delete' ? 'Delete my account permanently' : 'Confirm and export'}</button><button type="button" class="button" id="cancel-live-action">Cancel</button></div></form>`);
  document.querySelector('#cancel-live-action').addEventListener('click', () => dialog.close());
  document.querySelector('#live-account-action').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget;
    if (kind === 'delete' && form.querySelector('#confirm-delete').value !== 'DELETE') return;
    const field = form.querySelector('#confirm-password'), password = field?.value || ''; if (field) field.value = '';
    const button = form.querySelector('[type=submit]'), cancel = form.querySelector('#cancel-live-action'), close = document.querySelector('#close-dialog');
    button.disabled = true; cancel.disabled = true; close.disabled = true; dialog.dataset.busy = 'true';
    try {
      if (kind === 'delete') await liveConnection.deleteAccount(password);
      else { const data = await liveConnection.exportData(password); downloadJson(data, 'averlen-account-data.json'); dialog.close(); }
    } catch (error) { const target = document.querySelector('#account-action-error'); if (target) target.textContent = liveMessage(error); }
    finally { button.disabled = false; cancel.disabled = false; close.disabled = false; delete dialog.dataset.busy; }
  });
}
function downloadJson(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.querySelector('#month').innerHTML = months.map(month => `<option value="${month}">${monthLabel(month)}</option>`).join('');
document.querySelector('#month').value = state.month;
document.querySelector('#month').addEventListener('change', event => { state.month = event.target.value; render(); announce(`Showing ${monthLabel(state.month)}.`); });
document.querySelector('#about-preview').addEventListener('click', openAbout);
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('cancel', event => { if (dialog.dataset.busy === 'true') event.preventDefault(); });
dialog.addEventListener('close', () => { dialog.querySelectorAll('input[type=password]').forEach(input => { input.value = ''; }); });
document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action) {
    const actions = {
      'start-demo': () => { state.session = true; state.deletedPreview = false; const destination = state.pendingRoute || 'home'; state.pendingRoute = null; navigate(destination); },
      'start-demo-account': () => { state.session = true; state.deletedPreview = false; navigate('account'); },
      'manage-account': () => navigate('account'),
      'reload-live': () => { void liveConnection?.refresh(); },
      'open-settings': () => navigate('settings'),
      logout: () => { if (isLivePage) { void liveSignOut(); return; } resetSample(); state.session = false; state.pendingRoute = null; state.deletedPreview = false; navigate('login'); },
      'reset-sample': () => { if (isLivePage) { void liveConnection?.refresh(); return; } resetSample(); render(); announce('Sample changes reset.'); },
      'monthly-report': showMonthlyReport,
      retirement: showRetirement, debt: showDebt, ownership: showOwnership,
      about: openAbout, 'values-info': () => showSettingsInfo('values'), 'banks-info': () => showSettingsInfo('banks'), 'categories-info': () => showSettingsInfo('categories'),
      'add-account': () => showManualAccount(), 'delete-account': showDeletion, 'export-sample': exportSample,
      'reset-password-info': () => openDialog('Reset your password', '<p class="subtle">The live website will send a reset link to the email on your Averlen account. Email delivery is not connected in this preview, and no message has been sent.</p>'),
    };
    actions[action]?.();
  }
  const lens = event.target.closest('[data-lens]');
  if (lens) { state.lens = lens.dataset.lens; wealth(); }
  const category = event.target.closest('[data-category]');
  if (category) {
    if (dialog.open) dialog.close();
    state.category = category.dataset.category; state.query = ''; state.type = 'spending';
    if (location.hash === '#activity') { state.route = 'activity'; render(); }
    else location.hash = 'activity';
  }
  const txButton = event.target.closest('[data-tx]');
  if (txButton && state.liveData) { const tx = rows.find(row => row.id === txButton.dataset.tx); openDialog(tx.merchant, `<p class="subtle">${dateLabel(tx.date)} · ${esc(catFor(tx.category).name)}</p><div class="dialog-value">${tx.income ? '+' : '−'}${exactMoney(tx.cents)}</div><p class="note">${esc(tx.note || '')}</p><p class="note">This saved transaction is read-only on the website. Edit it in the iPhone app.</p>`); return; }
  if (txButton) {
    const tx = rows.find(row => row.id === txButton.dataset.tx);
    openDialog(tx.merchant, `<p class="subtle">${dateLabel(tx.date)} · Sample transaction</p><div class="dialog-value ${tx.income ? 'positive' : ''}">${tx.income ? '+' : '−'}${exactMoney(tx.cents)}</div><label for="edit-category" class="dialog-label">Category</label><select id="edit-category">${categories.filter(cat => (cat.id === 'income') === tx.income).map(cat => `<option value="${esc(cat.id)}" ${cat.id === tx.category ? 'selected' : ''}>${esc(cat.name)}</option>`).join('')}</select><p class="note">Try a different category. This changes sample data in this browser only and resets on reload.</p><div class="button-row"><button class="button primary" id="save-category">Save sample category</button></div>`);
    document.querySelector('#save-category').addEventListener('click', () => { tx.category = document.querySelector('#edit-category').value; dialog.close(); render(); announce('Sample category updated.'); });
  }
  const accountButton = event.target.closest('[data-account]');
  if (accountButton) showAccount(accountButton.dataset.account);
  const monthButton = event.target.closest('[data-month]');
  if (monthButton) { state.month = monthButton.dataset.month === state.month && monthButton.classList.contains('bar-button') ? currentMonth : monthButton.dataset.month; document.querySelector('#month').value = state.month; render(); announce(`Showing ${monthLabel(state.month)}.`); }
  if (event.target.closest('[data-theme-action]')) { state.theme = state.theme === 'light' ? 'dark' : 'light'; setTheme(); if (state.route === 'settings') settings(); }
});
function route() {
  const destination = location.hash.slice(1);
  if (destination === 'main') { main.focus(); return; }
  if (dialog.open) dialog.close();
  const privateRoutes = ['home', 'activity', 'trends', 'wealth', 'settings'];
  if (!state.session && privateRoutes.includes(destination)) { state.pendingRoute = destination; state.route = 'login'; }
  else state.route = ['login', 'account', ...privateRoutes].includes(destination) ? destination : state.session ? 'home' : 'login';
  render();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
if (isLivePage) {
  clearLiveRecords(); updateMonths();
  document.querySelector('.preview-banner>span').textContent = 'Averlen for the web';
  document.querySelector('#about-preview').textContent = 'About web access';
  document.querySelector('footer').textContent = 'Averlen · Your saved financial picture';
  window.addEventListener('pagehide', () => { clearLiveRecords(); state.phase = 'loading'; render(); });
  window.addEventListener('pageshow', event => { if (event.persisted) void liveConnection?.refresh(); });
}
setTheme();
route();
