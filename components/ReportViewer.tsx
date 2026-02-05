import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Calendar, FileText } from "lucide-react";
import { Report } from "../services/api";

interface ReportViewerProps {
  report: Report;
  content: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  content,
}) => {
  // Transform absolute URLs to relative URLs for images
  const transformedContent = content.replace(
    /http:\/\/localhost:8001(\/visualizations\/[^\)]+)/g,
    "$1",
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            {report.filename.split('/').pop() || report.filename}
          </h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {report.created}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={`/network-manager/reports/download/${encodeURIComponent(report.filename)}`}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Markdown
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 overflow-y-auto flex-1 bg-white">
        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h1:text-slate-900 prose-h2:text-2xl prose-h2:text-slate-800 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h2:mt-8 prose-a:text-indigo-600 prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-slate-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {transformedContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
