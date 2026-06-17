export default async function handler(req, res) {
  const { clip } = req.query;
  const projectId = "memebase369";

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/hlasky/${clip}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Nenalezeno');
    
    const data = await response.json();
    
    const nazev = data.fields?.nazev?.stringValue || "ClipStash Hláška";
    const soubor = data.fields?.soubor?.stringValue || "";
    const typ = data.fields?.typ?.stringValue || "video";
    
    const nahledObrazku = typ === 'video' ? soubor.replace(/\.[^/.]+$/, ".jpg") : soubor;

    const html = `<!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>${nazev} - ClipStash</title>
      <meta property="og:type" content="video.other" />
      <meta property="og:title" content="${nazev}" />
      <meta property="og:description" content="Přehrát hlášku na webu ClipStash." />
      <meta property="og:image" content="${nahledObrazku}" />
      <meta property="og:url" content="https://clipstash-cz.vercel.app/?clip=${clip}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${nazev}" />
      <meta name="twitter:description" content="Přehrát hlášku na webu ClipStash." />
      <meta name="twitter:image" content="${nahledObrazku}" />
      <script>window.location.href = "/?clip=${clip}&go=1";</script>
    </head>
    <body>
      <p>Přesměrovávám na hlášku...</p>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);

  } catch (error) {
    res.redirect('/');
  }
}