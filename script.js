const STORAGE_KEY = "hatwan-cash-desk-v1";

function currentDate() {
  return new Date().toISOString().slice(0, 10);
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

const els = {
  businessDate: document.querySelector("#businessDate"),
  openingUsd: document.querySelector("#openingUsd"),
  openingIqd: document.querySelector("#openingIqd"),
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
  editingHint: document.querySelector("#editingHint"),
  cancelEditBtn: document.querySelector("#cancelEditBtn")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(initialState);

  try {
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
  els.actionDate.value = state.businessDate || currentDate();
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
  const search = els.searchInput.value.trim().toLowerCase();
  const exchangeRecords = state.records.filter((record) => ["buy", "sell"].includes(record.kind));
  const serviceRecords = state.records.filter((record) => record.kind === "service");
  const visibleExchange = exchangeRecords.filter((record) => {
    const haystack = `${record.kind} ${record.date || state.businessDate} ${record.customer} ${record.reference} ${record.usd} ${record.rate}`.toLowerCase();
    return haystack.includes(search);
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

function renderAll() {
  els.businessDate.value = state.businessDate;
  els.openingUsd.value = state.openingUsd;
  els.openingIqd.value = state.openingIqd;
  renderSummary();
  renderTables();
}

function setKind(kind) {
  activeKind = kind;
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
  saveState();
  renderAll();
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

function excelCell(value, type = "String") {
  const safeValue = escapeHtml(value ?? "");
  return `<Cell><Data ss:Type="${type}">${safeValue}</Data></Cell>`;
}

function excelRow(values) {
  return `<Row>${values.map((cell) => excelCell(cell.value, cell.type)).join("")}</Row>`;
}

function excelSheet(name, rows) {
  return `
    <Worksheet ss:Name="${escapeHtml(name)}">
      <Table>${rows.join("")}</Table>
    </Worksheet>
  `;
}

function exportExcel() {
  const t = totals();
  const summaryRows = [
    excelRow([
      { value: "Hatwan Company" },
      { value: "Daily Cash Desk" }
    ]),
    excelRow([{ value: "Business Date" }, { value: state.businessDate }]),
    excelRow([{ value: "Opening USD" }, { value: state.openingUsd, type: "Number" }]),
    excelRow([{ value: "Opening IQD" }, { value: state.openingIqd, type: "Number" }]),
    excelRow([{ value: "Total Bought USD" }, { value: t.boughtUsd, type: "Number" }]),
    excelRow([{ value: "IQD Paid" }, { value: t.iqdPaid, type: "Number" }]),
    excelRow([{ value: "Total Sold USD" }, { value: t.soldUsd, type: "Number" }]),
    excelRow([{ value: "IQD Received" }, { value: t.iqdReceived, type: "Number" }]),
    excelRow([{ value: "Service Volume" }, { value: t.serviceVolume, type: "Number" }]),
    excelRow([{ value: "Service Profit" }, { value: t.serviceProfit, type: "Number" }]),
    excelRow([{ value: "Final USD" }, { value: numberValue(state.openingUsd) + t.boughtUsd - t.soldUsd, type: "Number" }]),
    excelRow([{ value: "Final IQD" }, { value: numberValue(state.openingIqd) + t.iqdReceived - t.iqdPaid, type: "Number" }])
  ];

  const exchangeRows = [
    excelRow(["#", "Type", "Action Date", "Time", "USD", "Rate", "IQD", "Customer", "Reference"].map((value) => ({ value }))),
    ...state.records.filter((record) => ["buy", "sell"].includes(record.kind)).map((record, index) => excelRow([
      { value: index + 1, type: "Number" },
      { value: record.kind === "buy" ? "Buy" : "Sell" },
      { value: record.date || state.businessDate },
      { value: record.time || "" },
      { value: record.usd, type: "Number" },
      { value: record.rate, type: "Number" },
      { value: record.iqd, type: "Number" },
      { value: record.customer || "" },
      { value: record.reference || "" }
    ]))
  ];

  const serviceRows = [
    excelRow(["#", "Service", "Direction", "Action Date", "Time", "Amount", "Fee", "Customer", "Reference"].map((value) => ({ value }))),
    ...state.records.filter((record) => record.kind === "service").map((record, index) => excelRow([
      { value: index + 1, type: "Number" },
      { value: record.service || "" },
      { value: record.direction || "" },
      { value: record.date || state.businessDate },
      { value: record.time || "" },
      { value: record.amount, type: "Number" },
      { value: record.fee, type: "Number" },
      { value: record.customer || "" },
      { value: record.reference || "" }
    ]))
  ];

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${excelSheet("Summary", summaryRows)}
  ${excelSheet("Exchange", exchangeRows)}
  ${excelSheet("Services", serviceRows)}
</Workbook>`;

  download(`hatwan-${state.businessDate}.xls`, workbook, "application/vnd.ms-excel;charset=utf-8");
}

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => setKind(button.dataset.kind));
});

[els.usdAmount, els.rate].forEach((input) => input.addEventListener("input", calculateIqd));
els.entryForm.addEventListener("submit", saveRecord);
els.cancelEditBtn.addEventListener("click", resetForm);
els.searchInput.addEventListener("input", renderTables);
document.querySelector("#exportExcelBtn").addEventListener("click", exportExcel);

els.businessDate.addEventListener("change", () => {
  state.businessDate = els.businessDate.value;
  if (!editingId) els.actionDate.value = state.businessDate;
  saveState();
});

els.openingUsd.addEventListener("input", () => {
  state.openingUsd = numberValue(els.openingUsd.value);
  saveState();
  renderSummary();
});

els.openingIqd.addEventListener("input", () => {
  state.openingIqd = numberValue(els.openingIqd.value);
  saveState();
  renderSummary();
});

document.querySelector("#newDayBtn").addEventListener("click", () => {
  if (!confirm("Start a new empty day? Make a backup first if you need today's records.")) return;
  const t = totals();
  state = {
    businessDate: currentDate(),
    openingUsd: numberValue(state.openingUsd) + t.boughtUsd - t.soldUsd,
    openingIqd: numberValue(state.openingIqd) + t.iqdReceived - t.iqdPaid,
    records: []
  };
  saveState();
  resetForm();
  renderAll();
});

document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) editRecord(editButton.dataset.edit);
  if (deleteButton) deleteRecord(deleteButton.dataset.delete);
});

setTodayTime();
renderAll();
