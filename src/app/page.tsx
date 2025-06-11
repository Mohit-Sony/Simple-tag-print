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

    const margin = 10;
    const fontSize = 10;

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
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    // Auto print
    setTimeout(() => {
      iframeRef.current?.contentWindow?.print();
    }, 500);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Label Generator (2.5" x 0.6")</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
        {inputs.map((val, idx) => (
          <input
            key={idx}
            type="text"
            placeholder={`Label ${idx + 1}`}
            value={val}
            onChange={(e) => handleChange(idx, e.target.value)}
            style={{ padding: '8px', fontSize: '14px' }}
          />
        ))}
      </div>
      <button onClick={generatePDF} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Generate & Print PDF
      </button>

      {pdfUrl && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Preview:</h3>
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            width="300"
            height="100"
            title="PDF Preview"
            style={{ border: '1px solid #ccc' }}
          />
        </div>
      )}
    </div>
  );
}