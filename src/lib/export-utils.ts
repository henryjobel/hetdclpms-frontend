"use client";

import * as XLSX from "xlsx";
import { showToast } from "@/lib/feedback";

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function cleanFilename(filename: string) {
  return filename.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").toLowerCase();
}

function cellValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : value;
}

export function exportRowsToXlsx<T>(options: {
  filename: string;
  sheetName: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const data = [
    options.columns.map((column) => column.header),
    ...options.rows.map((row) => options.columns.map((column) => cellValue(column.value(row)))),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet["!cols"] = options.columns.map((column) => ({ wch: Math.max(12, Math.min(32, column.header.length + 6)) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName.slice(0, 31) || "Export");
  XLSX.writeFile(workbook, cleanFilename(options.filename).replace(/\.xlsx$/i, "") + ".xlsx");
  showToast("Excel file downloaded", "success");
}

function pdfText(value: string | number | null | undefined) {
  return String(cellValue(value))
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncatePdfText(value: string | number | null | undefined, maxChars: number) {
  const text = String(cellValue(value)).replace(/\s+/g, " ").trim();
  return text.length > maxChars ? `${text.slice(0, Math.max(0, maxChars - 3))}...` : text;
}

function buildPdf(objects: string[]) {
  const header = "%PDF-1.4\n";
  const chunks = [header];
  const offsets = [0];
  let length = header.length;

  objects.forEach((object, index) => {
    offsets[index + 1] = length;
    const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
    chunks.push(chunk);
    length += chunk.length;
  });

  const xrefOffset = length;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  return new Blob([...chunks, xref], { type: "application/pdf" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = cleanFilename(filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportRowsToPdf<T>(options: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 32;
  const rowHeight = 18;
  const headerY = pageHeight - margin;
  const tableWidth = pageWidth - margin * 2;
  const colWidth = tableWidth / Math.max(1, options.columns.length);
  const maxCellChars = Math.max(8, Math.floor(colWidth / 4.8));
  const rowsPerPage = Math.max(1, Math.floor((pageHeight - 130) / rowHeight));
  const pages: T[][] = [];

  for (let i = 0; i < Math.max(1, options.rows.length); i += rowsPerPage) {
    pages.push(options.rows.slice(i, i + rowsPerPage));
  }

  const objects: string[] = [];
  const pageRefs: number[] = [];

  objects.push(""); // catalog
  objects.push(""); // pages
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageRows, pageIndex) => {
    const commands: string[] = [];
    commands.push("0.12 0.12 0.12 rg");
    commands.push(`BT /F1 16 Tf ${margin} ${headerY} Td (${pdfText(options.title)}) Tj ET`);
    commands.push(`BT /F1 8 Tf ${margin} ${headerY - 16} Td (${pdfText(options.subtitle ?? `Generated ${new Date().toLocaleString()}`)}) Tj ET`);
    commands.push(`BT /F1 8 Tf ${pageWidth - margin - 86} ${headerY - 16} Td (Page ${pageIndex + 1} of ${pages.length}) Tj ET`);

    const startY = headerY - 45;
    commands.push("0.92 0.94 0.97 rg");
    commands.push(`${margin} ${startY - 4} ${tableWidth} 18 re f`);
    commands.push("0.2 0.2 0.2 rg");
    options.columns.forEach((column, colIndex) => {
      commands.push(`BT /F1 7 Tf ${margin + colIndex * colWidth + 4} ${startY + 2} Td (${pdfText(truncatePdfText(column.header, maxCellChars))}) Tj ET`);
    });

    if (pageRows.length === 0) {
      commands.push(`BT /F1 9 Tf ${margin + 4} ${startY - rowHeight - 2} Td (No data found) Tj ET`);
    }

    pageRows.forEach((row, rowIndex) => {
      const y = startY - (rowIndex + 1) * rowHeight;
      if (rowIndex % 2 === 0) {
        commands.push("0.98 0.98 0.98 rg");
        commands.push(`${margin} ${y - 4} ${tableWidth} 16 re f`);
      }
      commands.push("0.1 0.1 0.1 rg");
      options.columns.forEach((column, colIndex) => {
        commands.push(`BT /F1 7 Tf ${margin + colIndex * colWidth + 4} ${y + 1} Td (${pdfText(truncatePdfText(column.value(row), maxCellChars))}) Tj ET`);
      });
    });

    const content = commands.join("\n");
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = objects.length + 2;
    pageRefs.push(pageObjectNumber);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`;

  downloadBlob(buildPdf(objects), cleanFilename(options.filename).replace(/\.pdf$/i, "") + ".pdf");
  showToast("PDF file downloaded", "success");
}
