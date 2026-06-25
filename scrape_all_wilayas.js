const { execSync } = require('child_process');

// Liste officielle des 58 wilayas d'Algérie
const wilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", 
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", 
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", 
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", 
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", 
  "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela", 
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", 
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Baji Mokhtar", "Ouled Djellal", 
  "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
];

// Délai d'attente (en secondes) entre chaque wilaya pour éviter les blocages de sécurité de Google Maps
const DELAY_BETWEEN_WILAYAS_SECONDS = 15;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runScraperForAll() {
  console.log(`🚀 Démarrage du scraping global pour les 58 wilayas d'Algérie.`);
  console.log(`⏱️ Un délai de ${DELAY_BETWEEN_WILAYAS_SECONDS} secondes sera appliqué entre chaque wilaya.\n`);

  for (let i = 0; i < wilayas.length; i++) {
    const wilaya = wilayas[i];
    const percentage = Math.round(((i + 1) / wilayas.length) * 100);
    
    console.log(`========================================`);
    console.log(`📍 WILAYA [${i + 1}/${wilayas.length}] (${percentage}%) : ${wilaya.toUpperCase()}`);
    console.log(`========================================`);

    try {
      // Exécute le scraper pour la wilaya en cours
      execSync(`node auto_scraper.js "pharmacie ${wilaya}" "Pharmacie" "${wilaya}"`, { stdio: 'inherit' });
      
      console.log(`\n✅ Wilaya ${wilaya} terminée avec succès.`);
    } catch (error) {
      console.error(`\n❌ Une erreur est survenue lors du scraping de la wilaya ${wilaya} :`, error.message);
    }

    // Si ce n'est pas la dernière wilaya, on attend avant la suivante
    if (i < wilayas.length - 1) {
      console.log(`⏳ Attente de ${DELAY_BETWEEN_WILAYAS_SECONDS} secondes avant la prochaine wilaya...\n`);
      await sleep(DELAY_BETWEEN_WILAYAS_SECONDS * 1000);
    }
  }

  console.log("\n🎉 TOUTES LES 58 WILAYAS ONT ÉTÉ TRAITÉES AVEC SUCCÈS !");
}

runScraperForAll();
