import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="bg-rose-500/20 text-rose-400 p-3 rounded-xl border border-rose-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Tüm Verileri ve Varlıkları Sıfırla
            </h3>
            <p className="text-xs text-slate-400">
              Bu işlem geri alınamaz
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
          <p className="font-medium text-slate-200">
            Aşağıdaki tüm verileriniz kalıcı olarak silinecektir:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Tüm Hisse Senedi Alım / Satım Kayıtları</li>
            <li>Tüm TEFAS Fon Alım / Satım Kayıtları</li>
            <li>Tüm Mevduat, Bono ve Tahvil İşlemleri</li>
            <li>Tüm Temettü Gelir Kayıtları</li>
            <li>Tüm Anlık Portföy Ekran Görüntüleri (Snapshots)</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Evet, Hepsini Sil
          </button>
        </div>
      </div>
    </div>
  );
};
