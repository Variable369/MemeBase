import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase'; // Načtení spojení s databází

function AdminForm() {
  const [nazev, setNazev] = useState('');
  const [soubor, setSoubor] = useState(null);
  const [nahravam, setNahravam] = useState(false);
  const [zprava, setZprava] = useState('');

  const odeslatFormular = async (e) => {
    e.preventDefault(); // Zabrání obnovení stránky
    if (!nazev || !soubor) {
      setZprava('⚠️ Prosím, vyplň název a vyber soubor.');
      return;
    }

    setNahravam(true);
    setZprava('⏳ Nahrávám do Cloudinary (to může chvilku trvat)...');

    try {
      // 1. PŘÍPRAVA PRO CLOUDINARY
      const formData = new FormData();
      formData.append('file', soubor);
      formData.append('upload_preset', 'meme_nahrano'); // Tvoje Cloudinary propustka

      // 2. ODESLÁNÍ SOUBORU
      // Použijeme 'auto', aby Cloudinary samo poznalo, zda je to video nebo audio
      const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dvxacipi2/auto/upload';
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message || 'Chyba při nahrávání do cloudu');

      setZprava('✅ Soubor nahrán! Zapisuji do databáze Firebase...');

      // 3. ZÁPIS DO FIREBASE (včetně odkazu, který nám Cloudinary právě vrátilo)
      const typSouboru = soubor.type.startsWith('video') ? 'video' : 'audio';
      
      await addDoc(collection(db, 'hlasky'), {
        nazev: nazev,
        soubor: data.secure_url, // Tady je ten vygenerovaný odkaz!
        typ: typSouboru,
        ikona: typSouboru === 'video' ? '🎬' : '🔊',
        casPridani: new Date() // Abychom mohli hlášky později řadit
      });

      setZprava('🎉 HOTOVO! Hláška je úspěšně v databázi.');
      setNazev(''); // Vyčištění formuláře
      setSoubor(null);
      document.getElementById('souborInput').value = ''; 

    } catch (error) {
      console.error(error);
      setZprava('❌ Došlo k chybě: ' + error.message);
    } finally {
      setNahravam(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px', marginBottom: '40px', border: '2px dashed #444' }}>
      <h2>Tajné nahrávací studio 🕵️‍♂️</h2>
      <form onSubmit={odeslatFormular} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input 
          type="text" 
          placeholder="Zadej název hlášky (např. Pelíšky: Rozkaz zněl jasně)" 
          value={nazev}
          onChange={(e) => setNazev(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: 'none', fontSize: '16px' }}
        />

        <input 
          id="souborInput"
          type="file" 
          accept="video/mp4,audio/mp3,audio/mpeg" 
          onChange={(e) => setSoubor(e.target.files[0])}
          style={{ padding: '10px', backgroundColor: '#333', color: '#fff', borderRadius: '5px' }}
        />

        <button 
          type="submit" 
          disabled={nahravam}
          style={{ 
            padding: '12px', 
            backgroundColor: nahravam ? '#555' : '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            fontWeight: 'bold', 
            cursor: nahravam ? 'not-allowed' : 'pointer' 
          }}
        >
          {nahravam ? 'Zpracovávám...' : '🚀 Nahrát hlášku na web'}
        </button>

        {zprava && <p style={{ fontWeight: 'bold', color: zprava.includes('❌') ? '#ff4d4d' : '#4dabf7' }}>{zprava}</p>}
      </form>
    </div>
  );
}

export default AdminForm;