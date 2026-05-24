'use strict';

/* ============================================================
   PRICING DATA
============================================================ */
const PRICING = {
  'ล้างแอร์': {
    '9000':  500,
    '12000': 600,
    '18000': 800,
    '24000': 1000,
    '36000': 1500,
  },
  'ซ่อมแอร์': {
    '9000':  800,
    '12000': 1000,
    '18000': 1200,
    '24000': 1500,
    '36000': 2000,
  },
  'ติดตั้งแอร์': {
    '9000':  1500,
    '12000': 1800,
    '18000': 2200,
    '24000': 2800,
    '36000': 3500,
  },
};

const SERVICE_TYPES = Object.keys(PRICING);

const BTU_OPTIONS = [
  { value: '9000',  label: '9,000 BTU' },
  { value: '12000', label: '12,000 BTU' },
  { value: '18000', label: '18,000 BTU' },
  { value: '24000', label: '24,000 BTU' },
  { value: '36000', label: '36,000 BTU' },
];

const DISTANCE_LABELS = {
  '100': 'ไม่เกิน 10 กม.',
  '200': '11-20 กม.',
  '300': '21-30 กม.',
  '500': '31-50 กม.',
  '800': 'มากกว่า 50 กม.',
};

/* ============================================================
   STATE
============================================================ */
let serviceItems = []; // [{id, type, btu, qty}]
let itemIdCounter = 0;
let currentBooking = null;

/* ============================================================
   BOOKING NUMBER GENERATOR
============================================================ */
function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function generateBookingNumber() {
  const today = getTodayStr();
  const storageKey = `ac_booking_counter_${today}`;
  let counter = parseInt(localStorage.getItem(storageKey) || '0', 10);
  counter += 1;
  localStorage.setItem(storageKey, String(counter));
  return `AC${today}${String(counter).padStart(3, '0')}`;
}

/* ============================================================
   HEADER DATE
============================================================ */
function initHeaderDate() {
  const el = document.getElementById('header-date');
  if (!el) return;
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = now.toLocaleDateString('th-TH', options);
}

/* ============================================================
   SERVICE ITEM RENDERING
============================================================ */
function createServiceItem() {
  itemIdCounter += 1;
  return { id: itemIdCounter, type: 'ล้างแอร์', btu: '9000', qty: 1 };
}

function getItemPrice(type, btu) {
  return (PRICING[type] && PRICING[type][btu]) ? PRICING[type][btu] : 0;
}

function formatNumber(n) {
  return n.toLocaleString('th-TH');
}

function buildServiceItemHTML(item, index, total) {
  const price = getItemPrice(item.type, item.btu);
  const typeOptions = SERVICE_TYPES.map(t =>
    `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`
  ).join('');
  const btuOptions = BTU_OPTIONS.map(b =>
    `<option value="${b.value}" ${item.btu === b.value ? 'selected' : ''}>${b.label}</option>`
  ).join('');

  const showRemove = total > 1;

  return `
    <div class="rounded-xl border p-4 pt-5 relative" id="item-${item.id}" style="background:rgb(249,249,247);border-color:rgba(0,0,0,0.12);">
      <span class="absolute -top-2.5 left-4 text-xs font-semibold px-2 py-0.5 rounded-full text-white" style="background:#1A1A1A;letter-spacing:0.03em;">
        รายการที่ ${index + 1}
      </span>

      <div class="grid gap-3" style="grid-template-columns:1fr 1fr 80px${showRemove ? ' 40px' : ''}; align-items:end;">

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium" style="color:#888780;">ประเภทบริการ</label>
          <div class="relative">
            <select class="form-field pr-8" data-id="${item.id}" data-field="type">
              ${typeOptions}
            </select>
            <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style="color:#888780;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium" style="color:#888780;">ขนาดแอร์</label>
          <div class="relative">
            <select class="form-field pr-8" data-id="${item.id}" data-field="btu">
              ${btuOptions}
            </select>
            <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style="color:#888780;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium" style="color:#888780;">จำนวน</label>
          <input type="number" class="form-field text-center" value="${item.qty}" min="1" max="99"
            data-id="${item.id}" data-field="qty" />
        </div>

        ${showRemove ? `
        <div class="flex items-end pb-0.5">
          <button type="button"
            class="w-9 h-9 flex items-center justify-center rounded-lg border transition-colors"
            data-id="${item.id}" data-action="remove" title="ลบรายการ"
            style="border-color:rgba(239,68,68,0.3);color:#EF4444;background:transparent;"
            onmouseover="this.style.background='rgba(239,68,68,0.08)'" onmouseout="this.style.background='transparent'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>` : ''}

      </div>

      <div class="mt-2.5 flex justify-end">
        <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md" style="background:#F1EFE8;color:#1A1A1A;" id="hint-${item.id}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          ราคา: ${formatNumber(price)} บาท/เครื่อง
        </span>
      </div>
    </div>
  `;
}

function renderServiceItems() {
  const container = document.getElementById('service-items-list');
  if (!container) return;
  container.innerHTML = serviceItems.map((item, i) =>
    buildServiceItemHTML(item, i, serviceItems.length)
  ).join('');
  attachItemListeners();
}

function attachItemListeners() {
  // Select / Input changes
  document.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('change', handleItemFieldChange);
    if (el.tagName === 'INPUT') el.addEventListener('input', handleItemFieldChange);
  });

  // Remove buttons
  document.querySelectorAll('[data-action="remove"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      serviceItems = serviceItems.filter(item => item.id !== id);
      renderServiceItems();
    });
  });
}

function handleItemFieldChange(e) {
  const id = parseInt(e.target.dataset.id, 10);
  const field = e.target.dataset.field;
  const item = serviceItems.find(i => i.id === id);
  if (!item) return;

  if (field === 'type') {
    item.type = e.target.value;
  } else if (field === 'btu') {
    item.btu = e.target.value;
  } else if (field === 'qty') {
    const v = parseInt(e.target.value, 10);
    item.qty = isNaN(v) || v < 1 ? 1 : v;
    e.target.value = item.qty;
  }

  // Update price hint
  const hint = document.getElementById(`hint-${id}`);
  if (hint) {
    const price = getItemPrice(item.type, item.btu);
    hint.innerHTML = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      ราคา: ${formatNumber(price)} บาท/เครื่อง
    `;
  }
}

/* ============================================================
   VALIDATION
============================================================ */
function showFieldError(fieldId, errorId, show) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (!field || !error) return;
  if (show) {
    field.classList.add('field-error');
    error.style.display = 'block';
  } else {
    field.classList.remove('field-error');
    error.style.display = 'none';
  }
}

function clearFieldError(fieldId, errorId) {
  showFieldError(fieldId, errorId, false);
}

function validateForm() {
  let valid = true;

  // Distance
  const distanceVal = document.getElementById('distance').value;
  showFieldError('distance', 'distance-error', !distanceVal);
  if (!distanceVal) valid = false;

  // Customer name
  const nameVal = document.getElementById('customer-name').value.trim();
  showFieldError('customer-name', 'customer-name-error', !nameVal);
  if (!nameVal) valid = false;

  // Phone
  const phoneVal = document.getElementById('customer-phone').value.trim();
  showFieldError('customer-phone', 'customer-phone-error', !phoneVal);
  if (!phoneVal) valid = false;

  // Address
  const addressVal = document.getElementById('customer-address').value.trim();
  showFieldError('customer-address', 'customer-address-error', !addressVal);
  if (!addressVal) valid = false;

  // Appointment date
  const dateVal = document.getElementById('appt-date').value;
  showFieldError('appt-date', 'appt-date-error', !dateVal);
  if (!dateVal) valid = false;

  // Appointment time
  const timeVal = document.getElementById('appt-time').value;
  showFieldError('appt-time', 'appt-time-error', !timeVal);
  if (!timeVal) valid = false;

  return valid;
}

function attachLiveValidation() {
  const fields = [
    ['distance', 'distance-error'],
    ['customer-name', 'customer-name-error'],
    ['customer-phone', 'customer-phone-error'],
    ['customer-address', 'customer-address-error'],
    ['appt-date', 'appt-date-error'],
    ['appt-time', 'appt-time-error'],
  ];
  fields.forEach(([fid, eid]) => {
    const el = document.getElementById(fid);
    if (el) {
      el.addEventListener('change', () => clearFieldError(fid, eid));
      el.addEventListener('input', () => clearFieldError(fid, eid));
    }
  });
}

/* ============================================================
   CALCULATE & SHOW MODAL
============================================================ */
function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  const thaiYear = y + 543;
  const months = ['', 'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `${d} ${months[m]} ${thaiYear}`;
}

function formatThaiDateTime(dateStr, timeStr) {
  const datePart = formatThaiDate(dateStr);
  const timePart = timeStr ? ` เวลา ${timeStr} น.` : '';
  return datePart + timePart;
}

function formatTodayThai() {
  const now = new Date();
  return formatThaiDate(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`);
}

function getBtuLabel(btu) {
  const found = BTU_OPTIONS.find(b => b.value === btu);
  return found ? found.label : btu;
}

function calculateAndShowModal() {
  if (!validateForm()) {
    // Scroll to first error
    const firstError = document.querySelector('.field-error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const distance = parseInt(document.getElementById('distance').value, 10);
  const customerName = document.getElementById('customer-name').value.trim();
  const customerPhone = document.getElementById('customer-phone').value.trim();
  const customerAddress = document.getElementById('customer-address').value.trim();
  const apptDate = document.getElementById('appt-date').value;
  const apptTime = document.getElementById('appt-time').value;

  // Compute totals
  const items = serviceItems.map(item => {
    const unitPrice = getItemPrice(item.type, item.btu);
    const subtotal = unitPrice * item.qty;
    return { ...item, unitPrice, subtotal };
  });

  const serviceTotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const total = serviceTotal + distance;
  const bookingNum = generateBookingNumber();

  currentBooking = {
    bookingNum,
    customerName,
    customerPhone,
    customerAddress,
    apptDate,
    apptTime,
    items,
    distance,
    distanceLabel: DISTANCE_LABELS[String(distance)] || '-',
    serviceTotal,
    total,
    createdDate: formatTodayThai(),
  };

  populateModal(currentBooking);
  openModal();
}

function populateModal(b) {
  document.getElementById('modal-booking-num').textContent = b.bookingNum;
  document.getElementById('modal-created-date').textContent = `วันที่ออกเอกสาร: ${b.createdDate}`;

  document.getElementById('res-customer-name').textContent = b.customerName;
  document.getElementById('res-customer-phone').textContent = b.customerPhone;
  document.getElementById('res-customer-address').textContent = b.customerAddress;
  document.getElementById('res-appointment').textContent = formatThaiDateTime(b.apptDate, b.apptTime);
  document.getElementById('res-total').textContent = formatNumber(b.total);

  // Table rows
  const tbody = document.getElementById('res-table-body');
  let rows = '';
  b.items.forEach((item) => {
    rows += `
      <tr class="border-b" style="border-color:rgba(0,0,0,0.08);">
        <td class="px-3 py-2.5 text-sm" style="color:#1A1A1A;">${item.type}</td>
        <td class="px-3 py-2.5 text-sm" style="color:#1A1A1A;">${getBtuLabel(item.btu)}</td>
        <td class="px-3 py-2.5 text-sm text-center" style="color:#1A1A1A;">${item.qty}</td>
        <td class="px-3 py-2.5 text-sm text-right" style="color:#1A1A1A;">${formatNumber(item.unitPrice)}</td>
        <td class="px-3 py-2.5 text-sm text-right font-semibold" style="color:#1A1A1A;">${formatNumber(item.subtotal)}</td>
      </tr>
    `;
  });

  // Distance row
  rows += `
    <tr>
      <td colspan="4" class="px-3 py-2.5 text-sm" style="color:#888780;">ค่าเดินทาง (${b.distanceLabel})</td>
      <td class="px-3 py-2.5 text-sm text-right font-medium" style="color:#888780;">${formatNumber(b.distance)}</td>
    </tr>
  `;

  tbody.innerHTML = rows;
}

/* ============================================================
   MODAL OPEN / CLOSE
============================================================ */
function openModal() {
  const overlay = document.getElementById('result-modal');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('result-modal');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   RESET FORM
============================================================ */
function resetForm() {
  document.getElementById('service-form').reset();

  // Clear all validation states
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  document.querySelectorAll('.error-msg').forEach(el => { el.style.display = 'none'; });

  // Reset service items to one default
  serviceItems = [createServiceItem()];
  renderServiceItems();

  closeModal();

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   PRINT QUOTATION
============================================================ */
function buildPrintArea(b) {
  const rows = b.items.map((item, i) => `
    <tr>
      <td>${i + 1}. ${item.type}</td>
      <td>${getBtuLabel(item.btu)}</td>
      <td>${item.qty}</td>
      <td>${formatNumber(item.unitPrice)} บาท</td>
      <td>${formatNumber(item.subtotal)} บาท</td>
    </tr>
  `).join('');

  return `
    <div class="print-header">
      <div class="print-company-block">
        <div class="print-company-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="10" rx="2"/>
            <path d="M7 17v2m5-2v2m5-2v2"/>
            <path d="M2 13h20"/>
          </svg>
        </div>
        <div>
          <div class="print-company-name">บริการแอร์ครบวงจร</div>
          <div class="print-company-sub">ล้าง • ซ่อม • ติดตั้ง แอร์ทุกยี่ห้อ</div>
        </div>
      </div>
      <div class="print-doc-info">
        <div class="print-doc-title">ใบเสนอราคา</div>
        <div class="print-doc-num">${b.bookingNum}</div>
        <div class="print-doc-date">วันที่: ${b.createdDate}</div>
      </div>
    </div>

    <div class="print-section-title">ข้อมูลลูกค้า</div>
    <div class="print-customer-grid">
      <div class="print-customer-item">
        <label>ชื่อลูกค้า</label>
        <span>${b.customerName}</span>
      </div>
      <div class="print-customer-item">
        <label>เบอร์โทร</label>
        <span>${b.customerPhone}</span>
      </div>
      <div class="print-customer-item" style="grid-column:1/-1;">
        <label>ที่อยู่</label>
        <span>${b.customerAddress}</span>
      </div>
    </div>

    <div class="print-section-title">รายการบริการและค่าใช้จ่าย</div>
    <table class="print-table">
      <thead>
        <tr>
          <th>รายการ</th>
          <th>ขนาด</th>
          <th style="text-align:center;">จำนวน</th>
          <th style="text-align:right;">ราคาต่อหน่วย</th>
          <th style="text-align:right;">รวม</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td colspan="4">ค่าเดินทาง (${b.distanceLabel})</td>
          <td>${formatNumber(b.distance)} บาท</td>
        </tr>
        <tr class="print-total-row">
          <td colspan="4" style="text-align:left;">ยอดรวมทั้งหมด</td>
          <td style="text-align:right;">${formatNumber(b.total)} บาท</td>
        </tr>
      </tbody>
    </table>

    <div class="print-section-title">วันและเวลานัดหมาย</div>
    <div class="print-appointment">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <strong>${formatThaiDateTime(b.apptDate, b.apptTime)}</strong>
    </div>

    <div class="print-footer">
      <strong>ขอบคุณที่ใช้บริการ</strong>
      บริการแอร์ครบวงจร — ล้าง ซ่อม ติดตั้ง แอร์ทุกยี่ห้อ ราคายุติธรรม บริการตรงเวลา
    </div>
  `;
}

function printQuotation() {
  if (!currentBooking) return;
  const printArea = document.getElementById('print-area');
  printArea.innerHTML = buildPrintArea(currentBooking);
  window.print();
}

/* ============================================================
   EVENT LISTENERS
============================================================ */
function initEventListeners() {
  // Add service item
  document.getElementById('btn-add-item').addEventListener('click', () => {
    serviceItems.push(createServiceItem());
    renderServiceItems();
    // Scroll new item into view
    const items = document.querySelectorAll('#service-items-list > div');
    if (items.length) items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Form submit
  document.getElementById('service-form').addEventListener('submit', (e) => {
    e.preventDefault();
    calculateAndShowModal();
  });

  // Modal close button
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);

  // Modal overlay click to close
  document.getElementById('result-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Print button
  document.getElementById('btn-print').addEventListener('click', printQuotation);

  // New booking button
  document.getElementById('btn-new-booking').addEventListener('click', resetForm);

  // Keyboard: Escape to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

/* ============================================================
   INIT
============================================================ */
function init() {
  initHeaderDate();

  // Start with one service item
  serviceItems = [createServiceItem()];
  renderServiceItems();

  attachLiveValidation();
  initEventListeners();

  // Set default appointment date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  document.getElementById('appt-date').value = `${y}-${m}-${d}`;
  document.getElementById('appt-time').value = '09:00';
}

document.addEventListener('DOMContentLoaded', init);
