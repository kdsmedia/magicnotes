/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import { Note, CategoryType, PaperStyle, Folder } from './types';
import { SearchIcon, PlusIcon, EditIcon, LockIcon, UnlockIcon, XIcon, LayoutGridIcon, LayoutListIcon, FolderIcon, FolderPlusIcon, CheckCircleIcon, CircleIcon, TrashIcon, FolderInputIcon, CheckSquareIcon, SparklesIcon } from './components/Icons';

const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Splash Screen Component
const SplashScreen = () => (
  <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center overflow-hidden animate-fade-in">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      {/* Main 3D Content */}
      <div className="relative z-10 text-center perspective-1000">
          <div className="animate-float-3d">
              {/* 3D Icon Card */}
              <div className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(99,102,241,0.6)] flex items-center justify-center transform rotate-[15deg] border border-white/20 backdrop-blur-xl relative preserve-3d">
                   {/* Glossy Reflection */}
                   <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                   <SparklesIcon className="w-14 h-14 text-white drop-shadow-md" />
              </div>
              
              {/* 3D Text */}
              <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl tracking-tighter transform translate-z-10">
                  MagicNotes
              </h1>
              <p className="text-indigo-300/80 font-medium tracking-widest text-sm uppercase mt-2">Artificial Intelligence Notes</p>
          </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-16 w-64 h-1.5 bg-slate-800/50 rounded-full overflow-hidden relative backdrop-blur-sm border border-white/5">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-cyan-400 animate-progress-fill rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-10 text-center opacity-70">
          <p className="text-slate-400 text-sm font-mono tracking-[0.2em] mb-1">v.1.0</p>
          <div className="flex items-center gap-2 justify-center text-xs text-slate-500 font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <span>Develop By</span>
              <span className="text-slate-300">Altomedia</span>
          </div>
      </div>
  </div>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('neo-notes-data');
    return saved ? JSON.parse(saved) : [];
  });
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('neo-folders-data');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(CategoryType.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewState, setViewState] = useState<'list' | 'editor'>('list');
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  
  // View Mode State: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Secret Folder State
  const [secretPassword, setSecretPassword] = useState<string | null>(() => localStorage.getItem('neo-secret-pass'));
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Create Folder Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  // Multi-Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Splash Screen Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('neo-notes-data', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('neo-folders-data', JSON.stringify(folders));
  }, [folders]);

  // Enhanced Filter Logic for Quick Search
  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const isCustomFolder = folders.some(f => f.id === selectedCategory);

    return notes
      .filter(note => {
        // 1. Isolation Rule for Secret Folder
        if (selectedCategory === CategoryType.SECRET) {
             if (note.category !== CategoryType.SECRET) return false;
        } else {
             if (note.category === CategoryType.SECRET) return false;
        }

        // 2. Global Search vs Category Filter
        if (!query) {
             if (isCustomFolder) {
                 // If a custom folder is selected, filter by folderId
                 if (note.folderId !== selectedCategory) return false;
             } else {
                 // Standard Category Filter
                 if (selectedCategory !== CategoryType.ALL && selectedCategory !== CategoryType.SECRET && note.category !== selectedCategory) {
                     return false;
                 }
             }
        }

        // 3. Search Matching
        if (query) {
            const plainContent = stripHtml(note.content).toLowerCase();
            return note.title.toLowerCase().includes(query) || plainContent.includes(query);
        }

        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, selectedCategory, searchQuery, folders]);

  const handleSaveNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'> & { id?: string }) => {
    const timestamp = Date.now();
    
    // Determine category and folderId
    // If we're creating a new note inside a custom folder view, assign that folder automatically
    let finalCategory = noteData.category;
    let finalFolderId = noteData.folderId;

    if (!noteData.id && !finalFolderId && folders.some(f => f.id === selectedCategory)) {
        finalFolderId = selectedCategory;
        // Keep category as whatever default or PERSONAL, since folderId takes precedence in organization
    }

    const dataToSave = {
        ...noteData,
        category: finalCategory,
        folderId: finalFolderId
    };

    if (noteData.id) {
      setNotes(prev => prev.map(n => 
        n.id === noteData.id 
          ? { ...n, ...dataToSave, updatedAt: timestamp } as Note 
          : n
      ));
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        createdAt: timestamp,
        updatedAt: timestamp,
        isFavorite: false,
        ...dataToSave
      } as Note;
      setNotes(prev => [newNote, ...prev]);
    }
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (currentNoteId === id) {
          setViewState('list');
          setCurrentNoteId(null);
      }
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;

      const newFolder: Folder = {
          id: crypto.randomUUID(),
          name: newFolderName,
          description: newFolderDesc,
          createdAt: Date.now()
      };

      setFolders(prev => [...prev, newFolder]);
      setShowFolderModal(false);
      setNewFolderName('');
      setNewFolderDesc('');
      setSelectedCategory(newFolder.id); // Switch to new folder
  };

  const handleDeleteFolder = (id: string) => {
      if (window.confirm("Hapus folder ini? Catatan di dalamnya akan dipindahkan ke 'Semua Catatan' (tanpa folder).")) {
          setFolders(prev => prev.filter(f => f.id !== id));
          // Remove folderId from notes in this folder
          setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: undefined } : n));
          
          if (selectedCategory === id) {
              setSelectedCategory(CategoryType.ALL);
          }
      }
  };

  const openEditor = (noteId?: string) => {
    if (isSelectionMode) return; // Prevent opening editor in selection mode

    if (noteId) {
        setCurrentNoteId(noteId);
    } else {
        const newId = crypto.randomUUID();
        const timestamp = Date.now();
        
        // Auto-assign folder if inside a folder view
        const currentFolderId = folders.some(f => f.id === selectedCategory) ? selectedCategory : undefined;
        
        const newNote: Note = {
            id: newId,
            title: '',
            content: '',
            category: (selectedCategory === CategoryType.ALL || selectedCategory === CategoryType.SECRET || currentFolderId) ? CategoryType.PERSONAL : selectedCategory,
            folderId: currentFolderId,
            createdAt: timestamp,
            updatedAt: timestamp,
            isFavorite: false,
            paperColor: '#ffffff',
            paperStyle: PaperStyle.LINED
        };
        setNotes(prev => [newNote, ...prev]);
        setCurrentNoteId(newId);
    }
    setViewState('editor');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
            <span key={i} className="bg-amber-300/50 text-amber-900 rounded px-0.5 box-decoration-clone">{part}</span> : 
            part
        )}
      </>
    );
  };

  const getHeaderTitle = () => {
      if (isSelectionMode) return `${selectedNoteIds.size} Dipilih`;
      if (searchQuery) return 'Pencarian';
      const folder = folders.find(f => f.id === selectedCategory);
      if (folder) return folder.name;
      return selectedCategory;
  };
  
  const getHeaderDesc = () => {
      if (isSelectionMode) return 'Pilih aksi untuk catatan terpilih';
      const folder = folders.find(f => f.id === selectedCategory);
      if (folder && folder.description) return folder.description;
      return filteredNotes.length + (searchQuery ? ' ditemukan' : ' Catatan');
  };

  // --- Secret Folder Logic ---

  const handleSecretClick = () => {
      if (isSecretUnlocked) {
          setSelectedCategory(CategoryType.SECRET);
      } else {
          setPasswordInput('');
          setPasswordError('');
          setShowPasswordModal(true);
      }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!secretPassword) {
          // Setting new password
          if (passwordInput.length < 4) {
              setPasswordError("Password minimal 4 karakter");
              return;
          }
          localStorage.setItem('neo-secret-pass', passwordInput);
          setSecretPassword(passwordInput);
          setIsSecretUnlocked(true);
          setSelectedCategory(CategoryType.SECRET);
          setShowPasswordModal(false);
      } else {
          // Checking password
          if (passwordInput === secretPassword) {
              setIsSecretUnlocked(true);
              setSelectedCategory(CategoryType.SECRET);
              setShowPasswordModal(false);
          } else {
              setPasswordError("Password salah!");
          }
      }
  };

  const lockSecretFolder = () => {
      setIsSecretUnlocked(false);
      setSelectedCategory(CategoryType.ALL);
  };

  // --- Selection Mode Logic ---

  const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      setSelectedNoteIds(new Set()); // Reset selection
  };

  const toggleNoteSelection = (noteId: string) => {
      const newSelection = new Set(selectedNoteIds);
      if (newSelection.has(noteId)) {
          newSelection.delete(noteId);
      } else {
          newSelection.add(noteId);
      }
      setSelectedNoteIds(newSelection);
  };

  const handleBulkDelete = () => {
      if (window.confirm(`Hapus ${selectedNoteIds.size} catatan yang dipilih?`)) {
          setNotes(prev => prev.filter(n => !selectedNoteIds.has(n.id)));
          setIsSelectionMode(false);
          setSelectedNoteIds(new Set());
      }
  };

  const handleBulkMove = (targetFolderId: string | null) => {
      setNotes(prev => prev.map(n => {
          if (selectedNoteIds.has(n.id)) {
              return { 
                  ...n, 
                  folderId: targetFolderId || undefined,
                  category: targetFolderId ? n.category : CategoryType.PERSONAL // If moving to "All Notes" (null folder), default to Personal or keep current? Let's just unset folderId.
              };
          }
          return n;
      }));
      setShowMoveModal(false);
      setIsSelectionMode(false);
      setSelectedNoteIds(new Set());
  };
  
  // Helper to append extension if needed
  const getNoteTitle = (note: Note) => {
      if (!note.title) return <span className="text-slate-400 italic">Tanpa Judul</span>;
      if (note.codeLanguage) {
          const ext = '.' + note.codeLanguage;
          // Check if title already ends with extension
          if (note.title.endsWith(ext)) return highlightText(note.title, searchQuery);
          return <span>{highlightText(note.title, searchQuery)}<span className="text-slate-400 opacity-60 text-sm">{ext}</span></span>;
      }
      return highlightText(note.title, searchQuery);
  };

  // Conditional Rendering for Splash Screen
  if (isLoading) {
      return <SplashScreen />;
  }

  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden font-sans animate-fade-in">
      <Sidebar 
        selectedCategory={selectedCategory} 
        onSelectCategory={(cat) => {
            if (cat !== CategoryType.SECRET) {
                setSelectedCategory(cat);
                setSearchQuery(''); 
                setIsSelectionMode(false);
            }
        }}
        onNewNote={() => openEditor()}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSecretClick={handleSecretClick}
        folders={folders}
        onCreateFolder={() => { setShowFolderModal(true); setIsSidebarOpen(false); }}
        onDeleteFolder={handleDeleteFolder}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative w-full transition-all duration-300">
        {/* Header (Always Show Hamburger) */}
        <div className={`flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-200 backdrop-blur-md sticky top-0 z-10 shadow-sm transition-colors ${isSelectionMode ? 'bg-indigo-50/90' : 'bg-white/80'}`}>
          <div className="flex items-center gap-4">
             {/* Hamburger Button / Close Selection */}
             {isSelectionMode ? (
                 <button 
                    onClick={() => setIsSelectionMode(false)}
                    className="p-3 -ml-2 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors active:scale-95"
                 >
                     <XIcon className="w-6 h-6" />
                 </button>
             ) : (
                <button 
                    className="p-3 -ml-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Buka Menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
             )}
             
             <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                    <h2 className={`text-xl font-bold leading-none truncate max-w-[150px] md:max-w-none ${isSelectionMode ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {getHeaderTitle()}
                    </h2>
                    {!isSelectionMode && selectedCategory === CategoryType.SECRET && (
                        <button onClick={lockSecretFolder} title="Kunci Folder" className="text-rose-500 hover:bg-rose-50 p-1 rounded-full">
                            <UnlockIcon className="w-5 h-5"/>
                        </button>
                    )}
                 </div>
                 <span className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">
                     {getHeaderDesc()}
                 </span>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             {/* Action Buttons */}
             {isSelectionMode ? (
                 <>
                    <button 
                        onClick={() => setShowMoveModal(true)}
                        disabled={selectedNoteIds.size === 0}
                        className="p-2.5 rounded-xl bg-white text-indigo-600 shadow-sm border border-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 transition-all flex items-center gap-2"
                        title="Pindahkan"
                    >
                        <FolderInputIcon className="w-5 h-5" />
                        <span className="hidden md:inline font-medium text-sm">Pindah</span>
                    </button>
                    <button 
                        onClick={handleBulkDelete}
                        disabled={selectedNoteIds.size === 0}
                        className="p-2.5 rounded-xl bg-white text-rose-600 shadow-sm border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 transition-all flex items-center gap-2"
                        title="Hapus"
                    >
                        <TrashIcon className="w-5 h-5" />
                        <span className="hidden md:inline font-medium text-sm">Hapus</span>
                    </button>
                 </>
             ) : (
                 <>
                    {/* Select Mode Toggle */}
                    <button 
                        onClick={toggleSelectionMode} 
                        className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Pilih Catatan"
                    >
                        <CheckSquareIcon className="w-5 h-5" />
                    </button>

                    {/* View Switcher */}
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1 shrink-0">
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                        >
                            <LayoutGridIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <LayoutListIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Desktop Search (Visible on large tablets) */}
                    <div className="relative hidden md:block w-60 xl:w-72">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                        type="text" 
                        placeholder="Cari..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                 </>
             )}
             
             {/* Mobile Add Button - Hidden in selection mode */}
             {!isSelectionMode && (
                 <button 
                    onClick={() => openEditor()} 
                    className="md:hidden bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-300 active:scale-90 transition-transform"
                 >
                     <PlusIcon className="w-6 h-6" />
                 </button>
             )}

             {/* Tablet Add Button */}
             {!isSelectionMode && (
                 <button 
                    onClick={() => openEditor()} 
                    className="hidden md:flex bg-indigo-600 text-white p-2.5 rounded-full shadow-lg shadow-indigo-300 active:scale-90 transition-transform items-center justify-center"
                 >
                     <PlusIcon className="w-5 h-5" />
                 </button>
             )}
          </div>
        </div>
        
        {/* Mobile Search Bar (Below Header) - Hidden in selection mode */}
        {!isSelectionMode && (
            <div className="md:hidden px-4 py-3 bg-white/50 backdrop-blur border-b border-slate-100">
                <div className="relative w-full">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                    type="text" 
                    placeholder="Cari cepat..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <XIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Note Grid/List Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {viewState === 'list' && (
            <>
                {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center text-slate-400">
                        <div className="bg-slate-100 p-6 rounded-full mb-6 animate-bounce">
                            {selectedCategory === CategoryType.SECRET ? <LockIcon className="w-10 h-10 text-rose-300" /> : <EditIcon className="w-10 h-10 text-slate-300" />}
                        </div>
                        <p className="text-xl font-bold text-slate-600 mb-2">
                            {searchQuery ? 'Tidak ada hasil' : 'Belum ada catatan'}
                        </p>
                        <p className="text-sm max-w-xs mx-auto mb-8">
                            {searchQuery 
                                ? `Tidak ada catatan untuk "${searchQuery}"`
                                : folders.some(f => f.id === selectedCategory) 
                                    ? "Folder ini masih kosong. Buat catatan baru di sini!"
                                    : "Mulai tulis ide cemerlang Anda."}
                        </p>
                        {!searchQuery && !isSelectionMode && (
                            <button 
                            onClick={() => openEditor()}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:bg-indigo-700 transition-colors"
                            >
                                Buat Catatan
                            </button>
                        )}
                        {searchQuery && (
                             <button 
                             onClick={() => setSearchQuery('')}
                             className="text-indigo-600 font-medium hover:underline"
                             >
                                 Bersihkan
                             </button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" : "flex flex-col gap-3"}>
                        {filteredNotes.map(note => (
                            viewMode === 'grid' ? (
                                // Grid View Card
                                <div 
                                    key={note.id}
                                    onClick={() => isSelectionMode ? toggleNoteSelection(note.id) : openEditor(note.id)}
                                    className={`group relative flex flex-col h-56 md:h-64 p-5 md:p-6 rounded-3xl border cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.97]
                                        ${isSelectionMode && selectedNoteIds.has(note.id) 
                                            ? 'ring-4 ring-indigo-500/30 border-indigo-500 z-10' 
                                            : 'border-slate-200/60 hover:border-slate-300 hover:shadow-lg'}
                                    `}
                                    style={{ backgroundColor: note.codeLanguage ? '#1e293b' : (note.paperColor || '#ffffff') }}
                                >
                                    {/* Selection Overlay/Checkbox */}
                                    {isSelectionMode && (
                                        <div className="absolute top-4 right-4 z-20">
                                            {selectedNoteIds.has(note.id) ? (
                                                <CheckCircleIcon className="w-6 h-6 text-indigo-600 fill-indigo-100" />
                                            ) : (
                                                <CircleIcon className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                    )}

                                    {/* Top Row: Date & Category */}
                                    <div className="flex justify-between items-center mb-4">
                                        <span className={`text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full bg-black/5 ${note.codeLanguage ? 'text-green-400 bg-white/5' : (note.category === CategoryType.SECRET ? 'text-rose-600' : 'text-slate-600')}`}>
                                            {folders.find(f => f.id === note.folderId)?.name || note.category}
                                        </span>
                                        <span className={`text-[10px] font-semibold ${note.codeLanguage ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(note.updatedAt)}</span>
                                    </div>
                                    
                                    {/* Content */}
                                    <h3 className={`text-lg md:text-xl font-bold mb-2 leading-tight line-clamp-2 pr-6 ${note.codeLanguage ? 'text-white font-mono' : 'text-slate-800'}`}>
                                        {getNoteTitle(note)}
                                    </h3>
                                    
                                    <div className={`text-sm leading-relaxed line-clamp-3 md:line-clamp-4 flex-1 relative z-10 ${note.codeLanguage ? 'text-green-400/80 font-mono text-xs' : 'text-slate-600'}`}>
                                        {note.content 
                                            ? (note.codeLanguage ? note.content : highlightText(stripHtml(note.content), searchQuery))
                                            : <span className="italic opacity-50">Tidak ada konten teks...</span>}
                                    </div>

                                    {/* Bottom Fade Gradient */}
                                    <div 
                                        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none" 
                                        style={{ background: `linear-gradient(to top, ${note.codeLanguage ? '#1e293b' : (note.paperColor || '#ffffff')} 20%, ${note.codeLanguage ? '#1e293b' : (note.paperColor || '#ffffff')}E6 50%, transparent 100%)` }}
                                    />
                                </div>
                            ) : (
                                // List View Card
                                <div 
                                    key={note.id}
                                    onClick={() => isSelectionMode ? toggleNoteSelection(note.id) : openEditor(note.id)}
                                    className={`group flex items-center p-4 bg-white rounded-2xl border active:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]
                                        ${isSelectionMode && selectedNoteIds.has(note.id) 
                                            ? 'ring-2 ring-indigo-500/30 border-indigo-500 bg-indigo-50/10' 
                                            : 'border-slate-200'}
                                    `}
                                >
                                    {/* Selection Checkbox (Left) */}
                                    {isSelectionMode && (
                                        <div className="mr-4 shrink-0">
                                            {selectedNoteIds.has(note.id) ? (
                                                <CheckCircleIcon className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                                            ) : (
                                                <CircleIcon className="w-5 h-5 text-slate-300" />
                                            )}
                                        </div>
                                    )}

                                    <div className={`w-1.5 self-stretch rounded-full mr-4 ${note.codeLanguage ? 'bg-slate-700' : (note.category === CategoryType.SECRET ? 'bg-rose-500' : 'bg-indigo-500')}`}></div>
                                    
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-bold text-slate-800 truncate mb-1">
                                            {getNoteTitle(note)}
                                        </h3>
                                        <p className="text-sm text-slate-500 truncate font-mono opacity-80">
                                            {note.content 
                                                ? (note.codeLanguage ? note.content : highlightText(stripHtml(note.content), searchQuery))
                                                : <span className="italic opacity-50">Tidak ada konten teks...</span>}
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className="text-[10px] text-slate-400">{formatDate(note.updatedAt)}</span>
                                        {note.codeLanguage ? (
                                            <span className="text-[9px] bg-slate-900 text-green-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                                                {note.codeLanguage.toUpperCase()}
                                            </span>
                                        ) : (
                                            note.folderId && (
                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                    {folders.find(f => f.id === note.folderId)?.name}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </>
          )}
        </div>

        {/* Editor Overlay */}
        {viewState === 'editor' && (
            <div className="absolute inset-0 z-40 bg-white animate-fade-in flex flex-col">
                {currentNoteId && (
                    <NoteEditor 
                        note={notes.find(n => n.id === currentNoteId) || null}
                        folders={folders}
                        onSave={handleSaveNote}
                        onDelete={handleDeleteNote}
                        onClose={() => {
                            setViewState('list');
                            setCurrentNoteId(null);
                        }}
                    />
                )}
            </div>
        )}
      </main>

      {/* Move Notes Modal */}
      {showMoveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <FolderInputIcon className="w-5 h-5 text-indigo-600"/>
                          Pindahkan ke...
                      </h3>
                      <button onClick={() => setShowMoveModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                          <XIcon className="w-5 h-5"/>
                      </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {/* Default "All Notes" option */}
                      <button 
                          onClick={() => handleBulkMove(null)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors text-left"
                      >
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                              <FolderIcon className="w-4 h-4" />
                          </div>
                          <div>
                              <div className="font-bold text-sm">Semua Catatan</div>
                              <div className="text-[10px] text-slate-400">Tanpa Folder</div>
                          </div>
                      </button>

                      {folders.map(folder => (
                          <button 
                             key={folder.id}
                             onClick={() => handleBulkMove(folder.id)}
                             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors text-left"
                          >
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                  <FolderIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                  <div className="font-bold text-sm truncate">{folder.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{folder.description || 'Folder Kustom'}</div>
                              </div>
                          </button>
                      ))}
                      
                      {folders.length === 0 && (
                          <div className="text-center text-sm text-slate-400 py-4">
                              Belum ada folder kustom.
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">
                          {secretPassword ? "Masukan Password" : "Buat Password Baru"}
                      </h3>
                      <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                          <XIcon className="w-6 h-6"/>
                      </button>
                  </div>
                  
                  <form onSubmit={handlePasswordSubmit}>
                      <div className="mb-6">
                          <div className="relative">
                              <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input 
                                  type="password" 
                                  value={passwordInput}
                                  onChange={(e) => setPasswordInput(e.target.value)}
                                  className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                                  placeholder={secretPassword ? "Password Anda..." : "Buat password aman..."}
                                  autoFocus
                              />
                          </div>
                          {passwordError && <p className="text-red-500 text-sm mt-2 ml-1 font-medium">{passwordError}</p>}
                          {!secretPassword && <p className="text-slate-500 text-xs mt-3 ml-1 leading-relaxed">Password ini akan digunakan untuk membuka folder rahasia selamanya. Jangan sampai lupa!</p>}
                      </div>
                      
                      <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95 text-lg">
                          {secretPassword ? "Buka Folder" : "Simpan Password"}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <FolderPlusIcon className="w-6 h-6 text-indigo-600"/>
                          Folder Baru
                      </h3>
                      <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                          <XIcon className="w-6 h-6"/>
                      </button>
                  </div>
                  
                  <form onSubmit={handleCreateFolder}>
                      <div className="space-y-4 mb-6">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nama Folder</label>
                              <input 
                                  type="text" 
                                  value={newFolderName}
                                  onChange={(e) => setNewFolderName(e.target.value)}
                                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-base"
                                  placeholder="Contoh: Proyek Skripsi"
                                  autoFocus
                                  required
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Deskripsi (Opsional)</label>
                              <textarea 
                                  value={newFolderDesc}
                                  onChange={(e) => setNewFolderDesc(e.target.value)}
                                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none h-24"
                                  placeholder="Tambahkan detail singkat..."
                              />
                          </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowFolderModal(false)} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-2xl transition-colors">
                            Batal
                        </button>
                        <button type="submit" disabled={!newFolderName.trim()} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50">
                            Buat Folder
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;