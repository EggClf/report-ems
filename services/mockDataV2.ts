import {
  OverviewData,
  Hotspot,
  Intent,
  IntentDistribution,
  DecisionTreeTrace,
  PlannerOutput,
  ExecutionOutcome,
  IntentLabel,
  ExecutionLog,
  KPIDelta,
  Priority,
  ExecutionStatus
} from '../types-v2';
import { mlModelAPI, generateSampleFeatures } from './mlModelAPI';

// Helper function to generate random data
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(randomBetween(min, max));
const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Configuration flag to toggle between mock and real API
const USE_REAL_API = true; // Set to false to use mock data only

const regions = ['Hà Nam', 'Khánh Hòa'];
const intentLabels: IntentLabel[] = ['MRO', 'ES']; // 'QoS', 'TS' not supported yet
const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];

// 5G Cell ID format: eNB_ID + Cell_ID (e.g., 12345_1 for first cell of eNB 12345)
const generateCellId = () => `${randomInt(10000, 99999)}_${randomInt(1, 3)}`;
const generateClusterId = () => `Cluster_${randomInt(1, 50)}`;

// Mock Overview Data
export const getMockOverviewData = (): OverviewData => {
  return {
    loopStatus: randomChoice(['running', 'running', 'running', 'degraded'] as const),
    dataFreshness: {
      snapshotAge: randomInt(5, 45), // 5-45 seconds
      featureCoverage: randomBetween(92, 99.5)
    },
    activeIntents: regions.map(region => ({
      region,
      count: randomInt(3, 25),
      priority: randomChoice(priorities)
    })),
    alerts: [
      {
        id: 'alert_1',
        type: 'kpi_guardrail_violated' as const,
        message: 'RSRP degradation below -110 dBm threshold in Cell 10234_2',
        timestamp: new Date(Date.now() - randomInt(300, 3600) * 1000),
        severity: 'high' as const
      },
      {
        id: 'alert_2',
        type: 'action_failed' as const,
        message: 'Energy saving SSB configuration failed on Cluster_23',
        timestamp: new Date(Date.now() - randomInt(60, 600) * 1000),
        severity: 'medium' as const
      },
      {
        id: 'alert_3',
        type: 'policy_blocked' as const,
        message: 'MRO handover parameter change blocked during peak hours',
        timestamp: new Date(Date.now() - randomInt(120, 1800) * 1000),
        severity: 'low' as const
      }
    ].filter(() => Math.random() > 0.3) // Randomly show some alerts
  };
};

// Mock Hotspots Data
export const getMockHotspots = (): Hotspot[] => {
  const hotspots: Hotspot[] = [];

  for (let i = 0; i < 15; i++) {
    hotspots.push({
      id: `hotspot_${i}`,
      cellId: generateCellId(),
      cluster: generateClusterId(),
      region: randomChoice(regions),
      severityScore: randomBetween(0.3, 0.95),
      lat: randomBetween(10.5, 21.5), // Vietnam coordinates range
      lng: randomBetween(102, 109),
      reason: randomChoice([
        'PRB utilization >90% - Capacity limit',
        'Handover failure rate >5%',
        'RSRP <-105 dBm in serving area',
        'CQI degradation - Avg <7',
        'RACH attempt spike detected',
        'Low traffic - ES opportunity',
        '5QI violation on critical bearers',
        'Inter-frequency handover optimization needed'
      ]),
      intentLabel: randomChoice(intentLabels)
    });
  }

  // Sort by severity score descending
  return hotspots.sort((a, b) => b.severityScore - a.severityScore);
};

// Mock Intents Data
export const getMockIntents = (): Intent[] => {
  const intents: Intent[] = [];
  const now = Date.now();

  for (let i = 0; i < 20; i++) {
    const scopeType = randomChoice(['cell', 'cluster'] as const);
    intents.push({
      id: `intent_${i}`,
      intentLabel: randomChoice(intentLabels),
      scope: {
        type: scopeType,
        target: scopeType === 'cell' ? generateCellId() : generateClusterId()
      },
      confidence: randomBetween(0.65, 0.98),
      timestamp: new Date(now - randomInt(60, 7200) * 1000), // Last 2 hours
      region: randomChoice(regions),
      priority: randomChoice(priorities)
    });
  }

  return intents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Mock Intent Distribution over time
export const getMockIntentDistribution = (): IntentDistribution[] => {
  const distribution: IntentDistribution[] = [];
  const now = Date.now();

  // Last 24 hours, every hour
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600 * 1000);
    distribution.push({
      timestamp,
      intents: {
        'MRO': randomInt(2, 12),
        'ES': randomInt(5, 18)
        // 'QoS': randomInt(1, 10),  // Not supported yet
        // 'TS': randomInt(3, 15)     // Not supported yet
      }
    });
  }

  return distribution;
};

// Mock Decision Tree Trace
export const getMockDecisionTreeTrace = async (intentId: string, intentLabel?: IntentLabel): Promise<DecisionTreeTrace> => {
  // Determine model type from intent label (default to ES if not specified)
  const modelType = intentLabel === 'MRO' ? 'MRO' : 'ES';

  // Try to use real API if enabled
  if (USE_REAL_API) {
    try {
      const isHealthy = await mlModelAPI.healthCheck();
      if (isHealthy) {
        console.log('✓ Using real ML API for decision tree trace');
        const features = generateSampleFeatures(modelType);
        return await mlModelAPI.getDecisionTreeTrace(intentId, modelType, features);
      }
    } catch (error) {
      console.warn('⚠ ML API unavailable, falling back to mock data:', error);
    }
  }

  // Fallback to mock data
  console.log('Using mock decision tree trace');
  const features = [
    { name: 'PRB_Utilization', value: 87.5 },
    { name: 'Avg_CQI', value: 8.2 },
    { name: 'Drop_Rate', value: 1.8 },
    { name: 'Handover_Success_Rate', value: 96.3 },
    { name: 'RSRP_Mean', value: -85.2 },
    { name: 'Traffic_Volume_GB', value: 124.5 },
    { name: 'Active_Users', value: 432 },
    { name: 'Energy_Efficiency_Mbps_per_W', value: 2.3 }
  ];

  return {
    intentId,
    intentLabel: intentLabel || 'ES',
    path: [
      {
        nodeId: 0,
        condition: 'PRB_Utilization > threshold',
        threshold: 80.0,
        featureValue: 87.5,
        featureName: 'PRB_Utilization',
        passed: true
      },
      {
        nodeId: 3,
        condition: 'Active_Users > threshold',
        threshold: 400,
        featureValue: 432,
        featureName: 'Active_Users',
        passed: true
      },
      {
        nodeId: 7,
        condition: 'Drop_Rate < threshold',
        threshold: 2.0,
        featureValue: 1.8,
        featureName: 'Drop_Rate',
        passed: true
      },
      {
        nodeId: 11,
        condition: 'LEAF: ES',
        threshold: 0,
        featureValue: 0,
        featureName: 'LEAF',
        passed: true
      }
    ],
    topFeatures: [
      { name: 'PRB_Utilization', value: 87.5, importance: 0.42 },
      { name: 'Active_Users', value: 432, importance: 0.28 },
      { name: 'Traffic_Volume_GB', value: 124.5, importance: 0.18 }
    ],
    counterfactual: [
      {
        feature: 'PRB_Utilization',
        currentValue: 87.5,
        thresholdValue: 80.0,
        alternativeIntent: 'MRO'
      },
      {
        feature: 'Active_Users',
        currentValue: 432,
        thresholdValue: 400,
        alternativeIntent: 'MRO'
      }
    ],
    featureSnapshot: features.reduce((acc, f) => {
      acc[f.name] = f.value;
      return acc;
    }, {} as Record<string, number>)
  };
};

// Mock Planner Output
export const getMockPlannerOutput = (intentId: string): PlannerOutput => {
  return {
    planId: `plan_${Date.now()}`,
    intentId,
    useCase: randomChoice(['ES', 'MRO'] as const), // 'TS', 'QoS' not supported yet
    candidateActions: [
      {
        id: 'action_1',
        action: 'MLB_Offset_Adjustment',
        target: generateCellId(),
        expectedGain: 12.5,
        riskScore: 0.15,
        parameters: {
          neighbor_cells: [generateCellId(), generateCellId()],
          offset_db: 3,
          hysteresis: 2
        }
      },
      {
        id: 'action_2',
        action: 'CIO_Optimization',
        target: generateCellId(),
        expectedGain: 8.3,
        riskScore: 0.25,
        parameters: {
          target_neighbor: generateCellId(),
          cio_value: 4
        }
      },
      {
        id: 'action_3',
        action: 'TX_Power_Optimization',
        target: generateCellId(),
        expectedGain: 6.1,
        riskScore: 0.35,
        parameters: {
          power_delta_db: -1,
          apply_gradual: true
        }
      }
    ],
    constraints: [
      { name: 'QoS_5QI_Threshold', passed: true },
      { name: 'RLF_Rate_Guardrail', passed: true },
      { name: 'Peak_Hours_Policy', passed: true },
      { name: 'Neighbor_Capacity_Check', passed: false, reason: `Neighbor ${generateCellId()} at 82% PRB utilization` }
    ],
    timeline: {
      when: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      where: [generateCellId(), generateCellId()],
      durationMinutes: 30
    },
    multiVendorCompatibility: [
      { vendor: 'Ericsson', compatible: true, affectedParameters: ['cellIndividualOffsetEUtran', 'qOffsetCell'] },
      { vendor: 'Huawei', compatible: true, affectedParameters: ['CellIndividualOffset', 'QOffset'] },
      { vendor: 'Nokia', compatible: true, affectedParameters: ['individualOffset', 'qOffsetFreq'] }
    ]
  };
};

// Mock Execution Logs
const generateExecutionLogs = (executionId: string, planId: string, intentId: string): ExecutionLog[] => {
  const statuses: ExecutionStatus[] = ['sent', 'ack', 'applied'];
  const targetCell = generateCellId();

  const logs: ExecutionLog[] = [];
  const now = Date.now();

  statuses.forEach((status, index) => {
    logs.push({
      executionId,
      planId,
      intentId,
      status,
      timestamp: new Date(now + index * 30000), // 30 seconds apart
      targetCell,
      errorReason: status === 'failed' ? 'Connection timeout' : undefined
    });
  });

  // Randomly add a failure or rollback
  if (Math.random() > 0.8) {
    logs.push({
      executionId,
      planId,
      intentId,
      status: 'failed',
      timestamp: new Date(now + logs.length * 30000),
      targetCell,
      errorReason: randomChoice(['Connection timeout', 'Parameter validation failed', 'Vendor API error'])
    });
  }

  return logs;
};

// Mock KPI Deltas
const generateKPIDeltas = (): KPIDelta[] => {
  return [
    {
      metric: 'PRB_Utilization',
      before: 87.5,
      after: 74.2,
      delta: -13.3,
      deltaPercent: -15.2,
      timeWindowMinutes: 30
    },
    {
      metric: 'Avg_Throughput_Mbps',
      before: 45.3,
      after: 52.1,
      delta: 6.8,
      deltaPercent: 15.0,
      timeWindowMinutes: 30
    },
    {
      metric: 'Drop_Rate',
      before: 1.8,
      after: 1.3,
      delta: -0.5,
      deltaPercent: -27.8,
      timeWindowMinutes: 30
    },
    {
      metric: 'Active_Users',
      before: 432,
      after: 398,
      delta: -34,
      deltaPercent: -7.9,
      timeWindowMinutes: 30
    }
  ];
};

// Mock Execution Outcome
export const getMockExecutionOutcome = (planId: string, intentId: string): ExecutionOutcome => {
  const executionId = `exec_${Date.now()}`;

  return {
    executionId,
    planId,
    intentId,
    logs: generateExecutionLogs(executionId, planId, intentId),
    kpiDeltas: generateKPIDeltas(),
    attribution: {
      success: Math.random() > 0.2, // 80% success rate
      correlationScore: randomBetween(0.7, 0.95)
    },
    rateLimiting: {
      cooldownMinutes: 15,
      actionsRemainingInWindow: randomInt(3, 12)
    }
  };
};

// Get all mock data
export const getAllMockData = async () => {
  const overview = getMockOverviewData();
  const hotspots = getMockHotspots();
  const intents = getMockIntents();
  const intentDistribution = getMockIntentDistribution();

  // Get detailed data for the first intent
  const firstIntent = intents[0];
  const decisionTrace = await getMockDecisionTreeTrace(firstIntent.id, firstIntent.intentLabel);
  const plannerOutput = getMockPlannerOutput(firstIntent.id);
  const executionOutcome = getMockExecutionOutcome(plannerOutput.planId, firstIntent.id);

  return {
    overview,
    hotspots,
    intents,
    intentDistribution,
    decisionTrace,
    plannerOutput,
    executionOutcome
  };
};
