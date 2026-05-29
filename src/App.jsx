import { useState, useEffect } from 'react';
import './App.css';
import AdminForm from './AdminForm';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';

// Pomocná funkce pro výpočet času "před..."
const ziskatRelativniCas = (timestamp) => {
  if (!timestamp) return 'Neznámý čas';
  
  // Firebase timestamp musíme nejprve převést na klasický JavaScriptový datum
  const casVidea = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const rozdilSekund = Math.floor((new Date() - casVidea) / 1000);

  if (rozdilSekund < 60) return 'před chvílí';
  
  const minuty = Math.floor(rozdilSekund / 60);
  if (minuty < 60) return minuty === 1 ? 'před 1 minutou' : `před ${minuty} minutami`;
  
  const hodiny = Math.floor(minuty / 60);
  if (hodiny < 24) return hodiny === 1 ? 'před 1 hodinou' : `před ${hodiny} hodinami`;
  
  const dny = Math.floor(hodiny / 24);
  if (dny < 30) return dny === 1 ? 'před 1 dnem' : `před ${dny} dny`;
  
  const mesice = Math.floor(dny / 30);
  if (mesice < 12) return mesice === 1 ? 'před 1 měsícem' : `před ${mesice} měsíci`;
  
  const roky = Math.floor(mesice / 12);
  return roky === 1 ? 'před 1 rokem' : `před ${roky} lety`;
};

function App() {
  const [aktivniHlaska, setAktivniHlaska] = useState(null);
  const [databaze, setDatabaze] = useState([]);
  
  const [uzivatel, setUzivatel] = useState(null);
  const [zobrazitPrihlaseni, setZobrazitPrihlaseni] = useState(false);
  const [jmeno, setJmeno] = useState('');
  const [heslo, setHeslo] = useState('');
  const [chyba, setChyba] = useState('');

  useEffect(() => {
    const odhlasitDatabazi = onSnapshot(collection(db, 'hlasky'), (snapshot) => {
      const stazeneHlasky = snapshot.docs.map(dokument => ({
        id: dokument.id,
        ...dokument.data()
      }));
      stazeneHlasky.sort((a, b) => b.casPridani?.toMillis() - a.casPridani?.toMillis());
      setDatabaze(stazeneHlasky);
    });

    const sledovatPrihlaseni = onAuthStateChanged(auth, (aktualniUzivatel) => {
      setUzivatel(aktualniUzivatel);
    });

    return () => {
      odhlasitDatabazi();
      sledovatPrihlaseni();
    };
  }, []);

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

  const zkusitOdhlasit = async () => {
    await signOut(auth);
  };

  const jeAdmin = uzivatel && uzivatel.email === 'admin@memebase.cz';

  const smazatHlasku = async (id, event) => {
    event.stopPropagation();
    const potvrzeni = window.confirm("Opravdu chceš tuto hlášku smazat?");
    if (potvrzeni) {
      try {
        await deleteDoc(doc(db, 'hlasky', id));
      } catch (error) {
        console.error("Chyba při mazání: ", error);
        alert("Nepodařilo se smazat hlášku.");
      }
    }
  };

  const upravitNazev = async (id, stavajiciNazev, event) => {
    event.stopPropagation();
    const novyNazev = window.prompt("Uprav název hlášky:", stavajiciNazev);
    if (novyNazev && novyNazev.trim() !== "") {
      try {
        await updateDoc(doc(db, 'hlasky', id), {
          nazev: novyNazev.trim()
        });
      } catch (error) {
        console.error("Chyba při úpravě názvu: ", error);
        alert("Nepodařilo se změnit název hlášky.");
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
        {uzivatel ? (
          <button onClick={zkusitOdhlasit} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
            🔓 Odhlásit ({uzivatel.email.split('@')[0]}) {jeAdmin && '👑'}
          </button>
        ) : (
          <button onClick={() => setZobrazitPrihlaseni(!zobrazitPrihlaseni)} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}>
            🔒 Přihlásit se
          </button>
        )}
      </div>

      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>🎬 Naše tajná databáze memů</h1>

      {zobrazitPrihlaseni && !uzivatel && (
        <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
          <h3>Vstup pro tvůrce</h3>
          <form onSubmit={zkusitPrihlasit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
            <input 
              type="text" placeholder="Uživatelské jméno" value={jmeno} onChange={(e) => setJmeno(e.target.value)} 
              style={{ padding: '8px', borderRadius: '5px', border: 'none' }}
            />
            <input 
              type="password" placeholder="Heslo" value={heslo} onChange={(e) => setHeslo(e.target.value)} 
              style={{ padding: '8px', borderRadius: '5px', border: 'none' }}
            />
            <button type="submit" style={{ padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              Přihlásit
            </button>
            {chyba && <p style={{ color: '#ff4d4d', marginTop: '10px' }}>{chyba}</p>}
          </form>
        </div>
      )}

      {uzivatel && <AdminForm />}

      {/* Mřížka s novým čistým designem */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '20px' }}>
        {databaze.map((hlaska) => (
          <div 
            key={hlaska.id} 
            onClick={() => setAktivniHlaska(hlaska)} 
            style={{ position: 'relative', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            
            {jeAdmin && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '5px' }}>
                <button onClick={(e) => upravitNazev(hlaska.id, hlaska.nazev, e)} style={{ background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '5px', padding: '6px', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                <button onClick={(e) => smazatHlasku(hlaska.id, e)} style={{ background: 'rgba(255, 0, 0, 0.8)', color: 'white', border: 'none', borderRadius: '5px', padding: '6px', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
              </div>
            )}

            {/* Náhled videa (YouTube styl) */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#111' }}>
              {hlaska.typ === 'video' ? (
                <video src={hlaska.soubor} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>{hlaska.ikona}</div>
              )}
            </div>
            
            {/* Informace pod videem */}
            <div style={{ padding: '0 4px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#f1f1f1', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {hlaska.nazev}
              </h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#aaaaaa' }}>
                {ziskatRelativniCas(hlaska.casPridani)}
              </p>
            </div>
            
          </div>
        ))}
      </div>

      {aktivniHlaska && (
        <div className="modal-pozadi" onClick={() => setAktivniHlaska(null)}>
          <div className="modal-okno" onClick={(e) => e.stopPropagation()}>
            <h2>{aktivniHlaska.nazev}</h2>
            {aktivniHlaska.typ === 'video' ? (
              <video src={aktivniHlaska.soubor} controls autoPlay playsInline style={{ width: '100%', maxHeight: '60vh', borderRadius: '8px' }} />
            ) : (
              <audio src={aktivniHlaska.soubor} controls autoPlay />
            )}
            <br />
            <button className="zavrit-btn" onClick={() => setAktivniHlaska(null)}>Zavřít</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;