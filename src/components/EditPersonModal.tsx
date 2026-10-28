import React, { useState, useRef } from 'react';
import { Gender, Person } from '../types';
import { fileToBase64 } from '../utils/storage';
import { 
  X, 
  Upload, 
  Trash2, 
  User, 
  Calendar, 
  Image as ImageIcon,
  Camera,
  AlertCircle,
  Video,
  Film
} from 'lucide-react';
import { saveMediaFile, deleteMediaFile } from '../utils/mediaStorage';
import confetti from 'canvas-confetti';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit: Person | null;
  parentForNewChild: Person | null;
  childForNewParent?: Person | null;
  spouseForPerson?: Person | null;
  targetRelationType?: 'father' | 'mother' | 'spouse' | 'son' | 'daughter' | null;
  initialGender?: Gender;
  people: Record<string, Person>;
  onSave: (person: Person) => void;
  onSaveWithRelation?: (newPerson: Person, relatedPerson?: Person) => void;
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
  childForNewParent,
  spouseForPerson,
  targetRelationType,
  initialGender,
  people,
  onSave,
  onSaveWithRelation,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!personToEdit;
  const isAddingChild = !!parentForNewChild;
  const isAddingParent = !!childForNewParent;
  const isAddingSpouse = !!spouseForPerson;

  const defaultGender: Gender = personToEdit?.gender || initialGender || (
    targetRelationType === 'mother' || targetRelationType === 'daughter'
      ? 'female'
      : targetRelationType === 'spouse' && spouseForPerson
      ? (spouseForPerson.gender === 'male' ? 'female' : 'male')
      : 'male'
  );

  const [name, setName] = useState<string>(personToEdit?.name || '');
  const [surname, setSurname] = useState<string>(personToEdit?.surname || '');
  const [gender, setGender] = useState<Gender>(defaultGender);
  const [parentId, setParentId] = useState<string | null>(
    personToEdit ? personToEdit.parentId : parentForNewChild ? parentForNewChild.id : null
  );

  // Date and Life status
  const [isAlive, setIsAlive] = useState<boolean>(personToEdit?.isAlive !== false);
  const [onlyYearKnown, setOnlyYearKnown] = useState<boolean>(
    Boolean(!personToEdit?.birthDate && personToEdit?.birthYear)
  );
  const [birthDate, setBirthDate] = useState<string>(personToEdit?.birthDate || '');
  const [birthYear, setBirthYear] = useState<string>(personToEdit?.birthYear || '');
  const [deathYear, setDeathYear] = useState<string>(personToEdit?.deathYear || '');

  const [location, setLocation] = useState<string>(personToEdit?.location || '');
  const [notes, setNotes] = useState<string>(personToEdit?.notes || '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(personToEdit?.photoUrl);
  
  // Video state (Biografik xotira videosi - 10 daqiqagacha)
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [biographyVideoUrl, setBiographyVideoUrl] = useState<string | undefined>(
    personToEdit?.biographyVideoUrl
  );
  const [biographyMediaId, setBiographyMediaId] = useState<string | undefined>(
    personToEdit?.biographyMediaId
  );
  const [biographyVideoDuration, setBiographyVideoDuration] = useState<number | undefined>(
    personToEdit?.biographyVideoDuration
  );
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  // Random gradient color selected automatically
  const [avatarColor] = useState<string>(() => {
    if (personToEdit?.avatarColor) return personToEdit.avatarColor;
    return AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
  });

  const [error, setError] = useState<string>('');

  // Inline "Yangi ota qo'shish" sub-form state
  const [isAddingNewFather, setIsAddingNewFather] = useState<boolean>(false);
  const [newFatherName, setNewFatherName] = useState<string>('');
  const [newFatherSurname, setNewFatherSurname] = useState<string>('');
  const [newFatherBirthYear, setNewFatherBirthYear] = useState<string>('');
  const [newFatherGrandparentId, setNewFatherGrandparentId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setError("Rasm hajmi 15MB dan oshmasligi kerak");
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setPhotoUrl(base64);
        setError('');
      } catch (err: any) {
        setError("Rasmni yuklashda xatolik yuz berdi");
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 300 * 1024 * 1024) {
      setError("Video hajmi 300MB dan oshmasligi kerak");
      return;
    }

    setIsVideoUploading(true);
    setError('');

    try {
      const mediaId = biographyMediaId || `bio_vid_${Date.now()}`;
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      const tempUrl = URL.createObjectURL(file);
      videoEl.src = tempUrl;

      videoEl.onloadedmetadata = async () => {
        URL.revokeObjectURL(tempUrl);
        const duration = Math.round(videoEl.duration);

        if (duration > 600) {
          setError("Video davomiyligi maksimum 10 daqiqa (600 soniya) bo'lishi kerak");
          setIsVideoUploading(false);
          return;
        }

        const storedUrl = await saveMediaFile(mediaId, file, 'bio-video', duration);
        setBiographyMediaId(mediaId);
        setBiographyVideoUrl(storedUrl);
        setBiographyVideoDuration(duration);
        setIsVideoUploading(false);
      };

      videoEl.onerror = async () => {
        URL.revokeObjectURL(tempUrl);
        const storedUrl = await saveMediaFile(mediaId, file, 'bio-video');
        setBiographyMediaId(mediaId);
        setBiographyVideoUrl(storedUrl);
        setIsVideoUploading(false);
      };
    } catch (err: any) {
      setError("Videoni saqlashda xatolik yuz berdi");
      setIsVideoUploading(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (biographyMediaId) {
      await deleteMediaFile(biographyMediaId);
    }
    setBiographyVideoUrl(undefined);
    setBiographyMediaId(undefined);
    setBiographyVideoDuration(undefined);
  };

  const handleCreateInlineFather = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newFatherName.trim()) {
      setError("Yangi otaning ismini kiriting.");
      return;
    }

    const calculatedGen = newFatherGrandparentId && people[newFatherGrandparentId]
      ? people[newFatherGrandparentId].generation + 1
      : 1;

    const newFatherId = `p_${Date.now()}_father`;
    const newFather: Person = {
      id: newFatherId,
      name: newFatherName.trim(),
      surname: newFatherSurname.trim() || undefined,
      gender: 'male',
      parentId: newFatherGrandparentId,
      birthYear: newFatherBirthYear.trim() || undefined,
      isAlive: true,
      avatarColor: AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)],
      generation: calculatedGen,
    };

    onSave(newFather);
    setParentId(newFatherId);
    setIsAddingNewFather(false);
    setNewFatherName('');
    setNewFatherSurname('');
    setNewFatherBirthYear('');
    setNewFatherGrandparentId(null);
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

    const effectiveBirthYear = onlyYearKnown
      ? birthYear.trim()
      : birthDate ? birthDate.split('-')[0] : (birthYear.trim() || undefined);

    const updatedPerson: Person = {
      id: personToEdit?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      surname: surname.trim() || undefined,
      gender,
      parentId,
      birthDate: !onlyYearKnown && birthDate.trim() ? birthDate.trim() : undefined,
      birthYear: effectiveBirthYear || undefined,
      deathYear: !isAlive ? (deathYear.trim() || undefined) : undefined,
      isAlive,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUrl,
      biographyVideoUrl,
      biographyMediaId,
      biographyVideoDuration,
      avatarColor,
      generation: calculatedGeneration,
    };

    if (isAddingSpouse && spouseForPerson) {
      const updatedPersonWithSpouse: Person = {
        ...updatedPerson,
        spouseId: spouseForPerson.id,
        spouseName: spouseForPerson.name,
        generation: spouseForPerson.generation,
      };
      const updatedSpouse: Person = {
        ...spouseForPerson,
        spouseId: updatedPerson.id,
        spouseName: `${updatedPerson.name} ${updatedPerson.surname || ''}`.trim(),
      };
      if (onSaveWithRelation) {
        onSaveWithRelation(updatedPersonWithSpouse, updatedSpouse);
      } else {
        onSave(updatedPersonWithSpouse);
        onSave(updatedSpouse);
      }
    } else if (isAddingParent && childForNewParent) {
      if (gender === 'female') {
        const updatedMother: Person = {
          ...updatedPerson,
          generation: Math.max(1, childForNewParent.generation - 1),
        };
        const updatedChild: Person = {
          ...childForNewParent,
          motherId: updatedPerson.id,
          motherName: `${updatedPerson.name} ${updatedPerson.surname || ''}`.trim(),
        };
        if (onSaveWithRelation) {
          onSaveWithRelation(updatedMother, updatedChild);
        } else {
          onSave(updatedMother);
          onSave(updatedChild);
        }
      } else {
        const updatedChild: Person = {
          ...childForNewParent,
          parentId: updatedPerson.id,
        };
        if (onSaveWithRelation) {
          onSaveWithRelation(updatedPerson, updatedChild);
        } else {
          onSave(updatedPerson);
          onSave(updatedChild);
        }
      }
    } else {
      onSave(updatedPerson);
    }

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overscroll-contain">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 flex-shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
              {isEditing
                ? "Shaxs ma'lumotlarini tahrirlash"
                : targetRelationType === 'father' && childForNewParent
                ? `«${childForNewParent.name}»ga Ota qo'shish`
                : targetRelationType === 'mother' && childForNewParent
                ? `«${childForNewParent.name}»ga Ona qo'shish`
                : targetRelationType === 'spouse' && spouseForPerson
                ? `«${spouseForPerson.name}»ga Turmush o'rtoq qo'shish`
                : targetRelationType === 'son' && parentForNewChild
                ? `«${parentForNewChild.name}»ga O'g'il farzand qo'shish`
                : targetRelationType === 'daughter' && parentForNewChild
                ? `«${parentForNewChild.name}»ga Qiz farzand qo'shish`
                : isAddingParent
                ? `«${childForNewParent?.name}» uchun ota qo'shish`
                : isAddingChild
                ? `${parentForNewChild?.name}ga yangi farzand qo'shish`
                : "Yangi shaxs qo'shish"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isAddingParent
                ? "Shajarada yuqori bo'g'in (ota / ajdod) kiritilmoqda"
                : "Ism, fotosurat va shaxsiy ma'lumotlar"}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Center Avatar & Rasm Yuklash (Image 4 talabi) */}
          <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="file-photo-input"
            />

            {/* Avatar Preview Box (Centered - avatar ustiga bosilganda rasm yuklanadi) */}
            <div className="relative group">
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden cursor-pointer shadow-lg border-2 border-emerald-500 relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                title="Avatar ustiga bosib rasm yuklang"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profil surati"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-extrabold text-3xl`}>
                    {name ? name.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
                  </div>
                )}

                {/* Overlay camera icon right on the avatar */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] font-bold">O'zgartirish</span>
                </div>
              </div>

              {photoUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoUrl(undefined);
                  }}
                  className="absolute -top-1 -right-1 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                  title="Rasmni o'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Avatar ustiga bosib fotosurat yuklang yoki almashtiring
            </p>
          </div>

          {/* 2. Ism va Familiya (Jins tanlashdan avval) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Ismi</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-person-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Umar, Akbarxo'ji"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Familiyasi (ixtiyoriy)
              </label>
              <input
                id="input-person-surname"
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Masalan: Xudoberdiyev"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Jins tanlash - Ism va familiyadan keyin markazda (Foydalanuvchi talabi) */}
          <div className="space-y-1.5 text-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Jinsi
            </label>
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>♂ Erkak (O'g'il / Ota)</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>♀ Ayol (Qiz / Ona)</span>
              </button>
            </div>
          </div>

          {/* 4. Tug'ilgan sana va Hayot holati (Image 5: Hayot yonida 'Faqatgina yil ma'lum' checkboxi) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tug'ilgan sana / Yili</span>
              </span>

              {/* Checkboxes: Hayot & Faqatgina yil ma'lum (Image 5) */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAlive}
                    onChange={(e) => setIsAlive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Hayot</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyYearKnown}
                    onChange={(e) => {
                      setOnlyYearKnown(e.target.checked);
                      if (e.target.checked && birthDate) {
                        setBirthYear(birthDate.split('-')[0]);
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Faqatgina yil ma'lum</span>
                </label>
              </div>
            </div>

            {/* Input field depends on onlyYearKnown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {onlyYearKnown ? "Tug'ilgan yili" : "To'liq tug'ilgan sana"}
                </label>
                {onlyYearKnown ? (
                  <input
                    type="number"
                    min="1700"
                    max="2099"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="Masalan: 1965"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                ) : (
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      if (e.target.value) {
                        setBirthYear(e.target.value.split('-')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}
              </div>

              {!isAlive && (
                <div>
                  <label className="text-[11px] font-semibold text-rose-500 block mb-1">
                    Vafot etgan yili
                  </label>
                  <input
                    type="number"
                    min="1700"
                    max="2099"
                    value={deathYear}
                    onChange={(e) => setDeathYear(e.target.value)}
                    placeholder="Masalan: 2015"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 5. Xotira videosi / Biografik video (10 daqiqagacha) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-emerald-600" />
                <span>Biografik video / Xotira (10 daqiqagacha)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Max: 10 daqiqa / 300MB
              </span>
            </div>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              id="file-video-input"
            />

            {biographyVideoUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-48 flex items-center justify-center">
                  <video
                    src={biographyVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                    title="Videoni o'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {biographyVideoDuration && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <span>Davomiyligi: {Math.floor(biographyVideoDuration / 60)} daq {biographyVideoDuration % 60} soniya</span>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Boshqa video tanlash
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isVideoUploading}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white/60 dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-xs font-bold text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Film className="w-5 h-5 text-emerald-600" />
                  <span>{isVideoUploading ? "Video yuklanmoqda..." : "Shaxsning qisqa video xotirasini yuklash"}</span>
                  <span className="text-[10px] text-slate-400 font-normal">MP4, MOV, WebM formatlari (10 daqiqagacha)</span>
                </button>
              </div>
            )}
          </div>

          {/* 6. Otasi (Parent selector) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Shajaradagi otasi / bosh bo'g'in
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewFather(!isAddingNewFather)}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{isAddingNewFather ? 'Bekor qilish' : '➕ Yangi ota qo\'shish'}</span>
              </button>
            </div>

            {isAddingNewFather ? (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 space-y-2.5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Otaning ismi *"
                    value={newFatherName}
                    onChange={(e) => setNewFatherName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Familiyasi"
                    value={newFatherSurname}
                    onChange={(e) => setNewFatherSurname(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewFather(false)}
                    className="px-2.5 py-1 text-xs text-slate-500"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateInlineFather}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    Otani yaratish
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
                      {p.name} {p.surname || ''} — {p.generation}-pusht
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* 6. Yashagan joyi va Qisqacha xotiralar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Yashagan joyi (ixtiyoriy)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Masalan: Farg'ona, Toshkent"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Qisqacha xotiralar (ixtiyoriy)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Esdaliklar, fazilatlari..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              id="btn-submit-person-form"
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isEditing ? "O'zgarishlarni saqlash" : "Shajaraga qo'shish"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
