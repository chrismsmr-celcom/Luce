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
  body{padding:2px;font:13.5px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#202124;overflow-wrap:anywhere;word-break:break-word}
  p,div{margin-top:0}
  p{margin-bottom:.6em}
  h1,h2,h3{font-size:1.1em;margin:.6em 0 .3em}
  img{max-width:100%;height:auto}
  table{max-width:100%}
  pre{white-space:pre-wrap}
  a{color:#1a73e8}
  blockquote{margin:6px 0 6px 2px;padding-left:10px;border-left:3px solid #dadce0;color:#5f6368}
`;
const HIDE_QUOTES_CSS = `.gmail_quote,.gmail_extra,.yahoo_quoted,blockquote[type="cite"]{display:none!important}`;
const COLLAPSED_HEIGHT = 420; // au-delà, le message est replié (comme « Voir plus » dans Gmail)

function buildDoc(clean: string, allowImages: boolean, hideQuotes: boolean): string {
  const img = allowImages ? "img-src https: data:" : "img-src data:";
  const csp = `default-src 'none'; style-src 'unsafe-inline'; font-src data:; ${img}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>${FRAME_CSS}${hideQuotes ? HIDE_QUOTES_CSS : ""}</style></head><body>${clean}</body></html>`;
}

function HtmlFrame({ html }: { html: string }) {
  const [allowImages, setAllowImages] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState(120);
  const ref = useRef<HTMLIFrameElement>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const clean = useMemo(() => sanitize(html), [html]);
  const hasRemote = useMemo(() => /<img[^>]+src\s*=\s*["']?https?:|url\(\s*["']?https?:/i.test(clean), [clean]);
  const hasQuotes = useMemo(() => /gmail_quote|yahoo_quoted|type\s*=\s*["']?cite/i.test(clean), [clean]);
  const doc = useMemo(() => buildDoc(clean, allowImages, hasQuotes && !showQuotes), [clean, allowImages, hasQuotes, showQuotes]);

  // Met le contenu à l'échelle de la boîte : un mail newsletter fait souvent 600-700 px de large ;
  // on le réduit (zoom) pour qu'il tienne sans défilement horizontal, puis on mesure la hauteur.
  const fit = () => {
    const frame = ref.current;
    const d = frame?.contentDocument;
    if (!frame || !d?.body) return;
    const avail = frame.clientWidth;
    d.body.style.zoom = "1";
    const needed = d.documentElement.scrollWidth;
    if (avail > 0 && needed > avail + 1) d.body.style.zoom = String(Math.max(avail / needed, 0.4));
    setHeight(Math.max(d.documentElement.scrollHeight, 40));
  };

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    observer.current = new ResizeObserver(() => fit());
    observer.current.observe(frame); // la largeur de la boîte change (fenêtre, mobile) -> on réajuste
    return () => observer.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLoad = () => {
    const d = ref.current?.contentDocument;
    if (!d) return;
    fit();
    d.querySelectorAll("img").forEach((img) => img.addEventListener("load", fit)); // images tardives
  };

  const tooTall = height > COLLAPSED_HEIGHT + 40;
  const collapsed = tooTall && !expanded;

  return (
    <div>
      {hasRemote && !allowImages && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ImageOff className="size-3.5" /> Images distantes bloquées (vie privée).
          </span>
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => setAllowImages(true)}>
            Afficher
          </Button>
        </div>
      )}
      <div className="relative overflow-hidden rounded-lg border bg-white" style={{ maxHeight: collapsed ? COLLAPSED_HEIGHT : undefined }}>
        <iframe
          ref={ref}
          title="Contenu du message"
          srcDoc={doc}
          // allow-same-origin sans allow-scripts : aucun script ne peut s'exécuter, mais on peut
          // mesurer le contenu. Les liens s'ouvrent dans un nouvel onglet.
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          onLoad={onLoad}
          style={{ height }}
          className="block w-full border-0 bg-white"
        />
        {collapsed && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />}
      </div>
      {(collapsed || (tooTall && expanded) || hasQuotes) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tooTall && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Réduire" : "Afficher tout le message"}
            </Button>
          )}
          {hasQuotes && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowQuotes((v) => !v)}>
              {showQuotes ? "Masquer les messages cités" : "⋯ Messages cités"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function MailBody({ html, text }: { html?: string; text?: string }) {
  if (html && html.trim()) return <HtmlFrame html={html} />;
  return (
    <div className="text-[13.5px] leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_p]:whitespace-pre-line [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_img]:max-w-full">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>
        {text ?? ""}
      </ReactMarkdown>
    </div>
  );
}
