import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, type MailAttachment } from "@/lib/api";
import { formatSize } from "@/lib/luce-data";

export type PreviewKind = "image" | "pdf" | "video" | "audio" | "text" | "other";

const BY_EXT: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  avif: "image/avif", bmp: "image/bmp", svg: "image/svg+xml", pdf: "application/pdf",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4",
  txt: "text/plain", csv: "text/csv", md: "text/plain", json: "text/plain", log: "text/plain",
};

// Gmail annonce parfois application/octet-stream : on retombe sur l'extension du fichier.
export function effectiveMime(a: Pick<MailAttachment, "mimeType" | "filename">): string {
  const m = (a.mimeType || "").toLowerCase().split(";")[0].trim();
  if (m && m !== "application/octet-stream") return m;
  const ext = a.filename.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXT[ext] ?? m ?? "application/octet-stream";
}

export function previewKind(mime: string): PreviewKind {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "text/plain" || mime === "text/csv") return "text";
  return "other";
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "external"; url: string }
  | { status: "ready"; url: string; text?: string };

export function AttachmentViewer({
  messageId,
  attachment,
  onClose,
}: {
  messageId: string;
  attachment: MailAttachment | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!attachment) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setState({ status: "loading" });

    (async () => {
      try {
        const result = await api.attachment(messageId, attachment);
        if (cancelled) return;
        if ("url" in result) {
          setState({ status: "external", url: result.url });
          return;
        }
        const mime = effectiveMime(attachment);
        const blob = new Blob([result.blob], { type: mime });
        objectUrl = URL.createObjectURL(blob);
        const text = previewKind(mime) === "text" ? (await blob.text()).slice(0, 200_000) : undefined;
        if (!cancelled) setState({ status: "ready", url: objectUrl, text });
      } catch (e) {
        if (!cancelled) setState({ status: "error", message: e instanceof Error ? e.message : "Erreur" });
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [messageId, attachment]);

  const mime = attachment ? effectiveMime(attachment) : "";
  const kind = previewKind(mime);

  return (
    <Dialog open={!!attachment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{attachment?.filename}</DialogTitle>
          <DialogDescription>
            {[mime, formatSize(attachment?.size ?? null)].filter((x) => x && x !== "—").join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-40">
          {state.status === "loading" && (
            <div className="grid h-40 place-items-center text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Chargement du fichier…</span>
            </div>
          )}

          {state.status === "error" && (
            <p className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{state.message}</p>
          )}

          {state.status === "external" && (
            <div className="grid place-items-center gap-3 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">Ce fichier est trop volumineux pour être affiché ici.</p>
              <Button asChild>
                <a href={state.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Ouvrir dans un nouvel onglet</a>
              </Button>
            </div>
          )}

          {state.status === "ready" && (
            <>
              {kind === "image" && (
                <img src={state.url} alt={attachment?.filename} className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain" />
              )}
              {kind === "pdf" && (
                <>
                  <iframe src={state.url} title={attachment?.filename} className="h-[70vh] w-full rounded-lg border" />
                  <p className="mt-2 text-xs text-muted-foreground">Si l'aperçu ne s'affiche pas (certains mobiles), utilise « Télécharger ».</p>
                </>
              )}
              {kind === "video" && <video src={state.url} controls className="mx-auto max-h-[70vh] w-full rounded-lg bg-black" />}
              {kind === "audio" && <audio src={state.url} controls className="w-full" />}
              {kind === "text" && (
                <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">{state.text}</pre>
              )}
              {kind === "other" && (
                <div className="grid place-items-center gap-3 rounded-lg border border-dashed p-8 text-center">
                  <FileText className="size-10 text-muted-foreground" />
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Pas d'aperçu pour ce type de fichier (Word, Excel, archive…). Télécharge-le pour l'ouvrir.
                  </p>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline">
                  <a href={state.url} download={attachment?.filename}><Download className="size-4" /> Télécharger</a>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
