import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase'; 

function AdminForm() {
  const [nazev, setNazev] = useState('');
  const [soubor, setSoubor] = useState(null);
  const [nahravam, setNahravam] = useState(false); // Používáme název "nahravam"
  const [zprava, setZprava] = useState('');

  const odeslatFormular = async (e) => {
    e.preventDefault(); 
    if (!nazev || !soubor) {
      setZprava('⚠️ Prosím, vyplň název a vyber soubor.');
      return;
    }

    setNahravam(true);
    setZprava('⏳ Nahrávám do Cloudinary (to může chvilku trvat)...');

    try {
      const formData = new FormData();
      formData.append('file', soubor);
      formData.append('upload_preset', 'meme_nahrano'); 

      const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dvxacipi2/auto/upload';
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message || 'Chyba při nahrávání do cloudu');

      setZprava('✅ Soubor nahrán! Zapisuji do databáze Firebase...');

      const typSouboru = soubor.type.startsWith('video') ? 'video' : 'audio';
      
      await addDoc(collection(db, 'hlasky'), {
        nazev: nazev,
        soubor: data.secure_url, 
        typ: typSouboru,
        ikona: typSouboru === 'video' ? '🎬' : '🔊',
        casPridani: new Date() 
      });

      setZprava('🎉 HOTOVO! Hláška je úspěšně v databázi.');
      setNazev(''); 
      setSoubor(null);
      // Pokud nemáš element s id 'souborInput', může to hodit drobnou chybu, ale kód poběží dál. 
      // Pro jistotu přidávám kontrolu, aby to nepadalo.
      const fileInput = document.getElementById('souborInput');
      if (fileInput) fileInput.value = ''; 

    } catch (error) {
      console.error(error);
      setZprava('❌ Došlo k chybě: ' + error.message);
    } finally {
      setNahravam(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
      
      <h2>Upload hlášky</h2>
      
      <form onSubmit={odeslatFormular} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <input 
          type="text" 
          placeholder="Zadej název hlášky (např. Mike Tyson - I broke my back)" 
          value={nazev} 
          onChange={(e) => setNazev(e.target.value)} 
          style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
        />
        
        <input 
          id="souborInput" /* Přidáno ID pro správné vyčištění pole po nahrání */
          type="file" 
          onChange={(e) => setSoubor(e.target.files[0])} 
          style={{ padding: '10px', background: '#333', color: 'white', borderRadius: '5px' }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button 
            type="submit" 
            disabled={nahravam} /* Zde změněno na nahravam */
            style={{ 
              padding: '10px 20px', 
              background: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: nahravam ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold',
              opacity: nahravam ? 0.7 : 1
            }}
          >
            {nahravam ? 'Nahrávám...' : 'Nahrát hlášku na web'}
          </button>
        </div>

        {/* Zobrazení stavové zprávy, ať víš, co se děje */}
        {zprava && (
          <p style={{ textAlign: 'center', marginTop: '10px', color: '#aaa', fontSize: '14px' }}>
            {zprava}
          </p>
        )}

      </form>
    </div>
  );
}

export default AdminForm;