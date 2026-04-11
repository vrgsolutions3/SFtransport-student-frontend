import { FolderOpen } from "lucide-react";

export function DocumentsEmpty() {
  return (
    <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 text-center">
      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
        <FolderOpen className="text-on-surface-variant" size={22} />
      </div>
      <h2 className="text-on-surface font-semibold mb-1">
        Nenhum documento enviado
      </h2>
      <p className="text-sm text-on-surface-variant">
        Quando você enviar seus documentos, eles aparecerão aqui para
        visualização e download.
      </p>
    </section>
  );
}
