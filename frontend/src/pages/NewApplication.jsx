import React, { useState, useRef } from 'react';
import { 
  UploadCloud, CheckCircle2, AlertCircle, 
  RefreshCw, ArrowRight, FileSpreadsheet, Play, Download
} from 'lucide-react';
import { formatCurrency } from '../utils/masking';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../services/api';

const SAMPLE_CSV_RAW = `applicantId,name,age,employmentType,declaredMonthlyIncome,existingEMI,requestedLoanAmount,requestedTenureMonths,cibilScore,activeLoans,dpd,writeOffs,bounceCount,avgMonthlyBalance,monthlyCredits,mutualFunds,savings,expectedOutcome
APP101,Rahul Sharma,29,Salaried,80000,15000,800000,60,745,2,0,0,0,55000,80000,250000,75000,APPROVED (High CIBIL + Clean Repayment)
APP102,Priya Patel,33,Salaried,95000,28000,1200000,60,720,2,0,0,1,65000,95000,600000,120000,EXCEPTION_REQUIRED (FOIR 57.3% > 50% with ₹6L Mutual Funds Mitigant)
APP103,Amit Kumar,27,Salaried,55000,12000,500000,36,640,3,30,1,4,14000,45000,0,8000,REJECTED (Write-off Knockout + High Bounces)
APP104,Sneha Kulkarni,31,Salaried,120000,20000,1500000,60,780,1,0,0,0,90000,120000,850000,250000,APPROVED (Super-Prime Grade A Profile)
APP105,Vikram Malhotra,42,Self-Employed,150000,35000,2000000,84,720,4,0,0,1,110000,165000,1200000,400000,APPROVED (Self-Employed High Net Worth)
APP106,Ananya Roy,25,Salaried,50000,15000,800000,48,710,1,0,0,1,30000,50000,350000,60000,EXCEPTION_REQUIRED (FOIR 65.2% > 50% with ₹3.5L Asset Buffer)
APP107,Rajesh Verma,38,Salaried,65000,30000,800000,48,710,3,0,0,3,22000,60000,50000,15000,REJECTED (Excessive Cheque Bounces > 2)
APP108,Deepak Joshi,28,Salaried,22000,4000,300000,36,715,1,0,0,0,18000,22000,50000,20000,REJECTED (Income < ₹30000 Minimum Cutoff)
APP109,Meera Nair,35,Salaried,110000,22000,1200000,60,760,2,0,0,0,80000,110000,450000,150000,APPROVED (Prime Borrower Low FOIR)
APP110,Suresh Menon,45,Self-Employed,180000,65000,2500000,60,730,3,0,0,1,140000,200000,1500000,500000,EXCEPTION_REQUIRED (FOIR 66.6% > 50% with ₹15L Liquid Assets)`;

const NewApplication = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingIdx, setSubmittingIdx] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // CSV Ingestion States
  const [parsedCsvRows, setParsedCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const parseCsvText = (text, fileName = 'sample_loan_applications.csv') => {
    setIsParsing(true);
    setErrorMessage('');
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        setErrorMessage('CSV file is empty or missing data rows.');
        setIsParsing(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length - 1) {
          const rowObj = {};
          headers.forEach((h, idx) => {
            const rawVal = values[idx] || '';
            if (['age', 'declaredMonthlyIncome', 'existingEMI', 'requestedLoanAmount', 'requestedTenureMonths', 'cibilScore', 'activeLoans', 'dpd', 'writeOffs', 'bounceCount', 'avgMonthlyBalance', 'monthlyCredits', 'mutualFunds', 'savings'].includes(h)) {
              rowObj[h] = Number(rawVal) || 0;
            } else {
              rowObj[h] = rawVal;
            }
          });
          rows.push(rowObj);
        }
      }

      setParsedCsvRows(rows);
      setCsvFileName(fileName);
    } catch (err) {
      setErrorMessage('Failed to parse CSV formatting.');
    } finally {
      setIsParsing(false);
    }
  };

  // Parse Uploaded CSV
  const handleCsvFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      parseCsvText(e.target.result, file.name);
    };
    reader.readAsText(file);
  };

  // Run BRE for single row
  const handleApplySingle = async (row, idx) => {
    setErrorMessage('');
    setIsSubmitting(true);
    setSubmittingIdx(idx);
    try {
      const res = await applicationApi.apply(row);
      if (res.success && res.data) {
        navigate(`/applications/${res.data.applicationId || res.data._id}`);
      } else {
        setErrorMessage(res.message || 'Underwriting evaluation failed');
      }
    } catch (err) {
      console.error('Application Submission Error:', err);
      const detail = err.response?.data?.message || (err.message === 'Network Error' ? 'Network Error: Cannot connect to BRE backend at http://localhost:5000.' : err.message) || 'Failed to submit application to BRE backend.';
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
      setSubmittingIdx(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Loan Application Ingestion</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Import CSV batch application packages to execute automated BRE policy underwriting.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CSV Dropzone / Loader Section */}
      <div className="bg-[#111] border-2 border-dashed border-[#333] hover:border-gray-500 rounded-2xl p-10 text-center space-y-5 transition-all shadow-xl">
        <div className="mx-auto w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-2xl flex items-center justify-center text-gray-400">
          <FileSpreadsheet className="w-8 h-8 text-white animate-pulse" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-white">Upload Loan Applications CSV Package</h3>
          <p className="text-xs text-gray-400 max-w-lg mx-auto mt-1.5 leading-relaxed">
            Select or drag-and-drop your application batch file to automatically parse borrower telemetries and run underwriting rules.
          </p>
        </div>

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={(e) => handleCsvFileUpload(e.target.files[0])}
          className="hidden"
        />

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-gray-200 transition-all inline-flex items-center gap-2 shadow-lg"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Browse CSV File</span>
          </button>

          <button
            type="button"
            onClick={() => parseCsvText(SAMPLE_CSV_RAW, 'sample_loan_applications.csv')}
            className="px-6 py-2.5 bg-[#1e1e1e] hover:bg-[#282828] border border-[#3a3a3a] text-gray-200 font-semibold rounded-xl text-xs transition-all inline-flex items-center gap-2 shadow-md"
          >
            <Play className="w-3.5 h-3.5 text-green-400" />
            <span>Load Default Dataset (10 Applications)</span>
          </button>
        </div>
      </div>

      {/* Parsed CSV Rows Table */}
      {parsedCsvRows.length > 0 && (
        <div className="bg-[#111] border border-[#333] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-300 space-y-3">
          <div className="px-6 py-4 border-b border-[#333] bg-[#161616] flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Parsed {parsedCsvRows.length} Loan Applications
                </h3>
                <p className="text-[11px] text-gray-400 font-mono">File: {csvFileName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setParsedCsvRows([])}
              className="px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#444] text-xs text-gray-300 rounded-lg transition-all"
            >
              Clear Batch
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#181818] text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-semibold border-b border-[#2a2a2a]">Applicant</th>
                  <th className="px-5 py-3.5 font-semibold border-b border-[#2a2a2a]">Income (₹)</th>
                  <th className="px-5 py-3.5 font-semibold border-b border-[#2a2a2a]">Requested Loan (₹)</th>
                  <th className="px-5 py-3.5 font-semibold border-b border-[#2a2a2a]">CIBIL</th>
                  <th className="px-5 py-3.5 font-semibold border-b border-[#2a2a2a]">Liquid Assets (₹)</th>
                  <th className="px-5 py-3.5 font-semibold border-b border-[#2a2a2a]">Expected Profile</th>
                  <th className="px-5 py-3.5 font-semibold border-b border-[#2a2a2a]">Underwriting Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222] text-xs">
                {parsedCsvRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#161616] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{row.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">{row.applicantId} • {row.employmentType}</div>
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">
                      {formatCurrency(row.declaredMonthlyIncome)}/mo
                    </td>
                    <td className="px-5 py-4 text-amber-400 font-bold">
                      {formatCurrency(row.requestedLoanAmount)}
                      <div className="text-[10px] text-gray-400 font-normal">{row.requestedTenureMonths} Months</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-white font-bold">
                      <span className={`px-2 py-0.5 rounded border ${row.cibilScore >= 730 ? 'bg-green-500/10 text-green-400 border-green-500/30' : row.cibilScore >= 680 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                        {row.cibilScore}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-300">
                      {formatCurrency((row.mutualFunds || 0) + (row.savings || 0))}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-[11px] max-w-xs leading-relaxed">
                      {row.expectedOutcome || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleApplySingle(row, idx)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-white text-black hover:bg-gray-200 font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1.5 shadow-md disabled:opacity-50"
                      >
                        {isSubmitting && submittingIdx === idx ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Evaluating...</span>
                          </>
                        ) : (
                          <>
                            <span>Run BRE</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewApplication;
