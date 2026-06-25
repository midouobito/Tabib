const { execSync } = require('child_process');

const args = process.argv.slice(2);
const targetCity = args[0] || 'Batna';

// Liste complète des spécialités médicales à collecter
const specialties = [
  { query: 'médecin généraliste', label: 'Généraliste' },
  { query: 'pédiatre', label: 'Pédiatre' },
  { query: 'gynécologue', label: 'Gynécologue' },
  { query: 'cardiologue', label: 'Cardiologue' },
  { query: 'ophtalmologue', label: 'Ophtalmologue' },
  { query: 'dermatologue', label: 'Dermatologue' },
  { query: 'orl', label: 'ORL' },
  { query: 'dentiste', label: 'Dentiste' },
  { query: 'gastro-entérologue', label: 'Gastro-entérologue' },
  { query: 'orthopédiste', label: 'Orthopédiste' },
  { query: 'neurologue', label: 'Neurologue' },
  { query: 'urologue', label: 'Urologue' },
  { query: 'psychiatre', label: 'Psychiatre' },
  { query: 'endocrinologue', label: 'Endocrinologue' },
  { query: 'pneumologue', label: 'Pneumologue' },
  { query: 'rhumatologue', label: 'Rhumatologue' },
  { query: 'néphrologue', label: 'Néphrologue' },
  { query: 'oncologue', label: 'Oncologue' },
  { query: 'radiologue', label: 'Radiologue' },
  { query: 'chirurgien', label: 'Chirurgien' },
  { query: 'allergologue', label: 'Allergologue' },
  { query: 'médecine interne', label: 'Médecin interniste' },
  { query: 'neurochirurgien', label: 'Neurochirurgien' },
  { query: 'nutritionniste', label: 'Nutritionniste' },
  { query: 'hématologue', label: 'Hématologue' },
  { query: 'infectiologue', label: 'Infectiologue' },
  { query: 'rééducation fonctionnelle', label: 'Médecine physique' },
  { query: 'médecine du sport', label: 'Médecin du sport' },
  { query: 'gériatre', label: 'Gériatre' },
  { query: 'chirurgien esthétique', label: 'Chirurgien esthétique' },
  { query: 'anesthésiste réanimateur', label: 'Anesthésiste' }
];

// Délai de sécurité (en secondes) entre chaque catégorie pour éviter les blocages de Google
const DELAY_BETWEEN_RUNS = 12;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBatchSpecialties() {
  console.log(`🚀 Lancement du scraping de toutes les spécialités médicales pour : ${targetCity.toUpperCase()}`);
  console.log(`⏱️ Délai de sécurité de ${DELAY_BETWEEN_RUNS} secondes entre chaque spécialité.\n`);

  for (let i = 0; i < specialties.length; i++) {
    const spec = specialties[i];
    console.log(`========================================`);
    console.log(`🩺 [${i + 1}/${specialties.length}] Spécialité : ${spec.label.toUpperCase()}`);
    console.log(`========================================`);

    try {
      // Lance auto_scraper.js pour la spécialité courante
      execSync(`node auto_scraper.js "${spec.query} ${targetCity}" "${spec.label}" "${targetCity}"`, { stdio: 'inherit' });
      console.log(`\n✅ Spécialité ${spec.label} terminée.`);
    } catch (err) {
      console.error(`\n❌ Erreur lors du scraping de la spécialité ${spec.label} :`, err.message);
    }

    if (i < specialties.length - 1) {
      console.log(`⏳ Attente de ${DELAY_BETWEEN_RUNS} secondes...\n`);
      await sleep(DELAY_BETWEEN_RUNS * 1000);
    }
  }

  console.log(`\n🎉 TOUTES LES SPÉCIALITÉS POUR ${targetCity.toUpperCase()} ONT ÉTÉ COLLECTÉES AVEC SUCCÈS !`);
}

runBatchSpecialties();
