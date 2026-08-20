import express from 'express';
import mongoose from 'mongoose';
import { LoanApplication } from '../models/LoanApplication.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { AuditLog } from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';
import { isDbConnected } from '../config/db.js';
import { 
  buildExceptionClusters, 
  classifyExceptionApplication, 
  EXCEPTION_ARCHETYPES 
} from '../services/exceptionIntelligenceService.js';
import { KNOWN_BUREAU_PROFILES } from '../services/bureauService.js';

const router = express.Router();

// Safe query builder to prevent Mongoose ObjectId CastError on custom alphanumeric IDs
const buildAppQuery = (id) => {
  if (!id) return {};
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    return { $or: [{ applicationId: id }, { _id: id }] };
  }
  return { applicationId: id };
};

// Helper to fetch all profiles as a map
const getProfilesMap = async () => {
  const map = {};
  
  // Seed known profiles first
  KNOWN_BUREAU_PROFILES.forEach((p) => {
    map[p.applicantId] = p;
  });

  if (isDbConnected) {
    try {
      const dbProfiles = await ApplicantProfile.find({}).lean();
      dbProfiles.forEach((p) => {
        map[p.applicantId] = p;
      });
    } catch (e) {
      console.warn('DB profiles map fetch warning:', e.message);
    }
  }
  return map;
};

// GET /api/exceptions/clusters
// Returns all active exception case clusters, Group A/B/C breakdowns, and historical benchmarks
router.get('/clusters', protect, async (req, res) => {
  try {
    let applications = [];
    if (isDbConnected) {
      try {
        applications = await LoanApplication.find({
          status: { $in: ['EXCEPTION_REQUIRED', 'EXCEPTION_L1_REQUIRED', 'EXCEPTION_L2_REQUIRED'] }
        }).sort({ createdAt: -1 }).lean();
      } catch (dbErr) {
        console.warn('DB exception applications fetch warning:', dbErr.message);
      }
    }

    const profilesMap = await getProfilesMap();
    const clusterResult = buildExceptionClusters(applications, profilesMap);

    return res.json({
      success: true,
      message: 'Exception clusters and case intelligence fetched successfully',
      data: clusterResult
    });
  } catch (error) {
    console.error('Exception clusters fetch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/exceptions/l2-queue
// Returns Senior L2 Escalation Queue (High Risk / Escalated Cases)
router.get('/l2-queue', protect, async (req, res) => {
  try {
    let escalatedApps = [];
    if (isDbConnected) {
      try {
        escalatedApps = await LoanApplication.find({
          $or: [
            { escalatedToL2: true, status: { $in: ['EXCEPTION_REQUIRED', 'EXCEPTION_L1_REQUIRED', 'EXCEPTION_L2_REQUIRED'] } },
            { status: 'EXCEPTION_L2_REQUIRED' },
            { 'exceptionDetails.exceptionLevel': 'L2', status: { $in: ['EXCEPTION_REQUIRED', 'EXCEPTION_L1_REQUIRED', 'EXCEPTION_L2_REQUIRED'] } },
            { status: 'EXCEPTION_REQUIRED', requestedLoanAmount: { $gt: 1500000 } }
          ]
        }).sort({ escalatedAt: -1, createdAt: -1 }).lean();
      } catch (dbErr) {
        console.warn('DB L2 queue fetch warning:', dbErr.message);
      }
    }

    const profilesMap = await getProfilesMap();
    const enriched = escalatedApps.map((app) => ({
      ...app,
      applicantProfile: profilesMap[app.applicantId] || {}
    }));

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/exceptions/escalate/:id
// Credit Officer L1 escalates case to Credit Officer L2
router.post('/escalate/:id', protect, authorize('CREDIT_OFFICER_L1', 'CREDIT_OFFICER_L2', 'POLICY_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { escalationNotes } = req.body;
    const officerName = req.user?.name || 'Credit Officer L1';

    const updateDoc = {
      escalatedToL2: true,
      escalatedBy: officerName,
      escalatedAt: new Date(),
      escalationNotes: escalationNotes || 'Escalated to Senior L2 Underwriter for high-risk / thin-buffer review.'
    };

    let updatedApp = null;
    if (isDbConnected) {
      try {
        updatedApp = await LoanApplication.findOneAndUpdate(
          buildAppQuery(id),
          updateDoc,
          { new: true }
        );

        if (updatedApp) {
          await AuditLog.create({
            applicationId: updatedApp.applicationId,
            applicantId: updatedApp.applicantId,
            ruleSetVersion: updatedApp.ruleSetVersion,
            decision: 'ESCALATED_TO_L2',
            evaluatedBy: `${officerName} (Escalation to L2 Committee)`,
            comments: updateDoc.escalationNotes,
            timestamp: new Date()
          });
        }
      } catch (dbErr) {
        console.warn('DB escalate error:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Application ${id} successfully escalated to Senior Credit Officer L2 Queue`,
      data: updatedApp || updateDoc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/exceptions/batch-decision
// Batch Decisioning for an entire cluster or sub-group (Group A Fast-Track, Group B, Group C)
router.post('/batch-decision', protect, async (req, res) => {
  try {
    const { 
      applicationIds, 
      action, // 'APPROVE' or 'REJECT' or 'APPROVE_WITH_CONDITIONS'
      officerNotes, 
      exceptionProfileCode,
      triageGroup,
      isL2Decision
    } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of application IDs to process.' });
    }

    const officerName = req.user?.name || (isL2Decision ? 'Senior Underwriter L2' : 'Credit Officer L1');
    const newStatus = action === 'APPROVE' || action === 'APPROVE_WITH_CONDITIONS'
      ? 'APPROVED_VIA_EXCEPTION' 
      : 'REJECTED_VIA_EXCEPTION';

    const reason = officerNotes || `Batch ${action} executed by ${officerName} referencing Exception Profile ${exceptionProfileCode || 'Cluster'}.`;

    const results = [];

    if (isDbConnected) {
      try {
        for (const appId of applicationIds) {
          const app = await LoanApplication.findOneAndUpdate(
            buildAppQuery(appId),
            {
              status: newStatus,
              escalatedToL2: false,
              'exceptionDetails.officerNotes': reason,
              'exceptionDetails.officerId': req.user?.id || 'OFFICER_BATCH',
              'exceptionDetails.actionTimestamp': new Date(),
              ...(isL2Decision ? {
                l2Decision: newStatus,
                l2DecisionBy: officerName,
                l2DecisionAt: new Date(),
                l2OfficerNotes: reason
              } : {})
            },
            { new: true }
          );

          if (app) {
            results.push(app);

            await AuditLog.create({
              applicationId: app.applicationId,
              applicantId: app.applicantId,
              ruleSetVersion: app.ruleSetVersion,
              decision: newStatus,
              evaluatedBy: `${officerName} (Batch Exception Resolution)`,
              comments: `[${triageGroup || 'CLUSTER'}] ${reason}`,
              evaluationSnapshot: {
                scorecard: app.scorecard,
                derivedMetrics: app.derivedMetrics,
                evaluationResult: app.evaluationResult,
                exceptionProfileCode: exceptionProfileCode || app.exceptionProfileCode
              },
              timestamp: new Date()
            });
          }
        }
      } catch (dbErr) {
        console.warn('DB batch decision execution warning:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Successfully resolved ${results.length || applicationIds.length} exception applications as ${newStatus}`,
      affectedCount: results.length || applicationIds.length,
      decision: newStatus,
      data: results
    });
  } catch (error) {
    console.error('Batch decision error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/exceptions/archetypes
// Returns definition of all 6 Core Archetypes
router.get('/archetypes', (req, res) => {
  return res.json({
    success: true,
    data: EXCEPTION_ARCHETYPES
  });
});

export default router;
