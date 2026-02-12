import React from 'react';
import { Calendar, Zap, Radio, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DataSelectionPanelProps {
  selectedDate: Date;
  selectedModelType: 'ES' | 'MRO';
  onDateChange: (date: Date) => void;
  onModelTypeChange: (type: 'ES' | 'MRO') => void;
}

// Known dates with available data
const AVAILABLE_DATES = [
  { date: '2026-02-04', label: 'Feb 4, 2026', hasData: true },
];

export const DataSelectionPanel: React.FC<DataSelectionPanelProps> = ({
  selectedDate,
  selectedModelType,
  onDateChange,
  onModelTypeChange,
}) => {
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentDateStr = formatDateForInput(selectedDate);
  const hasDataForSelected = AVAILABLE_DATES.some((d) => d.date === currentDateStr);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    onDateChange(newDate);
  };

  const handleQuickDateSelect = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    onDateChange(new Date(year, month - 1, day));
  };

  const taskTypes: {
    key: 'ES' | 'MRO';
    label: string;
    fullName: string;
    description: string;
    color: string;
    activeColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'ES',
      label: 'ES',
      fullName: 'Energy Saving',
      description: 'View cells identified for power-down to reduce energy consumption while maintaining QoS.',
      color: 'text-green-700',
      activeColor: 'bg-green-50 border-green-500 ring-2 ring-green-200',
      borderColor: 'border-green-200 hover:border-green-400',
      icon: <Zap className="w-6 h-6 text-green-600" />,
    },
    {
      key: 'MRO',
      label: 'MRO',
      fullName: 'Mobility Robustness Optimization',
      description: 'View handover parameter adjustments to reduce failures and optimize mobility.',
      color: 'text-blue-700',
      activeColor: 'bg-blue-50 border-blue-500 ring-2 ring-blue-200',
      borderColor: 'border-blue-200 hover:border-blue-400',
      icon: <Radio className="w-6 h-6 text-blue-600" />,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#241D1E] to-[#44494D]">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#EE0434]" />
          Select Data to Review
        </h2>
        <p className="text-sm text-gray-300 mt-1">
          VULCAN runs automated optimization every 23 hours. Choose a date and task type to review past decisions and outcomes.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Execution Date
            </h3>

            {/* Custom date input */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="date"
                value={currentDateStr}
                onChange={handleDateInputChange}
                max={formatDateForInput(new Date())}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-base font-medium focus:outline-none focus:border-[#EE0434] focus:ring-2 focus:ring-red-100 transition-colors cursor-pointer"
                style={{ color: '#241D1E' }}
              />
            </div>

            {/* Quick-select dates with data */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available Data</p>
              {AVAILABLE_DATES.map((item) => {
                const isSelected = currentDateStr === item.date;
                return (
                  <button
                    key={item.date}
                    onClick={() => handleQuickDateSelect(item.date)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-[#EE0434] bg-red-50 ring-2 ring-red-100'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 flex-shrink-0 ${
                        isSelected ? 'text-[#EE0434]' : 'text-green-500'
                      }`}
                    />
                    <div className="flex-1">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-[#EE0434]' : 'text-gray-800'}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-green-600 ml-2 font-medium">Data available</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-[#EE0434] bg-red-100 px-2 py-1 rounded">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Warning if selected date has no data */}
            {!hasDataForSelected && (
              <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">No data for this date</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    The selected date may show empty results. Available data: Feb 4, 2026.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Task Type Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-gray-500" />
              Optimization Task
            </h3>

            <div className="space-y-3">
              {taskTypes.map((task) => {
                const isActive = selectedModelType === task.key;
                return (
                  <button
                    key={task.key}
                    onClick={() => onModelTypeChange(task.key)}
                    className={`w-full flex items-start gap-4 px-4 py-4 rounded-lg border-2 transition-all text-left ${
                      isActive ? task.activeColor : task.borderColor
                    }`}
                  >
                    <div className="mt-0.5">{task.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${task.color}`}>{task.label}</span>
                        <span className="text-sm text-gray-600">— {task.fullName}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{task.description}</p>
                    </div>
                    {isActive && (
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        task.key === 'ES' ? 'text-green-500' : 'text-blue-500'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-5 flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
          <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 leading-relaxed">
            The system generates an optimization plan and executes it automatically each cycle (every 23 hours).
            Use this panel to <strong>review historical decisions</strong> — select the date of the cycle you want to inspect
            and the task type to view the corresponding network scan, ML predictions, and execution outcomes.
          </p>
        </div>
      </div>
    </div>
  );
};
