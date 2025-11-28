"use client";

import { useState, useRef } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { Trash2, Plus, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ItemInput {
  itemCode: string;
  Item: string;
  GrossWeight: string | number;
  purity: string;
  Derived_totalAmount: string | number;
  final_amt: string | number;
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
      "itemCode": "BCF0001",
      "Item": "NECKLACE",
      "GrossWeight": 100.00,
      "purity": "18K",
      "Derived_totalAmount": 0,
      "final_amt": 27500
    }
  ]);

  const updateItem = (index: number, key: keyof ItemInput, value: string) => {
    const newItems = [...items];
    newItems[index][key] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      itemCode: "",
      Item: "",
      GrossWeight: "",
      purity: "18K",
      Derived_totalAmount: "",
      final_amt: ""
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
          itemCode: row["itemCode"] || row["Item Code"] || row["SKU"] || "",
          Item: row["Item"] || row["item"] || "",
          GrossWeight: row["GrossWeight"] || row["Gross Weight"] || row["G.WT."] || "",
          purity: row["purity"] || row["Purity"] || "18K",
          Derived_totalAmount: row["Derived_totalAmount"] || row["Total Amount"] || "",
          final_amt: row["final_amt"] || row["Final Amount"] || row["NO."] || "",
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
        itemCode: "BCF0001",
        Item: "NECKLACE",
        GrossWeight: 100.00,
        purity: "18K",
        Derived_totalAmount: 25000,
        final_amt: 27500
      },
      {
        itemCode: "BCF0002",
        Item: "EARRING",
        GrossWeight: 15.50,
        purity: "14K",
        Derived_totalAmount: 8000,
        final_amt: 8500
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Labels");
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 }, // itemCode
      { wch: 15 }, // Item
      { wch: 12 }, // GrossWeight
      { wch: 8 },  // purity
      { wch: 18 }, // Derived_totalAmount
      { wch: 12 }, // final_amt
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
      let { itemCode, Item, GrossWeight, purity, final_amt } = item;
      Item = getCorrectJewelryName(Item);
      GrossWeight = toFixedNumber(GrossWeight);
      final_amt = toFixedNumber(final_amt);

      const page = pdfDoc.addPage([labelWidth, labelHeight]);

      const fontSize = 7;
      const leftMargin = 8;
      const lineSpacing = 10;
      const halfWidth = labelWidth / 2;

      // ============ LEFT SECTION ============
      let leftX = leftMargin;
      let currentY = labelHeight - 12;

      // SKU (Item Code)
      page.drawText(`SKU`, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${itemCode}`, {
        x: leftX + 28,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineSpacing;

      // G.WT. (Gross Weight)
      page.drawText(`G.WT.`, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${GrossWeight} GM`, {
        x: leftX + 28,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineSpacing;

      // NO. (Final Amount)
      page.drawText(`NO.`, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${final_amt}`, {
        x: leftX + 28,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // ============ RIGHT SECTION ============
      const rightSectionX = halfWidth + 5;

      // Purity and Item name on top line
      page.drawText(`Purity :-  ${purity}   ${Item}`, {
        x: rightSectionX,
        y: labelHeight - 12,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // Large "NO XXXXX" text
      const largeNoFontSize = 14;
      page.drawText(`NO ${final_amt}`, {
        x: rightSectionX,
        y: labelHeight - 30,
        size: largeNoFontSize,
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
              <th className="border px-3 py-2">Item Code</th>
              <th className="border px-3 py-2">Item</th>
              <th className="border px-3 py-2">Gross Weight</th>
              <th className="border px-3 py-2">Purity</th>
              <th className="border px-3 py-2">Total Amount</th>
              <th className="border px-3 py-2">Final Amount</th>
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
                    value={item.itemCode}
                    onChange={(e) => updateItem(idx, "itemCode", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <input
                    type="text"
                    className="w-full p-1 border rounded"
                    value={item.Item}
                    onChange={(e) => updateItem(idx, "Item", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <input
                    type="number"
                    className="w-full p-1 border rounded"
                    value={item.GrossWeight}
                    step="0.01"
                    onChange={(e) => updateItem(idx, "GrossWeight", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <select
                    className="w-full p-1 border rounded"
                    value={item.purity}
                    onChange={(e) => updateItem(idx, "purity", e.target.value)}
                  >
                    <option value="18K">18K</option>
                    <option value="14K">14K</option>
                  </select>
                </td>
                <td className="border px-2">
                  <input
                    type="number"
                    className="w-full p-1 border rounded"
                    value={item.Derived_totalAmount}
                    onChange={(e) => updateItem(idx, "Derived_totalAmount", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <input
                    type="number"
                    className="w-full p-1 border rounded"
                    value={item.final_amt}
                    onChange={(e) => updateItem(idx, "final_amt", e.target.value)}
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
            <strong>Expected CSV/Excel Format:</strong>
            <p className="mt-1">Columns: itemCode, Item, GrossWeight, purity, Derived_totalAmount, final_amt</p>
            <p className="text-xs mt-1">Alternative column names also accepted: Item Code, SKU, Gross Weight, G.WT., Purity, Total Amount, Final Amount, NO.</p>
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