import { HistoryRecord, HistoryActionType } from '../types';

const STORAGE_KEY_HISTORY = 'shajara_history_records_v1';

const INITIAL_HISTORY: HistoryRecord[] = [
  {
    id: 'hist_init_1',
    timestamp: Date.now() - 86400000 * 5,
    action: 'tree_reset',
    actorName: 'Muhammadrizo Xudoberdiyev',
    personName: 'Shajara',
    title: "Shajara daraxtiga asos solindi",
    description: "7 ajdod zanjiri va oila a'zolari dastlabki ro'yxati shakllantirildi.",
    details: "Dastlabki 7 pusht (Avazboy bobodan boshlab) kiritildi."
  },
  {
    id: 'hist_init_2',
    timestamp: Date.now() - 86400000 * 2,
    action: 'person_add',
    actorName: 'Muhammadrizo Xudoberdiyev',
    personName: 'Muhammadrizo',
    title: "Muhammadrizo shajaraga biriktirildi",
    description: "7-avlod vakili sifatida shajaradagi o'z o'rni belgilandi.",
    details: "Tug'ilgan sana: 2005-05-15, Manzil: Toshkent"
  }
];

export function getHistoryRecords(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(INITIAL_HISTORY));
      return INITIAL_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_HISTORY;
  } catch (err) {
    console.error("Error reading history from storage:", err);
    return INITIAL_HISTORY;
  }
}

export function addHistoryRecord(record: {
  action: HistoryActionType;
  actorName?: string;
  personName?: string;
  personId?: string;
  title: string;
  description: string;
  details?: string;
}): HistoryRecord {
  const newRecord: HistoryRecord = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    action: record.action,
    actorName: record.actorName || 'Oila a\'zosi',
    personName: record.personName,
    personId: record.personId,
    title: record.title,
    description: record.description,
    details: record.details
  };

  try {
    const existing = getHistoryRecords();
    const updated = [newRecord, ...existing].slice(0, 150); // So'nggi 150 ta harakat
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving history record:", err);
  }

  return newRecord;
}

export function clearHistoryRecords(): void {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([]));
  } catch (err) {
    console.error("Error clearing history:", err);
  }
}
