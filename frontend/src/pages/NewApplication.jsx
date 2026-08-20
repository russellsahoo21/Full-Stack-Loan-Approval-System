import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle2, AlertCircle, 
  RefreshCw, ArrowRight, FileSpreadsheet, Play, 
  CreditCard, ShieldCheck, User, Calculator, 
  Sparkles, Check, Lock, ChevronRight, Search, FileText, BadgePercent
} from 'lucide-react';
import { formatCurrency, maskPAN } from '../utils/masking';
import { useNavigate } from 'react-router-dom';
import { applicationApi, bureauApi } from '../services/api';

const SAMPLE_CSV_RAW = `applicantId,name,panNumber,aadhaarNumber,age,employmentType,declaredMonthlyIncome,existingEMI,requestedLoanAmount,requestedTenureMonths,cibilScore,activeLoans,dpd,writeOffs,bounceCount,avgMonthlyBalance,monthlyCredits,mutualFunds,savings,expectedOutcome
APP101,Rahul Sharma,ABCPA1431F,987654321098,23,Self-Employed,75000,11250,600000,60,750,1,0,0,0,45000,75000,250000,80000,APPROVED (Prime Score + Low FOIR)
APP102,Priya Patel,BEJPL1618S,985954191117,24,Salaried,61200,21420,1150000,60,716,3,0,0,1,30600,61200,525000,128000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP103,Amit Kumar,CHQPW1805F,984254061136,25,Salaried,46600,11650,700000,36,612,5,90,1,5,12000,46600,0,6000,REJECTED (Active Write-off / DPD Knockout)
APP104,Sneha Kulkarni,DKXPH1992S,982553931155,26,Salaried,91000,16380,1200000,60,738,2,0,0,0,50050,91000,386000,108000,APPROVED (Standard NBFC Policy Match)
APP105,Vikram Malhotra,ENGPS2179F,980853801174,27,Self-Employed,55000,18000,600000,48,710,2,0,0,3,18000,55000,40000,15000,REJECTED (Excessive Cheque Bounces > 2)
APP106,Ananya Roy,FQNPD2366S,979153671193,28,Salaried,82500,12375,1600000,60,755,3,0,0,0,49500,82500,325000,105000,APPROVED (Prime Score + Low FOIR)
APP107,Rajesh Verma,GTUPO2553F,977453541212,29,Salaried,67200,23520,1150000,60,721,2,0,0,1,33600,67200,650000,168000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP108,Deepak Joshi,HWDPZ2740S,975753411231,30,Salaried,50600,12650,850000,36,617,4,60,2,4,12000,50600,0,8500,REJECTED (Active Write-off / DPD Knockout)
APP109,Meera Nair,IZKPK2927F,974053281250,31,Self-Employed,101000,18180,1200000,60,743,1,0,0,0,55550,101000,446000,138000,APPROVED (Standard NBFC Policy Match)
APP110,Suresh Menon,JDRPV3114S,972353151269,32,Salaried,24000,3000,300000,36,725,1,0,0,0,15000,24000,30000,15000,REJECTED (Income < ₹30,000 Minimum Cutoff)
APP111,Aarav Gupta,KGYPG3301F,970653021288,33,Salaried,90000,13500,1400000,60,760,2,0,0,0,54000,90000,400000,130000,APPROVED (Prime Score + Low FOIR)
APP112,Neha Singh,LJHPR3488S,968952891307,34,Salaried,73200,25620,1150000,60,726,4,0,0,1,36600,73200,775000,208000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP113,Rohan Chopra,MMOPC3675F,967252761326,35,Self-Employed,54600,13650,400000,36,622,3,30,1,3,12000,54600,0,11000,REJECTED (Active Write-off / DPD Knockout)
APP114,Kavita Deshmukh,NPVPN3862S,965552631345,36,Salaried,111000,19980,1200000,60,748,2,0,0,0,61050,111000,506000,168000,APPROVED (Standard NBFC Policy Match)
APP115,Aditya Reddy,OSEPY4049F,963852501364,37,Salaried,55000,18000,600000,48,710,2,0,0,3,18000,55000,40000,15000,REJECTED (Excessive Cheque Bounces > 2)
APP116,Pooja Agarwal,PVLPJ4236S,962152371383,38,Salaried,97500,14625,1200000,60,765,1,0,0,0,58500,97500,475000,155000,APPROVED (Prime Score + Low FOIR)
APP117,Manish Mehta,QYSPU4423F,960452241402,39,Self-Employed,79200,27720,1150000,60,731,3,0,0,1,39600,79200,900000,248000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP118,Shreya Bhatia,RCZPF4610S,958752111421,40,Salaried,58600,14650,550000,36,627,5,90,2,5,12000,58600,0,13500,REJECTED (Active Write-off / DPD Knockout)
APP119,Siddharth Saxena,SFIPQ4797F,957051981440,41,Salaried,121000,21780,1200000,60,753,1,0,0,0,66550,121000,566000,198000,APPROVED (Standard NBFC Policy Match)
APP120,Divya Kapoor,TIPPB4984S,955351851459,42,Salaried,24000,3000,300000,36,725,1,0,0,0,15000,24000,30000,15000,REJECTED (Income < ₹30,000 Minimum Cutoff)
APP121,Gaurav Iyer,ULWPM5171F,953651721478,43,Self-Employed,105000,15750,1000000,60,770,3,0,0,0,63000,105000,550000,180000,APPROVED (Prime Score + Low FOIR)
APP122,Ritu Chatterjee,VOFPX5358S,951951591497,44,Salaried,85200,29820,1150000,60,736,2,0,0,1,42600,85200,1025000,288000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP123,Karan Mishra,WRMPI5545F,950251461516,45,Salaried,62600,15650,700000,36,632,4,60,1,4,12000,62600,0,16000,REJECTED (Active Write-off / DPD Knockout)
APP124,Tanvi Choudhury,XUTPT5732S,948551331535,46,Salaried,131000,23580,1200000,60,758,2,0,0,0,72050,131000,626000,228000,APPROVED (Standard NBFC Policy Match)
APP125,Varun Pandey,YXCPE5919F,946851201554,47,Self-Employed,55000,18000,600000,48,710,2,0,0,3,18000,55000,40000,15000,REJECTED (Excessive Cheque Bounces > 2)
APP126,Swati Gokhale,ZBJPP6106S,945151071573,48,Salaried,112500,16875,800000,60,775,2,0,0,0,67500,112500,625000,205000,APPROVED (Prime Score + Low FOIR)
APP127,Nikhil Shukla,AEQPA6293F,943450941592,49,Salaried,91200,31920,1150000,60,716,4,0,0,1,45600,91200,1150000,328000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP128,Simran Bansal,BHXPL6480S,941750811611,50,Salaried,66600,16650,850000,36,637,3,30,2,3,12000,66600,0,18500,REJECTED (Active Write-off / DPD Knockout)
APP129,Alok Tripathi,CKGPW6667F,940050681630,51,Self-Employed,141000,25380,1200000,60,763,1,0,0,0,77550,141000,686000,258000,APPROVED (Standard NBFC Policy Match)
APP130,Ishita Mahajan,DNNPH6854S,938350551649,52,Salaried,24000,3000,300000,36,725,1,0,0,0,15000,24000,30000,15000,REJECTED (Income < ₹30,000 Minimum Cutoff)
APP131,Harsh Pillai,EQUPS7041F,936650421668,53,Salaried,120000,18000,600000,60,780,1,0,0,0,72000,120000,700000,230000,APPROVED (Prime Score + Low FOIR)
APP132,Anjali Rao,FTDPD7228S,934950291687,54,Salaried,97200,34020,1150000,60,721,3,0,0,1,48600,97200,1275000,368000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP133,Kunal Dubey,GWKPO7415F,933250161706,55,Self-Employed,70600,17650,400000,36,642,5,90,1,5,12000,70600,0,21000,REJECTED (Active Write-off / DPD Knockout)
APP134,Rashmi Soni,HZRPZ7602S,931550031725,56,Salaried,151000,27180,1200000,60,738,2,0,0,0,83050,151000,746000,288000,APPROVED (Standard NBFC Policy Match)
APP135,Mayank Thakur,IDYPK7789F,929849901744,57,Salaried,55000,18000,600000,48,710,2,0,0,3,18000,55000,40000,15000,REJECTED (Excessive Cheque Bounces > 2)
APP136,Bhavna Garg,JGHPV7976S,928149771763,58,Salaried,127500,19125,1600000,60,785,3,0,0,0,76500,127500,775000,255000,APPROVED (Prime Score + Low FOIR)
APP137,Pranav Chauhan,KJOPG8163F,926449641782,59,Self-Employed,103200,36120,1150000,60,726,2,0,0,1,51600,103200,1400000,408000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP138,Payal Venkatesh,LMVPR8350S,924749511801,60,Salaried,74600,18650,550000,36,647,4,60,2,4,12000,74600,0,23500,REJECTED (Active Write-off / DPD Knockout)
APP139,Sachin Sen,MPEPC8537F,923049381820,23,Salaried,161000,28980,1200000,60,743,1,0,0,0,88550,161000,806000,318000,APPROVED (Standard NBFC Policy Match)
APP140,Deepika Grover,NSLPN8724S,921349251839,24,Salaried,24000,3000,300000,36,725,1,0,0,0,15000,24000,30000,15000,REJECTED (Income < ₹30,000 Minimum Cutoff)
APP141,Abhishek Kashyap,OVSPY8911F,919649121858,25,Self-Employed,135000,20250,1400000,60,790,2,0,0,0,81000,135000,850000,280000,APPROVED (Prime Score + Low FOIR)
APP142,Pallavi Chawla,PYZPJ9098S,917948991877,26,Salaried,109200,38220,1150000,60,731,4,0,0,1,54600,109200,1525000,448000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP143,Vishal Sood,QCIPU9285F,916248861896,27,Salaried,78600,19650,700000,36,652,3,30,1,3,12000,78600,0,26000,REJECTED (Active Write-off / DPD Knockout)
APP144,Preeti Kothari,RFPPF9472S,914548731915,28,Salaried,171000,30780,1200000,60,748,2,0,0,0,94050,171000,866000,348000,APPROVED (Standard NBFC Policy Match)
APP145,Yash Somani,SIWPQ9659F,912848601934,29,Self-Employed,55000,18000,600000,48,710,2,0,0,3,18000,55000,40000,15000,REJECTED (Excessive Cheque Bounces > 2)
APP146,Shruti Mittal,TLFPB9846S,911148471953,30,Salaried,142500,21375,1200000,60,750,1,0,0,0,85500,142500,925000,305000,APPROVED (Prime Score + Low FOIR)
APP147,Kartik Jain,UOMPM1033F,909448341972,31,Salaried,115200,40320,1150000,60,736,3,0,0,1,57600,115200,1650000,488000,EXCEPTION_REQUIRED (FOIR > 50% with High Asset Buffer)
APP148,Komal Bhattacharya,VRTPX1220S,907748211991,32,Salaried,82600,20650,850000,36,612,5,90,2,5,12000,82600,0,28500,REJECTED (Active Write-off / DPD Knockout)
APP149,Tushar Mukherjee,WUCPI1407F,906048082010,33,Self-Employed,181000,32580,1200000,60,753,1,0,0,0,99550,181000,926000,378000,APPROVED (Standard NBFC Policy Match)
APP150,Rupal Dutta,XXJPT1594S,904347952029,34,Salaried,24000,3000,300000,36,725,1,0,0,0,15000,24000,30000,15000,REJECTED (Income < ₹30,000 Minimum Cutoff)`;

const NewApplication = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Active View Mode: 'single' (KYC + PAN Gateway) vs 'batch' (CSV)
  const [viewMode, setViewMode] = useState('single');

  // Single Application Form State
  const [panNumber, setPanNumber] = useState('ABCPA1431F');
  const [aadhaarNumber, setAadhaarNumber] = useState('987654321098');
  const [isFetchingBureau, setIsFetchingBureau] = useState(false);
  const [bureauVerified, setBureauVerified] = useState(false);
  const [verifiedTelemetry, setVerifiedTelemetry] = useState(null);

  const [formData, setFormData] = useState({
    applicantId: 'APP001',
    name: 'Rahul Sharma',
    age: 29,
    employmentType: 'Salaried',
    declaredMonthlyIncome: 80000,
    existingEMI: 15000,
    requestedLoanAmount: 800000,
    requestedTenureMonths: 60,
  });

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingIdx, setSubmittingIdx] = useState(null);
  const [submissionStep, setSubmissionStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Helper for realistic asynchronous processing delay
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // CSV Ingestion States
  const [parsedCsvRows, setParsedCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Fetch Bureau Report via PAN / Aadhaar
  const handleFetchBureau = async (customPan, customName) => {
    const targetIdentifier = customPan || panNumber;
    if (!targetIdentifier || targetIdentifier.trim() === '') {
      setErrorMessage('Please enter a PAN Card or Aadhaar number to fetch credit bureau telemetry.');
      return;
    }

    setIsFetchingBureau(true);
    setErrorMessage('');
    setSuccessBanner('');

    try {
      const [res] = await Promise.all([
        bureauApi.fetchReport(targetIdentifier, customName || formData.name),
        delay(1200) // 1.2s realistic gateway handshake delay
      ]);

      if (res.success && res.data) {
        const b = res.data;
        setVerifiedTelemetry(b);
        setBureauVerified(true);
        setPanNumber(b.panNumber);
        if (b.aadhaarNumber) setAadhaarNumber(b.aadhaarNumber);

        // Auto-sync form with verified KYC data
        setFormData(prev => ({
          ...prev,
          applicantId: b.applicantId || prev.applicantId,
          name: b.name || prev.name,
          age: b.age || prev.age,
          employmentType: b.employmentType || prev.employmentType,
          declaredMonthlyIncome: b.declaredMonthlyIncome || prev.declaredMonthlyIncome,
          existingEMI: b.existingEMI !== undefined ? b.existingEMI : prev.existingEMI,
        }));

        setSuccessBanner(`✓ Credit Bureau report securely fetched from CIBIL / Experian Gateway for PAN ${b.panNumber}`);
      } else {
        setErrorMessage(res.message || 'Failed to fetch bureau report');
      }
    } catch (err) {
      console.error('Bureau Fetch Error:', err);
      const msg = err.response?.data?.message || 'Error communicating with Bureau Gateway';
      setErrorMessage(msg);
    } finally {
      setIsFetchingBureau(false);
    }
  };

  // Initial auto-fetch on mount for default demo persona
  useEffect(() => {
    handleFetchBureau('ABCPA1431F', 'Rahul Sharma');
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: ['name', 'employmentType', 'applicantId'].includes(field)
        ? value
        : Number(value) || 0
    }));
  };

  // Live Metrics Calculation
  const calculateLiveMetrics = () => {
    const r = 0.115 / 12; // 11.5% interest rate
    const n = formData.requestedTenureMonths || 60;
    const P = formData.requestedLoanAmount || 0;
    
    const proposedEMI = P > 0 
      ? Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
      : 0;

    const income = formData.declaredMonthlyIncome || 1;
    const totalEMI = (formData.existingEMI || 0) + proposedEMI;
    const foir = parseFloat(((totalEMI / income) * 100).toFixed(1));
    const lti = parseFloat((P / (income * 12)).toFixed(2));

    return { proposedEMI, foir, lti };
  };

  const liveMetrics = calculateLiveMetrics();

  // Submit Single Application to BRE with realistic 2.5s multi-stage underwriting progress
  const handleSubmitSingleApplication = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    setSubmissionStep('1/3: Binding verified KYC & Bureau telemetry...');

    try {
      const payload = {
        ...formData,
        panNumber: panNumber.trim().toUpperCase(),
        aadhaarNumber: aadhaarNumber.trim(),
        // Pass verified telemetry if available
        cibilScore: verifiedTelemetry?.cibilScore,
        activeLoans: verifiedTelemetry?.activeLoans,
        dpd: verifiedTelemetry?.dpd,
        writeOffs: verifiedTelemetry?.writeOffs,
        bounceCount: verifiedTelemetry?.bounceCount,
        avgMonthlyBalance: verifiedTelemetry?.avgMonthlyBalance,
        monthlyCredits: verifiedTelemetry?.monthlyCredits,
        mutualFunds: verifiedTelemetry?.mutualFunds,
        savings: verifiedTelemetry?.savings
      };

      // Stage 1: KYC & Telemetry verification (800ms)
      await delay(800);
      setSubmissionStep('2/3: Executing multi-tiered BRE policy checks (FOIR, CIBIL, Write-offs)...');

      // Stage 2: BRE Engine execution + realistic computation time (1100ms)
      const [res] = await Promise.all([
        applicationApi.apply(payload),
        delay(1100)
      ]);

      // Stage 3: Explainability scorecard generation & audit logging (700ms)
      setSubmissionStep('3/3: Generating explainability scorecard & immutable audit record...');
      await delay(700);

      if (res.success && res.data) {
        navigate(`/applications/${res.data.applicationId || res.data._id}`);
      } else {
        setErrorMessage(res.message || 'Underwriting evaluation failed');
      }
    } catch (err) {
      console.error('Application Submission Error:', err);
      const detail = err.response?.data?.message || err.message || 'Failed to submit application to BRE backend.';
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
      setSubmissionStep('');
    }
  };

  // CSV Ingestion Functions
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

  const handleCsvFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      parseCsvText(e.target.result, file.name);
    };
    reader.readAsText(file);
  };

  const handleApplyCsvRow = async (row, idx) => {
    setErrorMessage('');
    setIsSubmitting(true);
    setSubmittingIdx(idx);
    try {
      const [res] = await Promise.all([
        applicationApi.apply(row),
        delay(1500) // 1.5s realistic delay for batch item
      ]);

      if (res.success && res.data) {
        navigate(`/applications/${res.data.applicationId || res.data._id}`);
      } else {
        setErrorMessage(res.message || 'Underwriting evaluation failed');
      }
    } catch (err) {
      console.error('Application Submission Error:', err);
      const detail = err.response?.data?.message || err.message || 'Failed to submit application to BRE backend.';
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              New Loan Application Ingestion
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Mock KYC & CIBIL Bureau Gateway
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">
            Borrower identity is verified via PAN / Aadhaar to automatically pull tamper-proof CIBIL score & banking telemetry.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-[#181818] p-1 rounded-xl border border-[#333] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('single')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'single'
                ? 'bg-white text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KYC & Bureau Ingestion</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('batch')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'batch'
                ? 'bg-white text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Batch Ingestion</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successBanner && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* SINGLE APPLICATION INGESTION TAB */}
      {viewMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Mock Bureau & KYC Gateway Card */}
            <div className="bg-[#111] border border-[#333] rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-white">
                      Identity & Credit Bureau Verification Gateway
                    </h2>
                    <p className="text-[11px] text-gray-400">
                      NSDL / UIDAI & CIBIL Realtime Gateway (Tamper-Proof)
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  <Lock className="w-3 h-3" /> Auto-Verified
                </span>
              </div>

              {/* Identification Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>PAN Card Number</span>
                    <span className="text-[10px] text-gray-500 font-normal">Format: ABCDE1234F</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full bg-[#181818] border border-[#333] focus:border-white text-white font-mono font-bold rounded-xl px-3.5 py-2.5 text-sm uppercase tracking-wider focus:outline-none transition-all placeholder:text-gray-600"
                    />
                    <CreditCard className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Aadhaar Number (Linked)</span>
                    <span className="text-[10px] text-gray-500 font-normal">12 Digits</span>
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white font-mono rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Fetch Bureau Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-gray-400">
                  Click below to simulate real-time bureau pull from NSDL / CIBIL.
                </p>
                <button
                  type="button"
                  onClick={() => handleFetchBureau()}
                  disabled={isFetchingBureau}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isFetchingBureau ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Querying Bureau Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Fetch Verified Bureau Scorecard</span>
                    </>
                  )}
                </button>
              </div>

              {/* Verified Bureau Telemetry Card (Read-only / Secure) */}
              {verifiedTelemetry && (
                <div className="bg-[#161616] border border-blue-500/30 rounded-xl p-4 space-y-3.5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-xs font-bold text-white">
                        Verified Bureau Telemetry: {verifiedTelemetry.name} ({verifiedTelemetry.panNumber})
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Source: {verifiedTelemetry.bureauSource || 'CIBIL / Experian'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-2.5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block uppercase">Verified CIBIL Score</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-base font-extrabold font-mono ${
                          verifiedTelemetry.cibilScore >= 730 ? 'text-green-400' :
                          verifiedTelemetry.cibilScore >= 680 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {verifiedTelemetry.cibilScore}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">/ 900</span>
                      </div>
                      <span className="text-[9px] text-gray-400 block mt-0.5 truncate">{verifiedTelemetry.scoreCategory}</span>
                    </div>

                    <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-2.5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block uppercase">Write-Offs / Defaults</span>
                      <div className={`text-base font-extrabold font-mono mt-1 ${verifiedTelemetry.writeOffs > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {verifiedTelemetry.writeOffs} Records
                      </div>
                      <span className="text-[9px] text-gray-400 block mt-0.5">DPD: {verifiedTelemetry.dpd || 0} Days</span>
                    </div>

                    <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-2.5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block uppercase">Cheque Bounces (6M)</span>
                      <div className={`text-base font-extrabold font-mono mt-1 ${verifiedTelemetry.bounceCount > 2 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {verifiedTelemetry.bounceCount} Instances
                      </div>
                      <span className="text-[9px] text-gray-400 block mt-0.5">ECS Clearing</span>
                    </div>

                    <div className="bg-[#1c1c1c] border border-[#2a2a2a] p-2.5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block uppercase">Verified Liquid Buffer</span>
                      <div className="text-base font-extrabold text-amber-400 mt-1">
                        {formatCurrency((verifiedTelemetry.mutualFunds || 0) + (verifiedTelemetry.savings || 0))}
                      </div>
                      <span className="text-[9px] text-gray-400 block mt-0.5">MFs + Bank Savings</span>
                    </div>
                  </div>

                  {verifiedTelemetry.creditSummary && (
                    <p className="text-[11px] text-gray-300 italic bg-[#111] p-2.5 rounded-lg border border-[#222]">
                      "{verifiedTelemetry.creditSummary}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Loan Parameters & Applicant Profile */}
            <form onSubmit={handleSubmitSingleApplication} className="bg-[#111] border border-[#333] rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <User className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-semibold text-white">Loan Parameters & Financial Declarations</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Legal Name (as per PAN)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Applicant Internal ID</label>
                  <input
                    type="text"
                    value={formData.applicantId}
                    onChange={(e) => handleInputChange('applicantId', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white font-mono rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Age (Years)</label>
                  <input
                    type="number"
                    min="18"
                    max="75"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => handleInputChange('employmentType', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
                  >
                    <option value="Salaried">Salaried (Tier-1 NBFC)</option>
                    <option value="Self-Employed">Self-Employed Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Declared Monthly Income (₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.declaredMonthlyIncome}
                    onChange={(e) => handleInputChange('declaredMonthlyIncome', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white font-semibold rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Existing Monthly EMI (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.existingEMI}
                    onChange={(e) => handleInputChange('existingEMI', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Requested Loan Amount (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.requestedLoanAmount}
                    onChange={(e) => handleInputChange('requestedLoanAmount', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-amber-400 font-bold rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tenure (Months)</label>
                  <select
                    value={formData.requestedTenureMonths}
                    onChange={(e) => handleInputChange('requestedTenureMonths', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-white text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
                  >
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                    <option value={48}>48 Months (4 Years)</option>
                    <option value={60}>60 Months (5 Years)</option>
                    <option value={84}>84 Months (7 Years)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-white hover:bg-gray-200 text-black font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5 shadow-xl disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                      <span className="font-mono text-xs text-gray-900">{submissionStep || 'Evaluating Underwriting Policy...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Execute BRE Underwriting →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#333] rounded-2xl p-6 space-y-5 shadow-xl sticky top-6">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Live Derived Metrics Preview</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-[#181818] border border-[#2a2a2a] p-4 rounded-xl">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Proposed Monthly EMI</span>
                    <span className="text-[10px] text-gray-500 font-mono">@ 11.5% p.a.</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(liveMetrics.proposedEMI)}
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#2a2a2a] p-4 rounded-xl">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Fixed Obligation Ratio (FOIR)</span>
                    <span className={`text-[10px] font-semibold ${liveMetrics.foir <= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {liveMetrics.foir <= 50 ? 'Pass (≤ 50%)' : 'Exceeds 50% Limit'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {liveMetrics.foir}%
                  </div>
                  <div className="w-full bg-[#2a2a2a] h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full transition-all duration-300 ${liveMetrics.foir <= 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min(100, liveMetrics.foir)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#2a2a2a] p-4 rounded-xl">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Loan-to-Income (LTI)</span>
                    <span className="text-[10px] text-gray-500">Annual multiplier</span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {liveMetrics.lti}x <span className="text-xs font-normal text-gray-400">Annual Income</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#222] pt-4 text-xs text-gray-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Selected PAN:</span>
                  <span className="text-white font-mono font-bold">{panNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bureau Gateway:</span>
                  <span className="text-emerald-400 font-semibold">CIBIL Live Mock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV BATCH INGESTION TAB */}
      {viewMode === 'batch' && (
        <div className="space-y-6">
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
                <span>Load Default Dataset (50 Applications)</span>
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
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">{row.applicantId} • {row.panNumber || 'PAN N/A'}</div>
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
                            onClick={() => handleApplyCsvRow(row, idx)}
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
      )}
    </div>
  );
};

export default NewApplication;
