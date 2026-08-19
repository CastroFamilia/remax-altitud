import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  if (!content) return null;

  // Pre-process markdown to convert single newlines to hard breaks so that
  // pressing enter in the editor creates visible line breaks without collapsing.
  // We preserve existing double newlines (paragraphs) and list items.
  const processedContent = content.replace(/\r\n/g, "\n").replace(/(?<!\n)\n(?!\n)/g, "  \n");

  return (
    <div className={`markdown-content text-slate-800 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-navy mt-10 mb-4 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy mt-8 mb-4 border-b border-brand-warm/80 pb-2 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl md:text-2xl font-bold text-brand-navy mt-6 mb-3 tracking-tight">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg md:text-xl font-semibold text-brand-navy mt-5 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-base md:text-lg leading-relaxed text-slate-700 mb-6 font-normal">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900 text-inherit">{children}</strong>
          ),
          b: ({ children }) => <b className="font-bold text-slate-900 text-inherit">{children}</b>,
          em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
          i: ({ children }) => <i className="italic text-slate-800">{children}</i>,
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-6 mb-6 space-y-2 text-base md:text-lg text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-6 mb-6 space-y-2 text-base md:text-lg text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-red bg-brand-warm/40 p-4 md:p-5 my-6 rounded-r-xl italic text-slate-800 font-medium">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-brand-burgundy font-semibold underline underline-offset-4 hover:text-brand-red transition-colors"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <span className="block my-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src || ""}
                alt={alt || "Blog visual"}
                className="w-full max-h-[550px] object-cover rounded-2xl shadow-md border border-slate-200"
                loading="lazy"
              />
              {alt && (
                <span className="block text-center text-xs md:text-sm text-slate-500 mt-2 italic">
                  {alt}
                </span>
              )}
            </span>
          ),
          hr: () => <hr className="my-10 border-t border-slate-200" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-8 border border-slate-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm md:text-base">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 text-slate-900 font-semibold">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="hover:bg-slate-50/50">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 text-slate-700">{children}</td>,
          code: ({ children }) => (
            <code className="bg-slate-100 text-brand-burgundy px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200">
              {children}
            </code>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
