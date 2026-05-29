import { useState, useEffect } from 'react';
import './App.css';
import AdminForm from './AdminForm';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';

const ziskatRelativniCas = (timestamp) => {
  if (!timestamp) return 'Neznámý čas';
  const casVidea = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const rozdilSekund = Math.floor((new Date() - casVidea) / 1000);
  if (rozdilSekund < 60) return 'před chvílí';
  const minuty = Math.floor(rozdilSekund / 60);
  if (minuty < 60) return `před ${minuty} min.`;
  const hodiny = Math.floor(minuty / 60);
  if (hodiny < 24) return `před ${hodiny} hod.`;
  const dny = Math.floor(hodiny / 24);
  return `před ${dny} dny`;
};

function App() {
  // 1. Stavy pro aplikaci a složky
  const [aktivniHlaska, setAktivniHlaska] = useState(null);
  const [databaze, setDatabaze] = useState([]);
  const [slozky, setSlozky] = useState([]);
  const [aktivniSlozkaId, setAktivniSlozkaId] = useState('featured');
  const [jeMoveMod, setJeMoveMod] = useState(false);
  
  // 2. Stavy pro přihlášení (Vráceno zpět!)
  const [uzivatel, setUzivatel] = useState(null);
  const [zobrazitPrihlaseni, setZobrazitPrihlaseni] = useState(false);
  const [jmeno, setJmeno] = useState('');
  const [heslo, setHeslo] = useState('');
  const [chyba, setChyba] = useState('');

  useEffect(() => {
    const odhlasitHlasky = onSnapshot(collection(db, 'hlasky'), (snapshot) => {
      const stazene = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      stazene.sort((a, b) => b.casPridani?.toMillis() - a.casPridani?.toMillis());
      setDatabaze(stazene);
    });

    const odhlasitSlozky = onSnapshot(collection(db, 'slozky'), (snapshot) => {
      const stazeneSlozky = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSlozky(stazeneSlozky);
    });

    const sledovatPrihlaseni = onAuthStateChanged(auth, (u) => setUzivatel(u));

    return () => { odhlasitHlasky(); odhlasitSlozky(); sledovatPrihlaseni(); };
  }, []);

  // 3. Logika pro přihlášení (Vráceno zpět!)
  const zkusitPrihlasit = async (e) => {
    e.preventDefault();
    try {
      const upraveneJmeno = jmeno.trim().toLowerCase();
      const tajnyEmail = `${upraveneJmeno}@memebase.cz`;
      await signInWithEmailAndPassword(auth, tajnyEmail, heslo);
      setZobrazitPrihlaseni(false);
      setChyba('');
      setJmeno('');
      setHeslo('');
    } catch (error) {
      console.error(error);
      setChyba(`Chyba: ${error.code}`);
    }
  };

  const jeAdmin = uzivatel && uzivatel.email === 'admin@memebase.cz';

  const vytvoritSlozku = async () => {
    const nazev = window.prompt("Zadej název nové složky:");
    if (nazev) {
      await addDoc(collection(db, 'slozky'), { nazev });
    }
  };

  const smazatSlozku = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Smazat složku? Hlášky v ní zůstanou, ale budou vráceny do Featured.")) {
      await deleteDoc(doc(db, 'slozky', id));
      setAktivniSlozkaId('featured');
    }
  };

  const presunoutDoSlozky = async (hlaskaId, novaSlozkaId) => {
    await updateDoc(doc(db, 'hlasky', hlaskaId), { slozkaId: novaSlozkaId });
    setJeMoveMod(false);
  };

  // 4. Logika pro mazání a úpravu hlášek
  const smazatHlasku = async (id, event) => {
    event.stopPropagation();
    if (window.confirm("Opravdu chceš tuto hlášku smazat?")) {
      try { await deleteDoc(doc(db, 'hlasky', id)); } 
      catch (error) { alert("Nepodařilo se smazat hlášku."); }
    }
  };

  const upravitNazev = async (id, stavajiciNazev, event) => {
    event.stopPropagation();
    const novyNazev = window.prompt("Uprav název hlášky:", stavajiciNazev);
    if (novyNazev && novyNazev.trim() !== "") {
      try { await updateDoc(doc(db, 'hlasky', id), { nazev: novyNazev.trim() }); } 
      catch (error) { alert("Nepodařilo se změnit název hlášky."); }
    }
  };

  const filtrovaneHlasky = aktivniSlozkaId === 'featured' 
    ? databaze 
    : databaze.filter(h => h.slozkaId === aktivniSlozkaId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
        {uzivatel ? (
          <button onClick={() => signOut(auth)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
            🔓 Odhlásit {jeAdmin && '👑'}
          </button>
        ) : (
          <button onClick={() => setZobrazitPrihlaseni(!zobrazitPrihlaseni)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}>
            🔒 Přihlásit se
          </button>
        )}
      </div>

      <h1 className="hlavni-nadpis">Databáze hlášek</h1>

      {/* Přihlašovací formulář (Vráceno zpět!) */}
      {zobrazitPrihlaseni && !uzivatel && (
        <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
          <h3>Přihlášení</h3>
          <form onSubmit={zkusitPrihlasit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
            <input type="text" placeholder="Uživatelské jméno" value={jmeno} onChange={(e) => setJmeno(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: 'none' }}/>
            <input type="password" placeholder="Heslo" value={heslo} onChange={(e) => setHeslo(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: 'none' }}/>
            <button type="submit" style={{ padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Přihlásit</button>
            {chyba && <p style={{ color: '#ff4d4d', marginTop: '10px' }}>{chyba}</p>}
          </form>
        </div>
      )}

      {/* Navigace složek */}
      <div className="kategorie-nav">
        <div 
          className={`tab ${aktivniSlozkaId === 'featured' ? 'active' : ''}`}
          onClick={() => setAktivniSlozkaId('featured')}
        >
          Featured
        </div>
        
        {slozky.map(s => (
          <div 
            key={s.id} 
            className={`tab ${aktivniSlozkaId === s.id ? 'active' : ''}`}
            onClick={() => setAktivniSlozkaId(s.id)}
            onContextMenu={(e) => {
              if(jeAdmin) {
                e.preventDefault();
                smazatSlozku(s.id, e);
              }
            }}
          >
            {s.nazev}
          </div>
        ))}

        {jeAdmin && (
          <button className="btn-nova-slozka" onClick={vytvoritSlozku}>+ Nová složka</button>
        )}
      </div>

      {jeAdmin && <AdminForm slozky={slozky} />}

      {/* Move Mód */}
      {jeAdmin && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button 
            onClick={() => setJeMoveMod(!jeMoveMod)}
            style={{ padding: '8px 16px', borderRadius: '10px', background: jeMoveMod ? '#4CAF50' : '#333', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {jeMoveMod ? '✅ Hotovo (Mód přesunu)' : '📂 Přesunout hlášky'}
          </button>
        </div>
      )}

      {/* Mřížka hlášek */}
      <div className="yt-mrizka">
        {filtrovaneHlasky.map((hlaska) => (
          <div 
            key={hlaska.id} 
            className="yt-dlazdice"
            style={{ '--ambient-img': `url(${hlaska.soubor})` }}
            onClick={() => {
              if (jeMoveMod) {
                const kam = window.prompt("Kam přesunout? Napiš 'featured' nebo název složky přesně.");
                if (!kam) return;
                
                if (kam.toLowerCase() === 'featured') {
                  presunoutDoSlozky(hlaska.id, 'featured');
                } else {
                  const cil = slozky.find(s => s.nazev.toLowerCase() === kam.toLowerCase());
                  if (cil) presunoutDoSlozky(hlaska.id, cil.id);
                  else alert("Složka nenalezena! Napiš název přesně.");
                }
              } else {
                setAktivniHlaska(hlaska);
              }
            }}
          >
            {/* Overlay pro move mód */}
            {jeMoveMod && <div className="move-overlay">📦</div>}
            
            {/* Tlačítka pro admina (Úprava / Koš) */}
            {jeAdmin && !jeMoveMod && (
              <div className="admin-listy">
                <button onClick={(e) => upravitNazev(hlaska.id, hlaska.nazev, e)} className="admin-btn" style={{ background: 'rgba(230, 180, 0, 0.7)' }} title="Upravit název">✏️</button>
                <button onClick={(e) => smazatHlasku(hlaska.id, e)} className="admin-btn" style={{ background: 'rgba(255, 0, 0, 0.7)' }} title="Smazat hlášku">🗑️</button>
              </div>
            )}

            <div className="nahled-container">
              {hlaska.typ === 'video' ? <video src={hlaska.soubor} preload="metadata" className="nahled-obsah" /> : <div className="ikona-placeholder">{hlaska.ikona}</div>}
            </div>
            <div className="info-sekce">
              <h3 className="video-nazev">{hlaska.nazev}</h3>
              <p className="video-cas">{ziskatRelativniCas(hlaska.casPridani)}</p>
            </div>
          </div>
        ))}
      </div>

      {aktivniHlaska && (
        <div className="modal-pozadi" onClick={() => setAktivniHlaska(null)}>
          <div className="modal-okno" onClick={(e) => e.stopPropagation()}>
            <h2>{aktivniHlaska.nazev}</h2>
            {aktivniHlaska.typ === 'video' ? <video src={aktivniHlaska.soubor} controls autoPlay playsInline className="modal-video" /> : <audio src={aktivniHlaska.soubor} controls autoPlay />}
            <button className="zavrit-btn" onClick={() => setAktivniHlaska(null)}>Zavřít</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;