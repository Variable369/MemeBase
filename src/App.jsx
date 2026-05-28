import { useState } from 'react'
import './App.css'

const databaze = [
  { 
    id: 1, 
    nazev: 'Pelíšky: Rozkaz zněl jasně', 
    typ: 'audio',
    soubor: '/hlaska1.mp3', 
    ikona: '🔊'
  },
  { 
    id: 2, 
    nazev: 'Okresní přebor: Předseda hodil po nás kouli!', 
    typ: 'video', 
    soubor: '/predseda_hodil_po_nas_kouli.mp4', 
    ikona: '🎬' 
  },
  { 
    id: 3, 
    nazev: 'Zolik - Na shorte cupi',
    typ: 'audio', 
    soubor: '/nashortecupi.mp3', // Přesný název z public složky
    ikona: '🔊' 
  }
]

function App() {
  const [aktivniHlaska, setAktivniHlaska] = useState(null)

  return (
    <div>
      <h1 style={{ textAlign: 'center', modernization: '40px' }}>Vyber hlášku</h1>

      {/* Vykreslení mřížky dlaždic */}
      <div className="mrizka">
        {databaze.map((hlaska) => (
          <div key={hlaska.id} className="dlazdice" onClick={() => setAktivniHlaska(hlaska)}>
            
            <div className="nahled-box">
              {/* ZMĚNA ZDE: Pokud je to video, vykreslíme mini-video jako automatický obrázek */}
              {hlaska.typ === 'video' ? (
                <video 
                  src={hlaska.soubor} 
                  preload="metadata" /* Říká prohlížeči: stáhni jen začátek pro náhled */
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                hlaska.ikona /* Pro audio necháme přehlednou ikonku repráčku */
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
            
            {/* Přehrávače */}
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
  )
}

export default App