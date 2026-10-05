"use client";

import type { AccountBookPdfRow } from "./export-utils";
import { showToast } from "./feedback";

interface BookOptions {
  filename: string;
  month?: string;
  organization?: string;
  summary?: { opening?: number; received?: number; payment?: number; closing?: number; cashClosing?: number; bankClosing?: number };
  rows: AccountBookPdfRow[];
}

const WIDTH = 842, HEIGHT = 595, MARGIN = 32, SCALE = 3;
const widths = [78, 150, 216, 109, 75, 75, 75]; // Exactly 778pt: A4 minus margins.
const money = (value = 0) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
const font = (size: number, bold = false) => `${bold ? 600 : 400} ${size}px Arial, "Nirmala UI", sans-serif`;

function cleanReportText(value = "") {
  return value
    .replace(/\b(\d{3,6}\s*-\s*)?(BRAC\s+Bank|Dutch\s+Bangla\s+Bank|Dutch\s+Bangla|DBBL)(\s*-\s*[^,]*)?/gi, (_match, code = "") => `${code}Bank Account`)
    .replace(/\s+/g, " ")
    .trim();
}

// Measure the actual glyphs. Long identifiers break safely without losing characters.
function wrap(ctx: CanvasRenderingContext2D, value: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of value.trim().split(/\s+/u)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
    if (line) lines.push(line);
    line = "";
    for (const char of Array.from(word)) {
      if (ctx.measureText(line + char).width > width && line) { lines.push(line); line = ""; }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** Render the same high-resolution pages used in the downloaded PDF. */
export function renderAccountBookPages(options: BookOptions): HTMLCanvasElement[] {
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font(9);
  const rows = options.rows.map(row => {
    const values = [row.date, row.voucherNo, cleanReportText(row.particulars), cleanReportText(row.party),
      row.cashIn || row.cashOut ? money((row.cashIn || 0) + (row.cashOut || 0)) : "-",
      row.bankIn || row.bankOut ? money((row.bankIn || 0) + (row.bankOut || 0)) : "-",
      row.totalIn || row.totalOut ? money((row.totalIn || 0) + (row.totalOut || 0)) : "-"];
    const cells = values.map((value, i) => wrap(probe, value, widths[i] - 16));
    return { cells, height: Math.max(32, Math.max(...cells.map(c => c.length)) * 13 + 16) };
  });
  // Reserve the footer on every page. Split exceptionally long rows without discarding text.
  const pages: typeof rows[] = [[]];
  let used = 0;
  const capacity = 292;
  for (const row of rows) {
    let offset = 0;
    const count = Math.max(...row.cells.map(c => c.length));
    while (offset < count) {
      if (capacity - used < 32) { pages.push([]); used = 0; }
      const availableLines = Math.floor((capacity - used - 16) / 13);
      if (offset === 0 && row.height <= capacity && row.height > capacity - used) { pages.push([]); used = 0; continue; }
      const take = Math.min(count - offset, availableLines);
      const height = Math.max(32, take * 13 + 16);
      pages[pages.length - 1].push({ cells: row.cells.map(c => c.slice(offset, offset + take)), height });
      used += height; offset += take;
    }
  }
  if (used + 32 > capacity) pages.push([]);
  const totals = options.rows.reduce((sum, row) => [sum[0] + (row.cashIn || 0) + (row.cashOut || 0), sum[1] + (row.bankIn || 0) + (row.bankOut || 0), sum[2] + (row.totalIn || 0) + (row.totalOut || 0)], [0, 0, 0]);

  return pages.map((page, pageIndex) => {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * SCALE; canvas.height = HEIGHT * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const text = (value: string, x: number, y: number, size = 9, bold = false, color = "#202d3d") => {
      ctx.font = font(size, bold); ctx.fillStyle = color; ctx.fillText(value, x, y);
    };
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.strokeStyle = "#ccd3dc"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    text("ACCOUNT BOOK", MARGIN, 48, 21, true);
    ctx.font = font(11, true);
    const names = wrap(ctx, options.organization || "Cash & Bank Register", 560);
    names.forEach((name, i) => text(name, MARGIN, 68 + i * 13, 11, true));
    text(`Period: ${options.month || "All selected entries"}`, MARGIN, 94, 9);
    text("All amounts in Taka (BDT)", 671, 48, 9);
    text(`Page ${pageIndex + 1} of ${pages.length}`, 735, 68, 9);
    line(MARGIN, 105, WIDTH - MARGIN, 105);
    if (options.summary) {
      const cards = [["OPENING", options.summary.opening], ["RECEIVED", options.summary.received], ["PAYMENT", options.summary.payment], ["CLOSING", options.summary.closing]] as const;
      cards.forEach(([label, amount], i) => {
        const x = MARGIN + i * 198;
        ctx.fillStyle = "#f1f4f8"; ctx.fillRect(x, 116, 184, 44);
        text(label, x + 10, 131, 8, true, "#58677a");
        text(money(amount), x + 10, 149, 13, true);
      });
      text(`Cash closing: ${money(options.summary.cashClosing)}     |     Bank closing: ${money(options.summary.bankClosing)}`, MARGIN, 176, 9);
    }
    let y = 188;
    ctx.fillStyle = "#1b2c40"; ctx.fillRect(MARGIN, y, 778, 34);
    const headers = ["Date", "Voucher No.", "Particulars", "Account", "Cash", "Bank", "Total"];
    let x = MARGIN;
    headers.forEach((label, i) => {
      text(label, x + 8, y + (i >= 4 ? 14 : 21), 9, true, "#ffffff");
      if (i >= 4) text("Taka", x + 8, y + 27, 8, false, "#d4dfeb");
      x += widths[i];
    });
    y += 34;
    page.forEach((row, r) => {
      ctx.fillStyle = r % 2 ? "#f5f7fa" : "#ffffff";
      ctx.fillRect(MARGIN, y, 778, row.height);
      let cellX = MARGIN;
      row.cells.forEach((lines, i) => {
        ctx.save(); ctx.beginPath(); ctx.rect(cellX + 1, y + 1, widths[i] - 2, row.height - 2); ctx.clip();
        lines.forEach((value, l) => {
          ctx.font = font(9);
          text(value, i >= 4 ? cellX + widths[i] - 8 - ctx.measureText(value).width : cellX + 8, y + 17 + l * 13);
        });
        ctx.restore(); cellX += widths[i];
      });
      // Borders after fills: every row retains its full grid.
      let borderX = MARGIN;
      line(MARGIN, y, WIDTH - MARGIN, y);
      for (const width of [...widths, 0]) { line(borderX, y, borderX, y + row.height); borderX += width; }
      y += row.height; line(MARGIN, y, WIDTH - MARGIN, y);
    });
    if (pageIndex === pages.length - 1) {
      ctx.fillStyle = "#e8eef5"; ctx.fillRect(MARGIN, y, 778, 32);
      text("TOTAL MOVEMENT", MARGIN + 8, y + 20, 9, true);
      let end = MARGIN + widths.slice(0, 4).reduce((a, b) => a + b, 0);
      totals.forEach((value, i) => {
        end += widths[i + 4]; ctx.font = font(9, true);
        const formatted = money(value); text(formatted, end - 8 - ctx.measureText(formatted).width, y + 20, 9, true);
      });
    }
    line(MARGIN, 545, 205, 545); line(337, 545, 510, 545); line(637, 545, 810, 545);
    text("Prepared by", MARGIN, 559, 8); text("Checked by", 337, 559, 8); text("Approved by", 637, 559, 8);
    text("Cash and bank movements include internal transfers.", MARGIN, 581, 8, false, "#64748b");
    return canvas;
  });
}

// Embed 216-dpi pages, preserving browser-shaped text (including Bengali).
export function exportAccountBookToPdf(options: BookOptions) {
  const pages = renderAccountBookPages(options);
  const encoder = new TextEncoder();
  const objects: Uint8Array[] = [];
  const encode = (text: string) => encoder.encode(text);
  const join = (...parts: Uint8Array[]) => {
    const result = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0; parts.forEach(p => { result.set(p, offset); offset += p.length; }); return result;
  };
  objects.push(encode("<< /Type /Catalog /Pages 2 0 R >>"));
  objects.push(encode(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ")}] >>`));
  pages.forEach((canvas, i) => {
    const number = 3 + i * 3;
    const jpeg = Uint8Array.from(atob(canvas.toDataURL("image/jpeg", 0.97).split(",")[1]), c => c.charCodeAt(0));
    const content = `q ${WIDTH} 0 0 ${HEIGHT} 0 0 cm /Im0 Do Q`;
    objects.push(encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${WIDTH} ${HEIGHT}] /Resources << /XObject << /Im0 ${number + 2} 0 R >> >> /Contents ${number + 1} 0 R >>`));
    objects.push(encode(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    objects.push(join(encode(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`), jpeg, encode("\nendstream")));
  });
  const chunks = [encode("%PDF-1.4\n")];
  let offset = chunks[0].length;
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(offset); const chunk = join(encode(`${i + 1} 0 obj\n`), object, encode("\nendobj\n"));
    chunks.push(chunk); offset += chunk.length;
  });
  chunks.push(encode(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(o => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`));
  const bytes = join(...chunks);
  const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }));
  const link = document.createElement("a"); link.href = url;
  link.download = options.filename.replace(/[\\/:*?"<>|]/g, "-").replace(/\.pdf$/i, "") + ".pdf";
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  showToast("Account book PDF downloaded", "success");
}
