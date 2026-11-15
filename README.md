# KARATÉ LIFE — cockpit sportif

Application web React/Vite pour suivre une saison de karaté de compétition : journal d'entraînement, durée, intensité RPE, vidéos et corrections, techniques notées, bilans forme, santé, compétitions, objectifs, famille et statistiques.

## Fonctionnement et compatibilité

- Interface responsive et PWA pour iPhone (Safari → Partager → Sur l'écran d'accueil), navigateur de bureau et tablette.
- Les données sont enregistrées **localement sur l'appareil** dans localStorage. Il n'existe **pas encore de synchronisation cloud** ou de compte utilisateur.
- Le stockage existant du projet reste accessible : clés `karate_profiles`, `karate_events_<id>`, `karate_tech_base_<id>`, `karate_competitions_<id>`, etc.
- Le menu « Ancien dashboard » permet de retrouver les anciens modules sans migration destructive.
- Sauvegarde et restauration JSON depuis Réglages ; **à exporter avant de supprimer Safari, changer de téléphone ou nettoyer les données du navigateur**.
- La page web est publique. Les données personnelles locales ne sont pas incluses dans le code publié, mais le stockage local ne constitue pas une protection par mot de passe.

## Développement

```bash
npm ci
npm run dev
npm run build
```

Netlify : Vite build `npm run build`, dossier publié `dist`. Le service worker et le manifest sont placés dans `public/`.

## Suivi de performance

La charge d'entraînement affichée correspond à la durée en minutes × RPE (1–10) quand elle est renseignée. L'indice forme combine énergie, sommeil, douleur ressentie et stress selon une formule simple et **indicative, non médicale**. Les événements de l'ancien calendrier sans durée ne sont pas convertis artificiellement en minutes.

## Road to WKC 2027

Championnats du monde WKC : 23–29 octobre 2027 à Orlando (dates annoncées par WKC World et WKC Canada le 9 novembre 2026). La phase de préparation présentée est illustrative ; elle doit être adaptée par l'athlète et ses entraîneurs.
