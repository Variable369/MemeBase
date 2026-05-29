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
  const [aktivniHlaska, setAktivniHlaska] = useState(null);
  const [databaze, setDatabaze] = useState([]);
  const [slozky, setSlozky] = useState([]);
  const [aktivniSlozkaId, setAktivniSlozkaId] = useState('featured');
  
  const [uzivatel, setUzivatel] = useState(null);
  const [zobrazitPrihlaseni, setZobrazitPrihlaseni] = useState(false);
  const [jeMoveMod, setJeMoveMod] = useState(false);

  useEffect(() => {
    // Sledování hlášek
    const odhlasitHlasky = onSnapshot(collection(db, 'hlasky'), (snapshot) => {
      const stazene = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      stazene.sort((a, b) => b.casPridani?.toMillis() - a.casPridani?.toMillis());
      setDatabaze(stazene);
    });

    // Sledování složek
    const odhlasitSlozky = onSnapshot(collection(db, 'slozky'), (snapshot) => {
      const stazeneSlozky = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSlozky(stazeneSlozky);
    });

    const sledovatPrihlaseni = onAuthStateChanged(auth, (u) => setUzivatel(u));

    return () => { odhlasitHlasky(); odhlasitSlozky(); sledovatPrihlaseni(); };
  }, []);

  const jeAdmin = uzivatel && uzivatel.email === 'admin@memebase.cz';

  const vytvoritSlozku = async () => {
    const nazev = window.prompt("Zadej název nové složky:");
    if (nazev) {
      await addDoc(collection(db, 'slozky'), { nazev });
    }
  };

  const smazatSlozku = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Smazat složku? Hlášky v ní zůstanou, ale budou bez složky.")) {
      await deleteDoc(doc(db, 'slozky', id));
      setAktivniSlozkaId('featured');
    }
  };

  const presunoutDoSlozky = async (hlaskaId, novaSlozkaId) => {
    await updateDoc(doc(db, 'hlasky', hlaskaId), { slozkaId: novaSlozkaId });
    setJeMoveMod(false);
  };

  // Filtrování hlášek podle vybrané složky
  const filtrovaneHlasky = aktivniSlozkaId === 'featured' 
    ? databaze 
    : databaze.filter(h => h.slozkaId === aktivniSlozkaId);

  return (
    <div>
      {/* Horní lišta */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
        {uzivatel ? (
          <button onClick={() => signOut(auth)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
            🔓 Odhlásit {jeAdmin && '👑'}
          </button>
        ) : (
          <button onClick={() => setZobrazitPrihlaseni(true)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}>🔒</button>
        )}
      </div>

      <h1 className="hlavni-nadpis">Databáze hlášek</h1>

      {/* NAVIGAČNÍ LIŠTA SLOŽEK */}
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
            onContextMenu={(e) => jeAdmin && smazatSlozku(s.id, e)} // Pravé tlačítko smaže složku
          >
            {s.nazev}
          </div>
        ))}

        {jeAdmin && (
          <button className="btn-nova-slozka" onClick={vytvoritSlozku}>+ Nová složka</button>
        )}
      </div>

      {jeAdmin && <AdminForm slozky={slozky} />}

      {/* Přepínač MOVE módu pro admina */}
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

      <div className="yt-mrizka">
        {filtrovaneHlasky.map((hlaska) => (
          <div 
            key={hlaska.id} 
            className="yt-dlazdice"
            style={{ '--ambient-img': `url(${hlaska.soubor})` }}
            onClick={() => {
              if (jeMoveMod) {
                const kam = window.prompt("Kam přesunout? Napiš 'featured' nebo název složky přesně.");
                if (kam === 'featured') presunoutDoSlozky(hlaska.id, 'featured');
                else {
                  const cil = slozky.find(s => s.nazev.toLowerCase() === kam.toLowerCase());
                  if (cil) presunoutDoSlozky(hlaska.id, cil.id);
                  else alert("Složka nenalezena!");
                }
              } else {
                setAktivniHlaska(hlaska);
              }
            }}
          >
            {jeMoveMod && <div className="move-overlay">📦</div>}
            
            <div className="nahled-container">
              {hlaska.typ === 'video' ? <video src={hlaska.soubor} className="nahled-obsah" /> : <div className="ikona-placeholder">{hlaska.ikona}</div>}
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
            {aktivniHlaska.typ === 'video' ? <video src={aktivniHlaska.soubor} controls autoPlay className="modal-video" /> : <audio src={aktivniHlaska.soubor} controls autoPlay />}
            <button className="zavrit-btn" onClick={() => setAktivniHlaska(null)}>Zavřít</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;