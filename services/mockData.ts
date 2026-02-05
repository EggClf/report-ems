import { DecisionResponse } from '../types';
import { Report } from './api';

export const MRO_SCENARIO: DecisionResponse = {
  metadata: {
    region: "Q7_South",
    cell_id: "gNB_1023",
    time_window: "2026-01-23T22:30:00Z/2026-01-23T22:45:00Z",
    model_version: "ai-mro-es-v1.2"
  },
  decision: {
    strategy: "MRO",
    confidence: 0.87,
    recommended_action: {
      profile: "MRO_PROFILE_A",
      parameters: {
        time_to_trigger_ms: 512,
        handover_offset_db: 2
      }
    }
  },
  why: {
    summary: "Mobility degradation detected while cell load remains high. Late handovers observed towards neighbor gNB_1024.",
    rules_triggered: [
      "HO_FAILURE_RATE_EXCEEDED",
      "PING_PONG_DETECTED"
    ],
    top_kpis: [
      {
        name: "handover_failure_rate",
        value: 5.8,
        threshold: 3.0,
        trend: "UP",
        importance: 0.32
      },
      {
        name: "prb_utilization_dl",
        value: 78,
        threshold: 70,
        trend: "STABLE",
        importance: 0.21
      },
      {
        name: "edge_ue_ratio",
        value: 27,
        threshold: 20,
        trend: "UP",
        importance: 0.18
      }
    ]
  },
  guardrail: {
    energy_saving_blocked: true,
    reason: "High PRB utilization and mobility instability detected."
  },
  expected_impact: {
    qos: {
      handover_success_rate: "+2.1%",
      drop_call_rate: "-0.8%"
    },
    energy: {
      power_saving: "0%"
    }
  },
  operator_options: {
    can_apply: true,
    can_override: true,
    can_simulate: true
  }
};

export const ES_SCENARIO: DecisionResponse = {
  metadata: {
    region: "Q2_East",
    cell_id: "gNB_4055",
    time_window: "2026-01-24T02:00:00Z/2026-01-24T02:15:00Z",
    model_version: "ai-mro-es-v1.2"
  },
  decision: {
    strategy: "ENERGY_SAVING",
    confidence: 0.94,
    recommended_action: {
      mode: "CELL_SLEEP",
      scope: "SECONDARY_CARRIER",
      duration_min: 60
    }
  },
  why: {
    summary: "Traffic load is significantly below low-load threshold for consecutive windows. No active emergency calls.",
    rules_triggered: [
      "LOW_LOAD_SUSTAINED",
      "NO_ACTIVE_VIP_USERS"
    ],
    top_kpis: [
      {
        name: "prb_utilization_dl",
        value: 8,
        threshold: 15,
        trend: "DOWN",
        importance: 0.45
      },
      {
        name: "active_rrc_users",
        value: 12,
        threshold: 40,
        trend: "STABLE",
        importance: 0.30
      }
    ]
  },
  expected_impact: {
    qos: {
      throughput_avg: "0% (No Impact)",
      access_delay: "+5ms"
    },
    energy: {
      power_saving: "18%"
    }
  },
  operator_options: {
    can_apply: true,
    can_override: true,
    can_simulate: true
  }
};



export const MOCK_REPORTS: Report[] = [
  {
    filename: "kpi_report_20231027_100000.md",
    path: "/reports/kpi_report_20231027_100000.md",
    size: 4096,
    created: "2023-10-27 10:00:00",
    download_url: "#",
    request_id: "REQ-20231027-001",
    report_type: "MRO",
  },
  {
    filename: "kpi_report_20231027_090000.md",
    path: "/reports/kpi_report_20231027_090000.md",
    size: 3850,
    created: "2023-10-27 09:00:00",
    download_url: "#",
    request_id: "REQ-20231027-002",
    report_type: "MRO"
  }
];

export const MOCK_REPORT_CONTENT = `
# 5G KPI Analysis Report (MOCK)

**Generated:** 2023-10-27 10:00:00  
**Data Source:** \`sample_kpi.csv\`  
**KPIs Analyzed:** 5

---

## 1. Executive Summary

This is a **MOCK REPORT** generated because the backend is unavailable.

### Key Metrics:
- RSRP
- RSRQ
- SINR
- Downlink_Throughput
- Uplink_Throughput

---

## 2. Statistical Summary

| Metric | RSRP | RSRQ | SINR | Downlink_Throughput | Uplink_Throughput |
|---|---|---|---|---|---|
| **mean** | -88.40 | -12.10 | 15.20 | 132.50 | 38.60 |
| **max** | -83.00 | -9.00 | 21.00 | 165.80 | 50.10 |
| **min** | -95.00 | -16.00 | 8.00 | 95.40 | 25.60 |

---

## 3. Visualizations

> [!NOTE]
> Visualization images are not available in mock mode.

### 4.1 Time Series Analysis
![KPI Time Series](https://placehold.co/800x400?text=Mock+Time+Series+Plot)

### 4.2 Distribution Analysis
![KPI Box Plots](https://placehold.co/800x400?text=Mock+Box+Plots)

`;

export interface KpiDataPoint {
  timestamp: string;
  [key: string]: number | string;
}

export const KPI_DEFINITIONS = [
  { key: 'call_drop_rate', name: '5G EN-DC Call Drop Ratio 1 (%)', min: 0, max: 2, unit: '%' },
  { key: 'cell_downtime', name: 'CelldowntimeAuto (s)', min: 0, max: 0, unit: 's' },
  { key: 'rrc_users', name: 'Max RRC Connected NR ENDC User (UE)', min: 100, max: 500, unit: 'UE' },
  { key: 'dl_throughput', name: 'NR DL User Throughput Mbps (Mbps)', min: 50, max: 300, unit: 'Mbps' },
  { key: 'inter_sgnb_att', name: 'PSCell Change Inter-SgNB Att (#)', min: 50, max: 200, unit: '#' },
  { key: 'inter_sgnb_succ', name: 'PSCell Change Inter-SgNB Succ (#)', min: 48, max: 198, unit: '#' },
  { key: 'infra_sgnb_att', name: 'PSCell Change Infra-SgNB Att (#)', min: 20, max: 100, unit: '#' },
  { key: 'infra_sgnb_succ', name: 'PSCell Change Infra-SgNB Succ (#)', min: 19, max: 99, unit: '#' },
  { key: 'prb_utilization', name: 'TU PRB DL (%)', min: 20, max: 90, unit: '%' },
];

const getSeedFromCellId = (cellId: string): number => {
  let seed = 0;
  for (let i = 0; i < cellId.length; i++) {
    seed = (seed << 5) - seed + cellId.charCodeAt(i);
    seed |= 0;
  }
  return Math.abs(seed) % 1000 / 1000; // 0 to 1
};

export const generateMockKpiHistory = (hours = 4, cellId = 'gNB_1023'): KpiDataPoint[] => {
  const data: KpiDataPoint[] = [];
  const now = new Date();
  const points = hours * 12; // 5 min intervals
  const cellSeed = getSeedFromCellId(cellId);

  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    const point: KpiDataPoint = {
      timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    KPI_DEFINITIONS.forEach(kpi => {
      point[kpi.key] = 0;
    });

    data.push(point);
  }
  return data;
};

export const generateMockKpiUpdate = (cellId = 'gNB_1023'): KpiDataPoint => {
  const now = new Date();
  const point: KpiDataPoint = {
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
  const cellSeed = getSeedFromCellId(cellId);

  KPI_DEFINITIONS.forEach(kpi => {
    point[kpi.key] = 0;
  });



  return point;
};

// New Metrics Mock Data
import { 
  MetricsSnapshot, 
  StrategicMetric, 
  TacticalActionMetric, 
  TacticalPerformanceMetric, 
  OperationalMetric 
} from '../types';

export const generateMockMetrics = (): MetricsSnapshot => {
  const now = new Date();
  
  // Strategic Metrics
  const strategicMetrics: StrategicMetric[] = [
    {
      intent_type: 'ES',
      target_scope: 'Cluster_Q7_001',
      decision_path: 'root_node.low_traffic.night_time',
      model_version: 'v1.2.0',
      value: 0.94,
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString()
    },
    {
      intent_type: 'MRO',
      target_scope: 'Cell_gNB_1023',
      decision_path: 'root_node.high_mobility.congestion',
      model_version: 'v1.2.0',
      value: 0.87,
      timestamp: new Date(now.getTime() - 3 * 60000).toISOString()
    },
    {
      intent_type: 'QoS',
      target_scope: 'Cluster_Q2_East',
      decision_path: 'root_node.degraded_service.peak_hour',
      model_version: 'v1.2.1',
      value: 0.78,
      timestamp: new Date(now.getTime() - 8 * 60000).toISOString()
    },
    {
      intent_type: 'TS',
      target_scope: 'Cell_gNB_4055',
      decision_path: 'root_node.traffic_steering.load_balancing',
      model_version: 'v1.2.0',
      value: 1.0,
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString()
    }
  ];

  // Tactical Action Metrics
  const tacticalActions: TacticalActionMetric[] = [
    {
      agent_type: 'ES',
      action_name: 'cell_sleep',
      status: 'success',
      value: 1,
      timestamp: new Date(now.getTime() - 4 * 60000).toISOString(),
      target: 'gNB_4055_Carrier2'
    },
    {
      agent_type: 'MRO',
      action_name: 'handover_threshold',
      status: 'success',
      value: 2,
      timestamp: new Date(now.getTime() - 6 * 60000).toISOString(),
      target: 'gNB_1023'
    },
    {
      agent_type: 'ES',
      action_name: 'power_offset',
      status: 'rejected_by_safety_layer',
      value: -5,
      timestamp: new Date(now.getTime() - 10 * 60000).toISOString(),
      target: 'gNB_2341'
    },
    {
      agent_type: 'MRO',
      action_name: 'handover_threshold',
      status: 'success',
      value: -1,
      timestamp: new Date(now.getTime() - 1 * 60000).toISOString(),
      target: 'gNB_5678'
    },
    {
      agent_type: 'QoS',
      action_name: 'power_offset',
      status: 'success',
      value: 3,
      timestamp: new Date(now.getTime() - 7 * 60000).toISOString(),
      target: 'gNB_9012'
    },
    {
      agent_type: 'TS',
      action_name: 'traffic_steering',
      status: 'failed',
      value: 0,
      timestamp: new Date(now.getTime() - 12 * 60000).toISOString(),
      target: 'Cluster_Q2_East'
    }
  ];

  // Tactical Performance Metrics
  const tacticalPerformance: TacticalPerformanceMetric[] = [
    {
      agent_type: 'ES',
      metric_type: 'reward',
      value: 0.82,
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString()
    },
    {
      agent_type: 'ES',
      metric_type: 'episode_length',
      value: 247,
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString()
    },
    {
      agent_type: 'ES',
      metric_type: 'q_value_mean',
      value: 1.45,
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString()
    },
    {
      agent_type: 'MRO',
      metric_type: 'reward',
      value: 0.76,
      timestamp: new Date(now.getTime() - 3 * 60000).toISOString()
    },
    {
      agent_type: 'MRO',
      metric_type: 'episode_length',
      value: 312,
      timestamp: new Date(now.getTime() - 3 * 60000).toISOString()
    },
    {
      agent_type: 'MRO',
      metric_type: 'q_value_mean',
      value: 1.28,
      timestamp: new Date(now.getTime() - 3 * 60000).toISOString()
    },
    {
      agent_type: 'QoS',
      metric_type: 'reward',
      value: 0.68,
      timestamp: new Date(now.getTime() - 8 * 60000).toISOString()
    },
    {
      agent_type: 'TS',
      metric_type: 'reward',
      value: 0.91,
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString()
    }
  ];

  // Operational Metrics
  const operationalMetrics: OperationalMetric[] = [
    {
      metric_name: 'loop_latency_seconds',
      value: 0.342,
      timestamp: new Date(now.getTime() - 1 * 60000).toISOString(),
      labels: { agent: 'ES' }
    },
    {
      metric_name: 'loop_latency_seconds',
      value: 0.287,
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
      labels: { agent: 'MRO' }
    },
    {
      metric_name: 'loop_latency_seconds',
      value: 0.456,
      timestamp: new Date(now.getTime() - 3 * 60000).toISOString(),
      labels: { agent: 'QoS' }
    },
    {
      metric_name: 'model_drift_score',
      value: 0.12,
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      labels: { agent: 'ES' }
    },
    {
      metric_name: 'model_drift_score',
      value: 0.08,
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      labels: { agent: 'MRO' }
    },
    {
      metric_name: 'model_drift_score',
      value: 0.24,
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      labels: { agent: 'QoS' }
    },
    {
      metric_name: 'resource_usage',
      value: 67.5,
      timestamp: now.toISOString(),
      labels: { agent: 'ES', resource_type: 'GPU' }
    },
    {
      metric_name: 'resource_usage',
      value: 42.3,
      timestamp: now.toISOString(),
      labels: { agent: 'ES', resource_type: 'CPU' }
    },
    {
      metric_name: 'resource_usage',
      value: 78.2,
      timestamp: now.toISOString(),
      labels: { agent: 'MRO', resource_type: 'GPU' }
    },
    {
      metric_name: 'resource_usage',
      value: 53.7,
      timestamp: now.toISOString(),
      labels: { agent: 'MRO', resource_type: 'CPU' }
    }
  ];

  return {
    strategic: strategicMetrics,
    tactical_actions: tacticalActions,
    tactical_performance: tacticalPerformance,
    operational: operationalMetrics,
    last_updated: now.toISOString()
  };
};
