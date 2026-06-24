import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { useToastStore } from "../stores/toastStore";

export const exportToPDF = (elementId, filename = "dashboard-report.pdf") => {
  try {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(4, 120, 87);
    doc.text("KIMS Hospital Executive Report", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 20, 30);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);

    const element = document.getElementById(elementId);
    if (element) {
      let yPos = 50;

      doc.text("Key Performance Indicators:", 20, yPos);
      yPos += 10;

      const cards = element.querySelectorAll('[class*="rounded-\\[28px\\]"]');
      if (cards.length > 0) {
        cards.forEach((card) => {
          const titleEl = card.querySelector("h3");
          const valueEl = card.querySelector('[class*="text-2xl"]');
          if (titleEl && valueEl) {
            const title = titleEl.textContent?.trim() || "Metric";
            const value = valueEl.textContent?.trim() || "-";
            doc.setFontSize(11);
            doc.text(`  ${title}: ${value}`, 25, yPos);
            yPos += 8;
          }
        });
      }

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text("Department Summary:", 20, yPos + 10);

      const metrics = [
        ["Revenue", "Rs 32.79 Cr (MTD)"],
        ["Total Patients", "12,407 (MTD)"],
        ["Bed Occupancy", "86%"],
        ["Pharmacy Collection", "Rs 18.11 L"],
        ["Lab Tests", "1,245 (Today)"],
        ["Meal Production", "8,394 (Today)"],
      ];

      yPos += 20;
      metrics.forEach(([label, value]) => {
        doc.setFontSize(11);
        doc.text(`  ${label}: ${value}`, 25, yPos);
        yPos += 8;
      });
    }

    doc.save(filename);
    useToastStore.getState().success("PDF exported successfully");
  } catch (err) {
    useToastStore.getState().error("Failed to export PDF");
    console.error("PDF export error:", err);
  }
};

export const exportToExcel = (data, filename = "export.xlsx") => {
  try {
    if (!data || data.length === 0) {
      useToastStore.getState().warning("No data to export");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, filename);
    useToastStore.getState().success("Excel file exported successfully");
  } catch (err) {
    useToastStore.getState().error("Failed to export Excel");
    console.error("Excel export error:", err);
  }
};
