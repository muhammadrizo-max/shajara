import React, { useState, useRef } from 'react';
import { Gender, Person } from '../types';
import { fileToBase64 } from '../utils/storage';
import { saveMediaFile, getVideoDuration } from '../utils/mediaStorage';
import { 
  X, 
  Upload, 
  Trash2, 
  User, 
  Sparkles, 
  Briefcase, 
  MapPin, 
  Calendar, 
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Film,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit: Person | null;
  parentForNewChild: Person | null;
  people: Record<string, Person>;
  onSave: (person: Person) => void;
}

const AVATAR_GRADIENTS = [
  'from-sky-500 to-indigo-700',
  'from-emerald-500 to-teal-800',
  'from-amber-500 to-orange-700',
  'from-purple-600 to-indigo-900',
  'from-rose-500 to-pink-700',
  'from-teal-600 to-cyan-800',
  'from-blue-600 to-slate-800',
  'from-amber-600 to-amber-900',
];

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  isOpen,
  onClose,
  personToEdit,
  parentForNewChild,
  people,
  onSave,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const avatarVideoInputRef = useRef<HTMLInputElement>(null);
  const bioVideoInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!personToEdit;
  const isAddingChild = !!parentForNewChild;

  const [name, setName] = useState<string>(personToEdit?.name || '');
  const [surname, setSurname] = useState<string>(personToEdit?.surname || '');
  const [titleOrNickname, setTitleOrNickname] = useState<string>(personToEdit?.titleOrNickname || '');
  const [gender, setGender] = useState<Gender>(personToEdit?.gender || 'male');
  const [parentId, setParentId] = useState<string | null>(
    personToEdit ? personToEdit.parentId : parentForNewChild ? parentForNewChild.id : null
  );
  const [birthDate, setBirthDate] = useState<string>(personToEdit?.birthDate || '');
  const [birthYear, setBirthYear] = useState<string>(personToEdit?.birthYear || '');
  const [deathYear, setDeathYear] = useState<string>(personToEdit?.deathYear || '');
  const [isAlive, setIsAlive] = useState<boolean>(personToEdit?.isAlive !== false);
  const [occupation, setOccupation] = useState<string>(personToEdit?.occupation || '');
  const [location, setLocation] = useState<string>(personToEdit?.location || '');
  const [notes, setNotes] = useState<string>(personToEdit?.notes || '');
  
  // Photo and Avatar Video
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(personToEdit?.photoUrl);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | undefined>(personToEdit?.avatarVideoUrl);
  const [avatarMediaId, setAvatarMediaId] = useState<string | undefined>(personToEdit?.avatarMediaId);
  const [avatarVideoDuration, setAvatarVideoDuration] = useState<number | undefined>(personToEdit?.avatarVideoDuration);
  const [avatarColor, setAvatarColor] = useState<string>(
    personToEdit?.avatarColor || AVATAR_GRADIENTS[0]
  );

  // Biography Video
  const [biographyVideoUrl, setBiographyVideoUrl] = useState<string | undefined>(personToEdit?.biographyVideoUrl);
  const [biographyMediaId, setBiographyMediaId] = useState<string | undefined>(personToEdit?.biographyMediaId);
  const [biographyVideoDuration, setBiographyVideoDuration] = useState<number | undefined>(personToEdit?.biographyVideoDuration);
  const [bioVideoFileName, setBioVideoFileName] = useState<string>('');

  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Inline "Yangi ota qo'shish" sub-form state
  const [isAddingNewFather, setIsAddingNewFather] = useState<boolean>(false);
  const [newFatherName, setNewFatherName] = useState<string>('');
  const [newFatherSurname, setNewFatherSurname] = useState<string>('');
  const [newFatherNickname, setNewFatherNickname] = useState<string>('');
  const [newFatherBirthYear, setNewFatherBirthYear] = useState<string>('');
  const [newFatherGrandparentId, setNewFatherGrandparentId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateInlineFather = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newFatherName.trim()) {
      setError("Yangi otaning ismini kiriting.");
      return;
    }

    const calculatedGen = newFatherGrandparentId && people[newFatherGrandparentId]
      ? people[newFatherGrandparentId].generation + 1
      : 1;

    const newFatherId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdFather: Person = {
      id: newFatherId,
      name: newFatherName.trim(),
      surname: newFatherSurname.trim() || undefined,
      titleOrNickname: newFatherNickname.trim() || undefined,
      gender: 'male',
      parentId: newFatherGrandparentId,
      birthYear: newFatherBirthYear.trim() || undefined,
      generation: calculatedGen,
      isAlive: true,
      avatarColor: AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)],
    };

    onSave(createdFather);
    setParentId(newFatherId);
    setIsAddingNewFather(false);
    setNewFatherName('');
    setNewFatherSurname('');
    setNewFatherNickname('');
    setNewFatherBirthYear('');
    setError('');
  };

  // 1. Photo file upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Rasm hajmi 10MB dan kichik bo'lishi kerak");
        return;
      }
      try {
        setIsLoadingMedia(true);
        const base64 = await fileToBase64(file);
        setPhotoUrl(base64);
        setAvatarVideoUrl(undefined); // Clear video avatar if photo is picked
        setError('');
      } catch (err) {
        setError("Rasmni yuklashda xatolik yuz berdi");
      } finally {
        setIsLoadingMedia(false);
      }
    }
  };

  // 2. Avatar Video upload (max 1 daqiqa, 10MB)
  const handleAvatarVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 10MB size limit
      if (file.size > 10 * 1024 * 1024) {
        setError("Avatar video hajmi 10MB dan oshmasligi kerak!");
        return;
      }

      setIsLoadingMedia(true);
      try {
        const duration = await getVideoDuration(file);
        // Max 1 minute (60s + 2s buffer)
        if (duration > 62) {
          setError(`Avatar video juda uzun (${Math.round(duration)} soniya). Maksimal davomiyligi 1 daqiqa (60 soniya) bo'lishi lozim!`);
          setIsLoadingMedia(false);
          return;
        }

        const mediaId = `avatar_vid_${Date.now()}`;
        const url = await saveMediaFile(mediaId, file, 'avatar-video', duration);
        setAvatarVideoUrl(url);
        setAvatarMediaId(mediaId);
        setAvatarVideoDuration(Math.round(duration));
        setPhotoUrl(undefined); // Replace static photo
        setError('');
      } catch (err: any) {
        setError(err.message || "Avatar videoni yuklashda xatolik yuz berdi");
      } finally {
        setIsLoadingMedia(false);
      }
    }
  };

  // 3. Biography Video upload (max 10 daqiqa, 300MB)
  const handleBioVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 300MB size limit
      if (file.size > 300 * 1024 * 1024) {
        setError("Tarjimai hol videosi hajmi 300MB dan oshmasligi kerak!");
        return;
      }

      setIsLoadingMedia(true);
      try {
        const duration = await getVideoDuration(file);
        // Max 10 minutes (600s + 5s buffer)
        if (duration > 605) {
          setError(`Tarjimai hol videosi juda uzun (${Math.round(duration / 60)} daqiqa). Maksimal davomiyligi 10 daqiqa bo'lishi kerak!`);
          setIsLoadingMedia(false);
          return;
        }

        const mediaId = `bio_vid_${Date.now()}`;
        const url = await saveMediaFile(mediaId, file, 'bio-video', duration);
        setBiographyVideoUrl(url);
        setBiographyMediaId(mediaId);
        setBiographyVideoDuration(Math.round(duration));
        setBioVideoFileName(file.name);
        setError('');
      } catch (err: any) {
        setError(err.message || "Tarjimai hol videosini yuklashda xatolik yuz berdi");
      } finally {
        setIsLoadingMedia(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Iltimos, ismni kiriting");
      return;
    }

    const calculatedGeneration = parentId && people[parentId]
      ? people[parentId].generation + 1
      : personToEdit?.generation || 1;

    const updatedPerson: Person = {
      id: personToEdit?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      surname: surname.trim() || undefined,
      titleOrNickname: titleOrNickname.trim() || undefined,
      gender,
      parentId,
      birthDate: birthDate.trim() || undefined,
      birthYear: birthYear.trim() || (birthDate ? birthDate.split('-')[0] : undefined),
      deathYear: !isAlive ? (deathYear.trim() || undefined) : undefined,
      isAlive,
      occupation: occupation.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUrl,
      avatarVideoUrl,
      avatarMediaId,
      avatarVideoDuration,
      biographyVideoUrl,
      biographyMediaId,
      biographyVideoDuration,
      avatarColor,
      generation: calculatedGeneration,
    };

    onSave(updatedPerson);

    if (!isEditing) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // Safe fallback
      }
    }

    onClose();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 flex-shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {isEditing
                ? "Shaxs ma'lumotlarini tahrirlash"
                : isAddingChild
                ? `${parentForNewChild?.name}ga yangi farzand qo'shish`
                : "Yangi shaxs qo'shish"}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ism, rasm yoki qisqa video avatar, tarjimai hol va video xotiralar
            </p>
          </div>

          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Avatar (Photo OR Short Video Avatar) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Avatar (Rasm yoki Qisqa Video)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Video: max 1 daq / 10MB</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Preview Box */}
              <div className="relative group flex-shrink-0">
                {avatarVideoUrl ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-black">
                    <video
                      src={avatarVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-[9px] text-emerald-300 font-bold flex items-center gap-0.5">
                      <Film className="w-2.5 h-2.5" />
                      <span>{avatarVideoDuration}s</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarVideoUrl(undefined);
                        setAvatarVideoDuration(undefined);
                      }}
                      className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow hover:bg-rose-600"
                      title="Videoni olib tashlash"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : photoUrl ? (
                  <div className="relative w-20 h-20">
                    <img
                      src={photoUrl}
                      alt="Tanlangan rasm"
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(undefined)}
                      className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow hover:bg-rose-600"
                      title="Rasmni o'chirish"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-extrabold text-2xl shadow-md`}
                  >
                    {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                  </div>
                )}
              </div>

              {/* Upload Buttons */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="file-photo-input"
                />
                <input
                  ref={avatarVideoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleAvatarVideoUpload}
                  className="hidden"
                  id="file-avatar-video-input"
                />

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  {/* Photo Button */}
                  <button
                    type="button"
                    id="btn-choose-photo"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isLoadingMedia}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>Rasm yuklash</span>
                  </button>

                  {/* Video Avatar Button */}
                  <button
                    type="button"
                    id="btn-choose-video-avatar"
                    onClick={() => avatarVideoInputRef.current?.click()}
                    disabled={isLoadingMedia}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <VideoIcon className="w-3.5 h-3.5" />
                    <span>Qisqa video avatar (1 daq / 10MB)</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400">
                  {avatarVideoUrl
                    ? "✓ Qisqa video avatar muvaffaqiyatli yuklandi"
                    : photoUrl
                    ? "✓ Surat yuklandi"
                    : "Shaxs uchun fotosurat yoki 1 daqiqagacha bo'lgan qisqa video avatar yuklashingiz mumkin"}
                </p>
              </div>
            </div>

            {/* Avatar Color Palette (agar rasm ham video ham yo'q bo'lsa) */}
            {!photoUrl && !avatarVideoUrl && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Yoki avatar rangi tanlang:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_GRADIENTS.map((gradient) => (
                    <button
                      key={gradient}
                      type="button"
                      onClick={() => setAvatarColor(gradient)}
                      className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white transition-transform ${
                        avatarColor === gradient ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {avatarColor === gradient && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Ismi</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-person-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Umar, Akbarxo'ji, Kamoliddin"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Familiyasi (ixtiyoriy)
              </label>
              <input
                id="input-person-surname"
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Masalan: Xudoberdiyev"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Title or Nickname & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Unvoni / Laqabi / Sifat
              </label>
              <input
                id="input-person-nickname"
                type="text"
                value={titleOrNickname}
                onChange={(e) => setTitleOrNickname(e.target.value)}
                placeholder="Masalan: Yapaloq, Polvon, Qassob, Xo'ji, Rayis"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Jinsi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    gender === 'male'
                      ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>♂ Erkak (O'g'il)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    gender === 'female'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>♀ Ayol (Qiz)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Otasi (Parent selector) + Yangi ota qo'shish */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Shajaradagi otasi / bosh bo'g'in
              </label>
              <button
                type="button"
                id="btn-toggle-add-father"
                onClick={() => setIsAddingNewFather(!isAddingNewFather)}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                title="Agar otasi shajarada hali yo'q bo'lsa, yangi ota kiritish"
              >
                <span>{isAddingNewFather ? 'Bekor qilish' : '➕ Yangi ota qo\'shish'}</span>
              </button>
            </div>

            {isAddingNewFather ? (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 space-y-3 shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Yangi Ota ma'lumotlari
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Shajaraga yangi shaxs sifatida qo'shiladi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Otaning ismi *
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Xudoberdi, Muxiddin"
                      value={newFatherName}
                      onChange={(e) => setNewFatherName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Familiyasi
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Xudoberdiyev"
                      value={newFatherSurname}
                      onChange={(e) => setNewFatherSurname(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Unvoni / Laqabi
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Polvon, Qassob"
                      value={newFatherNickname}
                      onChange={(e) => setNewFatherNickname(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Tug'ilgan yili
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: 1950"
                      value={newFatherBirthYear}
                      onChange={(e) => setNewFatherBirthYear(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Ushbu yangi otaning o'z otasi (Bobosi)
                  </label>
                  <select
                    value={newFatherGrandparentId || ''}
                    onChange={(e) => setNewFatherGrandparentId(e.target.value || null)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Bosh ajdod (Otasiz / Shajara boshi)</option>
                    {(Object.values(people) as Person[])
                      .filter((p) => p.gender === 'male')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.surname || ''} ({p.generation}-pusht)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewFather(false)}
                    className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateInlineFather}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                  >
                    Otani yaratish va tanlash
                  </button>
                </div>
              </div>
            ) : (
              <select
                id="select-person-parent"
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Bosh ajdod (Shajara boshi / ildiz)</option>
                {(Object.values(people) as Person[])
                  .filter((p) => !personToEdit || p.id !== personToEdit.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.surname || ''} {p.titleOrNickname ? `(«${p.titleOrNickname}»)` : ''} — {p.generation}-pusht
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* 5. Occupation & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kasbi / Mashg'uloti
              </label>
              <input
                id="input-person-occupation"
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Masalan: O'qituvchi, Dehqon, Dasturchi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Yashagan joyi
              </label>
              <input
                id="input-person-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Masalan: Farg'ona, Toshkent, Andijon"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 6. Dates & Living Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To'liq tug'ilgan sana
              </label>
              <input
                id="input-person-birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  if (e.target.value) {
                    setBirthYear(e.target.value.split('-')[0]);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tug'ilgan yili
              </label>
              <input
                id="input-person-birth"
                type="text"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="Masalan: 1965"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isAlive}
                  onChange={(e) => setIsAlive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Hayot</span>
              </label>
            </div>

            {!isAlive && (
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Vafot etgan yili
                </label>
                <input
                  id="input-person-death"
                  type="text"
                  value={deathYear}
                  onChange={(e) => setDeathYear(e.target.value)}
                  placeholder="Masalan: 2012"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 7. Notes & Written Biography */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tarjimai hol / Qiziqarli xotiralar va fazilatlari
            </label>
            <textarea
              id="input-person-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ushbu shaxs haqida oilaviy xotiralar, elga qilgan xizmatlari va fazilatlari..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* 8. Full Biography Video Upload (max 10 daqiqa, 300MB) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    Tarjimai hol videosi (Video xotiralar)
                  </h4>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    Maksimal 10 daqiqagacha va 300MB gacha video joylash
                  </p>
                </div>
              </div>

              {biographyVideoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setBiographyVideoUrl(undefined);
                    setBiographyVideoDuration(undefined);
                    setBioVideoFileName('');
                  }}
                  className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>O'chirish</span>
                </button>
              )}
            </div>

            <input
              ref={bioVideoInputRef}
              type="file"
              accept="video/*"
              onChange={handleBioVideoUpload}
              className="hidden"
              id="file-bio-video-input"
            />

            {biographyVideoUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-amber-300/80 dark:border-amber-800/80 shadow-md">
                  <video
                    src={biographyVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-300 px-1">
                  <span className="flex items-center gap-1 font-medium truncate max-w-[200px]">
                    <Film className="w-3.5 h-3.5 text-amber-600" />
                    <span>{bioVideoFileName || "Tarjimai hol videosi"}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Davomiyligi: {formatDuration(biographyVideoDuration)}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => bioVideoInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800 hover:border-amber-500 bg-white/70 dark:bg-slate-900/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-amber-100/40 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    Videoni tanlash yoki bu yerga tortib kelish
                  </span>
                  <span className="text-[10px] text-slate-400">
                    MP4, WebM, MOV formatlarida (maksimal 10 daqiqa va 300MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              id="btn-submit-person-form"
              disabled={isLoadingMedia}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow transition-all flex items-center gap-1.5"
            >
              {isLoadingMedia ? (
                <span>Yuklanmoqda...</span>
              ) : (
                <span>{isEditing ? "O'zgarishlarni saqlash" : "Shajaraga qo'shish"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
