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
    <div class="service-item" id="item-${item.id}">
      <span class="service-item-num">รายการที่ ${index + 1}</span>

      <div class="form-group">
        <label class="form-label">ประเภทบริการ</label>
        <select class="form-control" data-id="${item.id}" data-field="type">
          ${typeOptions}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">ขนาดแอร์</label>
        <select class="form-control" data-id="${item.id}" data-field="btu">
          ${btuOptions}
        </select>
      </div>

      <div class="qty-wrapper form-group">
        <label class="form-label">จำนวน</label>
        <input type="number" class="form-control" value="${item.qty}" min="1" max="99"
          data-id="${item.id}" data-field="qty" style="text-align:center;" />
      </div>

      ${showRemove ? `
      <button type="button" class="btn btn-danger-ghost" data-id="${item.id}" data-action="remove" title="ลบรายการ">
        🗑️
      </button>` : `<div></div>`}
    </div>

    <div style="text-align:right;margin-top:-6px;padding-right:4px;">
      <span class="price-hint" id="hint-${item.id}">
        💰 ราคา: ${formatNumber(price)} บาท/เครื่อง
      </span>
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
    hint.textContent = `💰 ราคา: ${formatNumber(price)} บาท/เครื่อง`;
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
    field.classList.add('error');
    error.classList.add('visible');
  } else {
    field.classList.remove('error');
    error.classList.remove('visible');
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
    const firstError = document.querySelector('.form-control.error');
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
  b.items.forEach((item, i) => {
    rows += `
      <tr>
        <td>${item.type}</td>
        <td>${getBtuLabel(item.btu)}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">${formatNumber(item.unitPrice)}</td>
        <td>${formatNumber(item.subtotal)}</td>
      </tr>
    `;
  });

  // Distance row
  rows += `
    <tr class="distance-row">
      <td colspan="4">ค่าเดินทาง (${b.distanceLabel})</td>
      <td>${formatNumber(b.distance)}</td>
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
  document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('visible'));

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
      <td style="text-align:center;">${item.qty}</td>
      <td style="text-align:right;">${formatNumber(item.unitPrice)} บาท</td>
      <td style="text-align:right;">${formatNumber(item.subtotal)} บาท</td>
    </tr>
  `).join('');

  return `
    <div class="print-header">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="print-company-icon">❄</div>
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
          <td style="text-align:right;">${formatNumber(b.distance)} บาท</td>
        </tr>
        <tr class="print-total-row">
          <td colspan="4" style="text-align:left;">ยอดรวมทั้งหมด</td>
          <td style="text-align:right;">${formatNumber(b.total)} บาท</td>
        </tr>
      </tbody>
    </table>

    <div class="print-section-title">วันและเวลานัดหมาย</div>
    <div class="print-appointment">
      <span style="font-size:22px;">📅</span>
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
    const items = document.querySelectorAll('.service-item');
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
