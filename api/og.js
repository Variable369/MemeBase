export default async function handler(req, res) {
  const { clip } = req.query;

  // 1. ZDE DOPLŇ SVŮJ FIREBASE PROJECT ID (najdeš ho v src/firebase.js)
  const projectId = "memebase369";

  try {
    // 2. Skript bleskově sáhne do tvé veřejné databáze pro data
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/hlasky/${clip}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Nenalezeno');
    
    const data = await response.json();
    
    // 3. Vytažení hodnot z Firebase databáze
    const nazev = data.fields.nazev.stringValue;
    const soubor = data.fields.soubor.stringValue;
    const typ = data.fields.typ ? data.fields.typ.stringValue : 'video';
    
    // 4. Vygenerování obrázku z videa (Náš oblíbený trik s .jpg z Cloudinary)
    const nahledObrazku = typ === 'video' ? soubor.replace(/\.[^/.]+$/, ".jpg") : soubor;

    // 5. Vygenerování "vizitky" pro roboty
    const html = `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <title>${nazev} - ClipStash</title>
        
        <!-- Značky pro Discord, Facebook, iMessage atd. -->
        <meta property="og:type" content="video.other" />
        <meta property="og:title" content="${nazev}" />
        <meta property="og:description" content="Přehrát hlášku na webu ClipStash." />
        <meta property="og:image" content="${nahledObrazku}" />
        <meta property="og:url" content="https://clipstash-cz.vercel.app/?clip=${clip}" />
        
        <!-- Značky speciálně pro velké náhledy -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${nazev}" />
        <meta name="twitter:description" content="Přehrát hlášku na webu ClipStash." />
        <meta name="twitter:image" content="${nahledObrazku}" />
        
        <!-- Pokud na odkaz klikne skutečný člověk, tenhle kód ho bleskově pošle do tvé appky -->
        <script>
          window.location.href = "/?clip=${clip}&go=1";
        </script>
      </head>
      <body>
        <p>Načítám hlášku...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);

  } catch (error) {
    // Pokud by hláška náhodou neexistovala, prostě uživatele hodíme na domovskou stránku
    res.redirect('/');
  }
}