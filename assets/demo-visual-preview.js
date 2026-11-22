/* Stage 57 visual trial: isolated enhancement of the existing overview tab.
   The data are explicitly illustrative; this module makes no network requests. */
(() => {
  'use strict';
  const panel = document.getElementById('panel-overview');
  if (!panel || panel.querySelector('.v57-overview')) return;

  // All values are sample revenue figures in MILLIONS of toman, not live metrics.
  // The last seven-day data point matches the already illustrated 12,480,000 KPI.
  const periods = {
    '7': {
      labels: ['شنبه', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه'],
      fullLabels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
      values: [8.2, 8.9, 9.4, 8.7, 11.1, 10.8, 12.48],
      title: 'روند درآمد در ۷ روز اخیر',
      caption: 'هر نقطه، درآمد یک روز را نشان می‌دهد.'
    },
    '30': {
      labels: ['۱–۵', '۶–۱۰', '۱۱–۱۵', '۱۶–۲۰', '۲۱–۲۵', '۲۶–۳۰'],
      fullLabels: ['روزهای ۱ تا ۵', 'روزهای ۶ تا ۱۰', 'روزهای ۱۱ تا ۱۵', 'روزهای ۱۶ تا ۲۰', 'روزهای ۲۱ تا ۲۵', 'روزهای ۲۶ تا ۳۰'],
      values: [45, 52, 59, 63, 69, 73],
      title: 'روند درآمد در ۳۰ روز اخیر',
      caption: 'هر نقطه، مجموع درآمد یک بازه پنج‌روزه را نشان می‌دهد.'
    }
  };
  const nf = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });
  const money = value => `${nf.format(value)} میلیون`;

  const root = document.createElement('div');
  root.className = 'v57-overview';
  root.innerHTML = `
    <div class="v57-overview-head">
      <div>
        <p class="v57-kicker">گزارش عملکرد / نسخه نمایشی</p>
        <h3>روند درآمد فروشگاه</h3>
        <p class="v57-subtitle">بررسی روند فروش و سهم کانال‌های سفارش</p>
      </div>
      <div class="v57-period" role="group" aria-label="بازه زمانی نمودار">
        <button type="button" data-v57-period="7" aria-pressed="true">۷ روز</button>
        <button type="button" data-v57-period="30" aria-pressed="false">۳۰ روز</button>
      </div>
    </div>
    <div class="v57-panels">
      <div class="v57-chart-card">
        <div class="v57-chart-top">
          <div><div class="v57-chart-label" id="v57-chart-heading">روند درآمد در ۷ روز اخیر</div><div class="v57-chart-unit">مقیاس: میلیون تومان</div></div>
          <span class="v57-legend">درآمد فروشگاه</span>
        </div>
        <svg class="v57-svg" viewBox="0 0 600 210" preserveAspectRatio="none" role="img" aria-labelledby="v57-svg-title v57-svg-description">
          <title id="v57-svg-title">روند درآمد در ۷ روز اخیر</title>
          <desc id="v57-svg-description">نمودار نمونه؛ اعداد دقیق در جدول زیر ارائه شده‌اند.</desc>
          <defs><linearGradient id="v57-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity="0.19"/><stop offset="100%" stop-color="var(--primary)" stop-opacity="0.008"/></linearGradient></defs>
          <g id="v57-grid"></g><path id="v57-area" fill="url(#v57-gradient)"></path><path id="v57-line" class="v57-line"></path><g id="v57-points"></g>
        </svg>
        <div class="v57-axis" id="v57-axis" aria-hidden="true"></div>
      </div>
      <aside class="v57-side-card" aria-label="خلاصه عملکرد و کانال‌های سفارش">
        <div>
          <div class="v57-metric-label">مجموع درآمد این بازه</div>
          <strong class="v57-total" id="v57-total" aria-live="polite"></strong>
          <div class="v57-total-unit">تومان · داده نمایشی</div>
        </div>
        <div class="v57-metric-note" id="v57-caption"></div>
        <h4>سهم کانال‌های سفارش</h4>
        <div class="v57-channel"><div class="v57-channel-title"><span>وب‌سایت</span><strong>۵۸٪</strong></div><div class="v57-track" aria-hidden="true"><span style="inline-size:58%"></span></div></div>
        <div class="v57-channel" data-channel="instagram"><div class="v57-channel-title"><span>اینستاگرام</span><strong>۲۷٪</strong></div><div class="v57-track" aria-hidden="true"><span style="inline-size:27%"></span></div></div>
        <div class="v57-channel" data-channel="other"><div class="v57-channel-title"><span>سایر کانال‌ها</span><strong>۱۵٪</strong></div><div class="v57-track" aria-hidden="true"><span style="inline-size:15%"></span></div></div>
      </aside>
    </div>
    <p class="v57-demo-label">تمام اعداد این نمودار و سهم کانال‌ها صرفاً برای نمایش قابلیت طراحی رابط کاربری هستند و به داده واقعی متصل نیستند.</p>
    <details><summary class="v57-data-toggle">مشاهده داده‌های نمودار به‌صورت جدول</summary>
      <table class="v57-data-table"><thead><tr><th scope="col">روز یا بازه</th><th scope="col">درآمد (میلیون تومان)</th></tr></thead><tbody id="v57-data-body"></tbody></table>
    </details>`;
  panel.replaceChildren(root);

  const $ = id => root.querySelector(`#${id}`);
  const axis = $('v57-axis');
  const gGrid = $('v57-grid');
  const gPoints = $('v57-points');
  const line = $('v57-line');
  const area = $('v57-area');
  const table = $('v57-data-body');

  function render(period) {
    const data = periods[period];
    if (!data) return;
    const values = data.values;
    const left = 12, right = 588, top = 20, bottom = 188;
    const maxValue = Math.max(...values) * 1.14;
    const pts = values.map((value, i) => ({
      x: left + ((right - left) * i / (values.length - 1)),
      y: bottom - ((bottom - top) * value / maxValue)
    }));
    const lineD = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const first = pts[0], last = pts[pts.length - 1];
    line.setAttribute('d', lineD);
    area.setAttribute('d', `${lineD} L${last.x},${bottom} L${first.x},${bottom} Z`);
    gGrid.innerHTML = [0, 1, 2, 3].map(i => {
      const y = top + (bottom - top) * i / 3;
      return `<line class="v57-grid" x1="0" x2="600" y1="${y}" y2="${y}" />`;
    }).join('');
    gPoints.innerHTML = `<circle class="v57-dot" cx="${last.x}" cy="${last.y}" r="5" />`;
    axis.style.setProperty('--v57-n', values.length);
    axis.replaceChildren(...data.labels.map(label => {
      const el = document.createElement('span');
      el.textContent = label;
      return el;
    }));
    const total = values.reduce((sum, item) => sum + item, 0);
    $('v57-total').textContent = money(total);
    $('v57-caption').textContent = data.caption;
    $('v57-chart-heading').textContent = data.title;
    $('v57-svg-title').textContent = `${data.title} (نمونه)`;
    $('v57-svg-description').textContent = `${data.caption} مجموع درآمد: ${money(total)} تومان. جزئیات در جدول قابل مشاهده است.`;
    table.replaceChildren(...values.map((value, i) => {
      const row = document.createElement('tr');
      const name = document.createElement('td');
      const amount = document.createElement('td');
      name.textContent = data.fullLabels[i];
      amount.textContent = nf.format(value);
      row.append(name, amount);
      return row;
    }));
    root.querySelectorAll('[data-v57-period]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.v57Period === period));
    });
  }
  root.querySelectorAll('[data-v57-period]').forEach(button => {
    button.addEventListener('click', () => render(button.dataset.v57Period));
  });
  render('7');
})();
