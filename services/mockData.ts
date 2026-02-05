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
