# Loop Monitoring Dashboard V2 - 5G RAN Automation Platform

## Overview

This is a real-time loop monitoring dashboard for 5G RAN (Radio Access Network) automation, displaying 6 key panels for network optimization:

1. **Loop Status Overview Panel** - System health and operational status
2. **Network Hotspots Map Panel** - Geographic visualization of problem areas
3. **Intent Classification Engine Panel** - AI-driven intent classification
4. **Decision Tree Trace Analysis Panel** - Detailed decision path analysis
5. **Action Planner Output Panel** - Optimization action recommendations
6. **Execution & Outcome Analysis Panel** - Action execution results and KPI impacts

## Intent Classification System

The platform uses AI to classify network conditions into 4 intent types:

- **MRO** (Mobility Robustness Optimization) - Handover optimization and mobility improvements
- **ES** (Energy Saving) - Power consumption reduction opportunities
- **QoS** (Quality of Service) - Service level and 5QI requirement maintenance
- **TS** (Traffic Steering) - Load balancing and resource optimization

## Deployment Context

### Target Regions
- **Hà Nam Province** - Primary deployment area
- **Khánh Hòa Province** - Secondary deployment area

### Network Infrastructure
- 5G NR (New Radio) cells
- Cell ID format: `eNB_ID_CellID` (e.g., `12345_1`)
- Cluster-based network organization
- Multi-vendor support (Ericsson, Huawei, Nokia)

## What Changed

### Removed Files
- ❌ `components/ReportList.tsx` - No longer needed
- ❌ `components/ReportViewer.tsx` - No longer needed
- ❌ Old report-based workflow removed

### New Files Created

#### Type Definitions
- ✅ `types-v2.ts` - Complete type definitions for the new system including:
  - `OverviewData` - Loop status and alerts
  - `Hotspot` - Cell/cluster severity mapping
  - `Intent` - Intent classification data
  - `DecisionTreeTrace` - Decision path analysis
  - `PlannerOutput` - Action planning data
  - `ExecutionOutcome` - Execution results and KPI deltas

#### Mock Data Service
- ✅ `services/mockDataV2.ts` - Comprehensive mock data generator with:
  - Realistic network data simulation
  - Multiple regions and cell/cluster data
  - Time-series intent distribution
  - Decision tree paths with feature importance
  - Multi-vendor compatibility data
  - KPI before/after comparisons

#### Components
- ✅ `components/OverviewPanel.tsx` - Displays loop health status
- ✅ `components/HotspotsMapPanel.tsx` - Map and list view of hotspots
- ✅ `components/IntentClassifierPanel.tsx` - Intent table and distribution charts
- ✅ `components/DecisionTreeTracePanel.tsx` - Decision path visualization
- ✅ `components/PlannerOutputPanel.tsx` - Action recommendations and constraints
- ✅ `components/ExecutionOutcomePanel.tsx` - Execution timeline and KPI deltas
- ✅ `components/LoopMonitoringDashboard.tsx` - Main dashboard orchestrator

#### Updated Files
- ✅ `App.tsx` - Now uses `LoopMonitoringDashboard` instead of old `Dashboard`

## Features Implemented

### 1. Loop Status Overview Panel
- **Loop Status**: Running / Degraded / Paused indicator
- **Data Freshness**: Snapshot age and feature coverage percentage
- **Active Intents**: By region (Hà Nam, Khánh Hòa) with priority levels
- **Alerts**: Policy blocked, action failed, KPI guardrail violations
- **5G-specific KPIs**: RSRP, PRB utilization, handover success rate

### 2. Network Hotspots Map Panel
- **Map View**: Geographic visualization of cell-level issues
- **List View**: Top-K cells/clusters with severity scores
- **Color Coding**: By intent type (MRO/ES/QoS/TS)
- **Drilldown**: Click to view detailed analysis
- **5G Metrics**: PRB utilization, RSRP, CQI, RACH attempts

### 3. Intent Classification Engine Panel
- **Intent Summary**: MRO, ES, QoS, TS classification counts
- **Distribution Chart**: Time-series showing intent frequency (1h/6h/24h)
- **Intent Table**: Recent classifications with confidence scores
- **AI Performance**: Shows model accuracy vs baseline
- **Click to Drill**: Select intent to see decision trace

### 4. Decision Tree Trace Analysis Panel
- **Decision Path**: Visualization of ML model decision process
- **Node Details**: Shows condition, threshold, actual value, pass/fail
- **Top-3 Features**: Network KPIs with importance scores
- **Feature Snapshot**: Complete network state at decision time
- **Counterfactual Analysis**: "What if?" scenarios for parameter changes

### 5. Action Planner Output Panel
- **Candidate Actions**: MLB offset adjustment, CIO optimization, TX power tuning
- **Action Parameters**: Detailed 5G parameter configuration
- **Constraints Check**: QoS thresholds, RLF guardrails, peak hours policy
- **Timeline**: Scheduled execution time and duration
- **Multi-Vendor Support**: Ericsson/Huawei/Nokia compatibility matrix

### 6. Execution & Outcome Analysis Panel
- **Execution Timeline**: sent → ack → applied → failed/rollback tracking
- **5G KPI Deltas**: PRB utilization, throughput, RSRP changes
- **Attribution Analysis**: Correlation between action and outcome
- **Rate Limiting**: Cooldown period to prevent parameter oscillation

## Interactive Features

### Auto-Refresh
- Dashboard refreshes every 30 seconds automatically
- Manual refresh button available in navbar
- Last update timestamp displayed

### Drilldown Navigation
- **Click Hotspot** → Scrolls to Decision Tree Trace
- **Click Intent** → Updates all detail panels with that intent's data
- Selected intent highlighted with info banner

### Data Filtering
- Intent distribution supports 1h/6h/24h time ranges
- Map view switchable between map and list modes
- Top-K filtering on hotspots

## Technical Architecture

### State Management
- React hooks (useState, useEffect)
- Mock data regeneration on refresh
- Automatic intent selection for detail panels

### Styling
- Tailwind CSS with custom color schemes by intent/priority
- Responsive grid layouts
- Lucide icons throughout
- Hover effects and transitions

### Type Safety
- Full TypeScript coverage
- Strict type checking for all data structures
- Proper const assertions for literal types

## Running the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Mock Data

The system uses comprehensive mock data simulating a real 5G RAN deployment:
- 2 regions: **Hà Nam** and **Khánh Hòa** provinces
- 15+ network hotspots with varying severity
- 20 active intents across MRO/ES/QoS/TS types
- 24-hour intent distribution history
- 5G Cell IDs in format: `eNB_ID_CellID` (e.g., 12345_1)
- Real 5G KPIs: PRB utilization, RSRP, CQI, handover success rate
- Multi-step execution logs with network responses
- Multi-vendor parameter mappings for Ericsson/Huawei/Nokia

### 5G-Specific Parameters
- **PRB Utilization**: Physical Resource Block usage (0-100%)
- **RSRP**: Reference Signal Received Power (dBm)
- **CQI**: Channel Quality Indicator (0-15)
- **5QI**: 5G QoS Identifier
- **RLF Rate**: Radio Link Failure rate
- **RACH**: Random Access Channel attempts
- **MLB**: Mobility Load Balancing
- **CIO**: Cell Individual Offset

## Future Enhancements

While suitable for display, consider these improvements:

1. **Real Backend Integration**: Replace mock data with actual API calls
2. **Real-time WebSocket**: For live updates instead of polling
3. **Interactive Map**: Integrate Leaflet or Mapbox for actual geography
4. **Advanced Charts**: Use recharts or D3.js for better visualizations
5. **Export Features**: PDF reports, CSV downloads
6. **Historical Analysis**: Time-series analysis over days/weeks
7. **User Preferences**: Save view settings, favorite intents
8. **Role-Based Access**: Different views for operators vs managers

## Component Reusability

All components are designed to be reusable:
- Accept data via props
- Callbacks for user interactions (onClick handlers)
- No hardcoded business logic
- Easy to integrate with real APIs

## Migration from Grafana

While this is React-based, the panel structure mimics what would work well in Grafana:
- Each panel is self-contained
- Clear data boundaries
- Suitable for dashboard layout managers
- Can be exported as Grafana React plugins if needed

---

**Version**: 2.0  
**Date**: February 2026  
**Status**: ✅ Complete and Ready
