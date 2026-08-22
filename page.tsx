'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Upload, Search, ZoomIn, ZoomOut } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  image?: string;
  bio?: string;
  parentId?: string;
}

interface FamilyNode {
  person: Person;
  children: FamilyNode[];
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>([
    { id: '1', name: 'Umar Yopaloq', birthDate: '1940-01-15', gender: 'male', bio: 'Ajdodim' },
    { id: '2', name: 'Amma', birthDate: '1945-06-20', gender: 'female', bio: 'Ajdodim xotini', parentId: '1' },
    { id: '3', name: 'Donyor Polvon', birthDate: '1960-03-10', gender: 'male', parentId: '1' },
    { id: '4', name: 'Esen Qassob', birthDate: '1962-07-25', gender: 'male', parentId: '1' },
    { id: '5', name: 'Akbarxoji', birthDate: '1985-11-12', gender: 'male', parentId: '3' },
    { id: '6', name: 'Ergash Xoji', birthDate: '1987-02-18', gender: 'male', parentId: '3' },
    { id: '7', name: 'Xudoberdi', birthDate: '1988-09-05', gender: 'male', parentId: '4' }
  ]);

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [formData, setFormData] = useState<Partial<Person>>({});
  const [imagePreview, setImagePreview] = useState<string>('');

  const buildTree = useCallback((): FamilyNode[] => {
    const roots = people.filter(p => !p.parentId);
    const buildNode = (personId: string): FamilyNode => {
      const person = people.find(p => p.id === personId)!;
      const children = people.filter(p => p.parentId === personId).map(p => buildNode(p.id));
      return { person, children };
    };
    return roots.map(r => buildNode(r.id));
  }, [people]);

  const handleAddPerson = useCallback(() => {
    if (!formData.name) return;
    const newPerson: Person = {
      id: Date.now().toString(),
      name: formData.name,
      birthDate: formData.birthDate || new Date().toISOString().split('T')[0],
      gender: formData.gender || 'male',
      bio: formData.bio,
      image: imagePreview,
      parentId: formData.parentId
    };
    setPeople([...people, newPerson]);
    setFormData({});
    setImagePreview('');
  }, [formData, imagePreview, people]);

  const handleDeletePerson = useCallback((id: string) => {
    setPeople(people.filter(p => p.id !== id && p.parentId !== id));
    setSelectedPerson(null);
  }, [people]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddChild = (parentId: string) => {
    setFormData({ parentId });
    setEditMode(true);
    setSelectedPerson(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <motion.header initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-black/30 border-b border-purple-500/30 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" whileHover={{ scale: 1.05 }}>
            👨‍👩‍👧‍👦 Shajaraviy Web
          </motion.h1>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setEditMode(!editMode); setFormData({}); setImagePreview(''); }} className={`px-6 py-2 rounded-lg font-semibold transition-all ${editMode ? 'bg-red-500/80 hover:bg-red-600' : 'bg-purple-500/80 hover:bg-purple-600'}`}>
            {editMode ? '✕ Bekor' : '✎ Tahrirlash'}
          </motion.button>
        </div>
      </motion.header>

      <div className="pt-20 flex gap-6 p-6 max-w-7xl mx-auto">
        <div className="flex-1">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="sticky top-24 space-y-4 z-20">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-purple-400" size={20} />
              <input type="text" placeholder="Qidrish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="flex gap-2 bg-slate-800/30 backdrop-blur p-2 rounded-lg border border-purple-500/20">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setZoom(Math.min(zoom + 0.2, 2))} className="flex-1 p-2 hover:bg-purple-500/30 rounded transition-all"><ZoomIn size={20} /></motion.button>
              <span className="px-2 py-1 text-sm text-purple-300 self-center">{Math.round(zoom * 100)}%</span>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))} className="flex-1 p-2 hover:bg-purple-500/30 rounded transition-all"><ZoomOut size={20} /></motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 bg-slate-800/20 backdrop-blur border border-purple-500/20 rounded-xl p-8 overflow-auto max-h-[70vh]" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            <TreeRenderer nodes={buildTree()} onPersonClick={setSelectedPerson} onAddChild={handleAddChild} editMode={editMode} />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {editMode && !selectedPerson ? (
            <motion.div key="form" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="w-96">
              <div className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 backdrop-blur border border-purple-500/30 rounded-xl p-6 sticky top-24 max-h-[85vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-purple-300">Yangi Odamni Qo'shish</h2>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-purple-300 mb-2">Rasm</label>
                  <motion.label whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center border-2 border-dashed border-purple-500/50 rounded-lg p-6 cursor-pointer hover:border-purple-400 transition-all">
                    {imagePreview ? <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded" /> : (<><Upload className="text-purple-400 mb-2" size={32} /><span className="text-sm text-purple-300">Rasm yuklang</span></>)}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </motion.label>
                </div>
                <div className="space-y-4">
                  <input type="text" placeholder="Ismi" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400" />
                  <input type="date" value={formData.birthDate || ''} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400" />
                  <select value={formData.gender || 'male'} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })} className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400">
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                  <textarea placeholder="Biroqqa haqida ma'lumot" value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 resize-none" rows={3} />
                  {formData.parentId && <div className="p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg"><p className="text-sm text-purple-300">Ota/ona: <span className="font-semibold">{people.find(p => p.id === formData.parentId)?.name}</span></p></div>}
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddPerson} className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-3 rounded-lg font-bold transition-all"><Plus size={20} className="inline mr-2" />Qo'shish</motion.button>
              </div>
            </motion.div>
          ) : selectedPerson ? (
            <motion.div key="details" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="w-96">
              <div className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 backdrop-blur border border-purple-500/30 rounded-xl p-6 sticky top-24 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-purple-300">{selectedPerson.name}</h2>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => setSelectedPerson(null)} className="p-1 hover:bg-purple-500/30 rounded transition-all"><X size={24} /></motion.button>
                </div>
                {selectedPerson.image && <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} src={selectedPerson.image} alt={selectedPerson.name} className="w-full h-48 object-cover rounded-lg mb-6" />}
                <div className="space-y-4 mb-6">
                  <div className="p-3 bg-slate-700/50 rounded-lg"><p className="text-sm text-purple-300">Tug'ilgan sana</p><p className="font-semibold">{new Date(selectedPerson.birthDate).toLocaleDateString('uz-UZ')}</p></div>
                  {selectedPerson.bio && <div className="p-3 bg-slate-700/50 rounded-lg"><p className="text-sm text-purple-300">Biroqqa haqida</p><p className="text-sm">{selectedPerson.bio}</p></div>}
                  {selectedPerson.parentId && <div className="p-3 bg-slate-700/50 rounded-lg"><p className="text-sm text-purple-300">Ota/Ona</p><p className="font-semibold">{people.find(p => p.id === selectedPerson.parentId)?.name}</p></div>}
                  {people.filter(p => p.parentId === selectedPerson.id).length > 0 && <div className="p-3 bg-slate-700/50 rounded-lg"><p className="text-sm text-purple-300 mb-2">Bolalari</p><div className="space-y-1">{people.filter(p => p.parentId === selectedPerson.id).map(child => <button key={child.id} onClick={() => setSelectedPerson(child)} className="text-left w-full px-2 py-1 text-sm hover:bg-purple-500/30 rounded transition-all text-purple-300 hover:text-purple-100">→ {child.name}</button>)}</div></div>}
                  {people.filter(p => p.parentId === selectedPerson.parentId && p.id !== selectedPerson.id).length > 0 && <div className="p-3 bg-slate-700/50 rounded-lg"><p className="text-sm text-purple-300 mb-2">Qardoshlari</p><div className="space-y-1">{people.filter(p => p.parentId === selectedPerson.parentId && p.id !== selectedPerson.id).map(sibling => <button key={sibling.id} onClick={() => setSelectedPerson(sibling)} className="text-left w-full px-2 py-1 text-sm hover:bg-purple-500/30 rounded transition-all text-purple-300 hover:text-purple-100">→ {sibling.name} ({sibling.gender === 'male' ? 'Qardosh' : 'Opa/Singil'})</button>)}</div></div>}
                </div>
                {editMode && <div className="flex gap-2"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setFormData(selectedPerson); setImagePreview(selectedPerson.image || ''); }} className="flex-1 bg-blue-500/80 hover:bg-blue-600 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"><Edit2 size={18} /> O'zgartirish</motion.button><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDeletePerson(selectedPerson.id)} className="flex-1 bg-red-500/80 hover:bg-red-600 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"><Trash2 size={18} /> O'chirish</motion.button></div>}
                {editMode && <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleAddChild(selectedPerson.id)} className="w-full mt-3 bg-green-500/80 hover:bg-green-600 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"><Plus size={18} /> Oʻgul Qo'shish</motion.button>}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface TreeRendererProps {
  nodes: FamilyNode[];
  onPersonClick: (person: Person) => void;
  onAddChild: (parentId: string) => void;
  editMode: boolean;
}

const TreeRenderer: React.FC<TreeRendererProps> = ({ nodes, onPersonClick, onAddChild, editMode }) => {
  return (
    <div className="space-y-8">
      {nodes.map((node, idx) => (
        <motion.div key={node.person.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
          <PersonNode node={node} depth={0} onPersonClick={onPersonClick} onAddChild={onAddChild} editMode={editMode} />
        </motion.div>
      ))}
    </div>
  );
};

interface PersonNodeProps {
  node: FamilyNode;
  depth: number;
  onPersonClick: (person: Person) => void;
  onAddChild: (parentId: string) => void;
  editMode: boolean;
}

const PersonNode: React.FC<PersonNodeProps> = ({ node, depth, onPersonClick, onAddChild, editMode }) => {
  return (
    <div className={`ml-${depth * 8}`}>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={() => onPersonClick(node.person)} className="relative">
        <div className="group cursor-pointer mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative px-4 py-3 bg-slate-800 border border-purple-500/50 rounded-lg hover:border-purple-400 transition-all">
              <p className="font-bold text-white">{node.person.name}</p>
              <p className="text-xs text-purple-300">{new Date(node.person.birthDate).getFullYear()}</p>
            </div>
          </div>
        </div>
        {editMode && <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); onAddChild(node.person.id); }} className="ml-4 px-3 py-1 text-xs bg-green-500/70 hover:bg-green-600 rounded text-white font-semibold">+ Farzand</motion.button>}
      </motion.div>
      {node.children.length > 0 && <div className="ml-4 pl-4 border-l-2 border-purple-500/30 space-y-4">{node.children.map((child) => <PersonNode key={child.person.id} node={child} depth={depth + 1} onPersonClick={onPersonClick} onAddChild={onAddChild} editMode={editMode} />)}</div>}
    </div>
  );
};
