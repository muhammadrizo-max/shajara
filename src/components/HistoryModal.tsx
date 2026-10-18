import React, { useState, useEffect } from 'react';
import { HistoryRecord, HistoryActionType } from '../types';
import { getHistoryRecords, clearHistoryRecords } from '../utils/historyStorage';
import { 
  History, 
  X, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Share2, 
  RotateCcw, 
  Upload, 
  UserPlus, 
  Clock, 
  Calendar,
  Filter,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecords(getHistoryRecords());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm("Rostdan ham shajara tarixini tozalamoqchimisiz?")) {
      clearHistoryRecords();
      setRecords([]);
      setIsClearing(false);
    }
  };

  const getActionIcon = (action: HistoryActionType) => {
    switch (action) {
      case 'person_add':
        return <PlusCircle className="w-4 h-4 text-emerald-500" />;
      case 'person_edit':
        return <Edit3 className="w-4 h-4 text-sky-500" />;
      case 'person_delete':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'member_invited':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'tree_import':
        return <Upload className="w-4 h-4 text-indigo-500" />;
      case 'tree_reset':
        return <RotateCcw className="w-4 h-4 text-amber-500" />;
      case 'user_registered':
        return <Sparkles className="w-4 h-4 text-teal-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionBadgeClass = (action: HistoryActionType) => {
    switch (action) {
      case 'person_add':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'person_edit':
        return 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'person_delete':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'member_invited':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const filteredRecords = records.filter((r) => {
    if (filterType === 'all') return true;
    return r.action === filterType;
  });

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Shajara Tarixi & O'zgarishlar Jurnali</h2>
              <p className="text-amber-100 text-xs">
                Shajaradagi har bir shaxs qo'shilishi, tahrirlanishi va oilaviy o'zgarishlar xronologiyasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterType === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Barchasi ({records.length})
            </button>
            <button
              onClick={() => setFilterType('person_add')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterType === 'person_add'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Qo'shishlar
            </button>
            <button
              onClick={() => setFilterType('person_edit')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterType === 'person_edit'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Tahrirlashlar
            </button>
            <button
              onClick={() => setFilterType('member_invited')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterType === 'member_invited'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Taklifnomalar
            </button>
          </div>

          {records.length > 0 && (
            <button
              onClick={handleClear}
              className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>

        {/* Timeline List */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <History className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-semibold">Tarix jurnali hozircha bo'sh</p>
              <p className="text-xs mt-1">Shajaraga yangi shaxslar qo'shilganda yoki tahrirlanganda yozuvlar shu yerda aks etadi.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-5">
              {filteredRecords.map((item) => (
                <div key={item.id} className="relative pl-6 group">
                  {/* Timeline Dot with Action Icon */}
                  <div className="absolute -left-3.5 top-0.5 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                    {getActionIcon(item.action)}
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-600 transition-colors shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeClass(item.action)}`}>
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {item.description}
                    </div>

                    {item.details && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                        {item.details}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Bajaruvchi: <strong className="text-slate-700 dark:text-slate-300">{item.actorName}</strong></span>
                      {item.personName && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{item.personName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
};
