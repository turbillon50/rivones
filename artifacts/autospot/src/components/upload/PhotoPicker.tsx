import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpload } from "@workspace/object-storage-web";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (paths: string[]) => void;
  maxFiles?: number;
  accept?: string;
  label?: string;
}

/**
 * Minimal multi-photo picker around useUpload(). Shows thumbnails of the
 * uploaded objectPaths and lets the user remove them. Used by KYC, trip
 * inspections, and the host upload flow.
 */
export function PhotoPicker({ value, onChange, maxFiles = 6, accept = "image/*,application/pdf", label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { uploadFile } = useUpload();
  const { toast } = useToast();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (value.length + files.length > maxFiles) {
      toast({ title: `Máximo ${maxFiles} archivos`, variant: "destructive" });
      return;
    }
    setUploading(true);
    const newPaths: string[] = [];
    for (const file of Array.from(files)) {
      const result = await uploadFile(file);
      if (result?.objectPath) newPaths.push(result.objectPath);
    }
    if (newPaths.length === 0) {
      toast({ title: "No se pudo subir el archivo", variant: "destructive" });
    }
    onChange([...value, ...newPaths]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {value.map((path, idx) => (
          <div key={path + idx} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={path.startsWith("/") ? `/api/storage${path}` : path}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label="Eliminar"
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <ImagePlus size={18} />
            <span>{uploading ? "Subiendo…" : "Agregar"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
