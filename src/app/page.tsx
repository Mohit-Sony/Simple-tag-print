"use client"
import { useState, useRef } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';

export default function Home() {
  const [inputs, setInputs] = useState<string[]>(Array(6).fill(''));
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const inchToPt = 72;
    const pageWidth = 2.5 * inchToPt; // 2.5 inch in points
    const pageHeight = 0.6 * inchToPt; // 0.6 inch in points

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const margin = 2;
    const fontSize = 11;

    const rowHeight = (pageHeight - margin * 2) / 3;
    const colWidth = (pageWidth - margin * 2) / 2;

    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;

      const x = margin + col * colWidth + 5;
      const y = pageHeight - margin - row * rowHeight - fontSize;

      page.drawText(inputs[i] || '', {
        x,
        y,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    // Auto print
    setTimeout(() => {
      iframeRef.current?.contentWindow?.print();
    }, 500);
  };

  return (
    <div className="p-8 font-sans">
    <h1 className="text-2xl font-semibold mb-6">Label Generator (2.5" x 0.6")</h1>
  
    <div className="grid grid-cols-2 gap-4 mb-6">
      {inputs.map((val, idx) => (
        <input
          key={idx}
          type="text"
          placeholder={`Label ${idx + 1}`}
          value={val}
          onChange={(e) => handleChange(idx, e.target.value)}
          className="p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      ))}
    </div>
  
    <button
      onClick={generatePDF}
      className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded text-lg transition"
    >
      Generate & Print PDF
    </button>
  
    {pdfUrl && (
      <div className="mt-8">
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