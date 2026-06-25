const fs = require('fs');

const supabaseUrl = 'https://viabbtrtusufxbuhxypb.supabase.co';
const apiKey = 'sb_publishable_i2E9hvP2PfkSsrYauszvCw_GO7BhNeP';
const siteUrl = 'https://tabibclick.com';

async function generateSitemap() {
  try {
    console.log('📡 Fetching doctors from Supabase...');
    const res = await fetch(`${supabaseUrl}/rest/v1/medecins?select=id,nom`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }

    const doctors = await res.json();
    console.log(`🩺 Found ${doctors.length} doctors. Generating XML sitemap...`);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main site -->
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    doctors.forEach(doc => {
      // Create clean URL slug
      const slug = `${doc.id}-${doc.nom.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const docUrl = `${siteUrl}/?medecin=${slug}`;
      
      xml += `  <url>
    <loc>${docUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    fs.writeFileSync('sitemap.xml', xml, 'utf8');
    console.log(`✅ sitemap.xml generated successfully in the project directory!`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
  }
}

generateSitemap();
