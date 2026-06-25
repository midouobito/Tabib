import { useState } from 'react';
import { supabase } from '../utils/supabaseClient'; // Ajuste le chemin selon ton projet

export default function AddMedecinForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // L'état qui stocke toutes les valeurs du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    specialite: 'Généraliste',
    wilaya: 'Batna',
    ville: '',
    adresse: '',
    telephone: ''
  });

  // Met à jour l'état quand tu tapes dans un champ
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // La fonction qui envoie les données à Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Envoi de la requête INSERT à Supabase
    const { error } = await supabase
      .from('medecins')
      .insert([
        {
          nom: formData.nom,
          specialite: formData.specialite,
          wilaya: formData.wilaya,
          ville: formData.ville,
          adresse: formData.adresse,
          telephone: formData.telephone,
          horaires: '08:00 - 16:00',
          jours: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu'],
          disponible: true, // Par défaut, on le marque comme disponible
        }
      ]);

    if (error) {
      console.error(error);
      setMessage({ type: 'error', text: "Erreur lors de l'ajout : " + error.message });
    } else {
      setMessage({ type: 'success', text: "Médecin ajouté avec succès à l'annuaire !" });
      // On vide le formulaire pour le suivant
      setFormData({ nom: '', specialite: 'Généraliste', wilaya: 'Batna', ville: '', adresse: '', telephone: '' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">➕ Ajouter un Médecin</h2>

      {/* Affichage des messages de succès ou d'erreur */}
      {message.text && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ligne 1 : Nom et Spécialité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Nom complet du docteur *</label>
            <input type="text" name="nom" required value={formData.nom} onChange={handleChange} placeholder="ex: Dr. Sahraoui.F"
              className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-cyan-400 outline-none" />
          </div>
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Spécialité *</label>
            <select name="specialite" value={formData.specialite} onChange={handleChange}
              className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-cyan-400 outline-none">
              <option value="Généraliste">Généraliste</option>
              <option value="Gynécologue">Gynécologue</option>
              <option value="Pédiatre">Pédiatre</option>
              <option value="Cardiologue">Cardiologue</option>
              {/* Ajoute tes autres spécialités ici */}
            </select>
          </div>
        </div>

        {/* Ligne 2 : Wilaya et Ville */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Wilaya *</label>
            <select name="wilaya" value={formData.wilaya} onChange={handleChange}
              className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-cyan-400 outline-none">
              <option value="Batna">Batna</option>
              <option value="Alger">Alger</option>
              <option value="Oran">Oran</option>
              {/* Liste des wilayas... */}
            </select>
          </div>
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Commune / Ville *</label>
            <input type="text" name="ville" required value={formData.ville} onChange={handleChange} placeholder="ex: Ain Touta"
              className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-cyan-400 outline-none" />
          </div>
        </div>

        {/* Ligne 3 : Adresse et Téléphone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Adresse exacte</label>
            <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} placeholder="ex: Cité 16 Avril..."
              className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-cyan-400 outline-none" />
          </div>
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Téléphone du cabinet *</label>
            <input type="tel" name="telephone" required value={formData.telephone} onChange={handleChange} placeholder="ex: 0555..."
              className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-cyan-400 outline-none" />
          </div>
        </div>

        {/* Bouton de soumission */}
        <button type="submit" disabled={loading}
          className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
          {loading ? 'Enregistrement en cours...' : 'Ajouter à la base de données'}
        </button>
      </form>
    </div>
  );
}
