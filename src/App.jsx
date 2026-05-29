import { useState, useEffect } from 'react';
import './App.css';
import AdminForm from './AdminForm';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';

const ziskatRelativniCas = (timestamp) => {
  if (!timestamp) return 'Neznámý čas';
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

      <h1 className="hlavni-nadpis">🎬 ClipStash CZ</h1>

      {zobrazitPrihlaseni && !uzivatel && (
        <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
          <h3>Vstup pro tvůrce</h3>
          <form onSubmit={zkusitPrihlasit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
            <input type="text" placeholder="Uživatelské jméno" value={jmeno} onChange={(e) => setJmeno(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: 'none' }}/>
            <input type="password" placeholder="Heslo" value={heslo} onChange={(e) => setHeslo(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: 'none' }}/>
            <button type="submit" style={{ padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Přihlásit</button>
            {chyba && <p style={{ color: '#ff4d4d', marginTop: '10px' }}>{chyba}</p>}
          </form>
        </div>
      )}

      {uzivatel && <AdminForm />}

      {/* Mřížka (třída z CSS) */}
      <div className="yt-mrizka">
        {databaze.map((hlaska) => (
          <div 
            key={hlaska.id} 
            onClick={() => setAktivniHlaska(hlaska)} 
            className="yt-dlazdice"
            // TRIK: Předáme odkaz na soubor do CSS proměnné pro ambientní efekt
            style={{ '--ambient-img': `url(${hlaska.soubor})` }}
          >
            
            {jeAdmin && (
              <div className="admin-listy">
                <button onClick={(e) => upravitNazev(hlaska.id, hlaska.nazev, e)} className="admin-btn" style={{ background: 'rgba(230, 180, 0, 0.7)' }} title="Upravit název">✏️</button>
                <button onClick={(e) => smazatHlasku(hlaska.id, e)} className="admin-btn" style={{ background: 'rgba(255, 0, 0, 0.7)' }} title="Smazat hlášku">🗑️</button>
              </div>
            )}

            {/* Náhled (třídy z CSS) */}
            <div className="nahled-container">
              {hlaska.typ === 'video' ? (
                <video src={hlaska.soubor} preload="metadata" className="nahled-obsah" />
              ) : (
                <div className="ikona-placeholder">{hlaska.ikona}</div>
              )}
            </div>
            
            {/* Informace (třídy z CSS) */}
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
            {aktivniHlaska.typ === 'video' ? (
              <video src={aktivniHlaska.soubor} controls autoPlay playsInline className="modal-video" />
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