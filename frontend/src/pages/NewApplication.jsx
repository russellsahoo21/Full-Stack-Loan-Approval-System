import React, { useState } from 'react';
import { UploadCloud, FileJson, CheckCircle2, AlertCircle, ChevronRight, Calculator } from 'lucide-react';
import { maskPAN, maskMobile, maskAccountNumber, formatCurrency } from '../utils/masking';
import { useNavigate } from 'react-router-dom';

const NewApplication = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const handleFileUpload = (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    setTimeout(() => {
      setParsedData({
        applicant: {
          name: 'Rahul Sharma',
          pan: 'ABCDE1234F',
          mobile: '9876543210',
          accountNo: '0000111122223333',
        },
        metrics: {
          foir: 45,
          incomeTrend: 'Stable',
          avgMonthlyBalance: 85000,
          bounces6M: 0,
          assetValue: 1500000
        }
      });
      setIsUploading(false);
    }, 1500);
  };

  const handleEvaluate = () => {
    navigate('/applications/APP-987654');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Application Ingestion</h1>
        <p className="text-gray-400 mt-2">Upload financial documents or manually input data to run the Business Rule Engine.</p>
      </div>

      <div className="bg-[#111] rounded-xl shadow-sm border border-[#333] overflow-hidden mb-8">
        <div className="flex border-b border-[#333]">
          <button 
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'upload' ? 'bg-white text-black border-b-2 border-white' : 'text-gray-400 hover:bg-[#222]'}`}
            onClick={() => setActiveTab('upload')}
          >
            Bulk Upload (JSON/CSV)
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'manual' ? 'bg-white text-black border-b-2 border-white' : 'text-gray-400 hover:bg-[#222]'}`}
            onClick={() => setActiveTab('manual')}
          >
            Manual Entry Form
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'upload' ? (
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isUploading ? 'border-gray-500 bg-[#222]' : 'border-[#444] hover:border-gray-400 hover:bg-[#1a1a1a]'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileUpload}
            >
              <div className="flex flex-col items-center justify-center">
                {isUploading ? (
                  <div className="animate-pulse flex flex-col items-center">
                    <UploadCloud className="w-16 h-16 text-white mb-4 animate-bounce" />
                    <h3 className="text-lg font-semibold text-white">Normalizing Data...</h3>
                    <p className="text-gray-400 mt-2">Parsing CIBIL, Bank Statements, and ITRs.</p>
                  </div>
                ) : (
                  <>
                    <FileJson className="w-16 h-16 text-gray-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white">Drag & Drop Application Package</h3>
                    <p className="text-gray-400 mt-2 max-w-md mx-auto">
                      Upload a consolidated JSON or CSV containing the applicant's CIBIL summary, bank transaction history, and asset details.
                    </p>
                    <button 
                      onClick={handleFileUpload}
                      className="mt-6 px-6 py-2.5 bg-white border border-white rounded-md text-sm font-medium text-black hover:bg-gray-200 transition-colors shadow-sm"
                    >
                      Browse Files
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <AlertCircle className="w-12 h-12 mb-4 text-gray-600" />
              <p>Manual entry mode is available in the full version.</p>
              <p>Please use the Bulk Upload mock for this demo.</p>
            </div>
          )}
        </div>
      </div>

      {parsedData && (
        <div className="bg-[#111] rounded-xl shadow-lg border border-green-500 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-500/10 px-6 py-4 border-b border-green-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h2 className="text-lg font-bold text-green-500">Data Normalized Successfully</h2>
            </div>
            <span className="text-xs font-medium bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full">Ready for BRE</span>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Applicant Profile (Masked)</h3>
              <dl className="space-y-4">
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">Full Name</dt>
                  <dd className="text-sm font-medium text-white">{parsedData.applicant.name}</dd>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">PAN</dt>
                  <dd className="text-sm font-medium text-white tracking-widest">{maskPAN(parsedData.applicant.pan)}</dd>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">Mobile</dt>
                  <dd className="text-sm font-medium text-white">{maskMobile(parsedData.applicant.mobile)}</dd>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">Primary Account</dt>
                  <dd className="text-sm font-medium text-white">{maskAccountNumber(parsedData.applicant.accountNo)}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Extracted Key Metrics</h3>
              <dl className="space-y-4">
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">Calculated FOIR</dt>
                  <dd className="text-sm font-bold text-white">{parsedData.metrics.foir}%</dd>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">Avg Monthly Balance (6M)</dt>
                  <dd className="text-sm font-medium text-white">{formatCurrency(parsedData.metrics.avgMonthlyBalance)}</dd>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">Income Trend</dt>
                  <dd className="text-sm font-medium text-white">{parsedData.metrics.incomeTrend}</dd>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">Bounces (Last 6M)</dt>
                  <dd className="text-sm font-medium text-white">{parsedData.metrics.bounces6M}</dd>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-2">
                  <dt className="text-sm text-gray-400">Declared Asset Value</dt>
                  <dd className="text-sm font-medium text-white">{formatCurrency(parsedData.metrics.assetValue)}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a] px-6 py-4 border-t border-[#333] flex justify-end">
            <button 
              onClick={handleEvaluate}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition-colors shadow-sm"
            >
              <Calculator className="w-5 h-5" />
              Run Decision Engine
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewApplication;
