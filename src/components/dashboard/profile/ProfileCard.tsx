"use client";

import { getInitials } from "@/lib/profileUtils";

interface ProfileCardProps {
  photo: string | null;
  name: string;
  email: string;
  onOpenPhotoSheet: () => void;
}

export function ProfileCard({
  photo,
  name,
  email,
  onOpenPhotoSheet,
}: ProfileCardProps) {
  return (
    <div className="bg-primary rounded-2xl p-5 mb-6">
      <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden mx-auto mb-3">
        {photo ? (
          <img
            src={photo}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-white">
            {getInitials(name)}
          </span>
        )}
      </div>
      <p className="text-white font-bold text-lg text-center">{name}</p>
      <p className="text-white/70 text-sm text-center">{email}</p>
      <div className="flex justify-center mt-2">
        <button
          onClick={onOpenPhotoSheet}
          className="text-white/80 text-xs underline"
        >
          Alterar foto
        </button>
      </div>
    </div>
  );
}
