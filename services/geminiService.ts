import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateNoteTitle = async (content: string): Promise<string> => {
  if (!apiKey) return "Judul Otomatis (No API Key)";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Buatkan judul pendek, menarik, dan relevan (maksimal 5 kata) untuk catatan berikut ini dalam Bahasa Indonesia. Jangan gunakan tanda kutip.\n\nCatatan:\n${content}`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating title:", error);
    return "Catatan Baru";
  }
};

export const summarizeNote = async (content: string): Promise<string> => {
  if (!apiKey) return "API Key tidak ditemukan.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Ringkas catatan berikut ini menjadi satu paragraf singkat yang padat informasi dalam Bahasa Indonesia:\n\n${content}`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error summarizing:", error);
    return "Gagal membuat ringkasan.";
  }
};

export const continueWriting = async (currentContent: string): Promise<string> => {
  if (!apiKey) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Lanjutkan tulisan berikut ini dengan gaya bahasa yang sama, tambahkan sekitar 2-3 kalimat yang relevan dalam Bahasa Indonesia:\n\n${currentContent}`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error continuing text:", error);
    return "";
  }
};

export const fixGrammar = async (content: string): Promise<string> => {
    if (!apiKey) return content;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Perbaiki tata bahasa, ejaan, dan tanda baca dari teks berikut ini agar lebih profesional dalam Bahasa Indonesia, tanpa mengubah makna aslinya:\n\n${content}`,
      });
      return response.text.trim();
    } catch (error) {
      console.error("Error fixing grammar:", error);
      return content;
    }
  };

export const generateCustomContent = async (prompt: string, currentContent: string, imageBase64?: string): Promise<string> => {
    if (!apiKey) return "API Key tidak ditemukan.";

    try {
        const parts: any[] = [];

        // Add Image if exists
        if (imageBase64) {
            // Extract base64 data and mime type (simple handling)
            // format usually: data:image/png;base64,.....
            const mimeType = imageBase64.split(';')[0].split(':')[1];
            const data = imageBase64.split(',')[1];
            
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: data
                }
            });
        }

        // Enhanced System Prompt for Code & General Tasks
        const textPrompt = `Anda adalah Magic (Neo), asisten AI canggih di aplikasi MagicNotes. Anda ahli dalam penulisan kreatif, analisis data, dan pemrograman (Expert Fullstack Developer).

            Instruksi Pengguna: "${prompt}"
            
            Konteks (Catatan/Kode Saat Ini):
            "${currentContent.substring(0, 5000)}..."
            
            Panduan Respon:
            1. Jika konteks adalah KODE PEMROGRAMAN: 
               - Berikan solusi yang optimal, aman, dan bersih (clean code).
               - Jelaskan perbaikan atau terjemahan kode dengan singkat jika diminta.
               - JIKA diminta menerjemahkan kode, berikan kode hasilnya saja kecuali diminta penjelasannya.
               - Jangan sertakan wrapper markdown (\`\`\`) di awal/akhir jika outputnya akan langsung disisipkan ke editor kode (raw code), KECUALI pengguna meminta penjelasan teks.
            2. Jika konteks adalah TEKS BIASA:
               - Gunakan Bahasa Indonesia yang baik dan benar.
               - Gunakan format HTML sederhana (<p>, <b>, <ul>, <li>) untuk struktur.
            
            Langsung berikan isi jawaban tanpa basa-basi pembuka seperti "Berikut adalah hasilnya".`;
        
        parts.push({ text: textPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Supports vision
            contents: { parts: parts },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error custom generation:", error);
        return "Gagal memproses permintaan AI.";
    }
};