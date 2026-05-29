import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase'; 

function AdminForm({ slozky }) { // Přijímáme složky jako "props"
  const [nazev, setNazev] = useState('');
  const [soubor, setSoubor] = useState(null);
  const [vybranaSlozka, setVybranaSlozka] = useState('featured');
  const [nahravam, setNahravam] = useState(false);

  const odeslatFormular = async (e) => {
    e.preventDefault(); 
    if (!nazev || !soubor) return alert('Vyplň vše!');

    setNahravam(true);
    try {
      const formData = new FormData();
      formData.append('file', soubor);
      formData.append('upload_preset', 'meme_nahrano'); 

      const response = await fetch('https://api.cloudinary.com/v1_1/dvxacipi2/auto/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const typSouboru = soubor.type.startsWith('video') ? 'video' : 'audio';
      
      await addDoc(collection(db, 'hlasky'), {
        nazev: nazev,
        soubor: data.secure_url, 
        typ: typSouboru,
        ikona: typSouboru === 'video' ? '🎬' : '🔊',
        slozkaId: vybranaSlozka, // ULOŽENÍ SLOŽKY
        casPridani: new Date() 
      });

      setNazev(''); setSoubor(null);
    } catch (error) {
      alert('Chyba!');
    } finally {
      setNahravam(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
      <h2>Upload hlášky</h2>
      <form onSubmit={odeslatFormular} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="text" placeholder="Název hlášky..." value={nazev} onChange={(e) => setNazev(e.target.value)} style={{ padding: '10px', borderRadius: '5px' }} />
        
        {/* VÝBĚR SLOŽKY */}
        <select 
          value={vybranaSlozka} 
          onChange={(e) => setVybranaSlozka(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', background: '#333', color: 'white' }}
        >
          <option value="featured">Do Featured (Základní)</option>
          {slozky.map(s => (
            <option key={s.id} value={s.id}>{s.nazev}</option>
          ))}
        </select>

        <input type="file" onChange={(e) => setSoubor(e.target.files[0])} style={{ padding: '10px', background: '#333', color: 'white' }} />
        <button type="submit" disabled={nahravam} style={{ padding: '10px', background: '#4CAF50', color: 'white', cursor: 'pointer' }}>
          {nahravam ? 'Nahrávám...' : 'Nahrát'}
        </button>
      </form>
    </div>
  );
}

export default AdminForm;