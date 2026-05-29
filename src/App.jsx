import { useState, useEffect } from 'react';
import './App.css';
import AdminForm from './AdminForm';
// ZMĚNA 1: Přidali jsme 'updateDoc' pro možnost úpravy políček
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';

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
    event.stopPropagation(); // Zamezí otevření videa
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

  // ZMĚNA 2: Nová funkce pro úpravu názvu hlášky
  const upravitNazev = async (id, stavajiciNazev, event) => {
    event.stopPropagation(); // Zamezí otevření videa
    
    // Otevře vyskakovací okno s předvyplněným starým názvem
    const novyNazev = window.prompt("Uprav název hlášky:", stavajiciNazev);
    
    // Zkontrolujeme, zda uživatel nedal Cancel nebo nenechal pole prázdné
    if (novyNazev && novyNazev.trim() !== "") {
      try {
        // Aktualizujeme pouze políčko 'nazev' ve Firebase
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

      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Databáze hlášek</h1>

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

      <div className="mrizka">
        {databaze.map((hlaska) => (
          <div key={hlaska.id} className="dlazdice" onClick={() => setAktivniHlaska(hlaska)} style={{ position: 'relative' }}>
            
            {/* Ovládací tlačítka pro Admina */}
            {jeAdmin && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '5px' }}>
                {/* ZMĚNA 3: Přidáno žluté tlačítko pro úpravu */}
                <button 
                  onClick={(e) => upravitNazev(hlaska.id, hlaska.nazev, e)}
                  style={{
                    background: 'rgba(230, 180, 0, 0.9)', color: 'white', border: 'none', 
                    borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', fontSize: '14px'
                  }}
                  title="Upravit název"
                >
                  ✏️
                </button>
                
                <button 
                  onClick={(e) => smazatHlasku(hlaska.id, e)}
                  style={{
                    background: 'rgba(255, 0, 0, 0.8)', color: 'white', border: 'none', 
                    borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', fontSize: '14px'
                  }}
                  title="Smazat hlášku"
                >
                  🗑️
                </button>
              </div>
            )}

            <div className="nahled-box">
              {hlaska.typ === 'video' ? (
                <video src={hlaska.soubor} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                hlaska.ikona 
              )}
            </div>
            <h3>{hlaska.nazev}</h3>
            <p style={{ color: '#888' }}>{hlaska.typ === 'video' ? 'Přehrát video ▶️' : 'Přehrát zvuk 🔊'}</p>
          </div>
        ))}
      </div>

      {aktivniHlaska && (
        <div className="modal-pozadi" onClick={() => setAktivniHlaska(null)}>
          <div className="modal-okno" onClick={(e) => e.stopPropagation()}>
            <h2>{aktivniHlaska.nazev}</h2>
            {aktivniHlaska.typ === 'video' ? (
              <video src={aktivniHlaska.soubor} controls autoPlay playsInline style={{ width: '100%', maxHeight: '60vh' }} />
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