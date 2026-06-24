import { useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function UploadWidget({ onDataLoaded, title = "Upload MIS Data" }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      if (onDataLoaded) onDataLoaded(data);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div 
        className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-colors ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
      >
        {file ? (
          <div className="flex flex-col items-center text-green-600 fade-in">
            <CheckCircle2 size={48} className="mb-2" />
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">Data loaded successfully</p>
            <button 
              onClick={() => setFile(null)} 
              className="mt-4 text-sm text-green-600 hover:text-green-700 underline"
            >
              Upload another file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <UploadCloud size={48} className="mb-3 text-green-500" />
            <p className="text-sm font-medium text-gray-600 mb-1">Drag and drop your Excel file here</p>
            <p className="text-xs text-gray-500 mb-4">Supports .xlsx, .xls, .csv</p>
            <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
              <FileSpreadsheet size={16} /> Browse Files
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
