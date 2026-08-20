import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Database, Save, RefreshCw, User, 
  CreditCard, CheckCircle2, AlertCircle, ArrowRight, Calculator 
} from 'lucide-react';
import { syntheticApi, applicationApi } from '../services/api';
import { formatCurrency } from '../utils/masking';
import { useNavigate } from 'react-router-dom';


const SyntheticSandbox = () => {
  const navigate = useNavigate();
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [availableApplicants, setAvailableApplicants] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [simulationLoanAmount, setSimulationLoanAmount] = useState(800000);
  const [simulationTenure, setSimulationTenure] = useState(60);

  // Fetch real applicant IDs from submitted applications
  const fetchAvailableApplicants = async () => {
    setIsLoadingApplicants(true);
    try {
      const res = await applicationApi.getAll();
      if (res.success && res.data?.length > 0) {
        // Get unique applicant IDs from submitted applications
        const ids = [...new Set(res.data.map(a => a.applicantId).filter(Boolean))];
        setAvailableApplicants(ids);
        if (ids.length > 0 && !selectedApplicantId) {
          setSelectedApplicantId(ids[0]);
        }
      } else {
        setAvailableApplicants([]);
      }
    } catch (err) {
      console.warn('Could not load applicant list:', err);
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  const fetchProfile = async (id) => {
    if (!id) return;
    setIsLoading(true);
    setSaveSuccess('');
    setErrorMessage('');
    try {
      const res = await syntheticApi.getProfile(id);
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        setProfile(null);
        setErrorMessage(`No profile found for applicant: ${id}`);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch applicant profile. Submit a loan first to create a profile.');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableApplicants();
  }, []);

  useEffect(() => {
    if (selectedApplicantId) {
      fetchProfile(selectedApplicantId);
    }
  }, [selectedApplicantId]);

  const handleFieldChange = (field, value) => {
    setSaveSuccess('');
    setProfile(prev => ({
      ...prev,
      [field]: field === 'name' || field === 'employmentType' || field === 'applicantId' 
        ? value 
        : Number(value) || 0
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess('');
    setErrorMessage('');
    try {
      const res = await syntheticApi.updateProfile(selectedApplicantId, profile);
      if (res.success) {
        setSaveSuccess(`Synthetic telemetry for ${selectedApplicantId} updated successfully in MongoDB.`);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update synthetic profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEvaluation = async () => {
    try {
      const payload = {
        ...profile,
        requestedLoanAmount: Number(simulationLoanAmount),
        requestedTenureMonths: Number(simulationTenure),
      };
      const res = await applicationApi.apply(payload);
      if (res.success && res.data) {
        navigate(`/applications/${res.data.applicationId || res.data._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to evaluate profile against BRE');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-amber-400" />
              <span>Synthetic Telemetry Sandbox</span>
            </h1>
            <span className="text-xs bg-[#222] border border-[#333] text-gray-300 font-mono px-2.5 py-1 rounded-full">
              Bureau & Banking Simulator
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            Inspect, simulate, and edit mock financial profile data (CIBIL, DPD, ITR, AMB) in MongoDB.
          </p>
        </div>

        {/* Dynamic Applicant Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {isLoadingApplicants ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading applicants...</span>
            </div>
          ) : availableApplicants.length === 0 ? (
            <span className="text-xs text-gray-500 italic">No applicants found — submit a loan application first</span>
          ) : (
            <select
              value={selectedApplicantId}
              onChange={(e) => setSelectedApplicantId(e.target.value)}
              className="bg-[#181818] border border-[#333] text-white text-xs font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-white transition-all"
            >
              {availableApplicants.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => fetchAvailableApplicants()}
            disabled={isLoadingApplicants}
            className="p-2.5 bg-[#161616] border border-[#333] hover:border-gray-500 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingApplicants ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading || !profile ? (
        <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="text-xs">Fetching synthetic profile data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bureau & Banking Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bureau Card */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white text-sm">Credit Bureau Telemetry (CIBIL / Experian)</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 uppercase font-semibold mb-1">CIBIL Score (300-900)</label>
                  <input
                    type="number"
                    value={profile.cibilScore}
                    onChange={(e) => handleFieldChange('cibilScore', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white font-mono font-bold rounded-lg p-2 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 uppercase font-semibold mb-1">Active Loans Count</label>
                  <input
                    type="number"
                    value={profile.activeLoans}
                    onChange={(e) => handleFieldChange('activeLoans', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white font-mono rounded-lg p-2 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 uppercase font-semibold mb-1">Days Past Due (DPD)</label>
                  <input
                    type="number"
                    value={profile.dpd}
                    onChange={(e) => handleFieldChange('dpd', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white font-mono rounded-lg p-2 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 uppercase font-semibold mb-1">Active Write-Offs</label>
                  <input
                    type="number"
                    value={profile.writeOffs}
                    onChange={(e) => handleFieldChange('writeOffs', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white font-mono rounded-lg p-2 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Banking & Assets Card */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
                <Database className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Banking & Liquid Asset Buffers</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 uppercase font-semibold mb-1">Avg Monthly Bal (AMB ₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={profile.avgMonthlyBalance}
                    onChange={(e) => handleFieldChange('avgMonthlyBalance', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-lg p-2 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 uppercase font-semibold mb-1">Cheque Bounces (6M)</label>
                  <input
                    type="number"
                    value={profile.bounceCount}
                    onChange={(e) => handleFieldChange('bounceCount', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white font-mono rounded-lg p-2 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 uppercase font-semibold mb-1">Mutual Funds Assets (₹)</label>
                  <input
                    type="number"
                    step="25000"
                    value={profile.mutualFunds}
                    onChange={(e) => handleFieldChange('mutualFunds', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-lg p-2 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 uppercase font-semibold mb-1">Savings Buffer (₹)</label>
                  <input
                    type="number"
                    step="10000"
                    value={profile.savings}
                    onChange={(e) => handleFieldChange('savings', e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white rounded-lg p-2 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Parameters + Action Footer */}
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222]">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Policy Simulation Parameters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-400 uppercase font-semibold mb-1">Simulation Loan Amount (₹)</label>
                <input
                  type="number"
                  step="50000"
                  value={simulationLoanAmount}
                  onChange={(e) => setSimulationLoanAmount(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-white font-bold text-amber-400 rounded-lg p-2 focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 uppercase font-semibold mb-1">Simulation Tenure (Months)</label>
                <select
                  value={simulationTenure}
                  onChange={(e) => setSimulationTenure(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-white rounded-lg p-2 focus:outline-none focus:border-white"
                >
                  {[12,24,36,48,60,84].map(m => <option key={m} value={m}>{m} Months</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-[#181818] hover:bg-[#252525] border border-[#333] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Profile Changes</span>
              </button>
              <button
                onClick={handleTestEvaluation}
                disabled={!profile}
                className="flex-1 py-3 px-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                <Calculator className="w-4 h-4" />
                <span>Simulate BRE Evaluation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyntheticSandbox;
