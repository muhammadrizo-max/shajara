import React, { useState, useRef, useEffect } from 'react';
import { Gender, Person } from '../types';
import { fileToBase64 } from '../utils/storage';
import { uploadImageToR2 } from '../utils/r2Upload';
import { 
  X, 
  Upload, 
  Trash2, 
  User, 
  Calendar, 
  Image as ImageIcon, 
  Camera, 
  AlertCircle, 
  Cloud,
  CheckCircle2,
  Loader2
} from 'lucide-react';
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
  onDelete?: (personId: string) => void;
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
  onDelete,
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
  const [motherId, setMotherId] = useState<string | null>(personToEdit?.motherId || null);
  const [spouseId, setSpouseId] = useState<string | null>(personToEdit?.spouseId || null);
  const [isNoFatherSelected, setIsNoFatherSelected] = useState<boolean>(false);

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
  const [isPhotoUploading, setIsPhotoUploading] = useState<boolean>(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number>(0);
  const [isR2Photo, setIsR2Photo] = useState<boolean>(() => {
    return Boolean(personToEdit?.photoUrl && personToEdit.photoUrl.startsWith('http'));
  });

  // Random gradient color selected automatically
  const [avatarColor, setAvatarColor] = useState<string>(() => {
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

  // Synchronize internal state whenever modal opens or props change
  useEffect(() => {
    if (!isOpen) return;

    if (personToEdit) {
      setName(personToEdit.name || '');
      setSurname(personToEdit.surname || '');
      setGender(personToEdit.gender || 'male');
      setParentId(personToEdit.parentId ?? null);
      setMotherId(personToEdit.motherId ?? null);
      setSpouseId(personToEdit.spouseId ?? null);
      setIsNoFatherSelected(personToEdit.parentId === null);
      setIsAlive(personToEdit.isAlive !== false);
      const onlyYr = Boolean(!personToEdit.birthDate && personToEdit.birthYear);
      setOnlyYearKnown(onlyYr);
      setBirthDate(personToEdit.birthDate || '');
      setBirthYear(personToEdit.birthYear || '');
      setDeathYear(personToEdit.deathYear || '');
      setLocation(personToEdit.location || '');
      setNotes(personToEdit.notes || '');
      setPhotoUrl(personToEdit.photoUrl);
      setIsR2Photo(Boolean(personToEdit.photoUrl && personToEdit.photoUrl.startsWith('http')));
      setAvatarColor(personToEdit.avatarColor || AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)]);
      setError('');
    } else {
      // Adding new relative
      setName('');
      setSurname('');
      setMotherId(null);
      setSpouseId(null);

      // Auto gender by relation type:
      let targetGender: Gender = 'male';
      if (targetRelationType === 'mother' || targetRelationType === 'daughter') {
        targetGender = 'female';
      } else if (targetRelationType === 'father' || targetRelationType === 'son') {
        targetGender = 'male';
      } else if (targetRelationType === 'spouse' && spouseForPerson) {
        targetGender = spouseForPerson.gender === 'male' ? 'female' : 'male';
      } else if (initialGender) {
        targetGender = initialGender;
      }
      setGender(targetGender);

      if (parentForNewChild) {
        setParentId(parentForNewChild.id);
        setIsNoFatherSelected(false);
      } else {
        setParentId(null);
        setIsNoFatherSelected(false);
      }

      setIsAlive(true);
      setOnlyYearKnown(false);
      setBirthDate('');
      setBirthYear('');
      setDeathYear('');
      setLocation('');
      setNotes('');
      setPhotoUrl(undefined);
      setIsR2Photo(false);
      setAvatarColor(AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)]);
      setError('');
    }
    setIsAddingNewFather(false);
  }, [
    isOpen,
    personToEdit,
    parentForNewChild,
    childForNewParent,
    spouseForPerson,
    targetRelationType,
    initialGender,
  ]);

  // Find all invalid candidate IDs to prevent self-referencing and circular ancestry
  const invalidParentIds = React.useMemo(() => {
    const invalid = new Set<string>();
    
    // 1. Cannot be own father
    if (personToEdit) {
      invalid.add(personToEdit.id);
    }
    // 2. Child cannot be father of their own parent
    if (childForNewParent) {
      invalid.add(childForNewParent.id);
    }
    // 3. Spouse cannot be parent
    if (spouseForPerson) {
      invalid.add(spouseForPerson.id);
    }

    // 4. Find all descendants of personToEdit or childForNewParent
    const targetRootIds = [
      personToEdit?.id,
      childForNewParent?.id
    ].filter(Boolean) as string[];

    const queue = [...targetRootIds];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      invalid.add(currentId);
      (Object.values(people) as Person[]).forEach((p) => {
        if ((p.parentId === currentId || p.motherId === currentId) && !invalid.has(p.id)) {
          invalid.add(p.id);
          queue.push(p.id);
        }
      });
    }

    return invalid;
  }, [personToEdit, childForNewParent, spouseForPerson, people]);

  const availableParents = React.useMemo(() => {
    return (Object.values(people) as Person[]).filter(
      (p) => !invalidParentIds.has(p.id) && (p.gender === 'male' || !p.gender)
    );
  }, [people, invalidParentIds]);

  const availableMothers = React.useMemo(() => {
    return (Object.values(people) as Person[]).filter(
      (p) => !invalidParentIds.has(p.id) && p.id !== personToEdit?.id && (p.gender === 'female' || !p.gender)
    );
  }, [people, invalidParentIds, personToEdit]);

  const availableSpouses = React.useMemo(() => {
    return (Object.values(people) as Person[]).filter(
      (p) => p.id !== personToEdit?.id && p.id !== parentId && p.id !== motherId
    );
  }, [people, personToEdit, parentId, motherId]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("Rasm hajmi 20MB dan oshmasligi kerak");
      return;
    }

    setIsPhotoUploading(true);
    setPhotoUploadProgress(10);
    setError('');

    try {
      const result = await uploadImageToR2(file, {
        folder: 'avatars',
        onProgress: (pct) => setPhotoUploadProgress(pct),
      });

      if (result.success && result.url) {
        setPhotoUrl(result.url);
        setIsR2Photo(result.isR2);
        setIsPhotoUploading(false);
        setPhotoUploadProgress(100);
      } else {
        setError(result.error || "Rasmni yuklashda xatolik yuz berdi");
        setIsPhotoUploading(false);
      }
    } catch (err: any) {
      console.error("[EditPersonModal] Rasm yuklash xatosi:", err);
      setError("Rasmni yuklashda xatolik yuz berdi: " + (err?.message || ''));
      setIsPhotoUploading(false);
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
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
      parentId: isNoFatherSelected ? null : parentId,
      motherId: motherId || undefined,
      motherName: motherId && people[motherId] ? `${people[motherId].name} ${people[motherId].surname || ''}`.trim() : undefined,
      spouseId: spouseId || undefined,
      spouseName: spouseId && people[spouseId] ? `${people[spouseId].name} ${people[spouseId].surname || ''}`.trim() : undefined,
      birthDate: !onlyYearKnown && birthDate.trim() ? birthDate.trim() : undefined,
      birthYear: effectiveBirthYear || undefined,
      deathYear: !isAlive ? (deathYear.trim() || undefined) : undefined,
      isAlive,
      location: location.trim() || undefined,
      photoUrl,
      biographyVideoUrl: personToEdit?.biographyVideoUrl,
      biographyMediaId: personToEdit?.biographyMediaId,
      biographyVideoDuration: personToEdit?.biographyVideoDuration,
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
        const fatherId = childForNewParent.parentId;
        const father = fatherId && people[fatherId] ? people[fatherId] : null;

        const updatedMother: Person = {
          ...updatedPerson,
          generation: Math.max(1, childForNewParent.generation - 1),
          spouseId: father ? father.id : undefined,
          spouseName: father ? `${father.name} ${father.surname || ''}`.trim() : undefined,
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
                onClick={() => {
                  if (!isPhotoUploading) {
                    photoInputRef.current?.click();
                  }
                }}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-lg border-2 border-emerald-500 relative flex items-center justify-center transition-transform ${
                  isPhotoUploading ? 'cursor-wait opacity-90' : 'cursor-pointer hover:scale-105 active:scale-95'
                }`}
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

                {/* Yuklanish progress indikatori (Cloudflare R2) */}
                {isPhotoUploading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20 p-2 animate-in fade-in">
                    <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mb-1" />
                    <span className="text-xs font-black text-emerald-300">{photoUploadProgress}%</span>
                    <span className="text-[9px] font-semibold text-slate-300 text-center leading-tight">R2 ga yuklanmoqda...</span>
                  </div>
                )}

                {/* Overlay camera icon right on the avatar */}
                {!isPhotoUploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-bold">O'zgartirish</span>
                  </div>
                )}
              </div>

              {photoUrl && !isPhotoUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoUrl(undefined);
                    setIsR2Photo(false);
                  }}
                  className="absolute -top-1 -right-1 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer z-30"
                  title="Rasmni o'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              {isR2Photo && photoUrl && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                  <Cloud className="w-3 h-3 text-emerald-500" />
                  <span>Cloudflare R2 xotirasida</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Avatar ustiga bosib fotosurat yuklang yoki almashtiring
              </p>
            </div>
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



          {/* 6. Otasi (Parent selector) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAddingParent && childForNewParent
                  ? targetRelationType === 'mother'
                    ? `Onaning otasi (Bobo) / Bosh bo'g'in`
                    : `Otaning o'z otasi (Bobo) / Bosh bo'g'in`
                  : "Shajaradagi otasi / bosh bo'g'in"}
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewFather(!isAddingNewFather)}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{isAddingNewFather ? 'Bekor qilish' : '➕ Yangi ota qo\'shish'}</span>
              </button>
            </div>

            {isAddingParent && childForNewParent && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                «{childForNewParent.name}» uchun yangi ota qo'shilmoqda. Agar uning ham otasi (bobo) shajarada mavjud bo'lsa tanlang, aks holda «Bosh ajdod» sifatida qoldiring.
              </p>
            )}

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
              <div className="space-y-1">
                <select
                  id="select-person-parent"
                  value={isNoFatherSelected ? 'no_father' : (parentId || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'no_father') {
                      setIsNoFatherSelected(true);
                      setParentId(null);
                    } else if (val === '') {
                      setIsNoFatherSelected(false);
                      setParentId(null);
                    } else {
                      setIsNoFatherSelected(false);
                      setParentId(val);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="no_father">Ota belgilanmasin (Mustaqil / Otasiz)</option>
                  <option value="">Bosh ajdod (Shajara boshi / ildiz)</option>
                  {availableParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.surname || ''} — {p.generation}-pusht
                    </option>
                  ))}
                </select>
                {isNoFatherSelected && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    ✓ Ota belgilanmadi (Mustaqil shaxs sifatida saqlanadi).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Shajaradagi onasi va Turmush o'rtog'i (Munosabatlarni tahrirlash) */}
          {isEditing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              {/* Onasi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Shajaradagi onasi
                </label>
                <select
                  value={motherId || ''}
                  onChange={(e) => setMotherId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Onasi belgilanmasin</option>
                  {availableMothers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.surname || ''} — {p.generation}-pusht
                    </option>
                  ))}
                </select>
              </div>

              {/* Turmush o'rtog'i */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Turmush o'rtog'i
                </label>
                <select
                  value={spouseId || ''}
                  onChange={(e) => setSpouseId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Turmush o'rtog'i yo'q</option>
                  {availableSpouses.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.surname || ''} ({p.gender === 'female' ? 'Ayol' : 'Erkak'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
            {isEditing && personToEdit && onDelete ? (
              <button
                type="button"
                id="btn-delete-person-profile"
                onClick={() => {
                  const total = Object.keys(people).length;
                  if (total <= 1) {
                    setError("Shajarada kamida 1 kishi bo'lishi shart, oxirgi shaxsni o'chira olmaysiz!");
                    return;
                  }
                  if (window.confirm(`«${personToEdit.name}» profilini shajaradan butunlay o'chirishni tasdiqlaysizmi?`)) {
                    onDelete(personToEdit.id);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Profilni o'chirish</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
};
