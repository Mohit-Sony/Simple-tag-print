"use client";

import { useState, useRef } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { Trash2, Plus } from "lucide-react"; // npm install lucide-react

const encodeNumberToCode = (num: number): string => {
  const map = "CLUBHOUSEX";
  return String(num)
    .split("")
    .map((d) => map[parseInt(d)])
    .join("");
};

interface ItemInput {
  frontInput: string;
  purity: string;
  ab: string;
  number: string;
}

export default function LabelGenerator() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [items, setItems] = useState<ItemInput[]>([
    { frontInput: "104", purity: "18K", ab: "25.45", number: "123" },
  ]);

  const updateItem = (index: number, key: keyof ItemInput, value: string) => {
    const newItems = [...items];
    newItems[index][key] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { frontInput: "", purity: "18K", ab: "", number: "" }]);
  };

  const deleteItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const generateMultiplePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const HelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = HelveticaBold;

    const inchToPt = 72;
    const labelWidth = 2.5 * inchToPt;
    const labelHeight = 0.6 * inchToPt;
    const labelsPerRow = 1;
    const labelsPerColumn = 5;

    const pageWidth = labelsPerRow * labelWidth;
    const pageHeight = labelsPerColumn * labelHeight;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let labelIndex = 0;

    for (const item of items) {
      const { frontInput, purity, ab, number } = item;
      const encryptedNumber = encodeNumberToCode(parseInt(number));
      const labelText = `BCE${frontInput}`;

      const qrDataUrl = await QRCode.toDataURL(labelText);
      const qrImageBytes = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      const fontSize = 7;
      const qrDim = 40;
      const leftMargin = 10;

      const row = Math.floor(labelIndex / labelsPerRow);
      const col = labelIndex % labelsPerRow;

      const xOffset = col * labelWidth;
      const yOffset = pageHeight - (row + 1) * labelHeight;

      const lines = frontInput.includes("/") ? frontInput.split("/") : [frontInput];
      const ABC_X = xOffset + leftMargin + 3;
      const ABC_Y = !lines[1] ? yOffset + labelHeight - 20 : yOffset + labelHeight - 16 ;

      page.drawText("BCE", {
        x: ABC_X,
        y: ABC_Y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(lines[0], {
        x: ABC_X,
        y: ABC_Y - 8,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      if (lines[1]) {
        page.drawText(`& ${lines[1]}`, {
          x: ABC_X,
          y: ABC_Y - 15,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }

      const qrX = xOffset + labelWidth / 2 - qrDim - 10;
      const qrY = yOffset + labelHeight / 2 - qrDim / 2;

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrDim,
        height: qrDim,
      });

      const backX = xOffset + labelWidth / 2 + 15;
      const backStartY = yOffset - 1;

      page.drawText(`Purity: ${purity}`, {
        x: backX,
        y: backStartY + 28,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`G. Wt.: ${ab}`, {
        x: backX,
        y: backStartY + 20,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`${encryptedNumber}`, {
        x: backX,
        y: backStartY + 12,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      labelIndex++;
      if (labelIndex === labelsPerRow * labelsPerColumn) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        labelIndex = 0;
      }
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
              <th className="border px-3 py-2">Purity</th>
              <th className="border px-3 py-2">Weight</th>
              <th className="border px-3 py-2">Number</th>
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
                    value={item.frontInput}
                    onChange={(e) => updateItem(idx, "frontInput", e.target.value)}
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
                    value={item.ab}
                    step="0.01"
                    max="99.99"
                    onChange={(e) => updateItem(idx, "ab", e.target.value)}
                  />
                </td>
                <td className="border px-2">
                  <input
                    type="number"
                    className="w-full p-1 border rounded"
                    value={item.number}
                    onChange={(e) => updateItem(idx, "number", e.target.value)}
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