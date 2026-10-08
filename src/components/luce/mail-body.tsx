import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Rendu d'un email façon Gmail :
//  * HTML  -> nettoyé par DOMPurify, puis affiché dans une iframe sandboxée (aucun script) avec une
//             CSP qui bloque tout contenu distant : les pixels espions ne se chargent pas tant que
//             l'utilisateur n'a pas cliqué sur « Afficher les images ».
//  * Texte -> rendu Markdown (certains outils convertissent déjà le HTML en Markdown).

let hookInstalled = false;
function installHook() {
  if (hookInstalled || typeof window === "undefined") return;
  hookInstalled = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}

function sanitize(html: string): string {
  if (typeof window === "undefined" || !DOMPurify.isSupported) return "";
  installHook();
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "textarea", "select", "link", "meta", "base"],
    FORBID_ATTR: ["srcset", "ping"],
    ADD_ATTR: ["target"],
  });
}

const FRAME_CSS = `
  :root{color-scheme:light}
  html,body{margin:0;padding:0;background:#fff}
  body{padding:2px;font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#202124;overflow-wrap:anywhere}
  img{max-width:100%;height:auto}
  table{max-width:100%}
  pre{white-space:pre-wrap}
  a{color:#1a73e8}
  blockquote{margin:8px 0 8px 4px;padding-left:12px;border-left:3px solid #dadce0;color:#5f6368}
`;

function buildDoc(clean: string, allowImages: boolean): string {
  const img = allowImages ? "img-src https: data:" : "img-src data:";
  const csp = `default-src 'none'; style-src 'unsafe-inline'; font-src data:; ${img}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>${FRAME_CSS}</style></head><body>${clean}</body></html>`;
}

function HtmlFrame({ html }: { html: string }) {
  const [allowImages, setAllowImages] = useState(false);
  const [height, setHeight] = useState(160);
  const ref = useRef<HTMLIFrameElement>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const clean = useMemo(() => sanitize(html), [html]);
  const hasRemote = useMemo(() => /<img[^>]+src\s*=\s*["']?https?:|url\(\s*["']?https?:/i.test(clean), [clean]);
  const doc = useMemo(() => buildDoc(clean, allowImages), [clean, allowImages]);

  useEffect(() => () => observer.current?.disconnect(), []);

  const onLoad = () => {
    const d = ref.current?.contentDocument;
    if (!d?.body) return;
    const measure = () => setHeight(Math.max(d.documentElement.scrollHeight, 80));
    measure();
    observer.current?.disconnect();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(d.body);
  };

  return (
    <div>
      {hasRemote && !allowImages && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ImageOff className="size-3.5" /> Les images distantes sont bloquées pour protéger ta vie privée.
          </span>
          <Button size="sm" variant="outline" className="h-7" onClick={() => setAllowImages(true)}>
            Afficher les images
          </Button>
        </div>
      )}
      <iframe
        ref={ref}
        title="Contenu du message"
        srcDoc={doc}
        // allow-same-origin sans allow-scripts : aucun script ne peut s'exécuter, mais on peut
        // mesurer la hauteur du contenu. Les liens s'ouvrent dans un nouvel onglet.
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        onLoad={onLoad}
        style={{ height }}
        className="w-full rounded-lg border-0 bg-white"
      />
    </div>
  );
}

export function MailBody({ html, text }: { html?: string; text?: string }) {
  if (html && html.trim()) return <HtmlFrame html={html} />;
  return (
    <div className="text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_p]:whitespace-pre-line [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_img]:max-w-full">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>
        {text ?? ""}
      </ReactMarkdown>
    </div>
  );
}
