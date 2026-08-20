import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputPath = path.resolve('../../sample_bank_statement_hdfc.pdf');

const doc = new PDFDocument({ margin: 40, size: 'A4' });
doc.pipe(fs.createWriteStream(outputPath));

// ─── Colors ───────────────────────────────────────────────
const BLUE   = '#003580';
const GREEN  = '#1a7a3a';
const RED    = '#c0392b';
const GRAY   = '#555555';
const LGRAY  = '#aaaaaa';
const BGROW  = '#f0f4ff';

// ─── Helper: horizontal line ──────────────────────────────
const hLine = (y, color = '#cccccc', thick = 0.5) => {
  doc.moveTo(40, y).lineTo(555, y).lineWidth(thick).strokeColor(color).stroke();
};

// ─── HEADER ───────────────────────────────────────────────
doc.rect(40, 30, 515, 60).fill('#eef3ff').stroke('#c8d8f8');
doc.fontSize(20).fillColor(BLUE).font('Helvetica-Bold').text('HDFC BANK', 52, 42);
doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('We understand your world', 52, 64);
doc.fontSize(13).fillColor(BLUE).font('Helvetica-Bold').text('ACCOUNT STATEMENT', 350, 42, { align: 'right', width: 193 });
doc.fontSize(7.5).fillColor(GRAY).font('Helvetica').text('Period: 01-Feb-2025 to 31-Jul-2025 (6 Months)', 350, 60, { align: 'right', width: 193 });
doc.fontSize(7.5).fillColor(GRAY).text('Generated: 21-Aug-2025 | Branch: Noida Sector-18', 350, 70, { align: 'right', width: 193 });

// ─── ACCOUNT INFO BOX ────────────────────────────────────
let y = 102;
doc.rect(40, y, 515, 78).fill('#f5f8ff').stroke('#dce4f5');

doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('Account Holder:', 52, y + 8);
doc.fontSize(10).fillColor('#000').font('Helvetica-Bold').text('RAHUL SHARMA', 52, y + 18);
doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('Account No: XXXX XXXX 4821  |  Savings Account', 52, y + 32);
doc.fontSize(8).fillColor(GRAY).text('PAN Card: ABCPA1431F', 52, y + 44);
doc.fontSize(8).fillColor(GRAY).text('Date of Birth: 12-Mar-1996  (Age: 29 Years)', 52, y + 56);

doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('Employment:', 300, y + 8);
doc.fontSize(9).fillColor('#000').font('Helvetica-Bold').text('Salaried — TechCorp Pvt Ltd', 300, y + 18);
doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('IFSC: HDFC0003218', 300, y + 32);
doc.fontSize(8).fillColor(GRAY).text('Active Loans: 1  (Vehicle Loan — EMI ₹12,500/mo)', 300, y + 44);
doc.fontSize(8).fillColor(GREEN).font('Helvetica-Bold').text('CIBIL Score: 750  [PRIME]', 300, y + 56);

// ─── SUMMARY CARDS ───────────────────────────────────────
y = 192;
doc.fontSize(9).fillColor(BLUE).font('Helvetica-Bold').text('6-MONTH FINANCIAL SUMMARY', 40, y);
y += 12;

const cards = [
  { label: 'Avg Monthly Salary', val: '₹75,000' },
  { label: 'Avg Monthly Balance', val: '₹24,300' },
  { label: 'UPI Credits / Month', val: '₹68,000' },
  { label: 'Cheque Bounces', val: 'NIL' },
];
const cw = 124, ch = 40, gap = 5;
cards.forEach((c, i) => {
  const cx = 40 + i * (cw + gap);
  doc.rect(cx, y, cw, ch).fill('#e8eeff').stroke('#c5d3f5');
  doc.fontSize(7).fillColor(GRAY).font('Helvetica').text(c.label.toUpperCase(), cx + 6, y + 8, { width: cw - 12, align: 'center' });
  doc.fontSize(13).fillColor(c.val === 'NIL' ? GREEN : BLUE).font('Helvetica-Bold').text(c.val, cx + 6, y + 20, { width: cw - 12, align: 'center' });
});

// ─── TRANSACTIONS TABLE ───────────────────────────────────
y += ch + 16;
doc.fontSize(9).fillColor(BLUE).font('Helvetica-Bold').text('TRANSACTION DETAILS', 40, y);
y += 10;

// Table header
doc.rect(40, y, 515, 16).fill(BLUE);
const cols = [{ x: 42, w: 58, label: 'Date' }, { x: 100, w: 215, label: 'Description' }, { x: 315, w: 70, label: 'Ref No.' }, { x: 385, w: 58, label: 'Debit (₹)' }, { x: 443, w: 60, label: 'Credit (₹)' }, { x: 503, w: 50, label: 'Balance (₹)' }];
cols.forEach(c => {
  doc.fontSize(7).fillColor('#fff').font('Helvetica-Bold').text(c.label, c.x, y + 4, { width: c.w });
});
y += 16;

const txns = [
  { date: '01-Feb-25', desc: 'Opening Balance', ref: '—', debit: '', credit: '', bal: '22,450', hi: false },
  { date: '01-Feb-25', desc: 'NEFT/SALARY — TechCorp Pvt Ltd', ref: 'NEFT2502011', debit: '', credit: '75,000', bal: '97,450', hi: true },
  { date: '03-Feb-25', desc: 'UPI/PhonePe — Freelance Payment/Ravi', ref: 'UPI250203X', debit: '', credit: '8,500', bal: '1,05,950', hi: false },
  { date: '05-Feb-25', desc: 'NACH/EMI — Vehicle Loan HDFC', ref: 'NACH250205', debit: '12,500', credit: '', bal: '93,450', hi: false },
  { date: '07-Feb-25', desc: 'BBPS/Electricity — NPCL', ref: 'BBPS250207', debit: '1,840', credit: '', bal: '91,610', hi: false },
  { date: '10-Feb-25', desc: 'UPI/Rent — Housing Society', ref: 'UPI250210B', debit: '18,000', credit: '', bal: '73,610', hi: false },
  { date: '12-Feb-25', desc: 'BBPS/Mobile Postpaid — Airtel', ref: 'BBPS250212', debit: '499', credit: '', bal: '73,111', hi: false },
  { date: '15-Feb-25', desc: 'UPI/Client Freelance Payment', ref: 'UPI250215C', debit: '', credit: '12,000', bal: '85,111', hi: true },
  { date: '28-Feb-25', desc: 'Closing Balance — Feb 2025', ref: '—', debit: '', credit: '', bal: '24,100', hi: false },
  { date: '01-Mar-25', desc: 'NEFT/SALARY — TechCorp Pvt Ltd', ref: 'NEFT2503011', debit: '', credit: '75,000', bal: '99,100', hi: true },
  { date: '05-Mar-25', desc: 'NACH/EMI — Vehicle Loan HDFC', ref: 'NACH250305', debit: '12,500', credit: '', bal: '86,600', hi: false },
  { date: '06-Mar-25', desc: 'BBPS/Electricity — NPCL', ref: 'BBPS250306', debit: '1,620', credit: '', bal: '84,980', hi: false },
  { date: '10-Mar-25', desc: 'UPI/Rent — Housing Society', ref: 'UPI250310D', debit: '18,000', credit: '', bal: '66,980', hi: false },
  { date: '31-Mar-25', desc: 'Closing Balance — Mar 2025', ref: '—', debit: '', credit: '', bal: '25,200', hi: false },
  { date: '01-Apr-25', desc: 'NEFT/SALARY — TechCorp Pvt Ltd', ref: 'NEFT2504011', debit: '', credit: '75,000', bal: '1,00,200', hi: true },
  { date: '05-Apr-25', desc: 'NACH/EMI — Vehicle Loan HDFC', ref: 'NACH250405', debit: '12,500', credit: '', bal: '87,700', hi: false },
  { date: '30-Apr-25', desc: 'Closing Balance — Apr 2025', ref: '—', debit: '', credit: '', bal: '23,800', hi: false },
  { date: '01-May-25', desc: 'NEFT/SALARY — TechCorp Pvt Ltd', ref: 'NEFT2505011', debit: '', credit: '75,000', bal: '98,800', hi: true },
  { date: '31-May-25', desc: 'Closing Balance — May 2025', ref: '—', debit: '', credit: '', bal: '24,500', hi: false },
  { date: '01-Jun-25', desc: 'NEFT/SALARY — TechCorp Pvt Ltd', ref: 'NEFT2506011', debit: '', credit: '75,000', bal: '99,500', hi: true },
  { date: '30-Jun-25', desc: 'Closing Balance — Jun 2025', ref: '—', debit: '', credit: '', bal: '23,900', hi: false },
  { date: '01-Jul-25', desc: 'NEFT/SALARY — TechCorp Pvt Ltd', ref: 'NEFT2507011', debit: '', credit: '75,000', bal: '98,900', hi: true },
  { date: '31-Jul-25', desc: 'Closing Balance — Jul 2025', ref: '—', debit: '', credit: '', bal: '24,300', hi: false },
];

const rh = 14;
txns.forEach((t, idx) => {
  const bg = t.hi ? '#eef6ee' : idx % 2 === 0 ? '#ffffff' : BGROW;
  doc.rect(40, y, 515, rh).fill(bg).stroke('#e5e9f5');

  doc.fontSize(7).fillColor('#333').font('Helvetica').text(t.date, cols[0].x, y + 3, { width: cols[0].w });
  doc.text(t.desc, cols[1].x, y + 3, { width: cols[1].w });
  doc.fillColor(LGRAY).text(t.ref, cols[2].x, y + 3, { width: cols[2].w });
  if (t.debit) doc.fillColor(RED).font('Helvetica-Bold').text(t.debit, cols[3].x, y + 3, { width: cols[3].w, align: 'right' });
  if (t.credit) doc.fillColor(GREEN).font('Helvetica-Bold').text(t.credit, cols[4].x, y + 3, { width: cols[4].w, align: 'right' });
  doc.fillColor('#000').font('Helvetica').text(t.bal, cols[5].x, y + 3, { width: cols[5].w, align: 'right' });
  y += rh;
});

// ─── TOTALS ROW ───────────────────────────────────────────
y += 4;
doc.rect(40, y, 515, 16).fill('#e8eeff').stroke('#c8d8f8');
doc.fontSize(7.5).fillColor(BLUE).font('Helvetica-Bold')
  .text('TOTAL CREDITS: ₹5,08,000', 52, y + 4)
  .text('TOTAL DEBITS: ₹1,42,918', 200, y + 4)
  .text('AVG BALANCE: ₹24,300', 380, y + 4)
  .text('BOUNCES: NIL', 490, y + 4);

// ─── FOOTER ───────────────────────────────────────────────
y += 28;
hLine(y, '#cccccc', 0.5);
doc.fontSize(6.5).fillColor(LGRAY).font('Helvetica')
  .text('This is a computer-generated statement and does not require a signature. HDFC Bank Ltd. | CIN: L65920MH1994PLC080618', 40, y + 6, { align: 'center', width: 515 })
  .text('For disputes: 1800-258-3838 | www.hdfcbank.com | Registered Office: HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai - 400 013', 40, y + 16, { align: 'center', width: 515 });

doc.end();
console.log('✅ PDF generated at:', outputPath);
