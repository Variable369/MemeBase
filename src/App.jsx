import { useState, useEffect } from 'react';
import './App.css';
import AdminForm from './AdminForm';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; // Naše spojení s Firebase

function App() {
  const [aktivniHlaska, setAktivniHlaska] = useState(null);
  const [databaze, setDatabaze] = useState([]); // Tady teď bude prázdno, dokud nepřijdou data z cloudu

  // Tento kód se spustí po načtení stránky a začne "poslouchat" databázi
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'hlasky'), (snapshot) => {
      const stazeneHlasky = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Seřadíme hlášky podle času přidání (nejnovější nahoře)
      stazeneHlasky.sort((a, b) => b.casPridani?.toMillis() - a.casPridani?.toMillis());
      
      setDatabaze(stazeneHlasky);
    });

    // Uklidíme posluchač, pokud by uživatel ze stránky odešel
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>🎬 Naše tajná databáze memů</h1>

      {/* Formulář pro nahrávání */}
      <AdminForm />

      {/* Vykreslení mřížky dlaždic z cloudu */}
      <div className="mrizka">
        {databaze.map((hlaska) => (
          <div key={hlaska.id} className="dlazdice" onClick={() => setAktivniHlaska(hlaska)}>
            
            <div className="nahled-box">
              {hlaska.typ === 'video' ? (
                <video 
                  src={hlaska.soubor} 
                  preload="metadata" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                hlaska.ikona 
              )}
            </div>

            <h3>{hlaska.nazev}</h3>
            <p style={{ color: '#888' }}>{hlaska.typ === 'video' ? 'Přehrát video ▶️' : 'Přehrát zvuk 🔊'}</p>
          </div>
        ))}
      </div>

      {/* Vyskakovací okno (Modál) */}
      {aktivniHlaska && (
        <div className="modal-pozadi" onClick={() => setAktivniHlaska(null)}>
          <div className="modal-okno" onClick={(e) => e.stopPropagation()}>
            <h2>{aktivniHlaska.nazev}</h2>
            
            {aktivniHlaska.typ === 'video' ? (
              <video 
                src={aktivniHlaska.soubor} 
                controls 
                autoPlay 
                playsInline
                style={{ width: '100%', maxHeight: '60vh' }}
              />
            ) : (
              <audio 
                src={aktivniHlaska.soubor} 
                controls 
                autoPlay 
              />
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