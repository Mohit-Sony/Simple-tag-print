"use client";

import { useState, useRef } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { Trash2, Plus, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ItemInput {
  SKU: string;
  ITEM: string;
  "G.WT.": string | number;
  Purity: string;
  "24K": string | number;
  "No.": string | number;
}

function getCorrectJewelryName(item: string): string {
  const itemCorrectionMap: Record<string, string> = {
    "BAJU BAND": "Baju Band",
    "BANGLE": "Bangle",
    "BANGLE-4": "Bangle-4",
    "BANGLE-4PC": "Bangle-4",
    "BORLA": "Borla",
    "BRACELATE": "Bracelet",
    "BRACLATE": "Bracelet",
    "BROOCH": "Brooch",
    "Broouch": "Brooch",
    "C+ER": "C + Er",
    "CHOKKER": "Choker",
    "Chokker": "Choker",
    "EARRING": "Earring",
    "Earring": "Earring",
    "Earrings": "Earring",
    "MATHAPATTI": "Mathapatti",
    "Mathapatti": "Mathapatti",
    "N+ER": "N + Er",
    "N+Er": "N + Er",
    "NATH": "Nath",
    "NECKLACE": "Necklace",
    "Necklace": "Necklace",
    "P+E": "P + Er",
    "P+ER": "P + Er",
    "PANDANT": "Pendant",
    "Pandant": "Pendant",
    "RING": "Ring",
    "Ring": "Ring",
    "TIKA": "Tika"
  };

  return itemCorrectionMap[item.trim()] || item.trim();
}

export default function LabelGenerator() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [items, setItems] = useState<ItemInput[]>([
    {
      "SKU": "BCF0001",
      "ITEM": "NECKLACE",
      "G.WT.": 100.00,
      "Purity": "18K",
      "24K": 0,
      "No.": 27500
    }
  ]);

  const updateItem = (index: number, key: keyof ItemInput, value: string) => {
    const newItems = [...items];
    newItems[index][key] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      SKU: "",
      ITEM: "",
      "G.WT.": "",
      Purity: "18K",
      "24K": "",
      "No.": ""
    }]);
  };

  const deleteItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const parsedItems: ItemInput[] = jsonData.map((row: any) => ({
          SKU: row["SKU"] || row["itemCode"] || row["Item Code"] || "",
          ITEM: row["ITEM"] || row["Item"] || row["item"] || "",
          "G.WT.": row["G.WT."] || row["GrossWeight"] || row["Gross Weight"] || "",
          Purity: row["Purity"] || row["purity"] || "18K",
          "24K": row["24K"] || row["Derived_totalAmount"] || row["Total Amount"] || "",
          "No.": row["No."] || row["final_amt"] || row["Final Amount"] || row["NO."] || "",
        }));

        if (parsedItems.length > 0) {
          setItems(parsedItems);
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Error parsing file. Please check the format.");
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        SKU: "BCF0001",
        ITEM: "NECKLACE",
        "G.WT.": 100.00,
        Purity: "18K",
        "24K": 62.50,
        "No.": 27500
      },
      {
        SKU: "BCF0002",
        ITEM: "EARRING",
        "G.WT.": 15.50,
        Purity: "14K",
        "24K": 6.42,
        "No.": 8500
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet3");

    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 }, // SKU
      { wch: 15 }, // ITEM
      { wch: 12 }, // G.WT.
      { wch: 8 },  // Purity
      { wch: 12 }, // 24K
      { wch: 12 }, // No.
    ];

    XLSX.writeFile(workbook, "label_template.xlsx");
  };

  function toFixedNumber(input: string | number): number {
    const num = typeof input === "number" ? input : Number(input);
    if (isNaN(num)) {
      throw new Error("Invalid number input");
    }
    return parseFloat(num.toFixed(2));
  }

  const generateMultiplePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const HelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const finalfont = HelveticaBold;

    const inchToPt = 72;
    const labelWidth = 2.7 * inchToPt;
    const labelHeight = 0.6 * inchToPt;

    for (const item of items) {
      let { SKU, ITEM, "G.WT.": GrossWeight, Purity, "24K": goldWeight, "No.": finalAmount } = item;
      ITEM = getCorrectJewelryName(ITEM);
      const gwt = toFixedNumber(GrossWeight);
      const gold24K = toFixedNumber(goldWeight);
      const no = toFixedNumber(finalAmount);

      const page = pdfDoc.addPage([labelWidth, labelHeight]);

      const labelFontSize = 8;
      const valueFontSize = 8;
      const rightTopFontSize = 10;
      const largeFontSize = 16;
      const leftMargin = 8;
      const lineSpacing = 10;

      // Left section column positions
      const leftLabelX = leftMargin;
      const leftValueX = leftMargin + 42;

      // Right section position (starts around middle)
      const rightSectionX = labelWidth / 2 + 10;

      // Calculate vertical center for right section content
      const rightContentHeight = rightTopFontSize + largeFontSize + 5; // Total height of right content
      const rightStartY = (labelHeight - rightContentHeight) / 2 + rightContentHeight - 5;

      // ============ TAG FORMAT (matching image) ============
      let currentY = labelHeight - 10;

      // === LINE 1: SKU and 24K ===
      // Left: SKU label + value
      page.drawText(`${SKU}`, {
        x: leftLabelX,
        y: currentY,
        size: labelFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // Right: 24K label (vertically centered)
      page.drawText(`24K`, {
        x: rightSectionX,
        y: rightStartY,
        size: rightTopFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // Right: 24K value (vertically centered)
      page.drawText(`${gold24K}`, {
        x: rightSectionX + 35,
        y: rightStartY,
        size: rightTopFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      currentY -= lineSpacing;

      // === LINE 2: Item ===
      // Left: Item label
      page.drawText(`Item`, {
        x: leftLabelX,
        y: currentY,
        size: labelFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // Left: Item value
      page.drawText(`${ITEM}`, {
        x: leftValueX,
        y: currentY,
        size: valueFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      currentY -= lineSpacing;

      // === LINE 3: Gr Wt. ===
      // Left: Gr Wt. label
      page.drawText(`Gr Wt.`, {
        x: leftLabelX,
        y: currentY,
        size: labelFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // Left: Gr Wt. value
      page.drawText(`${gwt}`, {
        x: leftValueX,
        y: currentY,
        size: valueFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // Right: LARGE "NO. xxxxx" (vertically centered below 24K)
      page.drawText(`NO. ${no}`, {
        x: rightSectionX,
        y: rightStartY - rightTopFontSize - 5,
        size: largeFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      currentY -= lineSpacing;

      // === LINE 4: Purity ===
      // Left: Purity label
      page.drawText(`Purity`, {
        x: leftLabelX,
        y: currentY,
        size: labelFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // Left: Purity value
      page.drawText(`${Purity}`, {
        x: leftValueX,
        y: currentY,
        size: valueFontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    setTimeout(() => {
      iframeRef.current?.contentWindow?.print();
    }, 500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Jewellery Label Generator</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr>
              <th className="border px-3 py-2">#</th>
              <th className="border px-3 py-2">SKU</th>
              <th className="border px-3 py-2">ITEM</th>
              <th className="border px-3 py-2">G.WT.</th>
              <th className="border px-3 py-2">Purity</th>
              <th className="border px-3 py-2">24K</th>
              <th className="border px-3 py-2">No.</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="text-sm">
                <td className="border px-2 text-center">{idx + 1}</td>
                <td className="border px-2">
                  <input
                    type="text"
                    className="w-full p-1 border rounded"
                    value={item.SKU}
                    onChange={(e) => updateItem(idx, "SKU", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <input
                    type="text"
                    className="w-full p-1 border rounded"
                    value={item.ITEM}
                    onChange={(e) => updateItem(idx, "ITEM", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <input
                    type="number"
                    className="w-full p-1 border rounded"
                    value={item["G.WT."]}
                    step="0.01"
                    onChange={(e) => updateItem(idx, "G.WT.", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <select
                    className="w-full p-1 border rounded"
                    value={item.Purity}
                    onChange={(e) => updateItem(idx, "Purity", e.target.value)}
                  >
                    <option value="18K">18K</option>
                    <option value="14K">14K</option>
                  </select>
                </td>
                <td className="border px-2">
                  <input
                    type="number"
                    className="w-full p-1 border rounded"
                    value={item["24K"]}
                    onChange={(e) => updateItem(idx, "24K", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <input
                    type="number"
                    className="w-full p-1 border rounded"
                    value={item["No."]}
                    onChange={(e) => updateItem(idx, "No.", e.target.value)}
                  />
                </td>
                <td className="border text-center">
                  <button
                    onClick={() => deleteItem(idx)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <button
            onClick={addItem}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <Plus size={16} />
            Add Row
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            <Upload size={16} />
            Import CSV/Excel
          </button>
        </div>

        <button
          onClick={generateMultiplePDF}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Generate & Print PDF
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded border text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <div>
            <strong>Expected CSV/Excel Format (Sheet3 format):</strong>
            <p className="mt-1">Columns: SKU, ITEM, G.WT., Purity, 24K, No.</p>
            <p className="text-xs mt-1">Import the "Sheet3" format from your SAMPLE TAG.xlsx or use the template below.</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
          >
            <Download size={16} />
            Download Template
          </button>
        </div>
      </div>

      {pdfUrl && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Preview:</h3>
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            width="300"
            height="100"
            title="PDF Preview"
            className="border border-gray-300"
          />
        </div>
      )}
    </div>
  );
}