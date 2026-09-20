const STORAGE_KEY = "Lawe-cash-desk-v1";

function currentDate() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

const todayDate = currentDate();

const importedExchangeRows = [
  { kind: "buy", usd: 700, rate: 1477, iqd: 1033900, time: "08:56" },
  { kind: "buy", usd: 55, rate: 1477.5, iqd: 81262.5, time: "10:04" },
  { kind: "buy", usd: 200, rate: 1476.5, iqd: 295300, time: "11:51" },
  { kind: "buy", usd: 100, rate: 1476.5, iqd: 147650, time: "14:21" },
  { kind: "buy", usd: 10000, rate: 1478.25, iqd: 14782500, time: "14:44" },
  { kind: "buy", usd: 10000, rate: 1479.25, iqd: 14792500, time: "14:44" },
  { kind: "buy", usd: 400, rate: 1477, iqd: 590800, time: "15:42" },
  { kind: "buy", usd: 300, rate: 1477, iqd: 443100, time: "15:45" },
  { kind: "buy", usd: 1600, rate: 1477, iqd: 2363200, time: "16:02" },
  { kind: "buy", usd: 50, rate: 1477.5, iqd: 73875, time: "17:43" },
  { kind: "buy", usd: 200, rate: 1477.5, iqd: 295500, time: "18:43" },
  { kind: "buy", usd: 10000, rate: 1478.5, iqd: 14785000, time: "21:23" },
  { kind: "buy", usd: 100, rate: 1477.5, iqd: 147750, time: "21:27" },
  { kind: "buy", usd: 300, rate: 1477.5, iqd: 443250, time: "21:47" },
  { kind: "buy", usd: 300, rate: 1477.5, iqd: 443250, time: "21:54" },
  { kind: "buy", usd: 400, rate: 1477.5, iqd: 591000, time: "22:03" },
  { kind: "buy", usd: 800, rate: 1477.5, iqd: 1182000, time: "22:52" },
  { kind: "buy", usd: 100, rate: 1477.5, iqd: 147750, time: "22:55" },
  { kind: "sell", usd: 1000, rate: 1479, iqd: 1479000, time: "09:01" },
  { kind: "sell", usd: 500, rate: 1478.5, iqd: 739250, time: "10:50" },
  { kind: "sell", usd: 8035, rate: 1478.5, iqd: 11879747.5, time: "11:43" },
  { kind: "sell", usd: 1350, rate: 1478.5, iqd: 1995975, time: "12:02" },
  { kind: "sell", usd: 500, rate: 1478.5, iqd: 739250, time: "12:03" },
  { kind: "sell", usd: 700, rate: 1479.5, iqd: 1035650, time: "14:15" },
  { kind: "sell", usd: 300, rate: 1479.5, iqd: 443850, time: "14:15" },
  { kind: "sell", usd: 13518, rate: 1479.5, iqd: 19999881, time: "14:41" },
  { kind: "sell", usd: 300, rate: 1479, iqd: 443700, time: "16:05" },
  { kind: "sell", usd: 500, rate: 1479, iqd: 739500, time: "16:22" },
  { kind: "sell", usd: 300, rate: 1479, iqd: 443700, time: "21:16" },
  { kind: "sell", usd: 300, rate: 1479, iqd: 443700, time: "21:16" },
  { kind: "sell", usd: 100, rate: 1479, iqd: 147900, time: "21:17" },
  { kind: "sell", usd: 6761, rate: 1479, iqd: 9999519, time: "22:57" }
];

const initialState = {
  businessDate: todayDate,
  openingUsd: 8424,
  openingIqd: 42192269,
  lendings: [],
  records: importedExchangeRows.map((record) => ({
    id: crypto.randomUUID(),
    date: todayDate,
    customer: "",
    reference: "Imported from Excel",
    ...record
  }))
};

let state = loadState();
let activeKind = "buy";
let editingId = null;
state.records = state.records.map(record => ({ ...record, date: record.date || state.businessDate }));
state.businessDate = currentDate();
saveState();

const els = {
  entryForm: document.querySelector("#entryForm"),
  exchangeFields: document.querySelector("#exchangeFields"),
  serviceFields: document.querySelector("#serviceFields"),
  usdAmount: document.querySelector("#usdAmount"),
  rate: document.querySelector("#rate"),
  iqdAmount: document.querySelector("#iqdAmount"),
  serviceName: document.querySelector("#serviceName"),
  serviceDirection: document.querySelector("#serviceDirection"),
  serviceAmount: document.querySelector("#serviceAmount"),
  serviceFee: document.querySelector("#serviceFee"),
  customer: document.querySelector("#customer"),
  reference: document.querySelector("#reference"),
  actionDate: document.querySelector("#actionDate"),
  time: document.querySelector("#time"),
  exchangeBody: document.querySelector("#exchangeBody"),
  serviceBody: document.querySelector("#serviceBody"),
  searchInput: document.querySelector("#searchInput"),
  kindFilter: document.querySelector("#kindFilter"),
  minAmount: document.querySelector("#minAmount"),
  maxAmount: document.querySelector("#maxAmount"),
  fromDate: document.querySelector("#fromDate"),
  toDate: document.querySelector("#toDate"),
  editingHint: document.querySelector("#editingHint"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  lendingForm: document.querySelector("#lendingForm"), lendingBody: document.querySelector("#lendingBody"), lendingDirection: document.querySelector("#lendingDirection"), lendingListFilter: document.querySelector("#lendingListFilter"), lendingTotals: document.querySelector("#lendingTotals"), lendingPerson: document.querySelector("#lendingPerson"), lendingPhone: document.querySelector("#lendingPhone"), lendingUsd: document.querySelector("#lendingUsd"), lendingIqd: document.querySelector("#lendingIqd"), lendingFib: document.querySelector("#lendingFib"), lendingSuperQi: document.querySelector("#lendingSuperQi")
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(initialState);
    return { ...structuredClone(initialState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value, currency = "IQD") {
  const maximumFractionDigits = currency === "USD" ? 2 : 0;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(numberValue(value)) + (currency ? ` ${currency}` : "");
}

function setTodayTime() {
  els.actionDate.value = currentDate();
  els.time.value = new Date().toTimeString().slice(0, 5);
}

function calculateIqd() {
  const iqd = numberValue(els.usdAmount.value) * numberValue(els.rate.value);
  els.iqdAmount.value = iqd ? money(iqd, "IQD") : "";
}

function totals() {
  return state.records.reduce((acc, record) => {
    if (record.kind === "buy") {
      acc.boughtUsd += record.usd;
      acc.iqdPaid += record.iqd;
    }

    if (record.kind === "sell") {
      acc.soldUsd += record.usd;
      acc.iqdReceived += record.iqd;
    }

    if (record.kind === "service") {
      acc.serviceVolume += record.amount;
      acc.serviceProfit += record.fee;
      if (record.direction === "deposit") acc.iqdReceived += record.amount + record.fee;
      if (record.direction === "withdraw") acc.iqdPaid += record.amount;
    }

    return acc;
  }, {
    boughtUsd: 0,
    soldUsd: 0,
    iqdPaid: 0,
    iqdReceived: 0,
    serviceVolume: 0,
    serviceProfit: 0
  });
}

function renderSummary() {
  const t = totals();
  const usdBalance = numberValue(state.openingUsd) + t.boughtUsd - t.soldUsd;
  const iqdBalance = numberValue(state.openingIqd) + t.iqdReceived - t.iqdPaid;

  document.querySelector("#usdBalance").textContent = money(usdBalance, "USD");
  document.querySelector("#iqdBalance").textContent = money(iqdBalance, "IQD");
  document.querySelector("#serviceProfit").textContent = money(t.serviceProfit, "IQD");
  document.querySelector("#transactionCount").textContent = state.records.length;
  document.querySelector("#totalBought").textContent = money(t.boughtUsd, "USD");
  document.querySelector("#totalIqdPaid").textContent = money(t.iqdPaid, "IQD");
  document.querySelector("#totalSold").textContent = money(t.soldUsd, "USD");
  document.querySelector("#totalIqdReceived").textContent = money(t.iqdReceived, "IQD");
  document.querySelector("#totalServiceVolume").textContent = money(t.serviceVolume, "IQD");
}

function rowActions(record) {
  return `
    <div class="row-actions">
      <button class="row-button" type="button" data-edit="${record.id}">Edit</button>
      <button class="row-button" type="button" data-delete="${record.id}">Delete</button>
    </div>
  `;
}

function renderTables() {
  const search = els.searchInput ? els.searchInput.value.trim().toLowerCase() : "";
  const kind = els.kindFilter.value;
  const minAmount = Number(els.minAmount.value) || 0;
  const maxAmount = Number(els.maxAmount.value) || Infinity;
  const fromDate = els.fromDate.value;
  const toDate = els.toDate.value;
  const exchangeRecords = state.records.filter((record) => ["buy", "sell"].includes(record.kind));
  const serviceRecords = state.records.filter((record) => record.kind === "service");
  const visibleExchange = exchangeRecords.filter((record) => {
    const haystack = `${record.kind} ${record.date || state.businessDate} ${record.customer} ${record.reference} ${record.usd} ${record.rate}`.toLowerCase();
    return haystack.includes(search) && (!kind || record.kind === kind) && (Number(record.usd || record.amount || 0) >= minAmount) && (Number(record.usd || record.amount || 0) <= maxAmount) && (!fromDate || (record.date || "") >= fromDate) && (!toDate || (record.date || "") <= toDate);
  });

  els.exchangeBody.innerHTML = visibleExchange.length ? visibleExchange.map((record, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${record.kind === "buy" ? "کڕین" : "فرۆشتن"}</td>
      <td data-ltr="true">${money(record.usd, "USD")}</td>
      <td data-ltr="true">${money(record.rate, "")}</td>
      <td data-ltr="true">${money(record.iqd, "IQD")}</td>
      <td data-ltr="true">${record.date || state.businessDate || ""}</td>
      <td data-ltr="true">${record.time || ""}</td>
      <td>${escapeHtml(record.customer || "")}</td>
      <td>${escapeHtml(record.reference || "")}</td>
      <td>${rowActions(record)}</td>
    </tr>
  `).join("") : `<tr><td class="empty-row" colspan="10">هیچ تۆمارێک نییە</td></tr>`;

  els.serviceBody.innerHTML = serviceRecords.length ? serviceRecords.map((record, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(record.service || "")}</td>
      <td>${record.direction === "deposit" ? "Deposit" : "Withdraw"}</td>
      <td data-ltr="true">${money(record.amount, "IQD")}</td>
      <td data-ltr="true">${money(record.fee, "IQD")}</td>
      <td data-ltr="true">${record.date || state.businessDate || ""}</td>
      <td data-ltr="true">${record.time || ""}</td>
      <td>${escapeHtml(record.customer || "")}</td>
      <td>${escapeHtml(record.reference || "")}</td>
      <td>${rowActions(record)}</td>
    </tr>
  `).join("") : `<tr><td class="empty-row" colspan="10">هیچ خزمەتگوزارییەک تۆمار نەکراوە</td></tr>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function renderLendings() { if (els.lendingListFilter && !els.lendingListFilter.dataset.userChanged) els.lendingListFilter.value = ""; const filter = els.lendingListFilter?.value || ""; const filters={}; document.querySelectorAll("[data-lending-filter]").forEach(x=>filters[x.dataset.lendingFilter]=x.value.trim().toLowerCase()); const rows = (state.lendings || []).filter(r => (!filter || r.direction === filter) && (!filters.person || String(r.person).toLowerCase().includes(filters.person)) && (!filters.phone || String(r.phone).toLowerCase().includes(filters.phone)) && (!filters.usd || Number(r.usd) >= Number(filters.usd)) && (!filters.iqd || Number(r.iqd) >= Number(filters.iqd)) && (!filters.fib || Number(r.fib) >= Number(filters.fib)) && (!filters.superQi || Number(r.superQi) >= Number(filters.superQi))); const all = state.lendings || []; els.lendingTotals.innerHTML = "<strong>هەموو:</strong> "+all.length+" | <strong class=green-text>سەوز:</strong> "+all.filter(r=>r.direction==="green").length+" | <strong class=red-text>سور:</strong> "+all.filter(r=>r.direction==="red").length; els.lendingBody.innerHTML = rows.length ? rows.map((r,i) => `<tr class="lending-${r.direction}"><td>${escapeHtml(r.person)}</td><td>${escapeHtml(r.phone)}</td><td data-ltr="true">${money(r.usd,"USD")}</td><td data-ltr="true">${money(r.iqd,"IQD")}</td><td data-ltr="true">${money(r.fib,"FIB")}</td><td data-ltr="true">${money(r.superQi,"SuperQI")}</td><td>${r.direction === "green" ? "سەوز" : "سور"}</td><td><button class="row-button" data-lending-delete="${r.id}">سڕینەوە</button></td></tr>`).join("") : `<tr><td colspan="8" class="empty-row">هیچ تۆمارێک نییە</td></tr>`; }

function renderAll() {
  renderSummary();
  renderTables();
  renderLendings();
}

function setKind(kind) {
  activeKind = kind;
  async function addLending(event) { event.preventDefault(); const record={id:crypto.randomUUID(),person:els.lendingPerson.value.trim(),phone:els.lendingPhone.value.trim(),usd:numberValue(els.lendingUsd.value),iqd:numberValue(els.lendingIqd.value),fib:numberValue(els.lendingFib.value),superQi:numberValue(els.lendingSuperQi.value),direction:els.lendingDirection.value}; try { const res=await fetch("/api/lending",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(record)}); if(!res.ok) throw new Error(); state.lendings=state.lendings||[]; state.lendings.push(record); } catch { state.lendings=state.lendings||[]; state.lendings.push(record); saveState(); } els.lendingForm.reset(); renderLendings(); }

document.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.kind === kind);
  });
  els.exchangeFields.classList.toggle("is-hidden", kind === "service");
  els.serviceFields.classList.toggle("is-hidden", kind !== "service");
}

function resetForm() {
  editingId = null;
  els.entryForm.reset();
  els.editingHint.textContent = "نوێ";
  els.cancelEditBtn.classList.add("is-hidden");
  setTodayTime();
  calculateIqd();
}

function recordFromForm() {
  const base = {
    id: editingId || crypto.randomUUID(),
    kind: activeKind,
    date: els.actionDate.value || state.businessDate,
    time: els.time.value,
    customer: els.customer.value.trim() || "",
    reference: els.reference.value.trim() || ""
  };

  if (activeKind === "service") {
    return {
      ...base,
      service: els.serviceName.value,
      direction: els.serviceDirection.value,
      amount: numberValue(els.serviceAmount.value),
      fee: numberValue(els.serviceFee.value)
    };
  }

  const usd = numberValue(els.usdAmount.value);
  const rate = numberValue(els.rate.value);
  return {
    ...base,
    usd,
    rate,
    iqd: usd * rate
  };
}

function validateRecord(record) {
  if (record.kind === "service") return record.amount > 0;
  return record.usd > 0 && record.rate > 0;
}

function saveRecord(event) {
  event.preventDefault();
  syncCalendarDate();
  const record = recordFromForm();
  if (!validateRecord(record)) {
    alert("تکایە بڕ و نرخ بە دروستی بنووسە.");
    return;
  }

  if (editingId) {
    state.records = state.records.map((item) => item.id === editingId ? record : item);
  } else {
    state.records.push(record);
  }

  saveState();
  resetForm();
  renderAll();
void (async()=>{try{const res=await fetch("/api/lending");if(res.ok){const data=await res.json();state.lendings=data.records||[];renderLendings();}}catch{}})();
}

function editRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  editingId = id;
  setKind(record.kind);
  els.editingHint.textContent = "Editing";
  els.cancelEditBtn.classList.remove("is-hidden");
  els.customer.value = record.customer || "";
  els.reference.value = record.reference || "";
  els.actionDate.value = record.date || state.businessDate || "";
  els.time.value = record.time || "";

  if (record.kind === "service") {
    els.serviceName.value = record.service || "FIB";
    els.serviceDirection.value = record.direction || "deposit";
    els.serviceAmount.value = record.amount || "";
    els.serviceFee.value = record.fee || "";
  } else {
    els.usdAmount.value = record.usd || "";
    els.rate.value = record.rate || "";
    calculateIqd();
  }
}

function deleteRecord(id) {
  if (!confirm("Delete this record?")) return;
  state.records = state.records.filter((record) => record.id !== id);
  if (editingId === id) resetForm();
  saveState();
  renderAll();
void (async()=>{try{const res=await fetch("/api/lending");if(res.ok){const data=await res.json();state.lendings=data.records||[];renderLendings();}}catch{}})();
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportExcel() {
  const button = document.querySelector("#exportExcelBtn");
  button.disabled = true;
  try {
    const workbook = await window.buildCashWorkbook(state);
    const bytes = await workbook.xlsx.writeBuffer();
    download('Lawe-' + currentDate() + '.xlsx', bytes,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } catch (error) {
    alert("Excel export failed. Please retry. " + error.message);
  } finally {
    button.disabled = false;
  }
}

async function addLending(event) { event.preventDefault(); const record={id:crypto.randomUUID(),person:els.lendingPerson.value.trim(),phone:els.lendingPhone.value.trim(),usd:numberValue(els.lendingUsd.value),iqd:numberValue(els.lendingIqd.value),fib:numberValue(els.lendingFib.value),superQi:numberValue(els.lendingSuperQi.value),direction:els.lendingDirection.value}; try { const res=await fetch("/api/lending",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(record)}); if(!res.ok) throw new Error(); state.lendings=state.lendings||[]; state.lendings.push(record); } catch { state.lendings=state.lendings||[]; state.lendings.push(record); saveState(); } els.lendingForm.reset(); renderLendings(); }

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => setKind(button.dataset.kind));
});

[els.usdAmount, els.rate].forEach((input) => input.addEventListener("input", calculateIqd));
els.entryForm.addEventListener("submit", saveRecord);
els.lendingForm.addEventListener("submit", addLending); els.lendingListFilter?.addEventListener("change", ()=>{els.lendingListFilter.dataset.userChanged="1";renderLendings();}); document.querySelectorAll("[data-lending-filter]").forEach(x=>x.addEventListener("input",renderLendings));
els.lendingDirection.addEventListener("change", () => els.lendingDirection.className = els.lendingDirection.value === "green" ? "direction-green" : "direction-red");
els.lendingDirection.className = "direction-green";
els.cancelEditBtn.addEventListener("click", resetForm);
if (els.searchInput) els.searchInput.addEventListener("input", renderTables);
els.kindFilter.addEventListener("input", renderTables);
els.minAmount.addEventListener("input", renderTables);
els.maxAmount.addEventListener("input", renderTables);
els.fromDate.addEventListener("input", renderTables);
els.toDate.addEventListener("input", renderTables);
document.querySelector("#exportExcelBtn").addEventListener("click", exportExcel);
const toggleExchangeBtn=document.querySelector("#toggleExchangeBtn"); const exchangeTable=document.querySelector("#exchangeBody")?.closest(".table-wrap"); exchangeTable?.classList.add("is-collapsed"); toggleExchangeBtn?.addEventListener("click",()=>{const collapsed=exchangeTable.classList.toggle("is-collapsed"); const open=!collapsed; toggleExchangeBtn.textContent=open?"شاردنەوەی تۆمارەکان":"پیشاندانی تۆمارەکان";});

function syncCalendarDate() {
  const nextDate = currentDate();
  if (state.businessDate === nextDate) return;
  const previousDate = state.businessDate;
  state.businessDate = nextDate;
  if (!editingId && (!els.actionDate.value || els.actionDate.value === previousDate)) {
    els.actionDate.value = nextDate;
    els.time.value = new Date().toTimeString().slice(0, 5);
  }
  saveState();
}

setInterval(syncCalendarDate, 1000);
window.addEventListener("focus", syncCalendarDate);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncCalendarDate();
});

document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) editRecord(editButton.dataset.edit);
  if (deleteButton) deleteRecord(deleteButton.dataset.delete);
  const lendingDelete = event.target.closest("[data-lending-delete]"); if (lendingDelete) { state.lendings = (state.lendings || []).filter(r => r.id !== lendingDelete.dataset.lendingDelete); saveState(); renderLendings(); }
});

setTodayTime();
renderAll();
void (async()=>{try{const res=await fetch("/api/lending");if(res.ok){const data=await res.json();state.lendings=data.records||[];renderLendings();}}catch{}})();




















