/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';
import { CategoryType, Folder } from '../types';
import { HomeIcon, UserIcon, BriefcaseIcon, LightbulbIcon, BookOpenIcon, PlusIcon, LockIcon, FolderIcon, FolderPlusIcon, TrashIcon } from './Icons';

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onNewNote: () => void;
  isOpen: boolean;
  onClose: () => void;
  onSecretClick: () => void;
  folders: Folder[];
  onCreateFolder: () => void;
  onDeleteFolder: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  selectedCategory, 
  onSelectCategory, 
  onNewNote, 
  isOpen, 
  onClose, 
  onSecretClick,
  folders,
  onCreateFolder,
  onDeleteFolder
}) => {
  
  const categories = [
    { type: CategoryType.ALL, icon: <HomeIcon className="w-5 h-5" />, label: 'Semua Catatan' },
    { type: CategoryType.PERSONAL, icon: <UserIcon className="w-5 h-5" />, label: 'Pribadi' },
    { type: CategoryType.WORK, icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Pekerjaan' },
    { type: CategoryType.IDEAS, icon: <LightbulbIcon className="w-5 h-5" />, label: 'Ide' },
    { type: CategoryType.JOURNAL, icon: <BookOpenIcon className="w-5 h-5" />, label: 'Jurnal' },
  ];

  return (
    <>
      {/* Overlay (Visible on all devices when open) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content (Always fixed drawer) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl`}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            MagicNotes
          </h1>
          <p className="text-xs text-slate-400 mt-1">Cerdas & Terorganisir</p>
        </div>

        <div className="p-4">
          <button 
            onClick={() => {
              onNewNote();
              onClose();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            Buat Catatan
          </button>
        </div>

        {/* Navigation List - Flex 1 to take available space */}
        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat.type}
              onClick={() => {
                onSelectCategory(cat.type);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === cat.type
                  ? 'bg-slate-800 text-indigo-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}

          {/* User Folders Section */}
          <div className="pt-4 mt-4 border-t border-slate-800">
             <div className="flex items-center justify-between px-2 mb-2">
                 <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Folder Anda</span>
                 <button 
                    onClick={onCreateFolder}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                    title="Buat Folder Baru"
                 >
                     <PlusIcon className="w-4 h-4"/>
                 </button>
             </div>
             
             <div className="space-y-1">
                 {folders.map(folder => (
                     <div key={folder.id} className="relative group">
                         <button
                            onClick={() => {
                                onSelectCategory(folder.id);
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                                selectedCategory === folder.id
                                ? 'bg-slate-800 text-indigo-400'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                         >
                            <FolderIcon className="w-5 h-5 shrink-0" />
                            <span className="truncate">{folder.name}</span>
                         </button>
                         <button 
                             onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                             className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                             <TrashIcon className="w-4 h-4" />
                         </button>
                     </div>
                 ))}
                 
                 {folders.length === 0 && (
                     <button 
                        onClick={onCreateFolder}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 border-2 border-dashed border-slate-800 hover:border-slate-700"
                     >
                         <FolderPlusIcon className="w-5 h-5" />
                         Buat Folder Baru
                     </button>
                 )}
             </div>
          </div>
        </nav>

        {/* Secret Folder & Tips Section - Fixed at bottom */}
        <div className="mt-auto bg-slate-900 z-10">
            <div className="px-4 pt-2 border-t border-slate-800">
                 <button
                  onClick={() => {
                      onSecretClick();
                      onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors border mt-2 ${
                    selectedCategory === CategoryType.SECRET
                      ? 'bg-rose-900/30 text-rose-400 border-rose-900'
                      : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <LockIcon className="w-5 h-5" />
                  Folder Rahasia
                </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-800/50 rounded-lg p-4">
                 <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <LightbulbIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Tips Magic</span>
                 </div>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   Gunakan tombol "Magic" di editor untuk meringkas teks atau memperbaiki tata bahasa secara otomatis.
                 </p>
              </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;