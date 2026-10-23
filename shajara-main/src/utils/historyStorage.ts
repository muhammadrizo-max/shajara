import { HistoryRecord, HistoryActionType } from '../types';

const STORAGE_KEY_HISTORY = 'shajara_clean_history_records_v2';

// Yangi tizimda dastlabki default tarix bo'sh bo'ladi
const INITIAL_HISTORY: HistoryRecord[] = [];

export function getHistoryRecords(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) {
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
    const updated = [newRecord, ...existing].slice(0, 150);
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
