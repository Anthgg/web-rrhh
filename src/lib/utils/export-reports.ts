import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToExcel(data: any[], filename: string, sheetName = "Data") {
 const worksheet = XLSX.utils.json_to_sheet(data);
 const workbook = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
 XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(
 title: string,
 columns: string[],
 rows: any[][],
 filename: string,
 subtitle?: string
) {
 const doc = new jsPDF();
 
 // Title
 doc.setFontSize(16);
 doc.text(title, 14, 15);
 
 // Subtitle
 if (subtitle) {
 doc.setFontSize(10);
 doc.setTextColor(100);
 doc.text(subtitle, 14, 22);
 }

 // Table
 autoTable(doc, {
 head: [columns],
 body: rows,
 startY: subtitle ? 28 : 22,
 theme: "grid",
 headStyles: { fillColor: [79, 70, 229] }, // indigo-600
 styles: { fontSize: 8 },
 });

 doc.save(`${filename}.pdf`);
}
