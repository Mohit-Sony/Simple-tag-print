"use client";

import { useState, useRef } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { Trash2, Plus } from "lucide-react";

interface ItemInput {
  itemCode: string;
  Item: string;
  GrossWeight: string;
  purity: string;
  Derived_totalAmount: string;
  final_amt: string;
}

export default function LabelGenerator() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [items, setItems] = useState<ItemInput[]>([
    {
      itemCode: "BCE0002",
      Item: "BROOCH",
      GrossWeight: "15.65",
      purity: "18K",
      Derived_totalAmount: "217739.0",
      final_amt: "6221"
    },
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

  const generateMultiplePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const HelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const finalfont = HelveticaBold;

    const inchToPt = 72;
    const labelWidth = 2.7 * inchToPt;
    const labelHeight = 0.6 * inchToPt;

    for (const item of items) {
      const { itemCode, Item, GrossWeight, purity, final_amt } = item;

      const page = pdfDoc.addPage([labelWidth, labelHeight]);

      const fontSize = 6;
      const purityFontSize = fontSize ; // 2 points bigger for purity
      const leftMargin = 11;

      // === LEFT SIDE TEXT ===
      let leftX = leftMargin;
      let currentY = 30; // Starting Y position
      const lineSpacing = 7;

      // Item Code
      page.drawText(`${itemCode} |${purity}`, {
        x: leftX,
        y: currentY,
        size: fontSize+1 ,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineSpacing;

      // Gross Weight
      page.drawText(`G. Wt. :${GrossWeight} `, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineSpacing;

      // Item
      page.drawText(`Item: ${Item}`, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineSpacing;


      // Final Amount
      page.drawText(`No : ${final_amt}`, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });

      // === QR Code ===
      const qrDataUrl = await QRCode.toDataURL(itemCode);
      const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      const qrDim = 35;
      let qrX = labelWidth / 4 + 15; // Right side
      let qrY = labelHeight / 2 - qrDim / 2;

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrDim,
        height: qrDim,
      });

      // === Back SIDE TEXT ===
      leftX = labelWidth / 2 + 10
      currentY = 30
      // Item Code
      // Item Code
      // Item Code
      page.drawText(`${itemCode} |${purity}`, {
        x: leftX,
        y: currentY,
        size: fontSize+1 ,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineSpacing;

      // Gross Weight
      page.drawText(`G. Wt. :${GrossWeight} `, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineSpacing;

      // Item
      page.drawText(`Item: ${Item}`, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });
      currentY -= lineSpacing;


      // Final Amount
      page.drawText(`No : ${final_amt}`, {
        x: leftX,
        y: currentY,
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
      });



      qrX = labelWidth / 2 + 60; // Right side
      qrY = labelHeight / 2 - qrDim / 2;

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrDim,
        height: qrDim,
      });


    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
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
        <button
          onClick={addItem}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <Plus size={16} />
          Add Row
        </button>

        <button
          onClick={generateMultiplePDF}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Generate & Print PDF
        </button>
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