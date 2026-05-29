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
    <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
      
      {/* Nový nadpis */}
      <h2>Upload hlášky</h2>
      
      <form onSubmit={odeslatFormular} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Nový předvyplněný text (placeholder) */}
        <input 
          type="text" 
          placeholder="Zadej název hlášky (např. Mike Tyson - I broke my back)" 
          value={nazev} 
          onChange={(e) => setNazev(e.target.value)} 
          style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
        />
        
        <input 
          type="file" 
          onChange={(e) => setSoubor(e.target.files[0])} 
          style={{ padding: '10px', background: '#333', color: 'white', borderRadius: '5px' }}
        />
        
        {/* Obalovací div pro vycentrování zmenšeného tlačítka */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button 
            type="submit" 
            disabled={nahravaSe}
            style={{ 
              padding: '10px 20px', /* Zajišťuje úhlednou velikost kolem textu */
              background: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: nahravaSe ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold',
              opacity: nahravaSe ? 0.7 : 1
            }}
          >
            {/* Odstraněný emoji u názvu tlačítka */}
            {nahravaSe ? 'Nahrávám...' : 'Nahrát hlášku na web'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default AdminForm;