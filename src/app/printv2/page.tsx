"use client";
import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
const purityOptions = ['18K', '14K'];


export default function Home() {
  const [frontInput, setFrontInput] = useState('234');
  const [purity, setPurity] = useState('18K');
  const [ab, setAb] = useState('');
  const [number, setNumber] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  function encodeNumberToCode(num: number): string {
    const map = ['T', 'R', 'A', 'V', 'E', 'L', 'S', 'Y', 'N', 'C'];
    return num
      .toString()
      .split('')
      .map(d => map[parseInt(d, 10)])
      .join('');
  }
  
  function decodeCodeToNumber(code: string): number {
    const reverseMap: Record<string, string> = {
      T: '0', R: '1', A: '2', V: '3', E: '4',
      L: '5', S: '6', Y: '7', N: '8', C: '9'
    };
    return parseInt(
      code
        .split('')
        .map(char => reverseMap[char])
        .join('')
    );
  }

  const generatePDF = async () => {
    let currentnumber = number
    let encryptedNumber = encodeNumberToCode(parseInt(number))
    const pdfDoc = await PDFDocument.create();
    const HelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const Helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const finalfont = HelveticaBold;
    const inchToPt = 72;
    const pageWidth = 2.5 * inchToPt;
    const pageHeight = 0.6 * inchToPt;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const fontSize = 11;
    const leftMargin = 10;

    // === BACK SIDE TEXT ===
    const lines = frontInput.includes('/') ? frontInput.split('/') : [frontInput];
    const labelText = `BCE${frontInput}`;
    const ABC_X = leftMargin+3;

    const ABC_Y = !lines[1] ? pageHeight - 20 : pageHeight-13;

    page.drawText('BCE', {
      x: ABC_X,
      y: ABC_Y,
      size: fontSize,
      font: finalfont,
      color: rgb(0, 0, 0),
    });

    // Split by slash if present

    // First line (always present)
    page.drawText(lines[0], {
    x: ABC_X,
    y: ABC_Y - 12,
    size: fontSize,
    font: finalfont,
    color: rgb(0, 0, 0),
    });

    // Second line (optional)
    if (lines[1]) {
    page.drawText(`& ${lines[1]}`, {
        x: ABC_X,
        y: ABC_Y - 24, // 12 points below the previous line
        size: fontSize,
        font: finalfont,
        color: rgb(0, 0, 0),
    });
    }

    // === QR Code ===
    const qrDataUrl = await QRCode.toDataURL(labelText);
    const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    const qrDim = 40;
    const qrX = pageWidth / 2 - qrDim - 10;
    const qrY = pageHeight / 2 - qrDim / 2;

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrDim,
      height: qrDim,
    });

    // === FRONT SIDE TEXT ===
    const backX = pageWidth / 2 + 15;
    const backStartY = -1;

    page.drawText(`Purity: ${purity}`, {
      x: backX,
      y: backStartY + 30,
      size: fontSize,
      font: finalfont,
      color: rgb(0, 0, 0),
    });

    page.drawText(`G. Wt.: ${ab}`, {
      x: backX,
      y: backStartY + 18,
      size: fontSize,
      font: finalfont,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${encryptedNumber}`, {
      x: backX,
      y: backStartY + 6,
      size: fontSize,
      font: finalfont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    setTimeout(() => {
      iframeRef.current?.contentWindow?.print();
    }, 500);
  };

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-semibold mb-6">Updated Tag Generator</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
      <div>
    <label htmlFor="item-code" className="block text-sm font-medium text-gray-700 mb-1">
      ITEM Code
    </label>
    <input
      type="text"
      id="item-code"
      placeholder="BCE 104"
      value={frontInput}
      onChange={(e) => setFrontInput(e.target.value)}
      className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
    <Listbox value={purity} onChange={setPurity}>
      <div className="relative">
        <Listbox.Button className="w-full relative cursor-default rounded-md border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <span className="block truncate">{purity}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
          </span>
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {purityOptions.map((option) => (
            <Listbox.Option
              key={option}
              value={option}
              className={({ active }) =>
                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                  active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                }`
              }
            >
              {({ selected }) => (
                <>
                  <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>{option}</span>
                  {selected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                      <CheckIcon className="h-5 w-5" />
                    </span>
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  </div>
  <div>
    <label htmlFor="ab" className="block text-sm font-medium text-gray-700 mb-1">
      G. Wt.
    </label>
    <input
      type="number"
      id="ab"
      step="0.01"
      max="99.99"
      placeholder="e.g., 25.45"
      value={ab}
      onChange={(e) => setAb(e.target.value)}
      className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
    />
  </div>

  {/* Number Input */}
  <div>
    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
      Number
    </label>
    <input
      type="number"
      id="number"
      placeholder="e.g., 123"
      value={number}
      onChange={(e) => setNumber(e.target.value)}
      className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
    />
  </div>
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