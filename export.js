/* Browser XLSX export. Formatting follows kasher lawe.xlsx. */
(() => {
  let library;
  async function excelLibrary() {
    if (window.ExcelJS) return window.ExcelJS;
    if (!library) library = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'vendor/exceljs.min.js';
      script.onload = () => resolve(window.ExcelJS);
      script.onerror = () => { library = null; script.remove(); reject(new Error('Cannot load Excel exporter')); };
      document.head.append(script);
    });
    return library;
  }
  const purple = 'FFAEA4F6', navy = 'FF002060', white = 'FFFFFFFF';
  const usdFormat = '"$"#,##0.00;[Red]-"$"#,##0.00';
  const iqdFormat = '#,##0.00" IQD";[Red]-#,##0.00" IQD"';
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  function decorate(cell, fill = white, color = 'FF000000', size = 14) {
    cell.font = { name: 'Cambria', size, bold: true, color: { argb: color } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'rtl' };
    const edge = { style: 'thin', color: { argb: 'FF8497B0' } };
    cell.border = { top: edge, bottom: edge, left: edge, right: edge };
  }
  function rowStyle(sheet, row, columns, fill, color, height = 35) {
    sheet.getRow(row).height = height;
    for (let col = 1; col <= columns; col++) decorate(sheet.getCell(row, col), fill, color);
  }
  function dateValue(value) {
    const [y, m, d] = String(value).split('-').map(Number);
    return Number.isFinite(y + m + d) ? new Date(Date.UTC(y, m - 1, d)) : null;
  }
  function timeValue(value) {
    const match = /^(\d{2}):(\d{2})$/.exec(value || '');
    return match ? (+match[1] * 60 + +match[2]) / 1440 : null;
  }
  function setupSheet(wb, name, widths, color = purple) {
    const sheet = wb.addWorksheet(name, {
      views: [{ rightToLeft: true, state: 'frozen', ySplit: 4, showGridLines: false }],
      properties: { tabColor: { argb: color } },
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });
    widths.forEach((width, i) => { sheet.getColumn(i + 1).width = width; });
    sheet.pageSetup.printTitlesRow = '1:4';
    return sheet;
  }
  function exchangeSheet(wb, name, kind, records, today) {
    const sheet = setupSheet(wb, name, [6, 25.71, 17.71, 30.28, 18, 16, 23, 30]);
    sheet.mergeCells('A1:D3');
    sheet.getCell('A1').value = 'Hatwan Company';
    decorate(sheet.getCell('A1'), purple, 'FF000000', 40);
    sheet.mergeCells('E1:H3');
    sheet.getCell('E1').value = today;
    sheet.getCell('E1').numFmt = 'yyyy-mm-dd';
    decorate(sheet.getCell('E1'), purple, 'FF000000', 20);
    [24.75, 15, 36].forEach((height, i) => { sheet.getRow(i + 1).height = height; });
    sheet.getRow(4).values = ['ژ', kind === 'buy' ? 'دۆلاری وەرگیراو' : 'دۆلاری پێدراو', kind === 'buy' ? 'نرخی کڕین' : 'نرخی فرۆشتن', kind === 'buy' ? 'دیناری پێدراو' : 'دیناری وەرگیراو', 'کات', 'ڕێکەوت', 'کڕیار', 'تێبینی'];
    rowStyle(sheet, 4, 8, purple, 'FF000000', 45);
    const items = records.filter(record => record.kind === kind);
    const count = Math.max(1, items.length);
    for (let index = 0; index < count; index++) {
      const row = index + 5, record = items[index];

      if (record) {
        sheet.getRow(row).values = [index + 1, num(record.usd), num(record.rate),
          { formula: 'B' + row + '*C' + row, result: num(record.usd) * num(record.rate) },
          timeValue(record.time), dateValue(record.date), record.customer || '', record.reference || ''];
      }
      rowStyle(sheet, row, 8, white, 'FF000000');
      sheet.getCell(row, 2).numFmt = usdFormat;
      sheet.getCell(row, 3).numFmt = '#,##0.00';
      sheet.getCell(row, 4).numFmt = iqdFormat;
      sheet.getCell(row, 5).numFmt = 'hh:mm AM/PM';
      sheet.getCell(row, 6).numFmt = 'yyyy-mm-dd';
    }
    const totalRow = count + 5;
    rowStyle(sheet, totalRow, 8, navy, white, 38);
    sheet.getCell(totalRow, 1).value = 'کۆ';
    const usd = items.reduce((sum, r) => sum + num(r.usd), 0);
    const iqd = items.reduce((sum, r) => sum + num(r.usd) * num(r.rate), 0);
    sheet.getCell(totalRow, 2).value = { formula: 'SUM(B5:B' + (totalRow - 1) + ')', result: usd };
    sheet.getCell(totalRow, 4).value = { formula: 'SUM(D5:D' + (totalRow - 1) + ')', result: iqd };
    sheet.getCell(totalRow, 2).numFmt = usdFormat;
    sheet.getCell(totalRow, 4).numFmt = iqdFormat;
    sheet.autoFilter = 'A4:H' + (totalRow - 1);
    sheet.pageSetup.printArea = 'A1:H' + totalRow;
    return { name, totalRow, usd, iqd };
  }
  function servicesSheet(wb, records, today) {
    const sheet = setupSheet(wb, 'خزمەتگوزاری', [6, 20, 18, 24, 22, 18, 16, 23, 30]);
    sheet.mergeCells('A1:F3');
    sheet.getCell('A1').value = 'Hatwan Company';
    decorate(sheet.getCell('A1'), purple, 'FF000000', 40);
    sheet.mergeCells('G1:I3');
    sheet.getCell('G1').value = today;
    sheet.getCell('G1').numFmt = 'yyyy-mm-dd';
    decorate(sheet.getCell('G1'), purple, 'FF000000', 20);
    [25, 15, 36].forEach((height, i) => { sheet.getRow(i + 1).height = height; });
    sheet.getRow(4).values = ['ژ', 'خزمەتگوزاری', 'کردار', 'بڕی پارە', 'کرێ / قازانج', 'کات', 'ڕێکەوت', 'کڕیار', 'تێبینی'];
    rowStyle(sheet, 4, 9, purple, 'FF000000', 45);
    const items = records.filter(r => r.kind === 'service');
    items.forEach((record, index) => {
      const row = index + 5;

      sheet.getRow(row).values = [index + 1, record.service || '', record.direction === 'deposit' ? 'Deposit' : 'Withdraw',
        num(record.amount), num(record.fee), timeValue(record.time), dateValue(record.date), record.customer || '', record.reference || ''];
      rowStyle(sheet, row, 9, white, 'FF000000');
      sheet.getCell(row, 4).numFmt = iqdFormat;
      sheet.getCell(row, 5).numFmt = iqdFormat;
      sheet.getCell(row, 6).numFmt = 'hh:mm AM/PM';
      sheet.getCell(row, 7).numFmt = 'yyyy-mm-dd';
    });
    const end = Math.max(5, items.length + 4), totalRow = end + 1;
    rowStyle(sheet, totalRow, 9, navy, white, 38);
    sheet.getCell(totalRow, 2).value = 'کۆی گشتی';
    for (const [col, prop] of [[4, 'amount'], [5, 'fee']]) {
      sheet.getCell(totalRow, col).value = { formula: 'SUM(' + String.fromCharCode(64 + col) + '5:' + String.fromCharCode(64 + col) + end + ')', result: items.reduce((n, r) => n + num(r[prop]), 0) };
      sheet.getCell(totalRow, col).numFmt = iqdFormat;
    }
    sheet.pageSetup.printArea = 'A1:I' + totalRow;
    return { items, end, totalRow };
  }
  window.buildCashWorkbook = async function(state) {
    const ExcelJS = await excelLibrary();
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Hatwan Company';
    wb.calcProperties.fullCalcOnLoad = true;
    const today = dateValue(state.businessDate);
    const buy = exchangeSheet(wb, 'كرين', 'buy', state.records, today);
    const sell = exchangeSheet(wb, 'فروشتن', 'sell', state.records, today);
    const summary = setupSheet(wb, 'خشتەی گشتی', [7.57, 26, 9.85, 25.71, 5.71, 30, 5.71, 16.14], navy);
    const services = servicesSheet(wb, state.records, today);
    summary.mergeCells('A1:H1');
    summary.getRow(1).height = 56;
    summary.getCell('A1').value = 'Hatwan Company';
    decorate(summary.getCell('A1'), navy, white, 40);
    summary.mergeCells('B2:G2');
    summary.getCell('B2').value = today;
    summary.getCell('B2').numFmt = 'yyyy-mm-dd';
    decorate(summary.getCell('B2'), white, 'FF000000', 14);
    summary.getRow(2).height = 28;
    const labels = {
      3: 'جورى دراوه كان', 4: 'بڕی بەردەست', 5: 'کڕینی گشتی', 6: 'فرۆشتنی گشتی',
      7: 'بڕی ماوە', 9: 'خزمەتگوزاری ـ وەرگیراو', 10: 'خزمەتگوزاری ـ پێدراو',
      11: 'قازانجی خزمەتگوزاری', 12: 'بڕی کۆتایی'
    };
    for (const [rowText, label] of Object.entries(labels)) {
      const row = Number(rowText);
      rowStyle(summary, row, 8, row === 3 ? 'FF8064A2' : row === 7 || row === 12 ? navy : row % 2 ? 'FFE4DFEC' : 'FFF2F2F2', row === 7 || row === 12 || row === 3 ? white : 'FF000000', 42);
      summary.getCell(row, 2).value = label;
      summary.getCell(row, 3).value = '←';
      summary.getCell(row, 4).numFmt = usdFormat;
      summary.getCell(row, 6).numFmt = iqdFormat;
    }
    summary.getCell('D3').value = 'دۆلار';
    summary.getCell('F3').value = 'دینار';
    summary.getCell('D4').value = num(state.openingUsd);
    summary.getCell('F4').value = num(state.openingIqd);
    const formula = (cell, text, result) => { summary.getCell(cell).value = { formula: text, result }; };
    formula('D5', "'كرين'!B" + buy.totalRow, buy.usd);
    formula('F5', "'فروشتن'!D" + sell.totalRow, sell.iqd);
    formula('D6', "'فروشتن'!B" + sell.totalRow, sell.usd);
    formula('F6', "'كرين'!D" + buy.totalRow, buy.iqd);
    const usdEnd = num(state.openingUsd) + buy.usd - sell.usd;
    const exchangeEnd = num(state.openingIqd) + sell.iqd - buy.iqd;
    formula('D7', 'D4+D5-D6', usdEnd);
    formula('F7', 'F4+F5-F6', exchangeEnd);
    const received = services.items.filter(r => r.direction === 'deposit').reduce((n, r) => n + num(r.amount) + num(r.fee), 0);
    const paid = services.items.filter(r => r.direction === 'withdraw').reduce((n, r) => n + num(r.amount), 0);
    const serviceRef = "'خزمەتگوزاری'!";
    const directions = serviceRef + 'C5:C' + services.end;
    formula('F9', 'SUMIF(' + directions + ',"Deposit",' + serviceRef + 'D5:D' + services.end + ')+SUMIF(' + directions + ',"Deposit",' + serviceRef + 'E5:E' + services.end + ')', received);
    formula('F10', 'SUMIF(' + directions + ',"Withdraw",' + serviceRef + 'D5:D' + services.end + ')', paid);
    formula('F11', serviceRef + 'E' + services.totalRow, services.items.reduce((n,r) => n + num(r.fee),0));
    formula('D12', 'D7', usdEnd);
    formula('F12', 'F7+F9-F10', exchangeEnd + received - paid);
    summary.pageSetup.printArea = 'A1:H12';
    return wb;
  };
})();
