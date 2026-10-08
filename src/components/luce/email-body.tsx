import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Image as ImageIcon, Video, Download, ExternalLink } from "lucide-react";
import type { Attachment } from "../../lib/api";

interface EmailBodyProps {
  content: string;
  attachments?: Attachment[];
}

const getFileType = (url: string): "image" | "video" | "pdf" | "file" => {
  const ext = url.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) return "image";
  if (["mp4", "webm", "mov", "avi"].includes(ext || "")) return "video";
  if (ext === "pdf") return "pdf";
  return "file";
};

export function EmailBody({ content, attachments }: EmailBodyProps) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => {
            if (!src) return null;
            return (
              <div className="my-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img src={src} alt={alt || "Image"} className="max-w-full h-auto" />
              </div>
            );
          },
          a: ({ href, children }) => {
            if (!href) return <a>{children}</a>;
            const type = getFileType(href);
            
            if (type === "image") {
              return (
                <div className="my-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img src={href} alt={String(children)} className="max-w-full h-auto" />
                </div>
              );
            }
            if (type === "video") {
              return (
                <div className="my-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-black">
                  <video src={href} controls className="max-w-full h-auto" />
                </div>
              );
            }
            if (type === "pdf") {
              return (
                <div className="my-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-100 p-3 flex items-center gap-2 border-b border-gray-200">
                    <FileText className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-sm text-gray-700">Aperçu PDF</span>
                  </div>
                  <iframe src={href} className="w-full h-96 border-none" title="PDF Viewer" />
                </div>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                {children} <ExternalLink className="w-3 h-3" />
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      
      {attachments && attachments.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pièces jointes ({attachments.length})</h3>
          <div className="grid gap-3">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{att.filename}</p>
                  <p className="text-xs text-gray-500">{att.mimeType}</p>
                </div>
                {att.url && (
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-md">
                    <Download className="w-4 h-4 text-gray-600" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
