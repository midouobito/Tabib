const puppeteer = require('puppeteer');

const supabaseUrl = 'https://viabbtrtusufxbuhxypb.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYWJidHJ0dXN1ZnhidWh4eXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjE3MDg1MiwiZXhwIjoyMDk3NzQ2ODUyfQ.T2eTcwCBhL3PswvEUJgmOK2pTV0zrulDOqVp04pgpsg';

// Get search arguments
const args = process.argv.slice(2);
const searchQuery = args[0];
const categorySpecialty = args[1] || 'Pharmacie';
const cityWilaya = args[2] || 'Alger';

if (!searchQuery) {
  console.log(`
❌ Argument manquant !
Usage: node auto_scraper.js "<requête Google Maps>" "<Spécialité>" "<Wilaya/Ville>"
Exemple: node auto_scraper.js "pharmacie Oran" "Pharmacie" "Oran"
Exemple: node auto_scraper.js "pédiatre Batna" "Pédiatre" "Batna"
  `);
  process.exit(1);
}

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for Supabase fetch requests
async function checkDuplicate(nom, telephone) {
  try {
    const url = `${supabaseUrl}/rest/v1/medecins?nom=eq.${encodeURIComponent(nom)}&telephone=eq.${encodeURIComponent(telephone)}&select=id`;
    const res = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    return data.length > 0;
  } catch (err) {
    console.error(`⚠️ Erreur lors de la vérification de doublon pour ${nom}:`, err.message);
    return false;
  }
}

async function insertDoctor(payload) {
  try {
    const url = `${supabaseUrl}/rest/v1/medecins`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${res.statusText}: ${errText}`);
    }
    const data = await res.json();
    return data[0];
  } catch (err) {
    console.error(`❌ Erreur d'insertion pour ${payload.nom}:`, err.message);
    return null;
  }
}

async function startScraping() {
  console.log(`🤖 Lancement du Scraper Automatique pour: "${searchQuery}"`);
  console.log(`🏷️ Catégorie: ${categorySpecialty} | Ville: ${cityWilaya}`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set window size
  await page.setViewport({ width: 1200, height: 900 });
  
  // Go to google maps search
  const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
  console.log(`🌐 Navigation vers Google Maps...`);
  await page.goto(mapsSearchUrl, { waitUntil: 'networkidle2' });

  console.log(`⏳ Attente du chargement de la liste...`);
  await sleep(4000);

  // Find scrollable feed container in page context
  console.log(`📜 Défilement automatique de la liste (recherche des fiches)...`);
  
  await page.evaluate(async () => {
    // Find the sidebar feed container
    let feed = document.querySelector('div[role="feed"]');
    if (!feed) {
      const divs = document.querySelectorAll('div');
      for (const div of divs) {
        const style = window.getComputedStyle(div);
        const hasScroll = div.scrollHeight > div.clientHeight;
        const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';
        const isSidebarWidth = div.clientWidth > 250 && div.clientWidth < 500;
        if (hasScroll && isScrollable && isSidebarWidth) {
          feed = div;
          break;
        }
      }
    }

    if (!feed) {
      console.error("Sidebar feed container not found");
      return;
    }

    // Auto-scroll loop
    let lastHeight = feed.scrollHeight;
    let retries = 0;
    while (retries < 5) {
      feed.scrollBy(0, 1000);
      await new Promise(r => setTimeout(r, 2000));
      let newHeight = feed.scrollHeight;
      if (newHeight === lastHeight) {
        // Try scrolling one more time or wait longer
        feed.scrollBy(0, 1000);
        await new Promise(r => setTimeout(r, 3000));
        if (feed.scrollHeight === lastHeight) {
          retries++;
        } else {
          retries = 0;
        }
      } else {
        retries = 0;
      }
      lastHeight = feed.scrollHeight;
    }
  });

  console.log(`🔍 Défilement terminé. Extraction des éléments...`);

  // Extract places data
  const doctors = await page.evaluate((spec, city) => {
    const items = document.querySelectorAll('a[href*="/maps/place/"]');
    const results = [];
    const phoneRegex = /(?:0|\+213)\s*[2-7](?:\s*[0-9]){7,8}/;
    
    items.forEach((item) => {
      try {
        const nom = item.getAttribute('aria-label') || item.innerText.split('\n')[0] || "Sans nom";
        const url = item.getAttribute('href') || "";
        
        let lat = null, lng = null;
        const latLngMatch = url.match(/!3d([0-9.-]+)!4d([0-9.-]+)/);
        if (latLngMatch) {
          lat = parseFloat(latLngMatch[1]);
          lng = parseFloat(latLngMatch[2]);
        }
  
        let card = item;
        // Climb up to get the place card text content
        for (let i = 0; i < 10; i++) {
          if (card && card.parentElement && card.parentElement.clientWidth > 250) {
            card = card.parentElement;
          }
        }
        
        const cardText = card ? card.innerText : "";
        const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);
        
        let telephone = "Non renseigné";
        const phoneMatch = cardText.match(phoneRegex);
        if (phoneMatch) {
          telephone = phoneMatch[0].replace(/[\s-]/g, '').replace('+213', '0');
        }
  
        let adresse = "Algérie";
        for (const line of lines) {
          if (line.includes('·')) {
            const parts = line.split('·');
            const secondPart = parts[1] ? parts[1].trim() : '';
            if (secondPart && !secondPart.includes('Ferm') && !secondPart.includes('Ouvert') && !secondPart.match(/[0-9]{9,10}/) && !secondPart.includes('+')) {
              adresse = secondPart;
              break;
            }
          }
        }
        
        if (adresse === "Algérie" || adresse.includes('+')) {
          const excludeKeywords = ['étoile', 'stars', 'fermé', 'ouvert', 'horaires', 'site', 'direction', 'partager', 'enregistrer', 'téléphone', 'appeler', 'ferme'];
          const addressLines = lines.filter(line => {
            if (line.includes(nom)) return false;
            if (phoneRegex.test(line)) return false;
            if (line.match(/^[0-9.,\s()]+$/)) return false;
            if (excludeKeywords.some(kw => line.toLowerCase().includes(kw))) return false;
            return true;
          });
          if (addressLines.length > 0) {
            adresse = addressLines[0];
          }
        }
  
        results.push({
          nom,
          specialite: spec,
          ville: city,
          wilaya: city,
          adresse,
          telephone,
          horaires: "08:00 - 16:00",
          jours: ["Dim", "Lun", "Mar", "Mer", "Jeu"],
          disponible: true,
          lat,
          lng
        });
      } catch (err) {
        // ignore errors on individual cards
      }
    });
    return results;
  }, categorySpecialty, cityWilaya);

  await browser.close();

  console.log(`📊 Total fiches extraites: ${doctors.length}`);
  
  if (doctors.length === 0) {
    console.log(`⚠️ Aucune fiche trouvée. Veuillez vérifier votre recherche.`);
    return;
  }

  console.log(`💾 Vérification et insertion dans la base de données...`);
  
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    
    // Check if duplicate
    const isDup = await checkDuplicate(doc.nom, doc.telephone);
    if (isDup) {
      skipped++;
      console.log(`[~] Ignoré (Doublon) : ${doc.nom} (${doc.telephone})`);
      continue;
    }

    // Insert doctor
    const res = await insertDoctor(doc);
    if (res) {
      inserted++;
      console.log(`[+] Inséré avec succès (${i + 1}/${doctors.length}) : ${doc.nom}`);
    }
    
    // Tiny delay to avoid hitting Supabase rate limits
    await sleep(200);
  }

  console.log(`\n🎉 Scraping complété !`);
  console.log(`✅ Ajoutés : ${inserted}`);
  console.log(`🟡 Ignorés (Doublons) : ${skipped}`);
}

startScraping();
