-- 1. CRÉATION DE LA TABLE DES PROFILS (RÔLES ET SÉCURITÉ)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'patient', 'medecin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de la RLS sur la table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour la table profiles
CREATE POLICY "Les profils sont visibles par tous" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 2. DÉCLENCHEUR D'INSCRIPTION AUTOMATIQUE (TRIGGER)
-- Crée automatiquement une entrée dans la table profiles lors de l'inscription d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'patient');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suppression du trigger s'il existe déjà pour éviter les doublons
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. MODIFICATION DE LA TABLE DES MÉDECINS
-- Ajout de la colonne de liaison avec le profil utilisateur (médecin ayant revendiqué la fiche)
ALTER TABLE public.medecins 
    ADD COLUMN IF NOT EXISTS claimed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS) SUR LES MÉDECINS
-- Activation de la RLS sur la table medecins
ALTER TABLE public.medecins ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour éviter les conflits si ré-exécuté
DROP POLICY IF EXISTS "Lecture publique pour tous" ON public.medecins;
DROP POLICY IF EXISTS "Modification pour les administrateurs et propriétaires" ON public.medecins;
DROP POLICY IF EXISTS "Insertion réservée aux administrateurs" ON public.medecins;
DROP POLICY IF EXISTS "Suppression réservée aux administrateurs" ON public.medecins;

-- Politique de lecture : tout le monde peut voir l'annuaire
CREATE POLICY "Lecture publique pour tous" 
    ON public.medecins FOR SELECT 
    USING (true);

-- Politique de modification : seuls les admins et le médecin propriétaire de sa fiche peuvent modifier
CREATE POLICY "Modification pour les administrateurs et propriétaires" 
    ON public.medecins FOR UPDATE 
    USING (
        auth.role() = 'authenticated' AND (
            claimed_by_profile_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        )
    );

-- Politique d'insertion : réservée aux administrateurs (ex: imports)
CREATE POLICY "Insertion réservée aux administrateurs" 
    ON public.medecins FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Politique de suppression : réservée aux administrateurs
CREATE POLICY "Suppression réservée aux administrateurs" 
    ON public.medecins FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
