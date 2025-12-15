/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, CategoryType, PaperStyle, Folder } from '../types';
import { 
  ChevronLeftIcon, SaveIcon, SparklesIcon, TrashIcon, XIcon, PaletteIcon,
  BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, ImageIcon, AlignLeftIcon, AlignCenterIcon,
  HighlighterIcon, SmileIcon, TypeIcon, LayoutIcon, PlusIcon, MoreHorizontalIcon, MicIcon,
  CameraIcon, MapPinIcon, OrderedListIcon, UndoIcon, RedoIcon, StrikethroughIcon,
  IndentIcon, OutdentIcon, LinkIcon, CalendarIcon, MinusIcon, RemoveFormattingIcon, LightbulbIcon, FolderIcon,
  TableIcon, CodeIcon, CheckSquareIcon, ClockIcon, TerminalIcon, PaperclipIcon, FileTextIcon
} from './Icons';
import { generateNoteTitle, summarizeNote, continueWriting, fixGrammar, generateCustomContent } from '../services/geminiService';

interface NoteEditorProps {
  note?: Note | null;
  folders: Folder[];
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const LANGUAGES = [
    { id: 'html', label: 'HTML', ext: '.html' },
    { id: 'css', label: 'CSS', ext: '.css' },
    { id: 'js', label: 'JavaScript', ext: '.js' },
    { id: 'ts', label: 'TypeScript', ext: '.ts' },
    { id: 'php', label: 'PHP', ext: '.php' },
    { id: 'py', label: 'Python', ext: '.py' },
    { id: 'java', label: 'Java', ext: '.java' },
    { id: 'cpp', label: 'C++', ext: '.cpp' },
    { id: 'sql', label: 'SQL', ext: '.sql' },
    { id: 'json', label: 'JSON', ext: '.json' },
    { id: 'rich', label: 'Rich Text', ext: '' }
];

const MAX_CHARS = 10000;

const COLORS = [
  { id: '#ffffff', name: 'Putih' },
  { id: '#fef9c3', name: 'Kuning' },
  { id: '#f0f9ff', name: 'Biru' },
  { id: '#fff1f2', name: 'Pink' },
  { id: '#f0fdf4', name: 'Hijau' },
];

const FONT_SIZES = [
  { value: '1', label: 'Kecil', px: '12px' },
  { value: '3', label: 'Normal', px: '16px' },
  { value: '5', label: 'Besar', px: '24px' },
  { value: '7', label: 'Jumbo', px: '36px' },
];

const TEXT_COLORS = [
  { value: '#000000', label: 'Hitam' },
  { value: '#dc2626', label: 'Merah' },
  { value: '#2563eb', label: 'Biru' },
  { value: '#16a34a', label: 'Hijau' },
  { value: '#9333ea', label: 'Ungu' },
  { value: '#ea580c', label: 'Oranye' },
];

const HIGHLIGHT_COLORS = [
    { value: 'transparent', label: 'None' }, 
    { value: '#fef08a', label: 'Kuning' },
    { value: '#bfdbfe', label: 'Biru' },
    { value: '#bbf7d0', label: 'Hijau' },
    { value: '#fecdd3', label: 'Pink' },
    { value: '#ddd6fe', label: 'Ungu' },
];

const FONT_FAMILIES = [
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Playfair Display, serif', label: 'Playfair' },
    { value: 'Courier New, monospace', label: 'Courier' },
    { value: 'Comic Sans MS, cursive', label: 'Comic Sans' },
];

const EMOJIS = [
    '😀','😄','🤣','😊','😍','🥰','😎','🤔','😴','😭',
    '👍','👎','👊','✌️','👌','🙏','❤️','🔥','✨','⭐',
    '⚠️','✅','❌','❓','❗','💡','🎉','🚀','💰','📅'
];

const NoteEditor: React.FC<NoteEditorProps> = ({ note, folders, onSave, onDelete, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>(CategoryType.PERSONAL);
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [codeLanguage, setCodeLanguage] = useState<string | undefined>(undefined);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  
  const [paperColor, setPaperColor] = useState('#ffffff');
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(PaperStyle.LINED);
  
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isListening, setIsListening] = useState(false);
  
  // Custom AI Prompt State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiImageAttachment, setAiImageAttachment] = useState<string | null>(null);
  const [aiFileName, setAiFileName] = useState<string | null>(null);

  // Table Inputs
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // 'font', 'color', 'paragraph', 'insert', 'paper', 'ai', 'category', 'code', 'ai-translate'
  const [activeMenu, setActiveMenu] = useState<string | null>(null); 
  
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const currentIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialization
  useEffect(() => {
    if (note && note.id !== currentIdRef.current) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setFolderId(note.folderId);
      setCodeLanguage(note.codeLanguage);
      setPaperColor(note.paperColor || '#ffffff');
      setPaperStyle(note.paperStyle || PaperStyle.LINED);
      if (editorRef.current && !note.codeLanguage) {
        editorRef.current.innerHTML = note.content;
      }
      currentIdRef.current = note.id;
      setSaveStatus('saved');
      updateStats(note.content);
    }
  }, [note]);

  // Auto-Save
  useEffect(() => {
    if (!note?.id) return;
    setSaveStatus('saving');
    const timeoutId = setTimeout(() => {
        onSave({ id: note.id, title, content, category, folderId, paperColor, paperStyle, codeLanguage });
        setSaveStatus('saved');
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [title, content, category, folderId, paperColor, paperStyle, codeLanguage]);

  const updateStats = (text: string) => {
      setCharCount(text.length);
      setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
  };

  const calculateReadingTime = () => {
      const wpm = 200;
      const minutes = Math.ceil(wordCount / wpm);
      return minutes + ' min read';
  };

  // Voice to Text
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung fitur Voice to Text.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (codeLanguage) {
          const newContent = content + transcript + ' ';
          setContent(newContent);
          updateStats(newContent);
      } else {
          executeCommand('insertText', transcript + ' ');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, codeLanguage, content]);

  const handleManualSave = () => {
    onSave({ id: note?.id, title, content, category, folderId, paperColor, paperStyle, codeLanguage });
    setSaveStatus('saved');
    onClose();
  };

  const handleAIAction = async (action: 'title' | 'summary' | 'continue' | 'grammar') => {
    let textContent = '';
    if (codeLanguage) {
        textContent = content;
    } else {
        textContent = editorRef.current?.innerText || '';
    }
    
    if (!textContent.trim() && action !== 'continue') return;
    setIsProcessingAI(true);
    setActiveMenu(null);

    try {
      if (action === 'title') {
        const newTitle = await generateNoteTitle(textContent);
        setTitle(newTitle);
      } else if (action === 'summary') {
        const summary = await summarizeNote(textContent);
        if (!codeLanguage) {
             executeCommand('insertHTML', `<br/><div style="background:#f1f5f9; padding:12px; border-radius:8px; margin-top:10px;"><strong>🤖 Ringkasan Magic:</strong><br/>${summary}</div><br/>`);
        } else {
            alert("Ringkasan: \n" + summary);
        }
      } else if (action === 'continue') {
        const continuation = await continueWriting(textContent);
        if (codeLanguage) {
            setContent(prev => prev + ' ' + continuation);
        } else {
            executeCommand('insertText', ' ' + continuation);
        }
      } else if (action === 'grammar') {
        const fixed = await fixGrammar(textContent);
        if (codeLanguage) {
             setContent(fixed);
        } else if (editorRef.current) {
            editorRef.current.innerText = fixed;
            setContent(fixed);
        }
        updateStats(fixed);
      }
    } catch (e) {
      console.error(e);
      alert('Gagal memproses permintaan AI.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Helper to open modal with pre-filled prompt
  const openAIWithPrompt = (prompt: string) => {
      setAiPrompt(prompt);
      setShowAIModal(true);
      setActiveMenu(null);
  };

  const handleCustomAIGenerate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiPrompt.trim() && !aiImageAttachment) return;

      setIsProcessingAI(true);
      setShowAIModal(false);
      
      const currentText = codeLanguage ? content : (editorRef.current?.innerText || '');
      try {
          const result = await generateCustomContent(aiPrompt, currentText, aiImageAttachment || undefined);
          if (codeLanguage) {
              setContent(prev => prev + '\n' + result);
          } else {
              executeCommand('insertHTML', result + '&nbsp;');
          }
          setAiPrompt('');
          setAiImageAttachment(null);
          setAiFileName(null);
      } catch (e) {
          alert('Gagal membuat konten.');
      } finally {
          setIsProcessingAI(false);
      }
  };
  
  const handleAIFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Limit size to 5MB
      if (file.size > 5 * 1024 * 1024) {
          alert("Ukuran file maksimal 5MB.");
          return;
      }
      
      const isImage = file.type.startsWith('image/');
      setAiFileName(file.name);
      
      const reader = new FileReader();
      
      if (isImage) {
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setAiImageAttachment(ev.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      } else {
          // It's a text/code file, read content and append to prompt
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  const textContent = ev.target.result as string;
                  setAiPrompt(prev => {
                      const prefix = prev ? prev + '\n\n' : '';
                      return prefix + `[Isi File: ${file.name}]\n` + textContent;
                  });
              }
          };
          reader.readAsText(file);
      }
      
      // Reset input
      if (aiFileInputRef.current) aiFileInputRef.current.value = '';
  };

  const getBackgroundStyle = () => {
    const lineColor = '#cbd5e1';
    const styles: React.CSSProperties = {
      backgroundColor: paperColor,
      color: '#334155',
      lineHeight: '32px',
      backgroundAttachment: 'local',
    };
    switch (paperStyle) {
      case PaperStyle.LINED:
        styles.backgroundImage = `repeating-linear-gradient(transparent, transparent 31px, ${lineColor} 31px, ${lineColor} 32px)`;
        break;
      case PaperStyle.GRID:
        styles.backgroundImage = `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`;
        styles.backgroundSize = '32px 32px';
        break;
      case PaperStyle.DOTTED:
        styles.backgroundImage = `radial-gradient(${lineColor} 1.5px, transparent 1.5px)`;
        styles.backgroundSize = '32px 32px';
        break;
      default: styles.backgroundImage = 'none'; break;
    }
    return styles;
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (codeLanguage) return; // Disable rich text commands in code mode
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
        setContent(editorRef.current.innerHTML);
        updateStats(editorRef.current.innerText);
    }
  };

  const insertSymbol = (symbol: string) => {
      if (codeLanguage) {
          const textarea = textareaRef.current;
          if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const newContent = content.substring(0, start) + symbol + content.substring(end);
              setContent(newContent);
              // Restore cursor
              setTimeout(() => {
                  textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
                  textarea.focus();
              }, 0);
          }
      } else {
          executeCommand('insertText', symbol);
      }
  };

  const insertLink = () => {
      if (codeLanguage) return;
      const url = prompt("Masukan URL Link:", "https://");
      if(url) {
          executeCommand('createLink', url);
      }
      setActiveMenu(null);
  };

  const insertDate = () => {
      const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit' });
      if (codeLanguage) {
          setContent(prev => prev + dateStr);
      } else {
          executeCommand('insertText', dateStr);
      }
      setActiveMenu(null);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (codeLanguage) return;
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) executeCommand('insertImage', ev.target.result as string);
          };
          reader.readAsDataURL(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      setActiveMenu(null);
  };

  const insertLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocation tidak didukung oleh browser ini.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            if (codeLanguage) {
                const locStr = `Lat: ${latitude}, Long: ${longitude}`;
                setContent(prev => prev + locStr);
            } else {
                const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
                const html = `<br/><div style="display:inline-flex; align-items:center; gap:4px; padding:4px 8px; background:#eff6ff; border-radius:4px; color:#2563eb; font-size:14px;"><a href="${link}" target="_blank" style="text-decoration:none; color:inherit;">📍 Lokasi Saya: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</a></div>&nbsp;`;
                executeCommand('insertHTML', html);
            }
            setActiveMenu(null);
        },
        (error) => {
            alert("Gagal mengambil lokasi: " + error.message);
        }
    );
  };

  const handleInsertTable = () => {
      setShowTableModal(false);
      let html = '<table style="width:100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #cbd5e1;"><tbody>';
      for(let i=0; i<tableRows; i++) {
          html += '<tr>';
          for(let j=0; j<tableCols; j++) {
              html += '<td style="border: 1px solid #cbd5e1; padding: 8px; min-width: 20px;">&nbsp;</td>';
          }
          html += '</tr>';
      }
      html += '</tbody></table><br/>';
      executeCommand('insertHTML', html);
      setActiveMenu(null);
  };

  const handleInsertCodeBlock = () => {
      const html = `<pre style="background-color: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; margin: 10px 0;"><code>Ketik kode di sini...</code></pre><br/>`;
      executeCommand('insertHTML', html);
      setActiveMenu(null);
  };

  const handleInsertChecklist = () => {
     // Simple checkbox simulation
     const html = `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;"><input type="checkbox" style="width: 16px; height: 16px; cursor: pointer;"> <span>Tugas baru...</span></div>`;
     executeCommand('insertHTML', html);
     setActiveMenu(null);
  }

  const handleCategorySelection = (cat: string, isCustomFolder: boolean) => {
      setCategory(cat);
      setFolderId(isCustomFolder ? cat : undefined);
      setActiveMenu(null);
  }
  
  const getDisplayCategoryName = () => {
      if (folderId) {
          const folder = folders.find(f => f.id === folderId);
          return folder ? folder.name : 'Unknown Folder';
      }
      return category;
  }

  const handleCodeLanguageChange = (langId: string) => {
      if (langId === 'rich') {
          // Switching back to Rich Text
          // We wrap the plain text code in a pre block or just plain text
          // For simplicity, we just set the content as text
          // NOTE: Going from Code -> Rich Text might lose HTML structure if the code was HTML
          // But usually code mode is for RAW code.
          setCodeLanguage(undefined);
          // Wait for render to switch ref
          setTimeout(() => {
              if (editorRef.current) {
                  editorRef.current.innerText = content;
                  updateStats(content);
              }
          }, 0);
      } else {
          // Switching to Code Mode
          // If coming from Rich Text, we take innerText (strip tags)
          if (!codeLanguage && editorRef.current) {
               setContent(editorRef.current.innerText); 
          }
          setCodeLanguage(langId);
      }
      setActiveMenu(null);
  };
  
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
          e.preventDefault();
          const target = e.target as HTMLTextAreaElement;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          
          // Insert 2 spaces
          const newValue = content.substring(0, start) + "  " + content.substring(end);
          setContent(newValue);
          
          setTimeout(() => {
              target.selectionStart = target.selectionEnd = start + 2;
          }, 0);
      }
  };

  // UI Components for Menu Content
  const renderMenuContent = () => {
      switch(activeMenu) {
          case 'font':
              return (
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Ukuran</label>
                          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                              {FONT_SIZES.map(s => (
                                  <button key={s.value} onClick={() => executeCommand('fontSize', s.value)} className="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">{s.label}</button>
                              ))}
                          </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Jenis Font</label>
                          <div className="space-y-1">
                              {FONT_FAMILIES.map(f => (
                                  <button key={f.value} onClick={() => executeCommand('fontName', f.value)} className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 rounded-lg text-base" style={{ fontFamily: f.value }}>{f.label}</button>
                              ))}
                          </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                          <button onClick={() => executeCommand('removeFormat')} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center gap-2">
                              <RemoveFormattingIcon className="w-4 h-4"/> Hapus Format
                          </button>
                      </div>
                  </div>
              );
          case 'code':
              return (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Bahasa Pemrograman</div>
                      {LANGUAGES.map(lang => (
                          <button 
                             key={lang.id}
                             onClick={() => handleCodeLanguageChange(lang.id)}
                             className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex justify-between items-center ${
                                 (codeLanguage === lang.id) || (!codeLanguage && lang.id === 'rich')
                                 ? 'bg-indigo-600 text-white' 
                                 : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                             }`}
                          >
                              <span>{lang.label}</span>
                              {lang.ext && <span className="text-xs opacity-60 font-mono bg-black/20 px-1.5 py-0.5 rounded">{lang.ext}</span>}
                          </button>
                      ))}
                  </div>
              );
          case 'color':
              return (
                  <div className="space-y-4">
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Warna Teks</label>
                           <div className="flex flex-wrap gap-3">
                               {TEXT_COLORS.map(c => (
                                   <button key={c.value} onClick={() => executeCommand('foreColor', c.value)} className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" style={{backgroundColor: c.value}} />
                               ))}
                           </div>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Highlight</label>
                           <div className="flex flex-wrap gap-3">
                               {HIGHLIGHT_COLORS.map(c => (
                                   <button key={c.value} onClick={() => executeCommand('hiliteColor', c.value)} className="w-8 h-8 rounded border border-slate-200 shadow-sm relative" style={{backgroundColor: c.value}}>
                                       {c.label === 'None' && <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">/</span>}
                                   </button>
                               ))}
                           </div>
                       </div>
                  </div>
              );
          case 'paragraph':
              return (
                  <div className="grid grid-cols-1 gap-2">
                       <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => executeCommand('justifyLeft')} className="flex items-center justify-center gap-2 px-3 py-3 bg-slate-50 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-100"><AlignLeftIcon className="w-4 h-4"/> Rata Kiri</button>
                           <button onClick={() => executeCommand('justifyCenter')} className="flex items-center justify-center gap-2 px-3 py-3 bg-slate-50 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-100"><AlignCenterIcon className="w-4 h-4"/> Tengah</button>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => executeCommand('indent')} className="flex items-center justify-center gap-2 px-3 py-3 bg-slate-50 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-100"><IndentIcon className="w-4 h-4"/> Indent</button>
                           <button onClick={() => executeCommand('outdent')} className="flex items-center justify-center gap-2 px-3 py-3 bg-slate-50 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-100"><OutdentIcon className="w-4 h-4"/> Outdent</button>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => executeCommand('insertUnorderedList')} className="flex items-center justify-center gap-2 px-3 py-3 bg-slate-50 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-100"><ListIcon className="w-4 h-4"/> Bullets</button>
                           <button onClick={() => executeCommand('insertOrderedList')} className="flex items-center justify-center gap-2 px-3 py-3 bg-slate-50 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-100"><OrderedListIcon className="w-4 h-4"/> Numbers</button>
                       </div>
                  </div>
              );
          case 'insert':
              return (
                  <div>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">
                              <ImageIcon className="w-5 h-5" /> <span className="text-[10px] font-bold">Galeri</span>
                          </button>
                          <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 p-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors">
                              <CameraIcon className="w-5 h-5" /> <span className="text-[10px] font-bold">Foto</span>
                          </button>
                          <button onClick={() => setShowTableModal(true)} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                              <TableIcon className="w-5 h-5" /> <span className="text-[10px] font-bold">Tabel</span>
                          </button>
                          <button onClick={handleInsertChecklist} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                              <CheckSquareIcon className="w-5 h-5" /> <span className="text-[10px] font-bold">To-Do</span>
                          </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                           <button onClick={insertDate} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-100 text-[10px] font-bold"><CalendarIcon className="w-4 h-4 mb-1"/> Tanggal</button>
                           <button onClick={insertLink} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-100 text-[10px] font-bold"><LinkIcon className="w-4 h-4 mb-1"/> Link</button>
                           <button onClick={insertLocation} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-100 text-[10px] font-bold"><MapPinIcon className="w-4 h-4 mb-1"/> Lokasi</button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                           <button onClick={handleInsertCodeBlock} className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium"><CodeIcon className="w-4 h-4"/> Blok Kode</button>
                           <button onClick={() => executeCommand('insertHorizontalRule')} className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium"><MinusIcon className="w-4 h-4"/> Garis Batas</button>
                      </div>

                      {/* Hidden Inputs */}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <input type="file" ref={cameraInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />
                      
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Emoji</label>
                      <div className="grid grid-cols-6 gap-2">
                          {EMOJIS.map(e => (
                              <button key={e} onClick={() => insertSymbol(e)} className="text-2xl hover:bg-slate-100 rounded p-1 transition-colors">{e}</button>
                          ))}
                      </div>
                  </div>
              );
          case 'paper':
              return (
                  <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Pola Kertas</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[PaperStyle.PLAIN, PaperStyle.LINED, PaperStyle.GRID, PaperStyle.DOTTED].map(s => (
                                <button key={s} onClick={() => setPaperStyle(s)} className={`h-10 rounded-lg border-2 ${paperStyle === s ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`} title={s}></button>
                            ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Warna Kertas</label>
                        <div className="flex justify-between gap-2">
                            {COLORS.map(c => (
                                <button key={c.id} onClick={() => setPaperColor(c.id)} className={`w-10 h-10 rounded-full border-2 ${paperColor === c.id ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-200'}`} style={{backgroundColor: c.id}}></button>
                            ))}
                        </div>
                      </div>
                  </div>
              );
          case 'ai':
            return (
                <div className="space-y-2">
                    <button onClick={() => { setShowAIModal(true); setActiveMenu(null); }} className="w-full text-left px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-transform">
                        <SparklesIcon className="w-5 h-5"/> ✨ Tulis dengan Instruksi
                    </button>
                    <div className="h-px bg-slate-100 my-2"></div>
                    
                    {codeLanguage ? (
                        <>
                           <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expert Developer</div>
                           <button onClick={() => openAIWithPrompt("Analisis kode ini. Tunjukkan potensi bug, kesalahan logika, dan berikan saran perbaikan.")} className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-800 rounded-xl font-medium flex items-center gap-3 hover:bg-indigo-100">
                               🔍 Review & Debug
                           </button>
                           <button onClick={() => openAIWithPrompt("Berikan saran optimasi untuk kode ini agar lebih efisien, bersih (clean code), dan performa lebih baik.")} className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-800 rounded-xl font-medium flex items-center gap-3 hover:bg-indigo-100">
                               🚀 Optimasi Kode
                           </button>
                           <button onClick={() => setActiveMenu('ai-translate')} className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-800 rounded-xl font-medium flex items-center gap-3 hover:bg-indigo-100">
                               🌐 Terjemahkan Kode
                           </button>
                           <div className="h-px bg-slate-100 my-2"></div>
                        </>
                    ) : (
                        <>
                           <button onClick={() => handleAIAction('summary')} className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-800 rounded-xl font-medium flex items-center gap-3 hover:bg-indigo-100">📝 Ringkas Catatan</button>
                           <button onClick={() => handleAIAction('grammar')} className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-800 rounded-xl font-medium flex items-center gap-3 hover:bg-indigo-100">🔍 Perbaiki Grammar</button>
                           <button onClick={() => handleAIAction('continue')} className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-800 rounded-xl font-medium flex items-center gap-3 hover:bg-indigo-100">✍️ Lanjutkan Menulis</button>
                        </>
                    )}
                    
                    <button onClick={() => handleAIAction('title')} className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-800 rounded-xl font-medium flex items-center gap-3 hover:bg-indigo-100">✨ Buat Judul Otomatis</button>
                </div>
            );
          case 'ai-translate':
              return (
                 <div className="space-y-1 max-h-[300px] overflow-y-auto">
                     <div className="flex items-center gap-2 mb-2 px-2">
                         <button onClick={() => setActiveMenu('ai')} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeftIcon className="w-4 h-4"/></button>
                         <span className="text-xs font-bold text-slate-400 uppercase">Terjemahkan ke...</span>
                     </div>
                     {LANGUAGES.filter(l => l.id !== 'rich').map(lang => (
                         <button 
                            key={lang.id}
                            onClick={() => openAIWithPrompt(`Terjemahkan kode ini ke bahasa pemrograman ${lang.label}. Berikan hanya kode hasilnya.`)}
                            className="w-full text-left px-4 py-3 rounded-xl font-medium transition-colors bg-slate-50 text-slate-700 hover:bg-slate-100"
                         >
                             {lang.label}
                         </button>
                     ))}
                 </div>
              );
          default: return null;
      }
  };

  const toggleMenu = (menu: string) => setActiveMenu(activeMenu === menu ? null : menu);

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col h-full font-sans">
      
      {/* 1. Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white/95 backdrop-blur-sm z-30 sticky top-0 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col flex-1 min-w-0 mr-2">
             <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul Catatan..."
                className="text-lg md:text-xl font-bold text-slate-800 placeholder-slate-300 border-none outline-none bg-transparent w-full p-0 truncate"
            />
             {/* Category Indicator clickable */}
             <div className="flex gap-2">
                 <button onClick={() => toggleMenu('category')} className="text-xs text-indigo-600 font-medium text-left flex items-center gap-1 w-fit max-w-full">
                     <span className="truncate">{getDisplayCategoryName()}</span> <ChevronLeftIcon className="w-3 h-3 -rotate-90 shrink-0" />
                 </button>
                 {codeLanguage && (
                     <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                         {LANGUAGES.find(l => l.id === codeLanguage)?.ext}
                     </span>
                 )}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
           {note && (
               <button onClick={() => onDelete(note.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                   <TrashIcon className="w-5 h-5" />
               </button>
           )}
           
           <button onClick={handleManualSave} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-bold transition-colors shadow-lg shadow-slate-200">
               Selesai
           </button>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
          {/* Desktop Toolbar (Sticky Top) */}
          <div className="hidden md:flex justify-center p-2 sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
               <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto scrollbar-hide">
                   <button onClick={() => executeCommand('undo')} className="p-2 rounded-lg text-slate-600 hover:bg-white/50" title="Undo"><UndoIcon className="w-5 h-5"/></button>
                   <button onClick={() => executeCommand('redo')} className="p-2 rounded-lg text-slate-600 hover:bg-white/50" title="Redo"><RedoIcon className="w-5 h-5"/></button>
                   <div className="w-px h-5 bg-slate-300 mx-1"></div>
                   
                   <button onClick={() => toggleMenu('code')} className={`p-2 rounded-lg ${activeMenu === 'code' ? 'bg-white shadow text-indigo-600' : (codeLanguage ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-white/50')}`} title="Code Mode"><TerminalIcon className="w-5 h-5"/></button>

                   {!codeLanguage && (
                       <>
                           <button onClick={() => toggleMenu('font')} className={`p-2 rounded-lg ${activeMenu === 'font' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:bg-white/50'}`}><TypeIcon className="w-5 h-5"/></button>
                           <button onClick={() => executeCommand('bold')} className="p-2 rounded-lg text-slate-600 hover:bg-white/50"><BoldIcon className="w-5 h-5"/></button>
                           <button onClick={() => executeCommand('italic')} className="p-2 rounded-lg text-slate-600 hover:bg-white/50"><ItalicIcon className="w-5 h-5"/></button>
                           <button onClick={() => executeCommand('underline')} className="p-2 rounded-lg text-slate-600 hover:bg-white/50"><UnderlineIcon className="w-5 h-5"/></button>
                           <button onClick={() => executeCommand('strikeThrough')} className="p-2 rounded-lg text-slate-600 hover:bg-white/50"><StrikethroughIcon className="w-5 h-5"/></button>
                           
                           <div className="w-px h-5 bg-slate-300 mx-1"></div>
                           <button onClick={() => toggleMenu('color')} className={`p-2 rounded-lg ${activeMenu === 'color' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:bg-white/50'}`}><div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-400 to-pink-400"></div></button>
                           <button onClick={() => toggleMenu('paragraph')} className={`p-2 rounded-lg ${activeMenu === 'paragraph' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:bg-white/50'}`}><LayoutIcon className="w-5 h-5"/></button>
                           
                           <div className="w-px h-5 bg-slate-300 mx-1"></div>
                           <button onClick={() => toggleMenu('insert')} className={`p-2 rounded-lg ${activeMenu === 'insert' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:bg-white/50'}`}><PlusIcon className="w-5 h-5"/></button>
                           <button onClick={() => toggleMenu('paper')} className={`p-2 rounded-lg ${activeMenu === 'paper' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:bg-white/50'}`}><PaletteIcon className="w-5 h-5"/></button>
                       </>
                   )}
                   
                   <button onClick={() => toggleMenu('ai')} className={`p-2 rounded-lg ${activeMenu === 'ai' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:bg-white/50'}`}><SparklesIcon className="w-5 h-5"/></button>
                   <button onClick={toggleListening} className={`p-2 rounded-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-600 hover:bg-white/50'}`}><MicIcon className="w-5 h-5"/></button>
               </div>
               
               {/* Desktop Menu Popover */}
               {activeMenu && (
                   <div className="absolute top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 min-w-[320px] animate-fade-in-up">
                       <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                           <span className="text-xs font-bold uppercase text-slate-400">Menu {activeMenu === 'ai-translate' ? 'Terjemahkan' : activeMenu}</span>
                           <button onClick={() => setActiveMenu(null)}><XIcon className="w-4 h-4 text-slate-400"/></button>
                       </div>
                       {renderMenuContent()}
                   </div>
               )}
          </div>

          {/* Editor Text Area */}
          <div className="flex-1 overflow-y-auto h-full relative" style={!codeLanguage ? { backgroundColor: paperColor } : undefined}>
            <div className={`max-w-3xl mx-auto px-6 py-8 min-h-full pb-32 md:pb-10 ${codeLanguage ? 'h-full' : ''}`}>
                {codeLanguage ? (
                    <textarea 
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            updateStats(e.target.value);
                        }}
                        onKeyDown={handleCodeKeyDown}
                        className="w-full h-full bg-slate-900 text-green-400 font-mono text-sm md:text-base p-4 rounded-lg outline-none resize-none leading-relaxed shadow-inner"
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                    />
                ) : (
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={(e) => {
                            setContent(e.currentTarget.innerHTML);
                            updateStats(e.currentTarget.innerText);
                        }}
                        style={getBackgroundStyle()}
                        className="w-full text-lg text-slate-700 outline-none leading-relaxed empty:before:content-[attr(placeholder)] empty:before:text-slate-300 min-h-[50vh]"
                        role="textbox"
                        aria-multiline="true"
                        placeholder="Mulai menulis cerita Anda..."
                    />
                )}
            </div>
          </div>
          
           {/* Info/Stats Bar */}
          <div className="absolute bottom-20 md:bottom-2 right-2 md:right-auto md:left-2 flex gap-2 pointer-events-none opacity-60 hover:opacity-100 transition-opacity">
               <div className="bg-slate-900/10 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 flex items-center gap-1">
                   {charCount} chars
               </div>
               <div className="bg-slate-900/10 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 flex items-center gap-1">
                   {wordCount} words
               </div>
               <div className="bg-slate-900/10 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 flex items-center gap-1">
                   <ClockIcon className="w-3 h-3" />
                   {calculateReadingTime()}
               </div>
          </div>

          {/* Mobile Menu Panel (Bottom Sheet) */}
          <div 
             className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${activeMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
             onClick={() => setActiveMenu(null)}
          >
             <div 
                className={`absolute bottom-[60px] left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto transition-transform duration-300 ease-out p-5 ${activeMenu ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={(e) => e.stopPropagation()}
             >
                  {/* Handle bar for visual cue */}
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
                  {activeMenu && renderMenuContent()}
             </div>
          </div>

          {/* Mobile Toolbar (Fixed Bottom) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-between items-center">
               <button onClick={() => toggleMenu('code')} className={`p-3 rounded-xl flex flex-col items-center gap-1 ${activeMenu === 'code' ? 'text-indigo-600 bg-indigo-50' : (codeLanguage ? 'text-indigo-600' : 'text-slate-500')}`}>
                   <TerminalIcon className="w-6 h-6"/>
               </button>
               
               {!codeLanguage && (
                   <button onClick={() => toggleMenu('font')} className={`p-3 rounded-xl flex flex-col items-center gap-1 ${activeMenu === 'font' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                       <TypeIcon className="w-6 h-6"/>
                   </button>
               )}
               
               <button onClick={toggleListening} className={`p-4 -mt-8 rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-indigo-600 text-white'}`}>
                   <MicIcon className="w-7 h-7"/>
               </button>

               {!codeLanguage && (
                   <button onClick={() => toggleMenu('insert')} className={`p-3 rounded-xl flex flex-col items-center gap-1 ${activeMenu === 'insert' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                       <PlusIcon className="w-6 h-6"/>
                   </button>
               )}
               
               <button onClick={() => toggleMenu('ai')} className={`p-3 rounded-xl flex flex-col items-center gap-1 ${activeMenu === 'ai' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                   <SparklesIcon className="w-6 h-6"/>
               </button>
          </div>
      </div>

      {/* AI Custom Prompt Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                 <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2 text-indigo-600">
                         <SparklesIcon className="w-6 h-6" />
                         <h3 className="text-xl font-bold">Instruksi Magic</h3>
                     </div>
                     <button onClick={() => { setShowAIModal(false); setAiImageAttachment(null); setAiFileName(null); }} className="text-slate-400 hover:text-slate-600">
                         <XIcon className="w-5 h-5"/>
                     </button>
                 </div>
                 
                 <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs text-slate-500 flex flex-col gap-2">
                     <div className="flex gap-2">
                        <LightbulbIcon className="w-4 h-4 shrink-0 text-amber-500" />
                        <p>Contoh: "Buatkan daftar ide liburan", "Jelaskan kode berikut", atau "Deskripsikan gambar ini".</p>
                     </div>
                     <div className="flex gap-2">
                        <PaperclipIcon className="w-4 h-4 shrink-0 text-slate-400" />
                        <p>Sisipkan file kode/teks untuk dibaca otomatis, atau gambar untuk analisis.</p>
                     </div>
                 </div>

                 <form onSubmit={handleCustomAIGenerate}>
                     <div className="relative">
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Apa yang ingin Anda tulis hari ini?"
                            className="w-full h-32 p-4 bg-slate-100 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none resize-none mb-4 text-slate-700 transition-colors"
                            autoFocus
                        />
                        
                         {/* Quick Actions based on attachment */}
                         {(aiFileName && !aiImageAttachment) && (
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                                <button type="button" onClick={() => setAiPrompt(prev => "Analisis file ini. Tunjukkan potensi bug, kesalahan logika, dan cara mengoptimasinya.")} className="px-2 py-1 bg-white/90 text-[10px] font-bold text-indigo-600 rounded shadow-sm hover:bg-indigo-50 border border-indigo-100">
                                    🔍 Analisis File
                                </button>
                                <button type="button" onClick={() => setAiPrompt(prev => "Jelaskan cara kerja kode/teks di dalam file ini dengan bahasa yang mudah dipahami.")} className="px-2 py-1 bg-white/90 text-[10px] font-bold text-indigo-600 rounded shadow-sm hover:bg-indigo-50 border border-indigo-100">
                                    📖 Jelaskan File
                                </button>
                            </div>
                         )}

                        {/* File Attachment Button inside Textarea area */}
                        <div className="absolute bottom-6 right-2">
                             <input 
                                type="file" 
                                ref={aiFileInputRef} 
                                onChange={handleAIFileSelect} 
                                className="hidden" 
                                accept="image/*,.txt,.js,.html,.css,.php,.json,.md,.csv,.ts,.java,.py"
                             />
                             <button 
                                type="button"
                                onClick={() => aiFileInputRef.current?.click()}
                                className="p-2 bg-white/80 backdrop-blur border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 shadow-sm transition-colors"
                                title="Sisipkan File"
                             >
                                 <PaperclipIcon className="w-5 h-5" />
                             </button>
                        </div>
                     </div>

                     {/* Attachment Preview */}
                     {(aiFileName || aiImageAttachment) && (
                         <div className="mb-4 flex items-center gap-3 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                             {aiImageAttachment ? (
                                 <img src={aiImageAttachment} alt="Preview" className="w-10 h-10 object-cover rounded-md" />
                             ) : (
                                 <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-500">
                                     <FileTextIcon className="w-6 h-6" />
                                 </div>
                             )}
                             <div className="flex-1 min-w-0">
                                 <p className="text-xs font-bold text-indigo-700 truncate">{aiFileName}</p>
                                 <p className="text-[10px] text-indigo-500">{aiImageAttachment ? 'Gambar Terlampir' : 'Teks Dimuat ke Prompt'}</p>
                             </div>
                             <button 
                                type="button"
                                onClick={() => { setAiImageAttachment(null); setAiFileName(null); setAiPrompt(prev => prev.split('\n\n[Isi File:')[0]); }} 
                                className="p-1 text-slate-400 hover:text-red-500"
                             >
                                 <XIcon className="w-4 h-4" />
                             </button>
                         </div>
                     )}

                     <div className="flex gap-3">
                         <button 
                            type="button" 
                            onClick={() => { setShowAIModal(false); setAiImageAttachment(null); setAiFileName(null); }} 
                            className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                         >
                             Batal
                         </button>
                         <button 
                            type="submit" 
                            disabled={!aiPrompt.trim() && !aiImageAttachment}
                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             Buat Sekarang
                         </button>
                     </div>
                 </form>
             </div>
        </div>
      )}

      {/* Table Prompt Modal */}
      {showTableModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-indigo-600" />
                      Sisipkan Tabel
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Baris</label>
                          <input type="number" min="1" max="20" value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value))} className="w-full px-3 py-2 bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kolom</label>
                          <input type="number" min="1" max="10" value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value))} className="w-full px-3 py-2 bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowTableModal(false)} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl">Batal</button>
                      <button onClick={handleInsertTable} className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">Sisipkan</button>
                  </div>
              </div>
          </div>
      )}

      {/* Loading Overlay */}
      {isProcessingAI && (
          <div className="absolute inset-0 z-[70] bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center animate-pulse">
                  <SparklesIcon className="w-12 h-12 text-indigo-600 mb-4 animate-spin-slow" />
                  <p className="text-indigo-800 font-medium">Sedang memproses permintaan...</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default NoteEditor;