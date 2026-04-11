"use client";

import { Camera, ImageIcon, Trash2 } from "lucide-react";

interface ProfilePhotoSheetProps {
  open: boolean;
  hasPhoto: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
}

export function ProfilePhotoSheet({
  open,
  hasPhoto,
  onClose,
  onCamera,
  onGallery,
  onRemove,
}: ProfilePhotoSheetProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl px-6 pt-4 pb-10">
        <p className="text-base font-bold text-on-surface mb-4">
          Foto de perfil
        </p>
        <div className="space-y-1">
          <div
            className="flex items-center gap-3 py-3 text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container rounded-xl px-2 transition-all"
            onClick={onCamera}
          >
            <Camera className="w-5 h-5 shrink-0" />
            Usar câmera
          </div>
          <div
            className="flex items-center gap-3 py-3 text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container rounded-xl px-2 transition-all"
            onClick={onGallery}
          >
            <ImageIcon className="w-5 h-5 shrink-0" />
            Escolher da galeria
          </div>
          {hasPhoto && (
            <div
              className="flex items-center gap-3 py-3 text-sm font-medium text-error cursor-pointer hover:bg-surface-container rounded-xl px-2 transition-all"
              onClick={onRemove}
            >
              <Trash2 className="w-5 h-5 shrink-0" />
              Remover foto
            </div>
          )}
        </div>
      </div>
    </>
  );
}
