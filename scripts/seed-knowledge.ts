import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// CONTENT CONSTANTS - Detailed methodology content in French for TPE/PME
// ============================================================================

const LEAN_8_WASTES = `
# Les 8 Gaspillages du Lean (TIMWOODS)

## Introduction

Le Lean Management identifie 8 types de gaspillages (ou "muda" en japonais) qui consomment des ressources sans creer de valeur pour le client. Pour une TPE ou PME, ces gaspillages representent souvent entre 20% et 40% du chiffre d'affaires perdu. L'acronyme TIMWOODS permet de les memoriser facilement : Transport, Inventaire, Mouvement, attente (Waiting), surproduction (Overproduction), sur-traitement (Overprocessing), Defauts et competences Sous-utilisees (Skills).

## 1. Transport (Transport inutile)

Le transport designe tout deplacement inutile de materiaux, produits, documents ou informations. Dans une PME, cela se manifeste par des allers-retours entre ateliers mal organises, des envois de mails en chaine avec pieces jointes volumineuses, ou des livraisons multiples la ou une seule suffirait.

**Exemples concrets en PME :**
- Un atelier de menuiserie ou les planches brutes sont stockees a 50 metres des machines de decoupe, necessitant des dizaines de trajets par jour.
- Un cabinet comptable ou les dossiers papier circulent entre 3 bureaux differents pour validation.
- Une entreprise de e-commerce qui expedie depuis un entrepot eloigne de son lieu de preparation.

**Indicateurs de mesure :** Distance parcourue par piece/dossier, nombre de manipulations par commande, cout de transport interne rapporte au chiffre d'affaires.

**Solutions typiques :** Reorganiser le layout de l'atelier en flux, numeriser les documents, centraliser les zones de stockage pres des postes de travail, mettre en place un systeme de kanban pour les approvisionnements internes.

## 2. Inventaire (Stocks excessifs)

Les stocks excessifs immobilisent de la tresorerie, occupent de l'espace et risquent l'obsolescence. Pour une PME avec une tresorerie limitee, un stock mal gere peut mettre en danger la survie de l'entreprise.

**Exemples concrets en PME :**
- Un restaurant qui commande en gros pour obtenir des remises mais jette 15% de ses achats perimes.
- Un artisan electricien qui stocke pour 6 mois de materiel alors que son fournisseur livre en 48h.
- Un commerce de detail avec des invendus saisonniers qui representent 20% du stock.

**Indicateurs de mesure :** Taux de rotation des stocks, valeur du stock dormant (>90 jours), taux de peremption/obsolescence, cout de stockage (loyer m2 x surface dediee).

**Solutions typiques :** Mettre en place un systeme de reapprovisionnement en juste-a-temps, negocier des livraisons plus frequentes avec les fournisseurs, utiliser la methode ABC pour prioriser la gestion des references, reduire les tailles de lot.

## 3. Mouvement (Mouvements inutiles)

Les mouvements inutiles concernent les deplacements physiques des personnes qui n'ajoutent pas de valeur : se baisser, marcher, chercher un outil, naviguer dans un logiciel complexe.

**Exemples concrets en PME :**
- Un boulanger qui fait 200 pas par fournee a cause d'un agencement non optimise.
- Un technicien de maintenance qui perd 30 minutes par intervention a chercher ses outils dans un vehicule mal organise.
- Un employe administratif qui navigue entre 5 logiciels differents pour traiter une commande.

**Indicateurs de mesure :** Nombre de pas par operation (podometre), temps de recherche d'outils/informations, nombre de clics par tache informatique.

**Solutions typiques :** Appliquer les 5S aux postes de travail, creer des kits d'outils pre-assembles, simplifier les interfaces logicielles, reorganiser l'ergonomie des postes.

## 4. Attente (Waiting)

L'attente est le temps perdu quand une ressource (personne, machine, materiau) est inactive en attendant l'etape suivante du processus.

**Exemples concrets en PME :**
- Un salon de coiffure ou les clients attendent 20 minutes car les rendez-vous sont mal espaces.
- Un atelier de production ou les operateurs attendent les matieres premieres du fournisseur en retard.
- Une equipe commerciale qui attend 3 jours la validation d'un devis par la direction.

**Indicateurs de mesure :** Temps d'attente moyen par etape du processus, taux d'utilisation des machines, delai de validation des documents, temps de cycle vs temps de valeur ajoutee.

**Solutions typiques :** Equilibrer les charges de travail, mettre en place des tampons (buffers) calibres, definir des seuils de delegation pour les validations, synchroniser les approvisionnements avec le planning de production.

## 5. Surproduction (Overproduction)

La surproduction est le gaspillage le plus grave car il genere tous les autres. Produire plus que necessaire, plus tot que necessaire ou plus vite que necessaire.

**Exemples concrets en PME :**
- Une imprimerie qui produit 10% de plus "au cas ou" sur chaque commande.
- Un traiteur qui prepare systematiquement 20% de surplus pour ses evenements.
- Un developpeur web qui code des fonctionnalites non demandees par le client.

**Indicateurs de mesure :** Taux de surplus de production, valeur des invendus, rapport production reelle/commandes fermes, taux de produits offerts ou brades.

**Solutions typiques :** Produire en flux tire (pull system), utiliser des kanbans, reduire les tailles de lot, aligner la production sur la demande reelle, mettre en place un systeme de previsions fiables.

## 6. Sur-traitement (Overprocessing)

Le sur-traitement consiste a effectuer des operations qui n'ajoutent pas de valeur percue par le client, ou a utiliser des ressources disproportionnees par rapport au besoin.

**Exemples concrets en PME :**
- Un menuisier qui ponce 4 fois un meuble dont la finition requiert 2 passages.
- Un cabinet d'expertise comptable qui produit des rapports de 50 pages quand le client n'en lit que 5.
- Une entreprise qui utilise un ERP a 2000 euros/mois quand un tableur suffirait.

**Indicateurs de mesure :** Cout de la qualite excessive, temps passe sur des taches sans valeur ajoutee percue, ecart entre specifications client et specifications internes.

**Solutions typiques :** Definir clairement les specifications client (voix du client), standardiser les processus, eliminer les etapes redondantes, adapter les outils au juste besoin.

## 7. Defauts (Defects)

Les defauts englobent tout ce qui ne repond pas aux attentes du client du premier coup : erreurs, rebuts, retouches, reclamations, retours.

**Exemples concrets en PME :**
- Un plombier qui doit revenir sur un chantier pour corriger une fuite mal reparee.
- Un site e-commerce qui envoie le mauvais produit dans 3% des commandes.
- Un prestataire de services qui doit refaire une proposition commerciale suite a des erreurs.

**Indicateurs de mesure :** Taux de rebut, taux de retour client, cout des retouches/reprises, nombre de reclamations, taux de livraison conforme du premier coup (First Pass Yield).

**Solutions typiques :** Mettre en place des poka-yoke (detrompeurs), standardiser les processus, former les equipes, instaurer des controles a la source, utiliser la methode des 5 Pourquoi pour traiter les causes racines.

## 8. Competences sous-utilisees (Skills)

Le 8eme gaspillage, ajoute par la communaute Lean occidentale, concerne le potentiel humain non exploite : creativite bridee, competences ignorees, manque de formation, desengagement.

**Exemples concrets en PME :**
- Un ouvrier qualifie qui connait des astuces de production mais a qui on ne demande jamais son avis.
- Un commercial bilingue affecte uniquement au marche francais.
- Un technicien qui pourrait former ses collegues mais n'a pas le temps dedie pour le faire.

**Indicateurs de mesure :** Nombre de suggestions d'amelioration par employe et par an, taux de polyvalence, ecart entre competences disponibles et competences utilisees, taux d'engagement des equipes.

**Solutions typiques :** Mettre en place une boite a idees structuree (systeme Kaizen), developper la polyvalence, realiser des entretiens de competences, creer des groupes de travail participatifs, deleguer et responsabiliser.

## Methodologie d'identification dans une PME

Pour identifier ces gaspillages dans votre entreprise, procedez ainsi :
1. Realisez un Gemba Walk (visite terrain) avec une grille TIMWOODS
2. Chronometrez les operations et classez-les en valeur ajoutee / non-valeur ajoutee
3. Dessinez une VSM (Value Stream Map) de votre processus principal
4. Priorisez les gaspillages par impact financier (analyse Pareto)
5. Lancez des chantiers d'amelioration Kaizen sur les gaspillages les plus impactants
`;

const LEAN_5S = `
# La Methode 5S : Organiser son espace de travail

## Introduction

Les 5S sont une methode japonaise d'organisation du poste de travail, fondement de toute demarche Lean. Le nom vient des 5 mots japonais commencant par S : Seiri (Trier), Seiton (Ranger), Seiso (Nettoyer), Seiketsu (Standardiser), Shitsuke (Maintenir la discipline). Pour une TPE/PME, les 5S representent le point de depart ideal d'une demarche d'amelioration continue car ils produisent des resultats visibles rapidement avec peu d'investissement.

## 1. Seiri - Trier

Le tri consiste a separer l'utile de l'inutile sur le poste de travail. On elimine tout ce qui n'est pas necessaire a l'execution des taches quotidiennes.

**Mise en oeuvre pour une PME :**
- Utiliser la methode des etiquettes rouges : coller une etiquette rouge sur tout objet dont l'utilite est incertaine. Si l'objet n'a pas ete utilise apres 30 jours, il est evacue.
- Creer une zone de quarantaine pour les objets etiquetes en attente de decision.
- Impliquer les operateurs car eux seuls savent ce qui est reellement utile au quotidien.

**Criteres de tri :**
- Utilise tous les jours : garder au poste
- Utilise toutes les semaines : garder a proximite
- Utilise tous les mois : stocker dans un lieu dedie
- Pas utilise depuis 6 mois : evaluer la necessite de conserver
- Pas utilise depuis 1 an : eliminer ou archiver

**Exemple concret :** Un garage automobile a elimine 3 metres cubes d'outils obsoletes, pieces usagees et documentation perimee, liberant 15% d'espace utile dans l'atelier.

## 2. Seiton - Ranger

Ranger signifie attribuer une place definie a chaque objet et s'assurer que chaque objet retourne a sa place apres utilisation. Le principe directeur est : "Une place pour chaque chose, chaque chose a sa place."

**Mise en oeuvre pour une PME :**
- Definir des emplacements fixes avec des marquages au sol (ruban adhesif colore).
- Utiliser le shadow board (panneau de rangement avec les silhouettes des outils dessinees).
- Organiser selon la frequence d'utilisation : les objets les plus utilises au plus pres et a hauteur de main.
- Etiqueter clairement tous les rangements, tiroirs, etageres et armoires.

**Exemple concret :** Un atelier de serrurerie a reduit le temps de recherche d'outils de 25 minutes par jour et par operateur en installant des panneaux perfores avec emplacement dedie pour chaque outil, soit un gain de 100 heures par an pour une equipe de 4 personnes.

## 3. Seiso - Nettoyer

Le nettoyage regulier permet de maintenir un environnement de travail propre, mais surtout de detecter les anomalies (fuites, usures, desserrages) avant qu'elles ne deviennent des pannes.

**Mise en oeuvre pour une PME :**
- Definir des zones de responsabilite de nettoyage pour chaque collaborateur.
- Creer une checklist de nettoyage quotidienne (5 minutes en fin de poste).
- Integrer l'inspection visuelle au nettoyage : verifier l'etat des equipements en nettoyant.
- Eliminer les sources de salissure a la racine plutot que de nettoyer en permanence.

**Exemple concret :** Une boulangerie artisanale a reduit ses pannes de petrin de 60% en instaurant un nettoyage-inspection quotidien de 10 minutes, detectant precocement les problemes mecaniques.

## 4. Seiketsu - Standardiser

La standardisation consiste a formaliser les bonnes pratiques des 3 premiers S pour les rendre perennes et reproductibles.

**Mise en oeuvre pour une PME :**
- Creer des standards visuels : photos du poste range, plan d'implantation, checklist.
- Afficher les standards directement sur le poste de travail (management visuel).
- Definir des responsabilites claires : qui fait quoi, quand, comment.
- Integrer les 5S dans les routines quotidiennes (rituels de debut/fin de poste).

**Outils utiles :**
- Photos avant/apres affichees sur le poste
- Checklist plastifiee avec cases a cocher
- Planning de rotation des taches 5S
- Code couleur par zone ou par equipe

## 5. Shitsuke - Maintenir la discipline

Le 5eme S est le plus difficile car il exige un changement de culture. Il s'agit de maintenir les bonnes habitudes dans la duree grace a l'auto-discipline et a l'implication de tous.

**Mise en oeuvre pour une PME :**
- Realiser des audits 5S reguliers (hebdomadaires au debut, puis mensuels).
- Utiliser une grille d'audit simple avec un score de 0 a 5 par critere.
- Afficher les resultats et celebrer les progres.
- Impliquer le dirigeant : montrer l'exemple est essentiel dans une petite structure.
- Former les nouveaux arrivants des leur integration.

**Grille d'audit 5S type :**
Chaque S est evalue sur 5 criteres notes de 1 a 5, soit un score maximum de 25 par S et 125 au total. Un score superieur a 100 indique une bonne maturite 5S.

## Plan de deploiement 5S pour une PME (8 semaines)

- Semaine 1-2 : Formation de l'equipe, choix d'une zone pilote, etat des lieux photo
- Semaine 3 : Grand tri avec etiquettes rouges, evacuation des inutiles
- Semaine 4 : Rangement, marquage au sol, shadow boards
- Semaine 5 : Nettoyage approfondi, identification des sources de salissure
- Semaine 6 : Creation des standards visuels et checklists
- Semaine 7 : Premier audit 5S, ajustements
- Semaine 8 : Bilan, celebration, planification du deploiement aux autres zones

## Benefices mesurables pour une PME

- Reduction du temps de recherche : 20 a 40 minutes par jour et par personne
- Reduction des accidents du travail : 30 a 50%
- Amelioration de la productivite : 10 a 15%
- Amelioration de la qualite : reduction des erreurs de 20 a 30%
- Amelioration du moral des equipes et de l'image aupres des clients
`;

const LEAN_KAIZEN = `
# Kaizen : L'Amelioration Continue au Quotidien

## Introduction

Kaizen est un mot japonais signifiant "changement pour le mieux" (kai = changement, zen = bon). C'est une philosophie d'amelioration continue par petits pas, impliquant tous les niveaux de l'entreprise. Contrairement aux grands projets de transformation, le Kaizen mise sur des ameliorations incrementales, peu couteuses et portees par les equipes terrain. C'est l'approche ideale pour les TPE/PME qui n'ont pas les moyens de grands projets de reorganisation.

## Principes fondamentaux du Kaizen

**1. Chaque processus peut etre ameliore.** Il n'existe pas de processus parfait. Meme une operation qui semble optimisee peut encore progresser.

**2. Les meilleures idees viennent du terrain.** Les collaborateurs qui executent les taches au quotidien sont les mieux places pour identifier les problemes et proposer des solutions.

**3. Privilegier les petites ameliorations rapides.** Une amelioration de 1% par jour produit un gain de 37 fois sur un an (effet compose). Pas besoin d'attendre le projet parfait.

**4. Eliminer les gaspillages en continu.** Chaque amelioration vise a reduire un ou plusieurs des 8 gaspillages (TIMWOODS).

**5. Standardiser ce qui fonctionne.** Toute amelioration validee doit etre documentee et partagee pour eviter la regression.

## Le systeme de suggestions Kaizen

Le coeur operationnel du Kaizen dans une PME est le systeme de suggestions. Voici comment le mettre en place efficacement.

**Structure du systeme :**
- Fournir des fiches de suggestion simples (papier ou numerique) avec : probleme observe, solution proposee, benefice attendu.
- Designier un responsable Kaizen (meme a temps partiel) qui collecte, evalue et suit les suggestions.
- Fixer un objectif : par exemple, 1 suggestion par collaborateur par mois.
- Definir un delai de reponse maximal (5 jours ouvrables) pour eviter la demotivation.

**Criteres d'evaluation des suggestions :**
- Impact sur la qualite, le cout, le delai ou la securite
- Facilite de mise en oeuvre (quick win vs projet)
- Cout de mise en oeuvre vs benefice attendu
- Applicabilite a d'autres postes ou processus

**Reconnaissance et motivation :**
- Repondre systematiquement a chaque suggestion (meme si elle n'est pas retenue)
- Afficher les suggestions mises en oeuvre et leurs resultats
- Celebrer les contributeurs (pas forcement avec des primes, la reconnaissance publique suffit souvent)
- Organiser un "mur Kaizen" visible par tous avec les ameliorations du mois

## Les evenements Kaizen (Kaizen Blitz)

Un evenement Kaizen (ou Kaizen Blitz) est un atelier intensif de 2 a 5 jours pour resoudre un probleme specifique. C'est adapte aux PME car c'est court et focalise.

**Deroulement type d'un Kaizen Blitz de 3 jours :**

Jour 1 - Observer et comprendre :
- Formation rapide de l'equipe (30 min)
- Observation du processus actuel sur le terrain (Gemba)
- Mesure des temps, distances, defauts
- Cartographie du processus actuel
- Identification des gaspillages

Jour 2 - Analyser et concevoir :
- Analyse des causes racines (5 Pourquoi, Ishikawa)
- Brainstorming de solutions
- Selection et planification des ameliorations
- Debut de mise en oeuvre des actions rapides

Jour 3 - Mettre en oeuvre et mesurer :
- Mise en oeuvre des ameliorations
- Test du nouveau processus
- Mesure des resultats
- Standardisation du nouveau processus
- Presentation des resultats a la direction

**Exemple concret :** Une PME de 30 salaries specialisee dans la fabrication de fenetres a organise un Kaizen Blitz sur sa ligne de decoupe. En 3 jours, l'equipe de 5 operateurs a reduit le temps de changement de serie de 45 a 15 minutes (methode SMED), augmentant la capacite de production de 12% sans investissement materiel.

## Quick Wins pour PME

Les quick wins sont des ameliorations faciles a mettre en oeuvre avec un impact immediat. En voici une liste par domaine :

**Production / Atelier :**
- Reorganiser un poste de travail (5S) : gain moyen 30 min/jour
- Creer une checklist de demarrage machine : reduction des pannes de 20%
- Installer un tableau de suivi visuel de production : gain en reactivite

**Administratif / Bureau :**
- Creer des modeles de documents standards : gain de 15 min par document
- Mettre en place un systeme de classement partage : reduction du temps de recherche
- Automatiser les relances clients avec un outil simple : gain de 2h/semaine

**Commercial :**
- Standardiser le processus de devis : reduction du delai de reponse de 50%
- Creer une FAQ interne pour les questions recurrentes
- Mettre en place un suivi visuel du pipeline commercial

## Indicateurs de suivi du Kaizen

- Nombre de suggestions soumises par mois
- Taux de mise en oeuvre des suggestions (objectif : >60%)
- Delai moyen entre suggestion et mise en oeuvre
- Gains cumules (temps, argent, qualite) des ameliorations
- Taux de participation (% des collaborateurs ayant soumis au moins une suggestion)
- Score d'engagement des equipes (enquete trimestrielle)

## Facteurs de succes dans une PME

1. **Engagement visible du dirigeant** : participer aux Gemba Walks, soutenir les initiatives
2. **Communication reguliere** : partager les resultats, celebrer les succes
3. **Patience** : les resultats s'accumulent dans le temps, pas du jour au lendemain
4. **Respect des personnes** : le Kaizen ne sert pas a supprimer des emplois mais a travailler mieux
5. **Perennite** : integrer le Kaizen dans les routines quotidiennes, pas comme un projet ponctuel
`;

const LEAN_PDCA = `
# PDCA : Le Cycle de Deming pour l'Amelioration Continue

## Introduction

Le cycle PDCA (Plan-Do-Check-Act), egalement appele roue de Deming, est un outil fondamental du management de la qualite et de l'amelioration continue. Developpe par Walter Shewhart et popularise par W. Edwards Deming, il fournit un cadre structure pour resoudre les problemes et ameliorer les processus de maniere iterative. Pour les TPE/PME, le PDCA est un outil precieux car il est simple a comprendre, applicable a tous les domaines et ne necessite aucun investissement materiel.

## Les 4 phases du cycle PDCA

### Phase 1 : PLAN (Planifier)

C'est la phase la plus importante. Elle consiste a analyser la situation actuelle, identifier le probleme, rechercher les causes et definir un plan d'action.

**Etapes detaillees :**
1. Definir le probleme de maniere precise et mesurable. Exemple : "Le delai de livraison moyen est de 8 jours alors que notre engagement client est de 5 jours."
2. Collecter des donnees sur la situation actuelle : mesures, observations, historiques.
3. Analyser les causes racines avec des outils comme les 5 Pourquoi ou le diagramme d'Ishikawa.
4. Definir un objectif SMART : Specifique, Mesurable, Atteignable, Realiste, Temporel. Exemple : "Reduire le delai de livraison moyen de 8 a 5 jours d'ici 3 mois."
5. Elaborer un plan d'action : qui fait quoi, quand, comment, avec quels moyens.

**Outils utiles pour la phase Plan :**
- Feuille de releve de donnees
- Diagramme de Pareto pour prioriser
- 5 Pourquoi / Ishikawa pour les causes racines
- Matrice de planification (QQOQCCP)

**Exemple concret PME :** Un atelier de reparation automobile constate que 25% des vehicules ne sont pas prets a l'heure promise. L'analyse revele que la cause principale est l'attente de pieces de rechange (45% des cas). Le plan prevoit de constituer un stock de 50 references les plus courantes et de mettre en place un systeme de commande anticipee des le diagnostic initial.

### Phase 2 : DO (Faire)

La mise en oeuvre du plan d'action, de preference a petite echelle d'abord (phase pilote) pour limiter les risques.

**Bonnes pratiques :**
- Commencer par un test a echelle reduite (un poste, une equipe, un produit).
- Documenter ce qui est fait, les ecarts par rapport au plan et les observations.
- Former les personnes impliquees avant de demarrer.
- Collecter des donnees pendant la mise en oeuvre pour la phase suivante.

**Exemple concret (suite) :** L'atelier constitue le stock des 50 references les plus demandees et forme les receptionnistes a verifier la disponibilite des pieces des la prise de rendez-vous. Le test est realise sur le planning du mardi et du jeudi pendant 4 semaines.

### Phase 3 : CHECK (Verifier)

Comparer les resultats obtenus aux objectifs fixes. C'est la phase d'evaluation objective.

**Questions a se poser :**
- L'objectif est-il atteint ?
- Les resultats sont-ils stables ou fluctuants ?
- Y a-t-il des effets secondaires non prevus (positifs ou negatifs) ?
- Le plan a-t-il ete applique comme prevu ? Si non, pourquoi ?
- Les donnees sont-elles fiables ?

**Outils de verification :**
- Graphiques de tendance (avant/apres)
- Cartes de controle pour verifier la stabilite
- Tableaux comparatifs objectif vs resultat
- Retour d'experience des equipes impliquees

**Exemple concret (suite) :** Apres 4 semaines de test, le taux de vehicules prets a l'heure est passe de 75% a 88% les jours de test, contre 74% les autres jours. L'objectif de 95% n'est pas encore atteint mais l'amelioration est significative. L'equipe identifie que 8% des retards restants sont dus a des diagnostics incomplets.

### Phase 4 : ACT (Agir/Ajuster)

Selon les resultats de la phase Check, trois actions sont possibles :

**Si l'objectif est atteint :**
- Standardiser la solution : documenter le nouveau processus, former tout le monde.
- Deployer a plus grande echelle (autres postes, equipes, sites).
- Demarrer un nouveau cycle PDCA sur un autre sujet.

**Si l'objectif n'est pas atteint mais on progresse :**
- Analyser les ecarts restants.
- Ajuster le plan d'action.
- Relancer un nouveau cycle PDCA avec les ajustements.

**Si la solution n'a pas fonctionne :**
- Analyser pourquoi (mauvais diagnostic, mauvaise solution, mauvaise mise en oeuvre).
- Revenir a la phase Plan avec les nouvelles donnees.

**Exemple concret (suite) :** L'atelier decide de standardiser le stock de pieces et la procedure de verification anticipee sur tous les jours de la semaine. Un deuxieme cycle PDCA est lance pour traiter le probleme des diagnostics incomplets, avec pour objectif d'atteindre 95% de vehicules prets a l'heure.

## Applications pratiques du PDCA en PME

**Amelioration de la qualite :** Reduire le taux de retours clients en analysant systematiquement chaque reclamation via un cycle PDCA.

**Reduction des couts :** Identifier les postes de depenses excessifs et tester des alternatives (fournisseurs, processus, materiaux).

**Amelioration des delais :** Cartographier le processus, identifier les goulets d'etranglement et tester des solutions.

**Gestion des ressources humaines :** Ameliorer l'integration des nouveaux collaborateurs, reduire l'absenteisme, developper les competences.

## Erreurs courantes a eviter

1. **Sauter la phase Plan** : agir sans analyser mene a des solutions qui ne traitent pas la cause racine.
2. **Negliger la phase Check** : sans mesure, impossible de savoir si l'amelioration est reelle.
3. **Ne pas boucler le cycle** : s'arreter apres Do sans verifier ni standardiser.
4. **Viser trop grand** : mieux vaut des petits cycles rapides que de grands projets lents.
5. **Ne pas impliquer les equipes terrain** : elles detiennent la connaissance des processus reels.
`;

const LEAN_GEMBA = `
# Gemba Walk : Aller sur le Terrain pour Comprendre

## Introduction

"Gemba" est un terme japonais signifiant "le lieu reel" ou "la ou la valeur est creee". Le Gemba Walk est une pratique de management qui consiste pour les dirigeants et managers a se rendre regulierement sur le terrain (atelier, magasin, bureau, chantier) pour observer les processus reels, echanger avec les equipes et identifier les opportunites d'amelioration. Pour le dirigeant d'une TPE/PME, c'est un outil puissant car il ne coute rien et produit des resultats immediats en termes de comprehension et d'engagement des equipes.

## Les 3 objectifs du Gemba Walk

**1. Observer la realite, pas les rapports**
Les tableaux de bord et rapports donnent une vision filtree de la realite. Sur le terrain, on voit les vrais processus, les vrais problemes, les vrais gaspillages. Le dirigeant qui reste dans son bureau ne percoit qu'une fraction de la realite de son entreprise.

**2. Ecouter les collaborateurs**
Le Gemba Walk est une opportunite d'echanger directement avec les personnes qui executent les taches au quotidien. Elles connaissent les problemes recurrents, les solutions de contournement et les idees d'amelioration que les rapports ne montrent jamais.

**3. Identifier les gaspillages et les opportunites**
En observant les flux de travail, les deplacements, les attentes et les stocks, le marcheur Gemba peut reperer des gaspillages invisibles depuis un bureau.

## Preparation du Gemba Walk

**Avant la visite :**
- Definir un theme ou un objectif precis pour chaque visite (securite, qualite, flux, gaspillages).
- Preparer une grille d'observation adaptee au theme.
- Informer les equipes a l'avance : le Gemba Walk n'est pas un audit surprise, c'est une demarche collaborative.
- Prevoir un calepin et un stylo (ou une tablette) pour noter les observations.
- Planifier la duree (30 a 60 minutes) et le parcours.

**Grille d'observation type :**
- Securite : EPI portes, voies de circulation degagees, risques visibles
- Qualite : defauts visibles, controles en place, problemes signales
- Flux : encours entre postes, attentes, goulets d'etranglement
- Organisation : postes ranges (5S), outils accessibles, standards affiches
- Management visuel : tableaux de bord a jour, indicateurs visibles
- Ambiance : engagement des equipes, communication, entraide

## Pendant le Gemba Walk

**Les regles d'or :**

1. **Observer avant de juger.** Prenez le temps de regarder comment le travail se fait reellement, sans idee preconcue.

2. **Poser des questions ouvertes.** Pas "Pourquoi ne faites-vous pas comme prevu ?" mais "Comment faites-vous cette operation ? Quelles difficultes rencontrez-vous ?"

3. **Ecouter avec respect.** Le Gemba Walk n'est pas un moment de critique ou de reproche. C'est un moment d'apprentissage mutuel.

4. **Ne pas resoudre les problemes sur place.** Notez les observations et les idees, mais evitez de donner des ordres ou de lancer des actions dans l'urgence. Les solutions doivent etre reflechies et construites avec les equipes.

5. **Se concentrer sur les processus, pas sur les personnes.** Si un probleme est observe, c'est le processus qui est defaillant, pas la personne.

**Questions utiles a poser :**
- "Quel est votre plus gros probleme au quotidien ?"
- "Qu'est-ce qui vous empeche de bien travailler ?"
- "Si vous pouviez changer une seule chose, ce serait quoi ?"
- "Comment savez-vous si votre travail est bien fait ?"
- "Avez-vous les outils et les informations necessaires ?"
- "Qu'est-ce qui fonctionne particulierement bien ?"

## Apres le Gemba Walk

**Actions de suivi :**
1. Debriefing immediat : noter les observations cles dans les 15 minutes suivant la visite.
2. Partager les observations avec les equipes concernees dans les 48h.
3. Prioriser les problemes identifies et les classer (quick win, amelioration structurelle, investissement).
4. Lancer des actions correctives via le cycle PDCA pour les problemes prioritaires.
5. Assurer le suivi et communiquer les resultats aux equipes.
6. Remercier les collaborateurs pour leurs contributions et leurs idees.

## Frequence recommandee pour une PME

- **Dirigeant** : 1 Gemba Walk par semaine, 30-45 minutes, sur un theme different a chaque fois
- **Responsable d'equipe** : 2-3 Gemba Walks par semaine, 15-20 minutes
- **Tout manager** : au minimum 1 Gemba Walk par mois

## Exemple concret en PME

Une PME de 45 salaries dans le secteur de l'agroalimentaire a instaure un Gemba Walk hebdomadaire du dirigeant sur les lignes de conditionnement. En 3 mois, cette pratique a permis de :
- Identifier et corriger 12 situations dangereuses (prevention des accidents)
- Detecter un defaut recurrent d'etiquetage lie a un capteur decale (3% de rebut evite)
- Recueillir 8 idees d'amelioration des operateurs, dont 5 mises en oeuvre
- Ameliorer significativement la communication entre la direction et le terrain
- Reduire le turnover de l'equipe de production de 18% a 8% grace a un sentiment de reconnaissance accru

## Pieges a eviter

- **Le Gemba Walk policier** : faire des remarques negatives, chercher des coupables
- **Le Gemba Walk touriste** : se promener sans objectif ni suivi
- **Le Gemba Walk invisible** : prendre des notes sans jamais donner de retour aux equipes
- **Le Gemba Walk ponctuel** : faire un Gemba Walk une fois et ne jamais revenir
- **Le Gemba Walk delegue** : envoyer quelqu'un d'autre au lieu d'y aller soi-meme
`;

const LSS_DMAIC = `
# DMAIC : La Methode Structuree du Lean Six Sigma

## Introduction

Le DMAIC est la methodologie de resolution de problemes du Lean Six Sigma. Son acronyme designe les 5 phases : Define (Definir), Measure (Mesurer), Analyze (Analyser), Improve (Ameliorer), Control (Controler). Contrairement au PDCA qui est iteratif et leger, le DMAIC est plus structure et convient aux problemes complexes necessitant une analyse approfondie des donnees. Pour une PME, le DMAIC est particulierement adapte aux problemes recurrents qui resistent aux solutions simples.

## Phase 1 : DEFINE (Definir)

L'objectif est de cadrer le projet de maniere precise : quel est le probleme, quel est l'impact, qui sont les parties prenantes, quel est le perimetre.

**Livrables de la phase Define :**
- Charte de projet : description du probleme, objectifs, perimetre, equipe, planning
- Voix du Client (VOC) : ce que le client attend reellement
- Arbre CTQ (Critical To Quality) : traduction des attentes client en specifications mesurables
- SIPOC : vue d'ensemble du processus (Suppliers, Inputs, Process, Outputs, Customers)

**Outils utilises :**
- Entretiens clients et parties prenantes
- Enquetes de satisfaction
- Analyse des reclamations
- Diagramme SIPOC

**Exemple PME :** Une imprimerie de 20 salaries definit le probleme suivant : "15% des commandes sont livrees avec au moins 1 jour de retard, generant des penalites de 2000 euros/mois et un risque de perte de clients cles." L'objectif SMART est de reduire le taux de retard a moins de 3% en 4 mois.

## Phase 2 : MEASURE (Mesurer)

L'objectif est de quantifier le probleme avec des donnees fiables pour etablir une base de reference (baseline) et identifier ou se concentrent les defauts.

**Livrables de la phase Measure :**
- Plan de collecte de donnees : quoi mesurer, comment, quand, par qui
- Donnees de base (baseline) : performance actuelle du processus
- Analyse du systeme de mesure : s'assurer que les mesures sont fiables
- Cartographie detaillee du processus avec les temps de cycle

**Outils utilises :**
- Feuilles de releve de donnees
- Histogrammes et boites a moustaches
- Cartes de controle
- Analyse de capabilite du processus (Cp, Cpk)
- Value Stream Mapping (VSM)

**Exemple PME (suite) :** L'imprimerie collecte pendant 4 semaines les donnees de chaque commande : date de reception, delai promis, date de livraison reelle, cause du retard. L'analyse revele que 65% des retards concernent les commandes avec facade personnalisee et que le temps moyen de traitement est de 5,2 jours contre un objectif de 3 jours.

## Phase 3 : ANALYZE (Analyser)

L'objectif est d'identifier les causes racines du probleme en utilisant des outils d'analyse statistique et qualitative.

**Livrables de la phase Analyze :**
- Identification des causes racines verifiees par les donnees
- Quantification de l'impact de chaque cause
- Priorisation des causes a traiter

**Outils utilises :**
- Diagramme d'Ishikawa (causes-effets)
- Analyse des 5 Pourquoi
- Diagramme de Pareto
- Tests d'hypotheses statistiques
- Analyse de correlation et regression
- AMDEC (Analyse des Modes de Defaillance et de leurs Effets)

**Exemple PME (suite) :** L'analyse Pareto montre que 3 causes representent 80% des retards : attente de la validation BAT (Bon A Tirer) par le client (35%), file d'attente devant la machine d'impression numerique (30%), erreurs de fichier necessitant des reprises (15%). L'analyse des 5 Pourquoi sur la validation BAT revele que les BAT sont envoyes par email sans relance automatique et que 40% des clients mettent plus de 48h a repondre.

## Phase 4 : IMPROVE (Ameliorer)

L'objectif est de concevoir, tester et mettre en oeuvre des solutions qui traitent les causes racines identifiees.

**Livrables de la phase Improve :**
- Solutions concues et evaluees (matrice impact/effort)
- Resultats des tests pilotes
- Plan de deploiement
- Analyse des risques des solutions

**Outils utilises :**
- Brainstorming structure
- Matrice de selection des solutions (impact vs effort)
- Plans d'experiences (DOE) pour optimiser les parametres
- Analyse des risques (AMDEC)
- Methode SMED pour les changements de serie
- Poka-yoke (systemes anti-erreur)

**Exemple PME (suite) :** Solutions mises en oeuvre : (1) Portail client en ligne pour la validation BAT avec relance automatique a 24h et 48h, (2) Planification de la charge machine avec un tableau Kanban visuel pour equilibrer les files d'attente, (3) Checklist de preflight automatisee pour detecter les erreurs de fichier a la reception de la commande.

## Phase 5 : CONTROL (Controler)

L'objectif est de perenniser les gains en mettant en place des systemes de controle et de surveillance du processus ameliore.

**Livrables de la phase Control :**
- Plan de controle : quoi surveiller, frequence, limites, actions si hors limites
- Tableaux de bord de suivi
- Procedures mises a jour et standardisees
- Formation des equipes
- Passation au responsable operationnel

**Outils utilises :**
- Cartes de controle statistique (SPC)
- Tableaux de bord avec indicateurs cles
- Procedures operationnelles standard (SOP)
- Audits periodiques
- Plans de reaction en cas de derive

**Exemple PME (suite) :** Un tableau de bord hebdomadaire affiche le taux de livraison a l'heure, le delai moyen de validation BAT et le taux d'erreur de fichier. Des alertes automatiques sont parametrees si le taux de retard depasse 5%. Apres 3 mois, le taux de retard est passe de 15% a 2,8%, les penalites ont ete eliminees et la satisfaction client a augmente de 18 points.

## Duree typique d'un projet DMAIC en PME

- Phase Define : 1-2 semaines
- Phase Measure : 2-4 semaines
- Phase Analyze : 1-2 semaines
- Phase Improve : 2-4 semaines
- Phase Control : 2-4 semaines
- Total : 2 a 4 mois selon la complexite
`;

const LSS_SIPOC = `
# SIPOC : Cartographier son Processus en Vue d'Ensemble

## Introduction

Le SIPOC est un outil de cartographie de processus utilise en Lean Six Sigma, particulierement en phase Define d'un projet DMAIC. Son nom est l'acronyme de Suppliers (Fournisseurs), Inputs (Entrees), Process (Processus), Outputs (Sorties), Customers (Clients). Il fournit une vue d'ensemble synthetique d'un processus, permettant a tous les acteurs de partager la meme comprehension. Pour une TPE/PME, c'est un excellent point de depart pour comprendre et documenter ses processus avant de les ameliorer.

## Les 5 composantes du SIPOC

### S - Suppliers (Fournisseurs)
Les fournisseurs sont toutes les entites (internes ou externes) qui fournissent les entrees necessaires au processus. Cela inclut les fournisseurs de matieres premieres, les departements internes, les prestataires de services, les clients eux-memes (quand ils fournissent des informations).

### I - Inputs (Entrees)
Les entrees sont toutes les ressources necessaires au bon fonctionnement du processus : matieres premieres, informations, documents, competences, equipements, energie. Pour chaque entree, on peut definir des specifications (qualite, quantite, delai).

### P - Process (Processus)
Le processus est decrit en 5 a 7 etapes macro maximum. Le SIPOC n'est pas un diagramme de flux detaille mais une vue d'ensemble. Chaque etape est un verbe d'action (Recevoir, Verifier, Transformer, Emballer, Expedier).

### O - Outputs (Sorties)
Les sorties sont les produits, services ou informations delivres par le processus. Chaque sortie a des caracteristiques mesurables liees aux attentes des clients (qualite, delai, cout).

### C - Customers (Clients)
Les clients sont les destinataires des sorties du processus. Ils peuvent etre externes (clients finaux, distributeurs) ou internes (departement suivant dans la chaine, direction).

## Methode de construction du SIPOC

**Etape 1 : Commencer par le P (Process)**
Identifier les 5-7 etapes macro du processus. Definir clairement le point de depart et le point d'arrivee du processus.

**Etape 2 : Definir les O (Outputs)**
Pour chaque sortie du processus, identifier ce qui est produit et ses specifications.

**Etape 3 : Identifier les C (Customers)**
Lister tous les destinataires de chaque sortie.

**Etape 4 : Identifier les I (Inputs)**
Lister toutes les entrees necessaires a chaque etape du processus.

**Etape 5 : Identifier les S (Suppliers)**
Pour chaque entree, identifier le fournisseur.

**Conseil pratique :** Construire le SIPOC en equipe, sur un grand tableau blanc ou un paperboard, avec des post-it. L'exercice collectif est aussi important que le resultat.

## Exemple complet : Processus de traitement d'une commande client (PME de negoce)

**Suppliers (Fournisseurs) :**
- Client (commande)
- Service commercial (tarifs et conditions)
- Entrepot (stock disponible)
- Fournisseurs externes (produits non stockes)
- Transporteur (capacite de livraison)

**Inputs (Entrees) :**
- Bon de commande client
- Catalogue et tarifs en vigueur
- Etat des stocks en temps reel
- Conditions de livraison
- Solvabilite client (encours autorise)

**Process (Processus) :**
1. Recevoir et enregistrer la commande
2. Verifier la disponibilite des stocks et la solvabilite
3. Preparer la commande en entrepot
4. Controler la conformite de la preparation
5. Expedier et livrer au client
6. Facturer et suivre le reglement

**Outputs (Sorties) :**
- Commande livree conforme (bon produit, bonne quantite)
- Livraison dans le delai annonce
- Facture exacte
- Bon de livraison signe

**Customers (Clients) :**
- Client final (destinataire de la commande)
- Service comptabilite (facture pour enregistrement)
- Direction commerciale (donnees pour le suivi du CA)

## Cas d'usage du SIPOC en PME

**1. Clarifier un processus flou :** Quand personne n'a la meme vision du processus, le SIPOC cree un langage commun.

**2. Integrer un nouveau collaborateur :** Le SIPOC donne une vision globale rapide du processus a un nouveau venu.

**3. Preparer un projet DMAIC :** Le SIPOC est le point de depart pour cadrer le perimetre d'un projet d'amelioration.

**4. Identifier les interfaces critiques :** Les liens fournisseurs-entrees et sorties-clients montrent ou les dysfonctionnements inter-services se produisent.

**5. Preparer une certification (ISO, etc.) :** Le SIPOC est une base pour la documentation des processus.

## Conseils pour les PME

- Ne passez pas plus de 2 heures sur un SIPOC. C'est un outil de synthese, pas un projet en soi.
- Impliquez les acteurs cles du processus : 4-6 personnes maximum.
- Utilisez un langage simple et comprehensible par tous.
- Affichez le SIPOC dans l'espace de travail concerne.
- Mettez-le a jour quand le processus change.
- Completez-le avec une VSM si vous avez besoin de plus de detail sur les temps et les flux.
`;

const LSS_CTQ = `
# CTQ : Critical To Quality - Traduire la Voix du Client en Specifications

## Introduction

L'arbre CTQ (Critical To Quality) est un outil du Lean Six Sigma qui permet de traduire les besoins exprimes par le client (souvent vagues et qualitatifs) en specifications mesurables et actionnables. C'est le pont entre la "Voix du Client" (VOC - Voice Of Customer) et les indicateurs de performance du processus. Pour une PME, maitriser les CTQ permet de concentrer les efforts d'amelioration sur ce qui compte reellement pour le client, evitant ainsi le sur-traitement ou les investissements mal cibles.

## Structure de l'arbre CTQ

L'arbre CTQ se decompose en 3 niveaux :

**Niveau 1 : Besoin du client (Voice Of Customer)**
Ce que le client exprime, souvent de maniere subjective. Exemple : "Je veux un service rapide."

**Niveau 2 : Pilote de qualite (Quality Driver)**
La traduction du besoin en dimension de qualite. Exemple : le "service rapide" se decline en "delai de reponse", "delai de livraison", "delai de traitement des reclamations".

**Niveau 3 : CTQ (Specification mesurable)**
La specification precise et mesurable. Exemple : "Delai de reponse a une demande de devis inferieur a 4 heures ouvrables."

## Methode de construction

### Etape 1 : Collecter la Voix du Client

**Sources de la VOC pour une PME :**
- Enquetes de satisfaction (meme simples : 5 questions par email)
- Analyse des reclamations et retours
- Entretiens directs avec les clients cles
- Avis en ligne (Google, Trustpilot, reseaux sociaux)
- Observations des commerciaux et du service client
- Taux de renouvellement et motifs de depart

**Methode d'interview VOC :**
- Poser des questions ouvertes : "Qu'est-ce qui est le plus important pour vous dans notre service ?"
- Creuser les reponses : "Quand vous dites 'rapide', qu'est-ce que cela signifie concretement pour vous ?"
- Demander des exemples de bonnes et mauvaises experiences
- Interroger au moins 10 clients representatifs (petits, moyens, grands)

### Etape 2 : Identifier les Quality Drivers

Regrouper les verbatims clients en grandes categories de qualite :
- **Delai** : temps de reponse, de livraison, de traitement
- **Qualite produit** : conformite, fiabilite, durabilite, esthetique
- **Service** : accueil, conseil, suivi, reactivite
- **Cout** : rapport qualite-prix, transparence tarifaire
- **Flexibilite** : personnalisation, adaptation aux besoins specifiques

### Etape 3 : Definir les specifications CTQ

Pour chaque Quality Driver, definir une specification SMART :
- **Specifique** : quelle mesure exacte ?
- **Mesurable** : comment mesurer ? avec quel outil ?
- **Acceptable** : quel seuil minimum ? (Lower Specification Limit - LSL)
- **Realiste** : est-ce atteignable avec nos moyens ?
- **Temporel** : sur quelle periode mesurer ?

## Exemple complet : PME de services informatiques (15 salaries)

**VOC recueillie :** "On veut un support technique reactif, des interventions fiables et des factures claires."

**Arbre CTQ :**

Besoin 1 : Support reactif
- Driver : Temps de prise en charge
  - CTQ : Accuse de reception en moins de 30 minutes (horaires ouvrables)
  - CTQ : Diagnostic initial en moins de 2 heures
- Driver : Disponibilite
  - CTQ : Couverture 8h-18h du lundi au vendredi
  - CTQ : Astreinte week-end pour les contrats premium

Besoin 2 : Interventions fiables
- Driver : Resolution
  - CTQ : Taux de resolution au premier passage superieur a 85%
  - CTQ : Pas de re-ouverture de ticket dans les 7 jours (taux < 5%)
- Driver : Competence
  - CTQ : Technicien certifie sur la technologie concernee
  - CTQ : Satisfaction post-intervention superieure a 4/5

Besoin 3 : Factures claires
- Driver : Transparence
  - CTQ : Detail heure par heure du temps passe
  - CTQ : Tarif conforme au devis accepte (ecart < 5%)
- Driver : Delai
  - CTQ : Facture envoyee dans les 5 jours ouvrables suivant l'intervention
  - CTQ : Zero erreur de facturation

## Utilisation des CTQ dans l'amelioration continue

**1. Priorisation :** Les CTQ permettent de savoir ou concentrer les efforts. Si le client valorise avant tout le delai, inutile d'investir massivement dans la qualite esthetique.

**2. Mesure de la performance :** Chaque CTQ devient un indicateur de performance (KPI) du processus, integre dans les tableaux de bord.

**3. Objectifs DMAIC :** Les CTQ definissent les objectifs des projets d'amelioration. Un ecart entre la performance actuelle et le CTQ cible justifie un projet.

**4. Communication avec le client :** Les CTQ permettent de formaliser les engagements de service (SLA - Service Level Agreement) de maniere objective et partagee.

## Erreurs courantes

- Definir les CTQ sans consulter les clients (suppositions internes)
- Creer trop de CTQ : 5 a 10 CTQ prioritaires suffisent
- Definir des CTQ non mesurables ("bonne qualite" au lieu de "zero defaut visible")
- Ne pas relier les CTQ aux processus internes
- Figer les CTQ : les attentes client evoluent, les CTQ doivent etre revus annuellement
`;

const OUTILS_VSM = `
# VSM : Value Stream Mapping - Cartographier la Chaine de Valeur

## Introduction

La Value Stream Mapping (VSM), ou cartographie de la chaine de valeur, est un outil du Lean Management qui permet de visualiser l'ensemble des etapes d'un processus, de la demande client a la livraison, en distinguant les activites a valeur ajoutee de celles qui n'en ont pas. C'est l'un des outils les plus puissants du Lean car il donne une vision globale des flux de matieres et d'informations, permet d'identifier les gaspillages et de concevoir un etat futur optimise. Pour une PME, la VSM est un outil de diagnostic incontournable avant de lancer des chantiers d'amelioration.

## Les symboles de la VSM

**Flux de matieres :**
- Rectangle : etape du processus (avec donnees : temps de cycle, TRS, nombre d'operateurs)
- Triangle : stock / en-cours (avec quantite et duree de stockage)
- Fleche pleine : flux pousse (push)
- Fleche avec cercle : flux tire (pull)
- Camion : livraison / transport
- FIFO : file d'attente premier entre, premier sorti

**Flux d'informations :**
- Fleche droite : flux d'information manuelle
- Fleche en zigzag : flux d'information electronique
- Rectangle avec coin coupe : systeme informatique (ERP, logiciel)

**Indicateurs :**
- Ligne temporelle en bas : alterne temps de valeur ajoutee (VA) et temps de non-valeur ajoutee (NVA)
- Lead time total : temps total du processus de bout en bout
- Temps VA total : somme des temps de valeur ajoutee
- Ratio VA : temps VA / lead time total (souvent entre 1% et 5% en PME)

## Methode de construction de la VSM

### Etape 1 : Choisir le processus a cartographier
Selectionner un processus strategique : le plus volumineux, le plus problematique ou celui qui impacte le plus le client.

### Etape 2 : Cartographier l'etat actuel (Current State)

**Regles de construction :**
1. Toujours commencer par le client (en haut a droite) et remonter le flux a contre-courant.
2. Marcher le processus de bout en bout (Gemba Walk dedie).
3. Collecter les donnees reelles, pas les donnees theoriques.
4. Dessiner a la main d'abord, sur un grand rouleau de papier kraft.
5. Impliquer les acteurs du processus dans la construction.

**Donnees a collecter pour chaque etape :**
- Temps de cycle (C/T) : temps pour traiter une unite
- Temps de changement de serie (C/O) : temps pour passer d'un produit a un autre
- Taux de rendement synthetique (TRS) : disponibilite x performance x qualite
- Nombre d'operateurs
- Taille des lots
- Taux de rebut
- Horaires de travail

**Donnees a collecter entre les etapes :**
- Quantite d'en-cours (WIP)
- Duree de stockage intermediaire
- Mode de declenchement (push ou pull)

### Etape 3 : Calculer le lead time

Le lead time se calcule en additionnant les temps de stockage entre chaque etape et les temps de traitement a chaque etape. La ligne temporelle en bas de la VSM visualise cette decomposition.

**Formule :**
Lead Time = Somme des temps de stockage + Somme des temps de traitement
Ratio VA = Somme des temps VA / Lead Time

### Etape 4 : Analyser les gaspillages

Identifier sur la cartographie actuelle :
- Les stocks excessifs entre les etapes (triangles importants)
- Les temps d'attente disproportionnes
- Les flux pousses la ou un flux tire serait preferable
- Les etapes a faible TRS ou fort taux de rebut
- Les boucles de reprise (retouches)
- Les transports inutiles

### Etape 5 : Dessiner l'etat futur (Future State)

**Principes directeurs pour l'etat futur :**
1. Produire au rythme du client (Takt Time = temps disponible / demande client)
2. Mettre en flux continu partout ou c'est possible
3. Utiliser des supermarchés Kanban la ou le flux continu n'est pas possible
4. Envoyer le programme client a un seul processus (processus regulateur)
5. Lisser le mix produit au niveau du processus regulateur
6. Creer un flux tire depuis le client

**Etape 6 : Plan d'action**
Identifier les chantiers d'amelioration necessaires pour passer de l'etat actuel a l'etat futur. Les representer par des "eclairs Kaizen" sur la cartographie.

## Exemple concret : PME de fabrication de meubles (25 salaries)

**Etat actuel :**
- Lead time : 18 jours
- Temps VA total : 6,5 heures
- Ratio VA : 1,5%
- Principaux gaspillages : 8 jours de stock de panneaux bruts, 4 jours d'en-cours entre decoupe et assemblage, taux de rebut de 7% au vernissage

**Etat futur vise :**
- Lead time cible : 7 jours
- Stock de panneaux reduit a 3 jours (livraison bi-hebdomadaire)
- Flux continu entre decoupe et assemblage (cellule en U)
- Taux de rebut vernissage cible : 2% (amelioration du processus de preparation)

**Chantiers identifies :**
1. Negociation fournisseur pour livraisons bi-hebdomadaires
2. Reorganisation en cellule de production (Layout)
3. Chantier Kaizen qualite vernissage
4. Mise en place de Kanbans entre vernissage et emballage
`;

const OUTILS_ISHIKAWA = `
# Diagramme d'Ishikawa (Fishbone) : Identifier les Causes Racines

## Introduction

Le diagramme d'Ishikawa, aussi appele diagramme en aretes de poisson (fishbone) ou diagramme causes-effets, est un outil de resolution de problemes cree par Kaoru Ishikawa en 1968. Il permet de visualiser de maniere structuree l'ensemble des causes potentielles d'un probleme, classees par categories. C'est un outil incontournable pour les TPE/PME car il structure la reflexion collective et evite de se precipiter sur la premiere cause apparente.

## Structure du diagramme

Le diagramme se presente sous la forme d'un poisson :
- La tete (a droite) represente le probleme (l'effet) a analyser
- L'arete centrale represente le processus
- Les aretes principales (6 branches) representent les categories de causes (les 6M)
- Les aretes secondaires representent les sous-causes

## Les 6M : Categories de causes

### 1. Main-d'oeuvre (Man)
Les causes liees aux personnes : competences, formation, experience, motivation, effectifs, fatigue, communication.

**Exemples en PME :**
- Manque de formation sur un nouvel equipement
- Turnover eleve avec perte de savoir-faire
- Surcharge de travail ponctuelle
- Absence de procedure claire entrainant des pratiques variables selon l'operateur
- Demotivation liee a un manque de reconnaissance

### 2. Methodes (Method)
Les causes liees aux procedures, modes operatoires, organisation du travail.

**Exemples en PME :**
- Absence de procedure ecrite (chacun fait "a sa maniere")
- Procedure obsolete non mise a jour
- Processus de validation trop long
- Mauvaise planification des taches
- Absence de controle qualite intermediaire

### 3. Matieres (Material)
Les causes liees aux matieres premieres, composants, consommables, informations en entree.

**Exemples en PME :**
- Qualite variable des matieres premieres selon les lots
- Stockage inadequat alterant les materiaux
- Specifications fournisseur non respectees
- Informations client incompletes ou erronees
- Rupture de stock entrainant l'utilisation de substituts

### 4. Machines/Equipements (Machine)
Les causes liees aux outils, machines, logiciels, equipements utilises dans le processus.

**Exemples en PME :**
- Machine mal entretenue ou usee
- Logiciel obsolete ou inadapte
- Outillage manquant ou defectueux
- Capacite insuffisante de l'equipement
- Absence de maintenance preventive

### 5. Milieu (Environment)
Les causes liees a l'environnement de travail : conditions physiques, organisation spatiale, contexte externe.

**Exemples en PME :**
- Eclairage insuffisant au poste de controle
- Temperature non controlee affectant le processus
- Bruit excessif genrant la concentration
- Espace de travail encombre
- Conditions meteo impactant les chantiers

### 6. Mesure (Measurement)
Les causes liees aux instruments de mesure, methodes de controle, indicateurs utilises.

**Exemples en PME :**
- Instruments de mesure non etalonnes
- Criteres de controle qualite flous ou subjectifs
- Absence de suivi statistique
- Frequence de controle insuffisante
- Indicateurs non pertinents (on mesure mal ou pas du tout)

## Methode d'animation d'un Ishikawa en PME

### Preparation (30 minutes)
1. Definir clairement le probleme (l'effet) a analyser. Formuler de maniere factuelle et mesurable.
2. Constituer le groupe : 4-8 personnes de profils differents (operateurs, techniciens, managers, fonctions support).
3. Preparer le materiel : tableau blanc ou paperboard, post-it, marqueurs.
4. Dessiner le squelette du diagramme avec les 6 branches.

### Animation (60-90 minutes)
1. Rappeler le probleme et l'objectif de la seance.
2. Phase de brainstorming libre : chaque participant ecrit ses idees de causes sur des post-it (1 cause par post-it), sans filtre ni critique.
3. Tour de table : chaque participant presente ses post-it et les place sur la branche appropriee.
4. Discussion collective : completer, regrouper, clarifier les causes.
5. Identifier les causes les plus probables par vote (chaque participant a 3 votes).
6. Pour les causes prioritaires, approfondir avec les 5 Pourquoi.

### Suivi
1. Photographier le diagramme et le distribuer a tous les participants.
2. Lancer des actions de verification pour les causes prioritaires (collecte de donnees).
3. Presenter les resultats lors de la prochaine reunion.

## Exemple complet : Taux de retour client de 5% (PME de e-commerce, 12 salaries)

**Probleme :** 5% des commandes font l'objet d'un retour client (objectif : <2%).

**Causes identifiees :**

Main-d'oeuvre : preparateurs peu experimentes (recrutement recent), pas de formation standardisee, fatigue en fin de journee (pic d'erreurs apres 16h).

Methodes : absence de double controle avant expedition, pas de checklist de preparation, preparation de plusieurs commandes en parallele (melange).

Matieres : fiches produit incompletes sur le site web (photos non representatives), tailles non standardisees selon les fournisseurs.

Machines : lecteur code-barres defaillant (ne detecte pas 2% des erreurs), imprimante d'etiquettes floue.

Milieu : eclairage insuffisant dans la zone de preparation, zone de stockage mal organisee (references proches melangees).

Mesure : pas de suivi du taux d'erreur par preparateur, pas d'analyse des motifs de retour.

**Causes prioritaires apres vote :** Absence de double controle (8 votes), fiches produit incompletes (6 votes), eclairage insuffisant (5 votes).

## Variantes utiles pour les PME

**Ishikawa simplifie a 4M :** Pour les processus de service, on peut se limiter a Main-d'oeuvre, Methodes, Moyens (regroupant Machines et Milieu), et Management.

**Ishikawa en mode "5 Pourquoi" :** Pour chaque branche principale, on enchaine les 5 Pourquoi pour remonter aux causes racines profondes.
`;

const OUTILS_5POURQUOI = `
# Les 5 Pourquoi : Remonter a la Cause Racine

## Introduction

La methode des 5 Pourquoi (5 Whys) est une technique d'analyse causale developpee par Sakichi Toyoda, fondateur de Toyota. Elle consiste a poser iterativement la question "Pourquoi ?" pour remonter de l'effet visible (le symptome) jusqu'a la cause racine profonde. Le principe est simple : en posant "Pourquoi ?" environ 5 fois de suite, on depasse les causes superficielles pour atteindre la cause fondamentale qu'il faut traiter pour eliminer definitivement le probleme. C'est un outil ideal pour les TPE/PME car il ne necessite aucun outil statistique, juste de la rigueur dans le questionnement.

## Methode

### Etape 1 : Definir le probleme
Formuler le probleme de maniere factuelle, precise et mesurable. Eviter les formulations vagues ou accusatoires.

- Mauvais : "La qualite est nulle"
- Bon : "8% des pieces livrees au client X sont non conformes depuis 3 mois"

### Etape 2 : Poser le premier "Pourquoi ?"
Pourquoi le probleme se produit-il ? La reponse doit etre factuelle, basee sur des observations, pas sur des opinions.

### Etape 3 : Enchainer les "Pourquoi ?"
Pour chaque reponse, poser a nouveau "Pourquoi ?" jusqu'a atteindre une cause sur laquelle on peut agir concretement. Le nombre 5 est indicatif : parfois 3 suffisent, parfois 7 sont necessaires.

### Etape 4 : Verifier la logique
Relire la chaine de causes de bas en haut en utilisant "donc" : "Parce que [cause racine], donc [cause 4], donc [cause 3], donc [cause 2], donc [cause 1], donc [probleme initial]." Si la logique est coherente, l'analyse est correcte.

### Etape 5 : Definir les actions correctives
Traiter la cause racine, pas les symptomes. Definir une action corrective et une action preventive.

## Exemples detailles pour des PME

### Exemple 1 : Retard de livraison (PME de negoce)

**Probleme :** La commande du client Dupont a ete livree avec 3 jours de retard.

Pourquoi 1 : Pourquoi la livraison est-elle en retard ?
Parce que la preparation de commande n'a ete terminee que vendredi au lieu de mercredi.

Pourquoi 2 : Pourquoi la preparation a-t-elle pris 2 jours de plus ?
Parce que la reference A-2045 etait en rupture de stock et il a fallu la commander au fournisseur.

Pourquoi 3 : Pourquoi cette reference etait-elle en rupture ?
Parce que le stock de securite n'avait pas ete reapprovisionne a temps.

Pourquoi 4 : Pourquoi le reapprovisionnement n'a-t-il pas eu lieu ?
Parce que le responsable logistique n'a pas recu l'alerte de seuil minimum.

Pourquoi 5 : Pourquoi l'alerte n'a-t-elle pas fonctionne ?
Parce que le seuil d'alerte n'a pas ete configure dans le nouveau logiciel de gestion de stock mis en place le mois dernier.

**Cause racine :** Parametrage incomplet du nouveau logiciel de gestion de stock.

**Actions :**
- Corrective : Configurer immediatement les seuils d'alerte pour toutes les references critiques.
- Preventive : Creer une checklist de parametrage a valider pour toute mise en service de nouveau logiciel. Former les utilisateurs sur les alertes.

### Exemple 2 : Erreur sur devis (PME de services)

**Probleme :** Le devis envoye au client Martin comportait un prix errone (18 000 euros au lieu de 21 000 euros).

Pourquoi 1 : Pourquoi le prix est-il errone ?
Parce que le commercial a utilise un ancien tarif.

Pourquoi 2 : Pourquoi a-t-il utilise un ancien tarif ?
Parce qu'il avait un fichier Excel de tarifs enregistre localement sur son PC, qui n'etait pas a jour.

Pourquoi 3 : Pourquoi son fichier n'etait-il pas a jour ?
Parce que la mise a jour des tarifs du 1er janvier n'a pas ete diffusee a tous les commerciaux.

Pourquoi 4 : Pourquoi la diffusion n'a-t-elle pas ete faite ?
Parce qu'il n'existe pas de procedure formelle de mise a jour et de diffusion des tarifs.

Pourquoi 5 : Pourquoi n'y a-t-il pas de procedure ?
Parce que le processus de tarification n'a jamais ete formalise, il reposait sur la memoire du directeur commercial parti a la retraite.

**Cause racine :** Absence de processus formalise de gestion et diffusion des tarifs.

**Actions :**
- Corrective : Creer un document de reference tarifaire partage et centralise (cloud), supprimer les copies locales.
- Preventive : Definir et documenter le processus annuel de revision tarifaire avec checklist de diffusion a tous les utilisateurs.

### Exemple 3 : Accident de travail (PME industrielle)

**Probleme :** Un operateur s'est blesse a la main en manipulant une piece metallique coupante.

Pourquoi 1 : Pourquoi l'operateur s'est-il coupe ?
Parce qu'il ne portait pas de gants de protection.

Pourquoi 2 : Pourquoi ne portait-il pas de gants ?
Parce que les gants adaptes (anti-coupure) n'etaient pas disponibles au poste.

Pourquoi 3 : Pourquoi n'etaient-ils pas disponibles ?
Parce que la derniere commande de gants a ete faite il y a 4 mois et le stock est epuise.

Pourquoi 4 : Pourquoi n'a-t-on pas recommande ?
Parce qu'il n'y a pas de systeme de suivi du stock d'EPI (Equipements de Protection Individuelle).

Pourquoi 5 : Pourquoi pas de suivi ?
Parce que la gestion des EPI est informelle : chacun se sert et personne n'est responsable du reapprovisionnement.

**Cause racine :** Absence de systeme de gestion et de responsable pour les EPI.

**Actions :**
- Corrective immediate : Commander des gants anti-coupure et les distribuer.
- Corrective organisationnelle : Designer un responsable EPI, mettre en place un stock minimum et un systeme de reapprovisionnement.
- Preventive : Auditer tous les postes pour verifier la disponibilite des EPI requis. Formaliser le processus de gestion des EPI.

## Regles d'or pour reussir les 5 Pourquoi

1. **Toujours baser les reponses sur des faits**, pas sur des suppositions ou des opinions.
2. **Rester sur une seule chaine causale** a la fois. Si plusieurs causes emergent a un niveau, traiter chaque branche separement.
3. **Ne jamais s'arreter a une cause humaine** ("erreur de l'operateur"). Chercher pourquoi le systeme a permis cette erreur.
4. **Impliquer les personnes concernees** : elles connaissent la realite du terrain.
5. **Verifier la cause racine** avec des donnees avant de lancer les actions correctives.
6. **Documenter l'analyse** pour capitaliser et eviter de refaire les memes erreurs.
`;

const OUTILS_PARETO = `
# Analyse de Pareto (80/20) : Prioriser les Actions d'Amelioration

## Introduction

L'analyse de Pareto, basee sur le principe des 80/20 enonce par l'economiste italien Vilfredo Pareto, est un outil de priorisation essentiel en amelioration continue. Le principe stipule qu'environ 80% des effets proviennent de 20% des causes. En qualite et en Lean Management, cela signifie que 80% des problemes sont causes par 20% des defauts, que 80% des couts viennent de 20% des postes de depenses, que 80% des reclamations proviennent de 20% des types de defauts. Pour une PME aux ressources limitees, le Pareto est un allie precieux pour concentrer les efforts la ou ils auront le plus d'impact.

## Construction du diagramme de Pareto

### Etape 1 : Definir le sujet d'analyse
Quel probleme veut-on analyser ? Exemples : types de defauts, causes de retard, motifs de reclamation, postes de depenses.

### Etape 2 : Collecter les donnees
Sur une periode representatif (1 a 3 mois minimum), relever la frequence ou le cout de chaque categorie.

### Etape 3 : Classer par ordre decroissant
Trier les categories de la plus frequente (ou couteuse) a la moins frequente.

### Etape 4 : Calculer les pourcentages cumules
Pour chaque categorie, calculer le pourcentage par rapport au total, puis le pourcentage cumule.

### Etape 5 : Construire le graphique
- Axe horizontal : les categories (barres), classees par ordre decroissant
- Axe vertical gauche : frequence ou cout (echelle des barres)
- Axe vertical droit : pourcentage cumule (echelle de la courbe)
- Courbe cumulee : tracer la courbe des pourcentages cumules
- Ligne de reference a 80% sur l'axe droit

### Etape 6 : Identifier les categories prioritaires
Les categories qui representent environ 80% du total sont les "vital few" (les quelques-uns vitaux). C'est sur celles-ci qu'il faut concentrer les efforts.

## Exemple complet : PME de fabrication de pieces plastiques (35 salaries)

**Contexte :** L'entreprise a un taux de rebut global de 4,2% et souhaite le reduire. Les donnees de 3 mois de production sont analysees.

**Donnees collectees (3200 pieces rebutees sur 76 000 produites) :**

| Type de defaut         | Nombre | % du total | % cumule |
|------------------------|--------|------------|----------|
| Bavure excessive       | 1120   | 35,0%      | 35,0%    |
| Retrait dimensionnel   | 768    | 24,0%      | 59,0%    |
| Decoloration           | 416    | 13,0%      | 72,0%    |
| Manque matiere         | 320    | 10,0%      | 82,0%    |
| Trace de demoulage     | 224    | 7,0%       | 89,0%    |
| Bulle d'air            | 160    | 5,0%       | 94,0%    |
| Cassure au demoulage   | 128    | 4,0%       | 98,0%    |
| Autres                 | 64     | 2,0%       | 100,0%   |

**Interpretation :** Les 3 premiers defauts (bavure, retrait, decoloration) representent 72% du total des rebuts. En traitant ces 3 causes, l'entreprise peut theoriquement reduire son taux de rebut de 4,2% a 1,2%.

**Plan d'action :**
1. Bavure excessive : regler les parametres de pression d'injection et verifier l'usure des moules (chantier prioritaire 1)
2. Retrait dimensionnel : optimiser le temps de refroidissement et la temperature du moule (chantier prioritaire 2)
3. Decoloration : verifier le sechage de la matiere et la temperature du fourreau (chantier prioritaire 3)

## Applications du Pareto en PME

### Analyse des reclamations clients
Classer les motifs de reclamation pour identifier les 20% de causes qui generent 80% des insatisfactions. Permet de cibler les actions d'amelioration qualite.

### Analyse des couts
Identifier les 20% de postes de depenses qui representent 80% des couts. Permet de cibler les negociations fournisseurs ou les optimisations de processus.

### Analyse des retards
Classer les causes de retard (machine en panne, attente matieres, validation client, etc.) pour prioriser les actions de reduction des delais.

### Analyse des ventes
Identifier les 20% de clients qui generent 80% du chiffre d'affaires (concentration du portefeuille). Permet d'adapter la strategie commerciale.

### Analyse des pannes machines
Classer les types de pannes et les machines concernees pour cibler la maintenance preventive.

## Le Pareto croise : aller plus loin

Apres un premier Pareto, on peut approfondir chaque categorie prioritaire avec un second Pareto. Par exemple, si "bavure excessive" est la cause principale de rebut, on peut faire un Pareto des sous-causes de bavure : usure du moule, pression d'injection, temperature, matiere, etc.

## Pareto en valeur vs en frequence

Il est souvent utile de construire deux diagrammes de Pareto :
- Un en **frequence** (nombre d'occurrences) : montre les problemes les plus frequents
- Un en **valeur** (impact financier) : montre les problemes les plus couteux

Les priorites peuvent differer. Un defaut frequent mais peu couteux est moins prioritaire qu'un defaut rare mais tres couteux. Le Pareto en valeur oriente mieux les decisions d'investissement.

## Conseils pratiques pour les PME

1. **Simplifier la collecte de donnees** : un simple tableau sur tableur suffit, pas besoin de logiciel specifique.
2. **Periode representative** : collecter sur au moins 1 mois pour avoir des donnees fiables.
3. **Mettre a jour regulierement** : refaire le Pareto tous les trimestres pour voir l'evolution.
4. **Communiquer les resultats** : afficher le diagramme de Pareto dans l'atelier ou le bureau pour sensibiliser les equipes.
5. **Feter les succes** : quand une categorie prioritaire est eliminee, le montrer sur le diagramme mis a jour.
`;

const OUTILS_A3 = `
# A3 Thinking : La Methode Toyota de Resolution de Problemes

## Introduction

Le rapport A3 est un format de resolution de problemes developpe par Toyota, nomme d'apres la taille de la feuille de papier utilisee (format A3, 297 x 420 mm). L'idee est de synthetiser toute la demarche de resolution d'un probleme sur une seule page : contexte, probleme, analyse, solutions, plan d'action et suivi. Cette contrainte de format force a la clarte, a la concision et a la rigueur. Pour une PME, le A3 est un outil pratique car il structure la reflexion sans etre bureaucratique. Un A3 bien fait remplace avantageusement un rapport de 20 pages que personne ne lit.

## Structure du rapport A3

Le A3 se divise en deux parties :
- **Cote gauche : comprendre le probleme** (analyse)
- **Cote droit : resoudre le probleme** (action)

### Section 1 : Contexte (Background)
Decrire brievement le contexte dans lequel le probleme se situe. Pourquoi est-ce important ? Quel est l'enjeu pour l'entreprise ?

**Contenu type :**
- Description du processus ou de l'activite concernee
- Enjeux strategiques ou financiers
- Parties prenantes impactees
- Pourquoi on traite ce probleme maintenant

**Exemple PME :** "Notre entreprise de 20 salaries fabrique des equipements electriques pour le batiment. Le taux de reclamation client est en hausse depuis 6 mois, passant de 2% a 5% des livraisons. Nos 3 clients principaux representent 60% du CA et ont menace de changer de fournisseur si la qualite ne s'ameliore pas d'ici 3 mois."

### Section 2 : Etat actuel (Current Condition)
Decrire la situation actuelle avec des faits et des donnees. Utiliser des graphiques, des chiffres, des cartographies pour rendre la situation visible.

**Contenu type :**
- Indicateurs de performance actuels vs objectifs
- Cartographie du processus actuel (simplifiee)
- Donnees factuelles sur le probleme (frequence, gravite, tendance)
- Impact mesure (cout, delai, satisfaction)

### Section 3 : Objectif (Goal / Target)
Definir clairement ce qu'on veut atteindre, de maniere SMART.

**Exemple :** "Reduire le taux de reclamation client de 5% a moins de 1,5% d'ici le 30 juin, sans augmenter les couts de controle de plus de 500 euros/mois."

### Section 4 : Analyse des causes (Root Cause Analysis)
Utiliser les 5 Pourquoi, le diagramme d'Ishikawa ou le Pareto pour identifier les causes racines verifiees.

**Contenu type :**
- Diagramme d'Ishikawa simplifie ou chaine des 5 Pourquoi
- Donnees de verification des causes (Pareto, correlation)
- Causes racines identifiees et verifiees

### Section 5 : Contre-mesures (Countermeasures)
Proposer des solutions concretes qui s'attaquent aux causes racines, pas aux symptomes.

**Contenu type :**
- Liste des actions avec pour chaque action : quoi, qui, quand, comment
- Lien entre chaque action et la cause racine qu'elle traite
- Evaluation de l'impact attendu de chaque action
- Priorite de mise en oeuvre (matrice effort/impact)

### Section 6 : Plan de mise en oeuvre (Implementation Plan)
Planifier la mise en oeuvre des contre-mesures avec un echancier.

**Contenu type :**
- Planning de type Gantt simplifie
- Jalons cles et dates de revue
- Ressources necessaires (budget, temps, personnes)
- Risques identifies et parades

### Section 7 : Suivi et resultats (Follow-up)
Definir comment on va verifier que les actions produisent les resultats attendus.

**Contenu type :**
- Indicateurs de suivi avec objectifs chiffres
- Frequence de mesure et responsable
- Critere de succes (comment sait-on que le probleme est resolu ?)
- Prochaine date de revue du A3

## Processus d'utilisation du A3 en PME

### Etape 1 : Le porteur de projet redige le cote gauche
Le responsable du probleme (un chef d'equipe, un responsable qualite, un operateur senior) commence par remplir les sections 1 a 4 (cote gauche : comprendre). Cela prend generalement 1 a 2 semaines de travail (collecte de donnees, analyse).

### Etape 2 : Revue avec le mentor/manager
Le porteur presente son analyse a son manager ou a un pair. Le manager ne donne pas la solution mais pose des questions pour challenger l'analyse : "Les donnees sont-elles fiables ?", "As-tu verifie cette cause ?", "N'y a-t-il pas une autre explication ?". C'est le processus de coaching par le A3, un element essentiel de la culture Toyota.

### Etape 3 : Le porteur complete le cote droit
Apres les ajustements de l'analyse, le porteur definit les contre-mesures et le plan d'action (sections 5 a 7).

### Etape 4 : Revue et validation
Nouvelle revue avec le manager pour valider le plan d'action et allouer les ressources.

### Etape 5 : Mise en oeuvre et suivi
Les actions sont mises en oeuvre selon le plan. Le A3 est mis a jour avec les resultats reels et affiche dans l'espace de travail pour visibilite.

## Exemple concret complet : PME d'installation de climatisation

**Contexte :** PME de 15 techniciens, 3 administratifs. Augmentation des rappels clients (retour sur site apres installation) de 10% a 22% en 6 mois. Cout estime : 3500 euros/mois en temps technicien et deplacement.

**Etat actuel :** 22% des installations necessitent un retour sur site dans les 30 jours. Pareto des motifs : fuite de fluide (40%), probleme electrique (25%), bruit anormal (20%), autres (15%).

**Objectif :** Reduire les rappels a moins de 8% sous 3 mois.

**Analyse (5 Pourquoi sur la fuite de fluide) :**
- Pourquoi fuite ? Raccord mal serre
- Pourquoi mal serre ? Cle dynamometrique non utilisee
- Pourquoi non utilisee ? Pas disponible dans tous les kits techniciens
- Pourquoi pas disponible ? Budget outillage non prevu pour les 5 nouveaux techniciens recrutes
- Cause racine : Processus d'equipement des nouveaux techniciens incomplet

**Contre-mesures :**
1. Equiper immediatement tous les techniciens d'une cle dynamometrique (J+7, responsable: chef d'atelier, cout: 450 euros)
2. Creer une checklist d'installation obligatoire avec verification couple de serrage (J+14, responsable: responsable qualite)
3. Creer un kit d'integration avec liste du materiel obligatoire pour tout nouveau technicien (J+21, responsable: RH)
4. Former tous les techniciens au serrage au couple (J+30, responsable: chef d'atelier)

**Suivi :** Taux de rappel mesure chaque semaine, revue du A3 toutes les 2 semaines.

## Pourquoi le A3 est ideal pour les PME

1. **Simple et visuel** : tout tient sur une page, pas de rapport fleuve
2. **Structure sans etre bureaucratique** : guide la reflexion sans noyer dans la paperasse
3. **Developpe les competences** : le processus de coaching par le A3 forme les managers et les equipes
4. **Favorise la communication** : le A3 est un support de discussion, pas un document administratif
5. **Peu couteux** : une feuille A3, un crayon et de la rigueur suffisent
`;

const STRATEGIE_SWOT = `
# SWOT / TOWS : Analyse Strategique et Matrice de Decision

## Introduction

L'analyse SWOT est un outil de diagnostic strategique qui classe les facteurs influencant une entreprise en quatre categories : Strengths (Forces), Weaknesses (Faiblesses), Opportunities (Opportunites) et Threats (Menaces). Les forces et faiblesses sont des facteurs internes (propres a l'entreprise), tandis que les opportunites et menaces sont des facteurs externes (environnement). Pour une TPE/PME, le SWOT est souvent le premier outil strategique utilise car il est simple a comprendre et ne necessite pas de donnees complexes. La matrice TOWS, qui en decoule, transforme ce diagnostic en strategies actionnables.

## Construction du SWOT

### Forces (Strengths) - Facteurs internes positifs
Ce que l'entreprise fait bien, ses avantages concurrentiels, ses ressources distinctives.

**Questions d'identification pour une PME :**
- Quels sont nos savoir-faire specifiques ?
- Qu'est-ce que nos clients apprecient le plus chez nous ?
- Quelles ressources avons-nous que nos concurrents n'ont pas ?
- Quels sont nos meilleurs resultats financiers ?
- Quelle est notre reputation sur le marche ?

**Exemples typiques en PME :**
- Proximite client et reactivite (avantage naturel des petites structures)
- Expertise technique pointue dans un domaine de niche
- Equipe fidele et polyvalente
- Agilite et capacite d'adaptation rapide
- Ancrage local et reseau de partenaires

### Faiblesses (Weaknesses) - Facteurs internes negatifs
Les domaines ou l'entreprise est vulnerable, ses lacunes, ses limites.

**Questions d'identification pour une PME :**
- Quelles sont nos principales difficultes recurrentes ?
- Que font nos concurrents mieux que nous ?
- Ou perdons-nous de l'argent ou du temps ?
- Quelles competences nous manquent ?
- Quels sont nos retours clients negatifs ?

**Exemples typiques en PME :**
- Dependance a un petit nombre de clients (concentration du CA)
- Manque de tresorerie limitant les investissements
- Absence de processus formalises (tout repose sur le dirigeant)
- Faible presence digitale / marketing
- Difficulte a recruter des talents

### Opportunites (Opportunities) - Facteurs externes positifs
Les evolutions de l'environnement qui peuvent beneficier a l'entreprise.

**Sources d'information :**
- Veille sectorielle et concurrentielle
- Tendances du marche et de la reglementation
- Innovations technologiques accessibles
- Evolution des besoins clients
- Aides publiques et subventions

**Exemples typiques en PME :**
- Croissance d'un segment de marche
- Nouvelle reglementation creant une demande
- Retrait ou difficulte d'un concurrent
- Technologie permettant de reduire les couts
- Appels d'offres publics accessibles

### Menaces (Threats) - Facteurs externes negatifs
Les evolutions de l'environnement qui peuvent nuire a l'entreprise.

**Exemples typiques en PME :**
- Arrivee de nouveaux concurrents (low-cost, geants du web)
- Hausse des couts matieres premieres ou energie
- Evolution reglementaire contraignante
- Obsolescence technologique
- Rarefaction de la main-d'oeuvre qualifiee

## La matrice TOWS : Du diagnostic a la strategie

La matrice TOWS croise les 4 categories du SWOT pour generer 4 types de strategies :

### Strategies SO (Forces x Opportunites) - Offensives
Utiliser les forces internes pour saisir les opportunites externes. C'est la strategie la plus favorable.

**Exemple PME :** "Notre expertise en renovation energetique (force) combinee a l'obligation de DPE pour la vente immobiliere (opportunite) nous permet de developper une offre de diagnostic + travaux cle en main."

### Strategies WO (Faiblesses x Opportunites) - De reorientation
Corriger les faiblesses internes pour pouvoir saisir les opportunites.

**Exemple PME :** "Notre faible presence digitale (faiblesse) nous empeche de capter la demande croissante en ligne (opportunite). Action : investir dans un site web vitrine et du referencement local."

### Strategies ST (Forces x Menaces) - Defensives
Utiliser les forces internes pour se proteger des menaces externes.

**Exemple PME :** "Notre proximite client et notre reactivite (forces) nous protegent de l'arrivee de concurrents low-cost en ligne (menace) en misant sur le service sur-mesure et la relation de confiance."

### Strategies WT (Faiblesses x Menaces) - De survie
Minimiser les faiblesses internes pour eviter les menaces. Situation critique necessitant des actions urgentes.

**Exemple PME :** "Notre dependance a 2 gros clients (faiblesse) combinee au risque de delocalisation de l'un d'eux (menace) necessite une diversification urgente du portefeuille client."

## Methodologie d'animation en PME

### Preparation (1 heure)
1. Collecter en amont les donnees cles : CA par client, marges par produit, avis clients, veille concurrentielle.
2. Preparer un questionnaire prealable pour que les participants reflechissent avant la seance.
3. Reunir 4-8 personnes representant differentes fonctions de l'entreprise.

### Seance (2-3 heures)
1. Brainstorming par categorie (15 min par quadrant) : chaque participant note ses idees sur des post-it.
2. Mise en commun et regroupement (30 min) : placer les post-it sur une grande matrice murale, regrouper les idees similaires.
3. Priorisation (20 min) : voter pour les 3-5 facteurs les plus importants de chaque quadrant.
4. Construction de la matrice TOWS (30 min) : croiser les facteurs prioritaires pour definir des strategies.
5. Plan d'action (20 min) : pour chaque strategie, definir les premieres actions concretes.

## Erreurs courantes a eviter

1. **Confondre interne et externe** : "Le marche est en croissance" est une opportunite (externe), pas une force (interne).
2. **Rester trop vague** : "Bonne qualite" n'est pas une force exploitable. "Taux de retour client de 0,5% contre 3% en moyenne sectorielle" est une force measurable.
3. **Ne lister que des forces** : l'honnetete sur les faiblesses est essentielle pour progresser.
4. **Ne pas transformer le SWOT en actions** : un SWOT sans matrice TOWS et sans plan d'action est un exercice sterile.
5. **Le faire seul** : le SWOT doit etre un exercice collectif pour capter toutes les perspectives.
`;

const STRATEGIE_STEEPLE = `
# STEEPLE / PESTEL : Analyse du Macro-Environnement

## Introduction

L'analyse STEEPLE (aussi connue sous le nom PESTEL) est un outil d'analyse strategique qui examine les facteurs macro-environnementaux influencant une entreprise. L'acronyme STEEPLE represente : Social, Technologique, Economique, Environnemental, Politique, Legal et Ethique. Cet outil est complementaire au SWOT : le STEEPLE identifie les facteurs externes (opportunites et menaces) de maniere structuree. Pour une TPE/PME, comprendre son macro-environnement est essentiel pour anticiper les evolutions et adapter sa strategie.

## Les 7 dimensions de l'analyse STEEPLE

### S - Social (Socioculturel)
Les tendances demographiques, culturelles et sociales qui influencent le marche.

**Facteurs a analyser :**
- Evolution demographique (vieillissement, urbanisation, immigration)
- Modes de vie et habitudes de consommation
- Niveau d'education et qualifications disponibles
- Attitudes envers le travail (teletravail, equilibre vie pro/perso)
- Tendances de consommation (bio, local, seconde main)
- Evolution des menages (taille, composition, monoparentalite)

**Impact PME - Exemples :**
- Un artisan boulanger voit sa clientele evoluer vers des produits bio et sans gluten.
- Une PME de services a la personne beneficie du vieillissement de la population.
- Une entreprise de BTP doit s'adapter a la rarefaction des apprentis (desaffection pour les metiers manuels).

### T - Technologique
Les innovations et evolutions technologiques qui impactent le secteur.

**Facteurs a analyser :**
- Innovations de rupture dans le secteur (intelligence artificielle, automatisation)
- Digitalisation des processus et des canaux de vente
- Nouvelles technologies accessibles (cloud, SaaS, IoT)
- Rythme d'obsolescence technologique
- Investissement R&D du secteur
- Cybersecurite et risques numeriques

**Impact PME - Exemples :**
- Un commerce de proximite doit developper sa presence en ligne (e-commerce, reseaux sociaux).
- Un cabinet comptable voit l'IA automatiser les saisies comptables, necessitant une montee en competence vers le conseil.
- Un artisan peut utiliser l'impression 3D pour prototyper a moindre cout.

### E - Economique
Les conditions macroeconomiques qui influencent l'activite.

**Facteurs a analyser :**
- Croissance economique (PIB, consommation des menages)
- Inflation et evolution des prix
- Taux d'interet et conditions de credit
- Taux de change (pour les entreprises exportatrices)
- Pouvoir d'achat des menages
- Taux de chomage et tension sur le marche du travail
- Cout des matieres premieres et de l'energie

**Impact PME - Exemples :**
- La hausse des taux d'interet impacte directement les PME du batiment (ralentissement des projets immobiliers).
- L'inflation des couts energetiques oblige les PME industrielles a optimiser leur consommation.
- La tension sur le marche du travail rend le recrutement difficile et pousse les salaires a la hausse.

### E - Environnemental (Ecologique)
Les enjeux ecologiques et les contraintes environnementales.

**Facteurs a analyser :**
- Reglementation environnementale (normes d'emission, gestion des dechets)
- Attentes des clients en matiere de developpement durable
- Cout de l'energie et transition energetique
- Rarefaction de certaines ressources
- Impact du changement climatique sur l'activite
- Opportunites liees a l'economie circulaire

**Impact PME - Exemples :**
- Un garagiste doit s'adapter aux vehicules electriques (formation, equipement).
- Un imprimeur peut se differencier avec des encres vegetales et du papier recycle.
- Un restaurateur peut valoriser une demarche zero dechet aupres de sa clientele.

### P - Politique
Les decisions politiques et gouvernementales qui impactent l'entreprise.

**Facteurs a analyser :**
- Politique fiscale (impots, charges sociales, credits d'impot)
- Aides et subventions aux entreprises (BPI, regions, Europe)
- Politique de commande publique
- Stabilite politique et continuite des politiques economiques
- Relations internationales et accords commerciaux
- Politique d'amenagement du territoire

**Impact PME - Exemples :**
- Les aides a la renovation energetique (MaPrimeRenov') creent un marche pour les artisans du batiment.
- Les ZFE (Zones a Faibles Emissions) impactent les artisans et livreurs qui doivent renouveler leur flotte.
- Le credit d'impot recherche peut financer l'innovation dans les PME innovantes.

### L - Legal (Juridique)
Le cadre reglementaire et legislatif applicable.

**Facteurs a analyser :**
- Droit du travail (duree du travail, contrats, licenciement)
- Normes et certifications obligatoires (CE, NF, ISO)
- RGPD et protection des donnees personnelles
- Droit de la concurrence et des pratiques commerciales
- Reglementation sectorielle specifique
- Responsabilite civile et penale du dirigeant

**Impact PME - Exemples :**
- Le RGPD oblige toute PME collectant des donnees clients a mettre en place des procedures de protection.
- La facturation electronique obligatoire a partir de 2026 necessite une adaptation des outils.
- Les normes RE2020 dans le batiment modifient les pratiques de construction.

### E - Ethique
Les attentes ethiques de la societe et des parties prenantes.

**Facteurs a analyser :**
- Responsabilite sociale des entreprises (RSE)
- Transparence et gouvernance
- Conditions de travail et bien-etre des salaries
- Ethique de la chaine d'approvisionnement
- Commerce equitable et pratiques durables
- Diversite et inclusion

**Impact PME - Exemples :**
- Les clients B2B demandent de plus en plus une demarche RSE a leurs fournisseurs (critere de selection).
- Le label "entreprise a mission" peut etre un avantage concurrentiel pour une PME.
- L'attention au bien-etre des salaries aide a fidéliser les talents dans un marche tendu.

## Methodologie d'analyse pour une PME

### Etape 1 : Collecter les informations (1-2 semaines)
- Presse professionnelle sectorielle
- Sites des syndicats et federations professionnelles
- Publications INSEE et BPI France
- Veille reglementaire (Legifrance, sites ministeriels)
- Echanges avec les pairs (clubs d'entrepreneurs, CCI)

### Etape 2 : Analyser et prioriser (seance de 2 heures)
Pour chaque facteur identifie, evaluer :
- L'impact potentiel sur l'entreprise (fort / moyen / faible)
- La probabilite de survenue (certaine / probable / possible)
- L'horizon temporel (court terme <1 an / moyen terme 1-3 ans / long terme >3 ans)

### Etape 3 : Integrer au SWOT
Les facteurs STEEPLE a fort impact positif deviennent des opportunites dans le SWOT. Les facteurs a fort impact negatif deviennent des menaces. Cela alimente la matrice TOWS et le plan strategique.

### Etape 4 : Definir les actions
Pour chaque facteur prioritaire, definir des actions concretes : veille renforcee, investissement, formation, partenariat, diversification.

## Frequence recommandee
Pour une PME, une analyse STEEPLE complete tous les 12 a 18 mois est suffisante, avec une veille legere continue (lecture presse pro, participation aux evenements sectoriels).
`;

const STRATEGIE_PORTER = `
# Les 5 Forces de Porter : Analyse Concurrentielle

## Introduction

Le modele des 5 Forces de Michael Porter est un outil d'analyse concurrentielle qui permet d'evaluer l'attractivite d'un secteur et la position concurrentielle d'une entreprise. Les 5 forces sont : la rivalite entre concurrents existants, la menace de nouveaux entrants, la menace de produits ou services de substitution, le pouvoir de negociation des fournisseurs et le pouvoir de negociation des clients. Pour une TPE/PME, cette analyse est precieuse pour comprendre les pressions concurrentielles et definir une strategie de differenciation ou de positionnement. Chaque force est evaluee sur une echelle de faible a forte, et plus une force est elevee, plus elle reduit la rentabilite potentielle du secteur.

## Les 5 Forces en detail

### Force 1 : Rivalite entre concurrents existants

C'est l'intensite de la competition directe entre les entreprises deja presentes sur le marche.

**Facteurs d'intensification :**
- Nombre eleve de concurrents de taille similaire
- Croissance lente du marche (les gains se font au detriment des autres)
- Couts fixes eleves (obligation de remplir les capacites)
- Faible differenciation des produits/services
- Barrieres de sortie elevees (investissements non recuperables)
- Surcapacite dans le secteur

**Evaluation pour une PME :**
- Comptabiliser le nombre de concurrents directs dans la zone de chalandise
- Evaluer le taux de croissance du marche local
- Mesurer le niveau de differenciation de votre offre
- Identifier les guerres de prix en cours

**Exemple PME :** Un salon de coiffure dans un centre-ville avec 8 concurrents dans un rayon de 500 metres, un marche stable et des services peu differencies fait face a une rivalite forte. Strategie possible : se specialiser (coiffure bio, barbier haut de gamme) pour reduire le nombre de concurrents directs.

### Force 2 : Menace de nouveaux entrants

La facilite avec laquelle de nouvelles entreprises peuvent entrer sur le marche.

**Barrieres a l'entree (facteurs protegeant les acteurs en place) :**
- Investissement initial necessaire (capital requis)
- Economies d'echelle des acteurs existants
- Acces aux canaux de distribution
- Reglementation et licences (barrieres legales)
- Brevets et propriete intellectuelle
- Fidelite des clients aux marques existantes
- Effet d'experience (courbe d'apprentissage)

**Evaluation pour une PME :**
- Quel est le cout d'entree dans votre secteur ?
- Y a-t-il des certifications ou agréments obligatoires ?
- Les clients sont-ils fideles ou volatils ?
- De nouveaux acteurs sont-ils apparus recemment ?

**Exemple PME :** Une entreprise de livraison de repas fait face a une menace forte de nouveaux entrants car l'investissement initial est faible (vehicule + telephone) et les barrieres reglementaires minimales. En revanche, un cabinet d'expertise comptable est mieux protege par les barrieres de certification (diplome obligatoire).

### Force 3 : Menace de produits/services de substitution

Le risque que les clients se tournent vers des alternatives qui repondent au meme besoin.

**Facteurs d'evaluation :**
- Existence de solutions alternatives (meme besoin, moyen different)
- Rapport qualite/prix des substituts
- Cout de changement pour le client (switching cost)
- Propension des clients a changer

**Exemple PME :** Un imprimeur traditionnel fait face a la menace de substitution par la communication digitale (emails, reseaux sociaux, sites web). Un plombier fait face a une menace faible de substitution car on ne peut pas remplacer une reparation physique par une solution numerique.

### Force 4 : Pouvoir de negociation des fournisseurs

La capacite des fournisseurs a imposer leurs conditions (prix, delais, quantites minimum).

**Facteurs renforcement le pouvoir fournisseur :**
- Peu de fournisseurs alternatifs (oligopole)
- Produit fournisseur specifique et non substituable
- Cout de changement de fournisseur eleve
- Menace d'integration en aval du fournisseur
- Faible part dans le CA du fournisseur (le fournisseur n'a pas peur de vous perdre)

**Evaluation pour une PME :**
- Combien de fournisseurs avez-vous pour chaque intrant cle ?
- Pouvez-vous facilement changer de fournisseur ?
- Quel pourcentage de vos couts representent les achats ?
- Vos fournisseurs augmentent-ils regulierement leurs prix ?

**Exemple PME :** Un restaurant dependant d'un seul maraicher local pour ses legumes bio a un pouvoir de negociation faible avec ce fournisseur. Diversifier les sources d'approvisionnement (2-3 maraichers, marche de gros en complement) reduit cette dependance.

### Force 5 : Pouvoir de negociation des clients

La capacite des clients a imposer leurs conditions (prix bas, delais courts, services gratuits).

**Facteurs renforcement le pouvoir client :**
- Concentration des clients (peu de clients representent beaucoup du CA)
- Produit/service standardise et facilement substituable
- Faible cout de changement pour le client
- Transparence des prix (facilite de comparaison)
- Menace d'integration en amont du client (faire lui-meme)
- Sensibilite prix du client

**Evaluation pour une PME :**
- Quel % du CA representent vos 3 premiers clients ?
- Vos clients peuvent-ils facilement aller chez un concurrent ?
- Les prix sont-ils facilement comparables dans votre secteur ?
- Recevez-vous regulierement des demandes de baisse de prix ?

**Exemple PME :** Un sous-traitant dont le client principal represente 50% du CA a un pouvoir de negociation tres faible. Le client peut imposer des baisses de prix, des delais courts et des conditions defavorables. La diversification du portefeuille client est une priorite strategique.

## Application pratique pour une PME

### Etape 1 : Evaluer chaque force (1 = faible, 5 = forte)
Remplir une grille d'evaluation pour chaque force avec les sous-criteres decrits ci-dessus.

### Etape 2 : Visualiser sur un diagramme radar
Representer les 5 forces sur un graphique pentagonal pour avoir une vue d'ensemble immediate.

### Etape 3 : Definir des strategies
Pour chaque force elevee, definir des actions pour la reduire :
- Rivalite forte : se differencier, innover, cibler une niche
- Nouveaux entrants : renforcer les barrieres (fidelisation, brevets, qualite)
- Substituts : innover, ajouter des services complementaires
- Pouvoir fournisseur : diversifier les sources, negocier en groupement, integrer
- Pouvoir client : diversifier le portefeuille, augmenter les couts de changement, fideliser

### Etape 4 : Revisiter l'analyse
Refaire l'analyse tous les 12-18 mois car les forces evoluent avec le marche.

## Limites du modele pour les PME

- Le modele est statique : il photographie un instant T mais le marche evolue vite.
- Il ne prend pas en compte les collaborations (coopetition, ecosystemes).
- Il peut etre difficile a alimenter en donnees pour une tres petite entreprise.
- Il ne traite pas les facteurs internes (complement avec le SWOT necessaire).
`;

const STRATEGIE_BCG = `
# La Matrice BCG : Analyse du Portefeuille de Produits/Services

## Introduction

La matrice BCG (Boston Consulting Group) est un outil d'analyse strategique qui permet de classer les produits ou services d'une entreprise selon deux axes : le taux de croissance du marche et la part de marche relative de l'entreprise. Elle aide a prendre des decisions d'investissement et d'allocation de ressources entre les differentes activites. Pour une TPE/PME, meme avec une gamme limitee, la matrice BCG aide a identifier quels produits/services meritent plus d'investissement et lesquels doivent etre abandonnes.

## Les 4 quadrants de la matrice

### Etoiles (Stars) - Forte croissance, forte part de marche
Ce sont les produits/services leaders sur un marche en croissance. Ils generent du chiffre d'affaires important mais necessitent aussi des investissements pour maintenir leur position dans un marche dynamique.

**Strategie :** Investir pour maintenir ou renforcer la position dominante. Ces produits deviendront des vaches a lait quand le marche ralentira.

**Exemple PME :** Un traiteur qui a lance un service de livraison de repas sains en entreprise. Le marche est en forte croissance (+15%/an) et il est le leader local avec 35% de part de marche. Il doit investir (vehicules, personnel, marketing) pour garder sa position face aux nouveaux entrants attires par la croissance.

### Vaches a lait (Cash Cows) - Faible croissance, forte part de marche
Ce sont les produits/services matures, leaders sur un marche stable. Ils generent beaucoup de tresorerie avec peu d'investissement car le marche ne necessite plus d'efforts de conquete.

**Strategie :** Rentabiliser au maximum, investir le minimum pour maintenir la position. Utiliser la tresorerie generee pour financer les etoiles et les dilemmes.

**Exemple PME :** Un electricien dont l'activite principale de maintenance des installations electriques represente 60% du CA. Le marche est stable, les clients sont fideles, la rentabilite est bonne. Cette activite finance les investissements dans les nouvelles offres (domotique, bornes de recharge).

### Dilemmes (Question Marks) - Forte croissance, faible part de marche
Ce sont les produits/services sur un marche en croissance mais ou l'entreprise n'a pas encore une position forte. Ils consomment des ressources pour tenter de gagner des parts de marche.

**Strategie :** Choisir soigneusement : investir massivement pour devenir une etoile, ou abandonner si les chances sont faibles. Ne pas rester en position intermediaire qui consomme des ressources sans resultat.

**Exemple PME :** Un menuisier qui a commence a proposer des escaliers design haut de gamme. Le marche est en croissance mais il n'a fait que 5 chantiers en 1 an contre 30 pour le leader local. Il doit decider : investir dans un showroom et du marketing pour percer, ou revenir a son coeur de metier.

### Poids morts (Dogs) - Faible croissance, faible part de marche
Ce sont les produits/services sur un marche stagnant ou l'entreprise n'a pas de position forte. Ils ne generent ni croissance ni rentabilite significative.

**Strategie :** Desinvestir, abandonner ou repositionner. Chaque euro investi dans un poids mort est un euro qui manque pour une etoile ou un dilemme.

**Exemple PME :** Un imprimeur qui continue a proposer des cartes de visite traditionnelles alors que la demande baisse de 10%/an et qu'il est en concurrence avec les plateformes en ligne a prix casse. Il devrait rediriger ses ressources vers l'impression grand format ou le packaging, segments en croissance.

## Methode de construction pour une PME

### Etape 1 : Identifier les activites/produits
Lister toutes les gammes de produits ou services distincts de l'entreprise. Regrouper par famille si necessaire (ne pas descendre trop dans le detail).

### Etape 2 : Evaluer le taux de croissance du marche
Pour chaque activite, estimer le taux de croissance annuel du marche correspondant. Sources : federation professionnelle, INSEE, etudes sectorielles, observation terrain.
- Forte croissance : >10%/an
- Faible croissance : <5%/an

### Etape 3 : Evaluer la part de marche relative
La part de marche relative se calcule par rapport au principal concurrent :
PMR = Votre CA dans l'activite / CA du principal concurrent dans l'activite
- PMR > 1 : vous etes leader
- PMR < 1 : vous etes suiveur

Pour une PME locale, on peut simplifier en evaluant sa position par rapport aux concurrents locaux (leader, challenger, suiveur).

### Etape 4 : Positionner sur la matrice
Placer chaque activite sur la matrice sous forme de cercle dont la taille est proportionnelle au CA genere.

### Etape 5 : Definir la strategie par activite
Pour chaque activite, definir l'orientation strategique et le niveau d'investissement en coherence avec le quadrant.

## Equilibre du portefeuille

Un portefeuille equilibre pour une PME devrait idealement comporter :
- 1-2 vaches a lait qui financent les autres activites
- 1-2 etoiles qui assurent la croissance future
- 1-2 dilemmes soigneusement selectionnes comme paris d'avenir
- Pas (ou peu) de poids morts

Un portefeuille desequilibre est un signal d'alerte :
- Que des vaches a lait = pas de relais de croissance, risque de declin
- Que des dilemmes = consommation de tresorerie sans retour, risque de crise
- Que des etoiles = besoin d'investissement permanent, tension de tresorerie
- Beaucoup de poids morts = dispersion des ressources, rentabilite faible

## Exemple complet : PME de services informatiques (18 salaries)

| Activite           | CA annuel | Croissance marche | Position     | Quadrant   |
|--------------------|-----------|-------------------|--------------|------------|
| Maintenance parc   | 450 000   | +2%               | Leader local | Vache a lait |
| Cloud / SaaS       | 180 000   | +25%              | Challenger   | Dilemme    |
| Cybersecurite      | 120 000   | +30%              | Nouveau      | Dilemme    |
| Vente materiel     | 200 000   | -5%               | Suiveur      | Poids mort |
| Dev web/mobile     | 250 000   | +12%              | Leader local | Etoile     |

**Decisions strategiques :**
- Maintenance parc : continuer a rentabiliser, pas d'investissement supplementaire
- Dev web/mobile : investir pour garder le leadership (recrutement d'un developpeur senior)
- Cloud/SaaS : investir strategiquement (formations, partenariat editeur) pour monter en competence
- Cybersecurite : evaluer a 6 mois, abandonner si pas de traction
- Vente materiel : reduire progressivement (orienter les clients vers des solutions cloud)

## Limites du modele pour les PME

1. La notion de "part de marche relative" est difficile a calculer pour une petite entreprise locale.
2. Le modele ne prend pas en compte les synergies entre activites.
3. Le taux de croissance n'est pas le seul facteur d'attractivite d'un marche.
4. Le modele est statique et doit etre reactualise regulierement.
5. Pour les tres petites entreprises (< 10 salaries), la gamme est souvent trop etroite pour une analyse pertinente.
`;

const STRATEGIE_HOSHIN = `
# Hoshin Kanri : Le Deploiement Strategique

## Introduction

Hoshin Kanri (litteralement "gestion de la boussole") est une methode japonaise de management strategique developpee chez Toyota. Elle permet de deployer la strategie de l'entreprise depuis la vision du dirigeant jusqu'aux actions quotidiennes de chaque collaborateur, en s'assurant que tous les efforts sont alignes dans la meme direction. Pour une PME, le Hoshin Kanri resout un probleme frequent : le dirigeant a une vision mais les equipes ne savent pas comment y contribuer au quotidien, ou bien chaque service travaille dans sa propre direction sans coherence d'ensemble.

## Les 4 etapes du Hoshin Kanri

### Etape 1 : Definir la vision et les objectifs strategiques (3-5 ans)

Le dirigeant definit ou l'entreprise doit etre dans 3 a 5 ans. Ce sont les "hoshin" (les orientations strategiques), generalement 3 a 5 maximum pour rester focalise.

**Methode pour une PME :**
- Realiser une analyse strategique prealable (SWOT, STEEPLE, Porter)
- Definir la vision en une phrase : "Dans 5 ans, nous serons..."
- Decliner en 3-5 objectifs strategiques breakthroughs (percee), pas des objectifs de maintien

**Exemples pour une PME de 30 salaries :**
- "Doubler le CA en 3 ans en developpant l'activite de services"
- "Atteindre 95% de satisfaction client d'ici 2 ans"
- "Reduire les couts de non-qualite de 50% en 18 mois"
- "Devenir le leader regional de la renovation energetique en 3 ans"

**Regles cles :**
- Pas plus de 5 objectifs strategiques (focus)
- Chaque objectif doit etre mesurable (KPI associe)
- Les objectifs doivent etre ambitieux mais atteignables (stretch targets)

### Etape 2 : Deployer en objectifs annuels (Catchball)

Les objectifs strategiques sont declines en objectifs annuels, puis cascades aux differents niveaux de l'organisation. Le mecanisme cle est le "catchball" : un aller-retour entre la direction et les equipes.

**Le processus de Catchball :**
1. Le dirigeant propose les objectifs annuels aux responsables d'equipe.
2. Les responsables evaluent la faisabilite et proposent des ajustements, des moyens necessaires et des KPI.
3. Le dirigeant et les responsables negocient et s'accordent sur les objectifs finaux.
4. Les responsables declinent a leur tour vers leurs equipes avec le meme processus.

**Avantage du Catchball :**
- Les objectifs sont realistes car valides par ceux qui doivent les atteindre
- Les equipes sont engagees car elles ont participe a la definition
- Les moyens necessaires sont identifies en amont

**Exemple de cascade :**
Objectif strategique : "Reduire les delais de livraison de 30% en 1 an"
- Objectif production : "Reduire le temps de cycle de fabrication de 25%"
  - Action equipe decoupe : "Mettre en oeuvre le SMED pour reduire les changements de serie de 50%"
  - Action equipe assemblage : "Reorganiser la cellule en flux continu"
- Objectif logistique : "Reduire le delai d'approvisionnement de 40%"
  - Action achats : "Negocier des livraisons bi-hebdomadaires avec les 3 fournisseurs principaux"
- Objectif commercial : "Ameliorer la precision des previsions de commande a 90%"
  - Action equipe commerciale : "Mettre en place un CRM avec pipeline de prevision"

### Etape 3 : Executer et suivre (PDCA)

Chaque objectif est suivi via un cycle PDCA regulier, avec des revues periodiques a chaque niveau.

**Rythme de suivi recommande pour une PME :**
- Revue quotidienne : indicateurs operationnels (tableau de bord atelier/equipe)
- Revue hebdomadaire : avancement des actions (reunion d'equipe 15-30 min)
- Revue mensuelle : indicateurs tactiques (reunion de direction 1-2h)
- Revue trimestrielle : indicateurs strategiques (comite de direction 3-4h)

**La matrice Hoshin (matrice en X) :**
C'est l'outil visuel central du Hoshin Kanri. Elle presente sur une seule page :
- Au nord : les objectifs strategiques a 3-5 ans
- A l'ouest : les objectifs annuels
- Au sud : les indicateurs et KPI
- A l'est : les responsables

Les intersections montrent les liens entre objectifs, actions et responsables, garantissant la coherence du deploiement.

### Etape 4 : Revue annuelle et ajustement

En fin d'annee, une revue strategique permet de :
- Evaluer l'atteinte des objectifs annuels
- Analyser les ecarts et leurs causes
- Capitaliser sur les reussites et les echecs
- Ajuster les objectifs de l'annee suivante
- Verifier l'alignement avec la vision a 3-5 ans

## Mise en oeuvre pratique pour une PME

### Phase 1 : Preparation (1-2 mois)
- Former le dirigeant et l'equipe de direction au Hoshin Kanri
- Realiser le diagnostic strategique (SWOT, analyse du marche)
- Definir la vision et les objectifs strategiques

### Phase 2 : Deploiement initial (1 mois)
- Processus de Catchball avec les responsables d'equipe
- Definir les objectifs annuels, les KPI et les responsables
- Construire la matrice Hoshin
- Definir les rituels de suivi (frequence, format, participants)

### Phase 3 : Execution (12 mois)
- Suivi regulier selon le rythme defini
- Resolution des problemes par PDCA
- Ajustements si necessaire (le Hoshin n'est pas rigide)

### Phase 4 : Bilan et relance (1 mois)
- Revue annuelle des resultats
- Celebration des succes
- Lancement du cycle suivant

## Exemple concret : PME de menuiserie aluminium (40 salaries)

**Vision a 3 ans :** "Devenir le menuisier aluminium de reference en Ile-de-France pour le marche de la renovation tertiaire, avec un CA de 8M euros (vs 4,5M actuellement) et une marge nette de 8% (vs 5%)."

**Objectifs strategiques :**
1. Doubler le CA renovation tertiaire en 3 ans
2. Ameliorer la marge nette de 5% a 8%
3. Atteindre un NPS (Net Promoter Score) de 60

**Objectifs annuels (annee 1) :**
1. Augmenter le CA renovation de 30% (de 2M a 2,6M)
   - KPI : CA mensuel renovation tertiaire
   - Responsable : Directeur commercial
2. Reduire les couts de non-qualite de 40% (de 180K a 108K)
   - KPI : cout mensuel des reprises et SAV
   - Responsable : Responsable production
3. Ameliorer le NPS de 35 a 45
   - KPI : NPS trimestriel
   - Responsable : Responsable qualite

**Matrice Hoshin simplifiee :**
L'objectif 1 (CA) est deploye en actions commerciales (prospection bureau d'etudes, partenariat avec architectes, presence sur les appels d'offres publics).
L'objectif 2 (qualite) est deploye en actions production (5S atelier, formation pose, checklist controle avant livraison).
L'objectif 3 (NPS) est deploye en actions transversales (enquete satisfaction systematique, traitement des reclamations en 48h, suivi post-chantier).

## Benefices du Hoshin Kanri pour une PME

1. **Alignement** : tout le monde tire dans la meme direction
2. **Focus** : les ressources limitees sont concentrees sur les priorites
3. **Engagement** : les equipes participent a la definition des objectifs (Catchball)
4. **Agilite** : le suivi regulier permet d'ajuster rapidement
5. **Apprentissage** : le cycle annuel de revue cree une capitalisation continue
`;

const BENCHMARK_RATIOS = `
# Ratios Financiers par Secteur : Benchmarks pour les TPE/PME

## Introduction

Les ratios financiers sont des indicateurs cles qui permettent d'evaluer la sante financiere d'une entreprise et de la comparer aux normes de son secteur. Pour une TPE/PME, connaitre les benchmarks sectoriels est essentiel pour identifier ses points forts et ses points faibles, convaincre un banquier ou un investisseur, et fixer des objectifs de progression realistes. Les donnees ci-dessous sont des moyennes indicatives pour les entreprises francaises de 5 a 250 salaries, tirees des publications INSEE, Banque de France et des federations professionnelles.

## Ratios de rentabilite

### Marge brute (CA - Couts d'achat) / CA
Ce ratio mesure la capacite de l'entreprise a generer de la valeur ajoutee par rapport a ses achats.

| Secteur                   | Marge brute moyenne | Fourchette typique |
|---------------------------|--------------------|--------------------|
| Commerce de detail         | 30-40%             | 25-50%             |
| Commerce de gros           | 15-25%             | 10-30%             |
| Industrie manufacturiere   | 35-50%             | 25-60%             |
| Services aux entreprises   | 55-75%             | 40-85%             |
| BTP / Construction         | 25-40%             | 20-50%             |
| Restauration               | 65-75%             | 60-80%             |
| Artisanat                  | 40-55%             | 30-65%             |
| Informatique / Digital     | 60-80%             | 45-90%             |

### Marge nette (Resultat net / CA)
C'est le ratio final de rentabilite apres toutes les charges.

| Secteur                   | Marge nette moyenne | Seuil d'alerte |
|---------------------------|--------------------:|:--------------:|
| Commerce de detail         | 2-5%                | < 1%           |
| Commerce de gros           | 1-3%                | < 0,5%         |
| Industrie manufacturiere   | 3-7%                | < 2%           |
| Services aux entreprises   | 5-12%               | < 3%           |
| BTP / Construction         | 2-5%                | < 1%           |
| Restauration               | 3-8%                | < 2%           |
| Artisanat                  | 4-8%                | < 2%           |
| Informatique / Digital     | 8-20%               | < 5%           |

### Taux de valeur ajoutee (VA / CA)
Mesure la richesse creee par l'entreprise par rapport a son activite.

| Secteur                   | VA/CA moyenne |
|---------------------------|:------------:|
| Commerce de detail         | 20-30%       |
| Industrie manufacturiere   | 30-45%       |
| Services aux entreprises   | 50-70%       |
| BTP / Construction         | 30-40%       |

## Ratios de structure financiere

### Taux d'endettement (Dettes financieres / Capitaux propres)
Mesure le levier financier de l'entreprise. Un ratio trop eleve indique une dependance excessive aux emprunts.

| Valeur   | Interpretation                        |
|----------|---------------------------------------|
| < 0,5    | Faiblement endette, marge de manoeuvre |
| 0,5 - 1  | Equilibre acceptable                  |
| 1 - 2    | Endettement significatif              |
| > 2      | Surendettement, risque financier      |

### Capacite d'autofinancement (CAF / CA)
Mesure la capacite de l'entreprise a financer ses investissements et rembourser ses emprunts.

| Secteur                   | CAF/CA moyenne |
|---------------------------|:--------------:|
| Commerce                   | 3-5%           |
| Industrie                  | 5-10%          |
| Services                   | 8-15%          |
| BTP                        | 4-7%           |

### Fonds de roulement net global (FRNG)
Difference entre les ressources stables et les emplois stables. Doit etre positif pour une situation saine.

### Besoin en fonds de roulement (BFR)
BFR = Stocks + Creances clients - Dettes fournisseurs. Doit etre finance par le FRNG et/ou la tresorerie.

| Secteur                   | BFR en jours de CA |
|---------------------------|:------------------:|
| Commerce de detail         | 15-30 jours        |
| Commerce de gros           | 30-60 jours        |
| Industrie manufacturiere   | 45-90 jours        |
| Services aux entreprises   | 20-45 jours        |
| BTP / Construction         | 30-60 jours        |

## Ratios de productivite

### CA par salarie
| Secteur                   | CA/salarie moyen   |
|---------------------------|:------------------:|
| Commerce de detail         | 150-250 K euros    |
| Commerce de gros           | 300-600 K euros    |
| Industrie manufacturiere   | 150-300 K euros    |
| Services aux entreprises   | 80-180 K euros     |
| BTP / Construction         | 120-200 K euros    |
| Restauration               | 60-100 K euros     |
| Informatique / Digital     | 100-200 K euros    |

### Valeur ajoutee par salarie
| Secteur                   | VA/salarie moyenne |
|---------------------------|:------------------:|
| Commerce                   | 45-65 K euros      |
| Industrie                  | 55-80 K euros      |
| Services                   | 60-90 K euros      |
| BTP                        | 50-70 K euros      |

## Ratios de gestion du cycle d'exploitation

### Delai moyen de paiement clients (DSO)
| Secteur       | DSO moyen     | Objectif |
|---------------|:------------:|:--------:|
| B2B           | 45-60 jours  | < 45 j   |
| B2C           | 0-15 jours   | Immediat |
| BTP           | 60-90 jours  | < 60 j   |

### Delai moyen de paiement fournisseurs (DPO)
| Secteur       | DPO moyen     |
|---------------|:------------:|
| Tous secteurs | 45-60 jours  |

### Rotation des stocks (en jours)
| Secteur                   | Rotation moyenne |
|---------------------------|:----------------:|
| Commerce alimentaire       | 15-30 jours      |
| Commerce non alimentaire   | 45-90 jours      |
| Industrie                  | 30-60 jours      |
| BTP                        | 15-30 jours      |

## Utilisation des ratios en diagnostic

1. **Calculer vos propres ratios** a partir de votre bilan et compte de resultat
2. **Comparer aux benchmarks sectoriels** pour identifier les ecarts significatifs
3. **Prioriser les ecarts** : quels ratios sous-performants ont le plus d'impact ?
4. **Analyser les causes** des ecarts (5 Pourquoi, Ishikawa)
5. **Definir des objectifs** de progression realistes (atteindre la moyenne sectorielle dans un premier temps)
6. **Suivre l'evolution** trimestriellement pour mesurer les progres
`;

const BENCHMARK_KPI = `
# KPIs Operationnels par Secteur : Benchmarks pour les TPE/PME

## Introduction

Les KPIs (Key Performance Indicators) operationnels mesurent l'efficacite des processus au quotidien. Contrairement aux ratios financiers qui donnent une vue retrospective, les KPIs operationnels sont des indicateurs avances qui permettent de piloter en temps reel et d'anticiper les resultats financiers. Pour une TPE/PME, suivre 5 a 10 KPIs cles suffit pour piloter efficacement l'activite. Voici les benchmarks par secteur pour se situer et fixer des objectifs.

## KPIs de production / fabrication

### Taux de Rendement Synthetique (TRS / OEE)
Le TRS mesure la performance globale d'un equipement : disponibilite x performance x qualite.

| Niveau        | TRS     | Interpretation                      |
|---------------|---------|-------------------------------------|
| World class   | > 85%   | Excellence operationnelle           |
| Bon           | 70-85%  | Performance solide                  |
| Moyen         | 55-70%  | Amelioration necessaire             |
| Faible        | < 55%   | Gaspillages importants              |

**Moyenne PME industrielle francaise : 55-65%** (source : etudes CETIM)

**Decomposition type des pertes :**
- Pertes de disponibilite (pannes, reglages) : 10-15%
- Pertes de performance (micro-arrets, ralentissements) : 10-15%
- Pertes de qualite (rebuts, retouches) : 3-8%

### Taux de rebut / non-qualite
| Secteur                   | Taux de rebut moyen | World class |
|---------------------------|:-------------------:|:-----------:|
| Plasturgie                | 3-8%                | < 1%        |
| Metallurgie               | 2-5%                | < 0,5%      |
| Agroalimentaire           | 5-12%               | < 2%        |
| Electronique              | 1-3%                | < 0,1%      |
| Imprimerie                | 4-8%                | < 2%        |

### Taux de service (livraison a l'heure et conforme)
| Niveau        | Taux de service | Interpretation                |
|---------------|:---------------:|-------------------------------|
| World class   | > 98%           | Service excellent             |
| Bon           | 95-98%          | Performance solide            |
| Moyen         | 90-95%          | Amelioration necessaire       |
| Insuffisant   | < 90%           | Probleme majeur               |

**Moyenne PME francaise : 88-93%**

### Temps de changement de serie (Setup time)
| Secteur                   | Moyen      | Apres SMED  |
|---------------------------|:----------:|:-----------:|
| Injection plastique       | 30-90 min  | 5-15 min    |
| Usinage CNC               | 20-60 min  | 5-10 min    |
| Imprimerie offset          | 30-60 min  | 10-20 min   |
| Conditionnement            | 15-45 min  | 3-10 min    |

## KPIs de service

### Taux de satisfaction client (CSAT)
| Niveau        | Score CSAT  | Interpretation              |
|---------------|:-----------:|-----------------------------|
| Excellent     | > 90%       | Tres haute satisfaction     |
| Bon           | 80-90%      | Satisfaction solide         |
| Moyen         | 70-80%      | Points d'amelioration       |
| Insuffisant   | < 70%       | Insatisfaction significative |

### Net Promoter Score (NPS)
| Niveau        | NPS      | Interpretation              |
|---------------|:--------:|-----------------------------|
| Excellent     | > 50     | Forte recommandation        |
| Bon           | 30-50    | Bon niveau de fidelite      |
| Moyen         | 0-30     | Neutre a positif            |
| Critique      | < 0      | Plus de detracteurs         |

**Moyenne par secteur en PME :**
- Artisanat : NPS 30-50 (proximite, confiance)
- Services B2B : NPS 20-40
- Commerce de detail : NPS 10-30
- Restauration : NPS 15-35

### Taux de resolution au premier contact (First Contact Resolution)
| Secteur                   | FCR moyen | World class |
|---------------------------|:---------:|:-----------:|
| Support informatique      | 60-70%    | > 80%       |
| SAV general               | 50-65%    | > 75%       |
| Service client e-commerce | 65-75%    | > 85%       |

## KPIs commerciaux

### Taux de conversion (devis acceptes / devis emis)
| Secteur                   | Taux moyen | Bon taux   |
|---------------------------|:----------:|:----------:|
| BTP / Artisanat           | 25-35%     | > 40%      |
| Services B2B              | 20-30%     | > 35%      |
| E-commerce (visite/achat) | 1-3%       | > 3%       |
| Commerce physique         | 20-30%     | > 35%      |

### Delai moyen de reponse a un devis
| Secteur                   | Delai moyen | Objectif   |
|---------------------------|:-----------:|:----------:|
| BTP / Artisanat           | 5-10 jours  | < 3 jours  |
| Services B2B              | 3-7 jours   | < 2 jours  |
| Commerce                  | 1-3 jours   | < 24h      |

### Cout d'acquisition client (CAC)
| Secteur                   | CAC moyen (PME) |
|---------------------------|:---------------:|
| Services B2B              | 200-500 euros   |
| E-commerce                | 15-50 euros     |
| SaaS B2B                  | 300-1000 euros  |
| Commerce local            | 20-80 euros     |

## KPIs RH

### Taux de turnover
| Secteur                   | Moyen     | Bon taux  |
|---------------------------|:---------:|:---------:|
| Restauration/Hotellerie   | 25-40%    | < 20%     |
| Commerce de detail        | 20-30%    | < 15%     |
| Industrie                 | 10-15%    | < 8%      |
| Services B2B              | 12-18%    | < 10%     |
| Informatique              | 15-25%    | < 12%     |

### Taux d'absenteisme
| Secteur                   | Moyen     | Bon taux  |
|---------------------------|:---------:|:---------:|
| Tous secteurs PME         | 5-7%      | < 3%      |
| Industrie                 | 6-9%      | < 4%      |
| Services                  | 4-6%      | < 3%      |

### Nombre d'heures de formation par salarie et par an
| Taille entreprise         | Moyenne   | Bon niveau |
|---------------------------|:---------:|:----------:|
| TPE (< 10 salaries)      | 8-12h     | > 20h     |
| PME (10-250 salaries)    | 15-25h    | > 30h     |

## Comment utiliser ces benchmarks

1. **Selectionner 5-10 KPIs pertinents** pour votre activite (pas plus pour rester focalisé)
2. **Mesurer votre performance actuelle** sur chaque KPI
3. **Comparer aux benchmarks** de votre secteur et taille d'entreprise
4. **Identifier les ecarts prioritaires** : ou etes-vous significativement en dessous ?
5. **Fixer des objectifs progressifs** : d'abord atteindre la moyenne, puis viser le "bon niveau"
6. **Mettre en place le suivi** : tableau de bord avec mise a jour hebdomadaire ou mensuelle
7. **Agir sur les ecarts** via des chantiers d'amelioration (Kaizen, DMAIC, PDCA)
`;

const BENCHMARK_GASPILLAGE = `
# Taux de Gaspillage Typiques par Secteur : Benchmarks pour les TPE/PME

## Introduction

Le gaspillage (muda en japonais) represente toute activite qui consomme des ressources sans creer de valeur pour le client. Dans la plupart des PME, le gaspillage represente entre 20% et 40% des couts operationnels, ce qui constitue un levier considerable de gain de competitivite. Ce document presente les taux de gaspillage typiques observes par secteur pour permettre aux dirigeants de PME d'estimer le potentiel d'amelioration de leur entreprise et de prioriser les chantiers Lean.

## Gaspillages par type et par secteur

### Transport inutile
Tout deplacement de materiaux, produits, documents ou informations sans valeur ajoutee.

| Secteur                   | Cout typique du gaspillage         | Potentiel de reduction |
|---------------------------|------------------------------------|:----------------------:|
| Industrie manufacturiere  | 3-8% du cout de production         | 40-60%                 |
| Logistique / Distribution | 5-12% du CA                        | 20-35%                 |
| BTP / Construction        | 5-15% du budget chantier           | 30-50%                 |
| Commerce de detail        | 2-5% du cout d'exploitation        | 25-40%                 |
| Services / Bureau         | 1-3% du temps de travail           | 50-70%                 |

**Exemples concrets :**
- Atelier de mecanique : un operateur parcourt en moyenne 4 km par jour dans l'atelier a cause d'un mauvais agencement. Apres reorganisation : 1,5 km.
- Cabinet d'architecte : les plans sont imprimes, transportes en reunion, annotes, scannes et renvoyes. La digitalisation complete elimine 90% de ce transport.
- Chantier BTP : les materiaux sont deplaces 3 a 5 fois avant leur pose finale. Une meilleure planification reduit a 1-2 deplacements.

### Stocks excessifs
Matieres premieres, en-cours de production ou produits finis en quantite superieure au besoin immediat.

| Secteur                   | Surstock typique (vs optimal) | Immobilisation financiere |
|---------------------------|:-----------------------------:|:-------------------------:|
| Commerce alimentaire      | 20-40% de surstock            | 15-30 jours de CA         |
| Commerce non alimentaire  | 30-60% de surstock            | 30-90 jours de CA         |
| Industrie manufacturiere  | 25-50% de surstock            | 20-60 jours de CA         |
| BTP                       | 15-30% de surstock            | 10-25 jours de CA         |

**Impact financier pour une PME type (CA 3M euros, industrie) :**
- Stock moyen actuel : 450 K euros (54 jours de CA)
- Stock optimal estime : 250 K euros (30 jours de CA)
- Tresorerie liberee : 200 K euros
- Economies annuelles (cout de stockage a 15%) : 30 K euros

### Mouvements inutiles
Deplacements physiques des personnes (marcher, se baisser, chercher) et mouvements numeriques (clics, navigation) sans valeur ajoutee.

| Secteur                   | Temps perdu par personne/jour | Cout annuel pour 10 salaries |
|---------------------------|:-----------------------------:|:----------------------------:|
| Industrie / Atelier       | 30-60 minutes                 | 25-50 K euros                |
| Bureau / Administratif    | 20-45 minutes                 | 17-37 K euros                |
| Commerce / Magasin        | 15-30 minutes                 | 12-25 K euros                |
| Restauration              | 20-40 minutes                 | 17-33 K euros                |

**Causes principales :**
- Poste de travail mal organise (pas de 5S)
- Outils ranges loin du poste d'utilisation
- Recherche de documents ou informations
- Navigation entre logiciels non integres
- Saisies multiples de la meme information

### Attente
Temps durant lequel une ressource (personne, machine, materiau) est inactive.

| Secteur                   | Temps d'attente typique (% du temps total) |
|---------------------------|:------------------------------------------:|
| Industrie manufacturiere  | 10-25% du temps de cycle                   |
| BTP / Chantier            | 15-30% du temps de chantier                |
| Services / Bureau         | 10-20% du temps de travail                 |
| Restauration              | 5-15% du temps de service                  |
| Sante / Medical           | 20-40% du temps patient                    |

**Causes principales en PME :**
- Attente de validation par le dirigeant (goulet de decision)
- Attente de matieres premieres (mauvaise planification)
- Attente entre etapes du processus (flux desynchronises)
- Attente d'information (communication defaillante)
- Attente client pour decision/validation

### Surproduction
Produire plus que necessaire, plus tot ou plus vite que la demande.

| Secteur                   | Surproduction typique | Cout associe            |
|---------------------------|:---------------------:|-------------------------|
| Industrie manufacturiere  | 5-15% de la production| Stockage + obsolescence |
| Restauration              | 10-25% des plats      | Pertes alimentaires     |
| Imprimerie                | 5-10% des tirages     | Papier + encre perdus   |
| Agroalimentaire           | 8-20% de la production| Pertes + destruction    |

### Sur-traitement
Faire plus que ce que le client demande ou utiliser des moyens disproportionnes.

| Secteur                   | Sur-traitement typique | Exemples courants                     |
|---------------------------|:----------------------:|---------------------------------------|
| Industrie                 | 5-15% des operations  | Finitions excessives, controles multiples |
| Services / Conseil        | 10-25% du temps       | Rapports trop detailles, reunions inutiles |
| Administratif             | 15-30% du temps       | Validations en chaine, doublons de saisie |
| BTP                       | 5-10% du budget       | Finitions au-dela du cahier des charges |

### Defauts
Non-conformites, erreurs, reprises, retouches, retours clients.

| Secteur                   | Cout de non-qualite (% du CA) | World class |
|---------------------------|:-----------------------------:|:-----------:|
| Industrie manufacturiere  | 5-15%                         | < 2%        |
| BTP / Construction        | 5-10%                         | < 3%        |
| Services                  | 3-8%                          | < 1%        |
| Restauration              | 5-12%                         | < 3%        |
| E-commerce                | 3-8%                          | < 1%        |

**Decomposition typique du cout de non-qualite :**
- Couts de detection (controles, inspections) : 20-30%
- Couts de correction interne (rebuts, retouches) : 30-40%
- Couts de correction externe (SAV, retours, penalites) : 20-30%
- Couts de prevention (formation, procedures) : 10-20%

### Competences sous-utilisees
Potentiel humain non exploite : idees ignorees, competences non utilisees, manque de delegation.

| Indicateur                              | Moyenne PME   | World class  |
|-----------------------------------------|:-------------:|:------------:|
| Suggestions par salarie par an          | 0-2           | > 12         |
| Taux de mise en oeuvre des suggestions  | 10-30%        | > 70%        |
| Taux de polyvalence (postes maitrises)  | 1-2 postes    | 3-4 postes   |
| % salaries impliques dans l'amelioration| 5-15%         | > 80%        |

## Estimation rapide du potentiel de gains pour une PME

### Methode simplifiee
Pour estimer rapidement le potentiel de gains lies a l'elimination des gaspillages dans votre PME :

1. **Prendre le CA annuel** de l'entreprise
2. **Appliquer le taux de gaspillage sectoriel** (tableau ci-dessous)
3. **Appliquer un taux de capture realiste** de 30-50% (on ne peut jamais eliminer 100% des gaspillages)

| Secteur                   | Taux de gaspillage global estime | Gain potentiel (taux capture 40%) |
|---------------------------|:--------------------------------:|:---------------------------------:|
| Industrie manufacturiere  | 25-35% des couts operationnels   | 10-14% des couts                  |
| BTP / Construction        | 20-30% du budget projet          | 8-12% du budget                   |
| Commerce                  | 15-25% des couts d'exploitation  | 6-10% des couts                   |
| Services                  | 20-30% du temps facturable       | 8-12% du temps                    |
| Restauration              | 25-35% du cout matiere + MO      | 10-14% des couts                  |

### Exemple concret
PME industrielle, CA 2,5M euros, couts operationnels 2M euros :
- Gaspillage estime : 30% x 2M = 600 K euros
- Potentiel de gains (taux capture 40%) : 240 K euros par an
- Cela represente une augmentation potentielle de la marge nette de 9,6 points de pourcentage

**Important :** Ces gains ne se realisent pas du jour au lendemain. Un programme Lean structure dans une PME produit typiquement :
- Annee 1 : 30-40% du potentiel capture (quick wins, 5S, premiers chantiers)
- Annee 2 : 20-30% supplementaires (chantiers structurels, VSM, SMED)
- Annee 3+ : gains incrementaux de 5-10% par an (culture Kaizen installee)
`;

const TEMPLATE_PLAN_ACTION = `
# Template de Plan d'Action : Guide Complet pour TPE/PME

## Introduction

Un plan d'action est un document structurant qui traduit une decision strategique ou une analyse de probleme en actions concretes, responsabilisees et planifiees. Pour une TPE/PME, le plan d'action est l'outil quotidien du dirigeant et des managers pour piloter les projets d'amelioration, suivre les actions correctives et coordonner les equipes. Ce template est adapte aux petites structures et peut etre utilise sur un simple tableur ou un outil de gestion de projet basique.

## Structure du plan d'action

### En-tete du document

**Informations obligatoires :**
- Titre du plan d'action (ex: "Reduction du taux de retard livraison")
- Responsable du plan (le pilote, pas celui qui fait tout)
- Date de creation et date de revue prevue
- Objectif SMART associe (ex: "Reduire le taux de retard de 15% a 5% d'ici le 30 septembre")
- Contexte / origine (suite a quel diagnostic, reclamation, audit ?)
- Indicateur de suivi (le KPI qui mesure le succes)

### Tableau des actions

Pour chaque action, documenter les elements suivants :

**Colonnes obligatoires :**

| N | Action | Responsable | Echeance | Statut | Commentaire |
|---|--------|-------------|----------|--------|-------------|
| 1 | Description precise de l'action a realiser | Prenom Nom | JJ/MM/AAAA | A faire / En cours / Termine / Abandonne | Observations, blocages, resultats |

**Colonnes complementaires (recommandees) :**

| Priorite | Categorie | Effort | Impact attendu | Cout |
|----------|-----------|--------|----------------|------|
| Haute/Moyenne/Basse | Quick win / Court terme / Structurel | Faible/Moyen/Eleve | Qualitatif ou quantitatif | Budget necessaire |

### Methodologie QQOQCCP pour definir chaque action

Pour chaque action du plan, se poser les questions suivantes :

- **Quoi ?** Que faut-il faire exactement ? (description precise et sans ambiguite)
- **Qui ?** Qui est responsable de la realisation ? (une seule personne, pas un service)
- **Ou ?** Ou l'action doit-elle etre realisee ? (site, atelier, service)
- **Quand ?** Quelle est la date limite ? (date precise, pas "rapidement")
- **Comment ?** Quelles sont les etapes ou moyens necessaires ?
- **Combien ?** Quel budget, quelles ressources, quel temps ?
- **Pourquoi ?** Quel est le lien avec l'objectif du plan ?

### Classification des actions par priorite

**Matrice Effort / Impact :**

|                | Impact faible       | Impact fort          |
|----------------|---------------------|----------------------|
| Effort faible  | Actions secondaires | Quick wins (priorite 1) |
| Effort eleve   | A abandonner        | Projets strategiques (priorite 2) |

**Classification temporelle :**
- **Quick wins** (0-2 semaines) : actions rapides, peu couteuses, impact immediat. A lancer en premier pour creer de la dynamique.
- **Court terme** (1-3 mois) : actions moderees necessitant un peu de preparation ou de coordination.
- **Structurel** (3-12 mois) : actions de fond necessitant des investissements, des formations ou des reorganisations.
- **Transformation** (12+ mois) : changements majeurs de processus, culture ou organisation.

## Rituels de suivi du plan d'action

### Revue hebdomadaire (15-30 minutes)
- Passer en revue les actions dont l'echeance arrive dans les 7 prochains jours
- Identifier les actions en retard et comprendre les blocages
- Mettre a jour les statuts
- Ajuster les echeances si necessaire (avec justification)

### Revue mensuelle (1 heure)
- Vue d'ensemble du plan : taux d'avancement global
- Mesure de l'indicateur de resultat (le KPI cible)
- Analyse des ecarts : pourquoi certaines actions sont en retard ?
- Decision sur les actions bloquees : debloquer, reformuler ou abandonner
- Ajout de nouvelles actions si necessaire

### Cloture du plan
Quand l'objectif est atteint ou le plan arrive a son terme :
- Bilan final : objectif atteint ? Pourquoi / pourquoi pas ?
- Lecons apprises : qu'est-ce qui a bien fonctionne ? Qu'ameliorer ?
- Actions residuelles : transferer dans un nouveau plan si necessaire
- Standardisation : les ameliorations sont-elles perennisees ?

## Exemple concret : Plan d'action suite a un diagnostic de gaspillages

**Titre :** Elimination des gaspillages - Processus de traitement des commandes
**Responsable :** Marie Dupont, Responsable Logistique
**Date :** 15/03/2025 - Revue : 15/04/2025
**Objectif :** Reduire le delai de traitement des commandes de 5 jours a 3 jours d'ici le 30 juin 2025
**Indicateur :** Delai moyen de traitement (de la reception a l'expedition)

| N | Action | Resp. | Echeance | Priorite | Statut |
|---|--------|-------|----------|----------|--------|
| 1 | Reorganiser la zone de preparation (5S) | Pierre L. | 31/03 | Quick win | En cours |
| 2 | Creer une checklist de verification commande | Marie D. | 22/03 | Quick win | Termine |
| 3 | Mettre en place un suivi visuel des commandes en cours (tableau Kanban) | Pierre L. | 07/04 | Court terme | A faire |
| 4 | Negocier un passage de commande automatise avec le fournisseur principal | Marie D. | 30/04 | Court terme | A faire |
| 5 | Former l'equipe au nouveau processus | Marie D. | 15/05 | Court terme | A faire |
| 6 | Automatiser la generation des bons de livraison | IT (Jean R.) | 31/05 | Structurel | A faire |
| 7 | Mettre en place un systeme de Kanban pour le reapprovisionnement du stock de preparation | Pierre L. | 15/06 | Structurel | A faire |

## Erreurs courantes a eviter

1. **Actions trop vagues** : "Ameliorer la qualite" n'est pas une action. "Former l'equipe au controle visuel des soudures selon la norme XY" en est une.
2. **Responsable collectif** : "L'equipe production" n'est pas un responsable. Nommer une personne.
3. **Pas de date** : une action sans echeance n'est pas une action, c'est un souhait.
4. **Trop d'actions** : 15-20 actions maximum par plan. Au-dela, prioriser et reporter.
5. **Pas de suivi** : un plan non suivi est un plan mort. Planifier les revues des la creation.
6. **Pas de lien avec un objectif** : chaque action doit contribuer a l'objectif mesurable du plan.
`;

const TEMPLATE_MEMOIRE = `
# Template de Memoire Technique : Structure pour Reponse aux Appels d'Offres

## Introduction

Le memoire technique est un document essentiel dans les reponses aux appels d'offres, notamment dans les marches publics et les appels d'offres prives structures. Il decrit la maniere dont l'entreprise propose de realiser la prestation demandee. Pour une TPE/PME, un memoire technique bien redige peut faire la difference face a des concurrents plus grands. Ce template est adapte aux petites entreprises et fournit une structure claire et reproductible pour produire des memoires techniques de qualite.

## Structure type du memoire technique

### 1. Page de garde
- Logo de l'entreprise
- Titre : "Memoire Technique" + intitule du marche
- Numero de reference du marche / appel d'offres
- Nom du maitre d'ouvrage (le client)
- Nom de l'entreprise candidate
- Date de remise
- Mention de confidentialite

### 2. Sommaire
Table des matieres detaillee avec pagination. Facilite la lecture pour les evaluateurs qui notent critere par critere.

### 3. Presentation de l'entreprise

**3.1 Identite et historique**
- Raison sociale, forme juridique, capital social
- Date de creation, historique en quelques lignes
- SIRET, code APE, certifications et qualifications
- Chiffre d'affaires des 3 dernieres annees
- Effectif total et repartition par metier

**3.2 Savoir-faire et competences**
- Domaines d'expertise specifiques
- Equipements et moyens techniques
- Technologies maitrisees
- Partenariats et sous-traitants habituels (si applicable)

**3.3 References similaires**
Presenter 3 a 5 references de projets similaires au marche vise :
- Nom du client (avec autorisation)
- Nature de la prestation
- Montant approximatif
- Duree et date de realisation
- Specificites techniques
- Resultats obtenus / satisfaction client

**Conseil PME :** Si vous n'avez pas de reference exactement identique, presentez des references qui demonstrent des competences transferables. Mettez en avant la proximite geographique et la reactivite, arguments forts des PME.

### 4. Comprehension du besoin

Montrer que vous avez compris la demande du client en reformulant :
- Le contexte du projet
- Les enjeux et contraintes du client
- Les resultats attendus
- Les points de vigilance identifies

**Conseil PME :** C'est souvent la section la plus differenciante. Un memoire qui montre une vraie comprehension du besoin, avec une visite sur site ou un echange prealable, se demarque nettement d'une reponse generique.

### 5. Methodologie et organisation

**5.1 Approche methodologique**
Decrire la methode de travail proposee, phase par phase :
- Phase de preparation / lancement
- Phase de realisation / execution
- Phase de controle et reception
- Phase de suivi / garantie

Pour chaque phase, preciser :
- Les objectifs
- Les activites prevues
- Les livrables
- Les moyens mobilises
- La duree estimee

**5.2 Organisation de l'equipe**
- Organigramme de l'equipe projet
- CV des personnes cles (chef de projet, responsable technique)
- Roles et responsabilites de chacun
- Disponibilite et temps alloue

**5.3 Planning previsionnel**
- Diagramme de Gantt ou planning simplifie
- Jalons cles et points de controle
- Dates de reunion de suivi proposees
- Marge prevue pour les aleas

### 6. Moyens techniques et materiels

- Liste des equipements qui seront utilises
- Justification du choix des materiaux ou produits
- Fiches techniques des produits proposes
- Moyens de controle qualite
- Outils de suivi et reporting

### 7. Demarche qualite, securite et environnement

**7.1 Qualite**
- Systeme de management de la qualite (ISO 9001 ou equivalent)
- Procedures de controle en cours de realisation
- Gestion des non-conformites
- Processus de reception et validation

**7.2 Securite**
- Plan de prevention des risques
- Formations securite des equipes
- EPI fournis
- Indicateurs securite (taux de frequence, taux de gravite)
- Document Unique d'Evaluation des Risques (DUERP)

**7.3 Environnement**
- Gestion des dechets
- Reduction de l'empreinte carbone
- Materiaux eco-responsables proposes
- Demarche RSE de l'entreprise

**Conseil PME :** Meme sans certification ISO, decrivez vos bonnes pratiques qualite, securite et environnement. Les evaluateurs cherchent une demarche, pas forcement un certificat.

### 8. Gestion des risques et des aleas

- Identification des principaux risques du projet
- Mesures de prevention et de mitigation prevues
- Processus d'escalade en cas de probleme
- Plan de continuite (que faire si un intervenant est absent ?)
- Engagement de delai et penalites acceptees

### 9. Engagements et garanties

- Engagement de resultat ou de moyens
- Delai de garantie
- Service apres-vente et maintenance
- Conditions d'intervention en urgence
- Assurances professionnelles (RC pro, decennale si applicable)

### 10. Annexes

- Attestations d'assurance
- Certifications et qualifications
- CV detailles des intervenants
- Fiches techniques des produits
- Attestations de satisfaction client
- DUERP (extrait)
- Politique qualite

## Conseils de redaction pour les PME

**Format et presentation :**
- Police lisible (Arial ou Calibri, taille 11-12)
- Pagination systematique
- En-tete avec le nom du marche, pied de page avec le nom de l'entreprise
- Illustrations, photos de realisations, schemas
- Impression couleur si possible, reliure soignee

**Style de redaction :**
- Phrases courtes et claires
- Vocabulaire technique adapte au lecteur (pas trop jargonnant)
- Privilegier le concret : chiffres, dates, noms, resultats
- Utiliser des tableaux et listes pour la lisibilite
- Repondre point par point aux criteres d'evaluation indiques dans le reglement de consultation

**Points differenciants pour une PME :**
- Proximite geographique et reactivite (delai d'intervention en heures)
- Contact direct avec le dirigeant (pas de filtre hierarchique)
- Flexibilite et adaptation aux specificites du client
- Ancrage local et connaissance du territoire
- Engagement personnel du chef d'entreprise
- Taille humaine permettant un suivi personnalise

## Erreurs frequentes a eviter

1. **Reponse generique** : copier-coller un memoire type sans l'adapter au marche specifique
2. **Non-respect du cadre de reponse** : si le reglement impose une structure, la respecter scrupuleusement
3. **Surestimation des moyens** : promettre des ressources qu'on ne pourra pas mobiliser
4. **Oublier les annexes demandees** : chaque document absent peut etre eliminatoire
5. **Fautes d'orthographe** : relecture obligatoire par une personne differente du redacteur
6. **Pas de chiffrage du temps** : un planning sans dates precises n'est pas credible
`;

const TEMPLATE_QUALITE = `
# Template de Plan Qualite : Structure pour TPE/PME

## Introduction

Le plan qualite (ou Plan d'Assurance Qualite - PAQ) est un document qui decrit les dispositions specifiques prises par l'entreprise pour garantir la qualite d'un produit, d'un service ou d'un projet. Il est souvent exige dans les marches publics, les projets industriels et les relations B2B exigeantes. Pour une TPE/PME qui n'a pas necessairement de certification ISO 9001, un plan qualite bien structure demontre le professionnalisme et la rigueur de l'entreprise. Ce template est simplifie et adapte aux petites structures.

## Structure du plan qualite

### 1. Objet et domaine d'application

**1.1 Objet du document**
Decrire l'objectif du plan qualite : "Ce document definit les dispositions mises en oeuvre par [nom de l'entreprise] pour garantir la qualite de [la prestation / le produit / le projet] dans le cadre de [reference du marche / contrat]."

**1.2 Perimetre d'application**
- Produits ou services couverts
- Phases du projet concernees (de la conception a la livraison)
- Sites de production ou d'intervention concernes
- Duree d'application

**1.3 Documents de reference**
- Cahier des charges du client
- Normes applicables (NF, EN, ISO)
- Reglementation sectorielle
- Documents internes de reference (procedures, modes operatoires)

### 2. Organisation qualite

**2.1 Responsabilites**
Definir les roles et responsabilites en matiere de qualite :

| Fonction           | Responsabilite qualite                                    |
|--------------------|-----------------------------------------------------------|
| Dirigeant          | Engagement qualite, allocation des ressources, revue      |
| Responsable projet | Application du plan qualite, coordination, reporting      |
| Responsable qualite| Controles, audits, traitement des non-conformites         |
| Operateurs         | Autocontrole, respect des procedures, signalement anomalies|

**Pour une TPE :** Le dirigeant cumule souvent les roles de responsable projet et responsable qualite. C'est acceptable si les activites de controle sont clairement planifiees.

**2.2 Communication**
- Reunions de suivi qualite (frequence, participants, ordre du jour type)
- Reporting client (format, frequence, contenu)
- Gestion documentaire (ou sont stockes les documents, qui y accede, comment sont geres les versions)

### 3. Processus de realisation

**3.1 Planification de la realisation**
Decrire les etapes du processus de realisation avec pour chaque etape :
- Entrees requises (specifications, matieres, informations)
- Activites a realiser
- Points de controle prevus
- Sorties attendues (livrables, criteres d'acceptation)
- Responsable

**3.2 Maitrise des approvisionnements**
- Criteres de selection des fournisseurs et sous-traitants
- Controles a la reception des matieres et composants
- Procedure en cas de non-conformite fournisseur
- Liste des fournisseurs agrees (si applicable)

**3.3 Maitrise de la production / realisation**
- Modes operatoires de reference pour les operations critiques
- Parametres a maitriser (temperature, pression, tolerances, etc.)
- Qualification des operateurs (formations requises, habilitations)
- Maintenance des equipements critiques (planning, enregistrements)

### 4. Controles et essais

**4.1 Plan de controle**
Le plan de controle est le coeur operationnel du plan qualite. Il definit pour chaque etape critique :

| Etape | Caracteristique a controler | Methode de controle | Frequence | Critere d'acceptation | Enregistrement | Responsable |
|-------|---------------------------|---------------------|-----------|----------------------|----------------|-------------|
| Reception matieres | Conformite au bon de commande | Visuel + dimensionnel | Chaque reception | Conforme au CDC | Fiche reception | Magasinier |
| Fabrication | Dimensions critiques | Mesure pied a coulisse | 1ere piece + toutes les 50 | Tolerance +/- 0,1 mm | Fiche controle | Operateur |
| Final | Aspect + fonctionnement | Visuel + test fonctionnel | 100% des pieces | Zero defaut visible, test OK | PV de controle | Resp. qualite |

**4.2 Equipements de controle et mesure**
- Liste des instruments de mesure utilises
- Programme d'etalonnage (frequence, prestataire)
- Procedure en cas d'instrument hors tolerance
- Traitement des mesures realisees avec un instrument decale

**Conseil PME :** Un etalonnage annuel des instruments critiques par un prestataire accredite COFRAC coute 50-150 euros par instrument. C'est un investissement faible par rapport au risque de livrer des produits hors tolerance.

### 5. Maitrise des non-conformites

**5.1 Detection et enregistrement**
- Tout operateur peut et doit signaler une non-conformite
- Utiliser une fiche de non-conformite simple : date, description, localisation du produit, gravite
- Isoler immediatement le produit non conforme (zone de quarantaine identifiee)

**5.2 Traitement**
Decision sur le produit non conforme :
- Rebut (eliminer)
- Retouche (reparer et re-controler)
- Acceptation en l'etat (derogation client necessaire)
- Reclassement (utilisation pour un autre usage)

**5.3 Analyse des causes et actions correctives**
Pour les non-conformites repetitives ou graves :
1. Analyse des causes (5 Pourquoi, Ishikawa)
2. Definition d'actions correctives
3. Mise en oeuvre et suivi
4. Verification de l'efficacite

**5.4 Indicateurs de suivi**
- Nombre de non-conformites par mois et par type
- Cout de non-qualite (rebuts + retouches + SAV)
- Taux de reclamation client
- Delai moyen de traitement des non-conformites

### 6. Tracabilite

**6.1 Identification des produits**
- Systeme d'identification unique (numero de lot, numero de serie, code-barres)
- Marquage physique sur les produits ou les emballages
- Lien entre le produit fini et ses composants/matieres (tracabilite amont)

**6.2 Enregistrements qualite**
Liste des enregistrements a conserver :
- Fiches de controle a reception
- Fiches de controle en production
- Proces-verbaux de controle final
- Fiches de non-conformite
- Rapports d'etalonnage
- Attestations de formation
- Comptes-rendus de reunion qualite

**Duree de conservation :** En general 5 ans minimum (verifier les exigences reglementaires de votre secteur). 10 ans pour les secteurs a responsabilite decennale (BTP).

### 7. Amelioration continue

**7.1 Revue qualite periodique**
Organiser une revue qualite trimestrielle (pour une PME) :
- Analyse des indicateurs qualite
- Bilan des non-conformites et actions correctives
- Retour d'experience des chantiers / projets
- Satisfaction client (analyse des enquetes, reclamations)
- Identification d'axes d'amelioration

**7.2 Actions d'amelioration**
- Alimenter un plan d'action avec les ameliorations identifiees
- Suivre la mise en oeuvre et mesurer l'efficacite
- Capitaliser les bonnes pratiques

**7.3 Formation**
- Identifier les besoins en formation qualite
- Planifier les formations (autocontrole, metrologie, procedures)
- Enregistrer les formations realisees
- Evaluer l'efficacite des formations

## Mise en oeuvre pour une PME sans certification ISO

**Etape 1 (semaine 1-2) :** Rediger le plan qualite en s'appuyant sur ce template. Adapter aux specificites de votre activite.

**Etape 2 (semaine 3-4) :** Creer les documents operationnels : fiches de controle, fiches de non-conformite, checklist de verification.

**Etape 3 (semaine 5-6) :** Former les equipes aux nouvelles pratiques. L'autocontrole par l'operateur est la cle.

**Etape 4 (mois 2-3) :** Mettre en oeuvre, enregistrer, mesurer. Ajuster les procedures si necessaire.

**Etape 5 (mois 3+) :** Faire vivre le plan qualite via les revues periodiques et l'amelioration continue.

## Benefices mesurables pour une PME

- Reduction du taux de rebut de 30 a 50% des la premiere annee
- Reduction des reclamations clients de 40 a 60%
- Amelioration du taux de service (livraison conforme) de 5 a 15 points
- Gain de credibilite dans les appels d'offres (le plan qualite est souvent un critere de notation)
- Preparation a une future certification ISO 9001 si souhaitee
`;

// ============================================================================
// SEED DATA STRUCTURE
// ============================================================================

interface SeedDocument {
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  tags: string[];
}

interface SeedBase {
  name: string;
  type: 'METHODOLOGY' | 'TEMPLATE' | 'GUIDE' | 'FORMATION' | 'CASE_STUDY' | 'BENCHMARK';
  description: string;
  documents: SeedDocument[];
}

const SEED_DATA: SeedBase[] = [
  {
    name: 'Lean Management',
    type: 'METHODOLOGY',
    description:
      'Fondamentaux du Lean Management adaptes aux TPE/PME : elimination des gaspillages, amelioration continue, organisation du poste de travail.',
    documents: [
      {
        title: 'Les 8 Gaspillages du Lean (TIMWOODS)',
        content: LEAN_8_WASTES,
        category: 'lean',
        subcategory: 'gaspillages',
        tags: ['lean', 'muda', 'timwoods', 'gaspillage', 'valeur-ajoutee', '8-wastes'],
      },
      {
        title: 'La Methode 5S',
        content: LEAN_5S,
        category: 'lean',
        subcategory: 'organisation',
        tags: ['5s', 'lean', 'organisation', 'poste-de-travail', 'rangement', 'standardisation'],
      },
      {
        title: 'Kaizen - Amelioration Continue',
        content: LEAN_KAIZEN,
        category: 'lean',
        subcategory: 'amelioration-continue',
        tags: ['kaizen', 'lean', 'amelioration-continue', 'suggestions', 'quick-win', 'blitz'],
      },
      {
        title: 'PDCA - Le Cycle de Deming',
        content: LEAN_PDCA,
        category: 'lean',
        subcategory: 'amelioration-continue',
        tags: ['pdca', 'deming', 'plan-do-check-act', 'amelioration-continue', 'roue-de-deming'],
      },
      {
        title: 'Gemba Walk - Aller sur le Terrain',
        content: LEAN_GEMBA,
        category: 'lean',
        subcategory: 'management',
        tags: ['gemba', 'terrain', 'observation', 'management-visuel', 'lean-management'],
      },
    ],
  },
  {
    name: 'Lean Six Sigma',
    type: 'METHODOLOGY',
    description:
      'Methodologies Lean Six Sigma pour les projets d\'amelioration structures : DMAIC, SIPOC, CTQ et outils statistiques adaptes aux PME.',
    documents: [
      {
        title: 'DMAIC - Methode Structuree du Lean Six Sigma',
        content: LSS_DMAIC,
        category: 'six-sigma',
        subcategory: 'dmaic',
        tags: ['dmaic', 'six-sigma', 'lean-six-sigma', 'define', 'measure', 'analyze', 'improve', 'control'],
      },
      {
        title: 'SIPOC - Cartographie de Processus',
        content: LSS_SIPOC,
        category: 'six-sigma',
        subcategory: 'outils',
        tags: ['sipoc', 'processus', 'cartographie', 'fournisseurs', 'clients', 'flux'],
      },
      {
        title: 'CTQ - Critical To Quality',
        content: LSS_CTQ,
        category: 'six-sigma',
        subcategory: 'outils',
        tags: ['ctq', 'voix-du-client', 'qualite', 'specifications', 'kpi', 'satisfaction'],
      },
    ],
  },
  {
    name: "Outils d'analyse",
    type: 'METHODOLOGY',
    description:
      'Outils d\'analyse et de resolution de problemes : VSM, Ishikawa, 5 Pourquoi, Pareto, A3 Thinking. Guides pratiques pour les TPE/PME.',
    documents: [
      {
        title: 'VSM - Value Stream Mapping',
        content: OUTILS_VSM,
        category: 'outils',
        subcategory: 'cartographie',
        tags: ['vsm', 'value-stream-mapping', 'flux', 'lead-time', 'cartographie', 'lean'],
      },
      {
        title: 'Diagramme d\'Ishikawa (Fishbone)',
        content: OUTILS_ISHIKAWA,
        category: 'outils',
        subcategory: 'analyse-causale',
        tags: ['ishikawa', 'fishbone', 'causes-effets', '6m', 'brainstorming', 'resolution-problemes'],
      },
      {
        title: 'Les 5 Pourquoi',
        content: OUTILS_5POURQUOI,
        category: 'outils',
        subcategory: 'analyse-causale',
        tags: ['5-pourquoi', '5-whys', 'cause-racine', 'analyse-causale', 'toyota'],
      },
      {
        title: 'Analyse de Pareto (80/20)',
        content: OUTILS_PARETO,
        category: 'outils',
        subcategory: 'priorisation',
        tags: ['pareto', '80-20', 'priorisation', 'diagramme', 'analyse', 'frequence'],
      },
      {
        title: 'A3 Thinking - Methode Toyota',
        content: OUTILS_A3,
        category: 'outils',
        subcategory: 'resolution-problemes',
        tags: ['a3', 'toyota', 'resolution-problemes', 'rapport', 'pdca', 'contre-mesures'],
      },
    ],
  },
  {
    name: "Strategie d'entreprise",
    type: 'METHODOLOGY',
    description:
      'Outils d\'analyse strategique pour les dirigeants de TPE/PME : SWOT/TOWS, STEEPLE/PESTEL, 5 Forces de Porter, Matrice BCG, Hoshin Kanri.',
    documents: [
      {
        title: 'SWOT / TOWS - Analyse et Strategie',
        content: STRATEGIE_SWOT,
        category: 'strategie',
        subcategory: 'diagnostic',
        tags: ['swot', 'tows', 'forces', 'faiblesses', 'opportunites', 'menaces', 'strategie'],
      },
      {
        title: 'STEEPLE / PESTEL - Analyse Macro-Environnement',
        content: STRATEGIE_STEEPLE,
        category: 'strategie',
        subcategory: 'macro-environnement',
        tags: ['steeple', 'pestel', 'macro-environnement', 'politique', 'economique', 'social', 'technologique'],
      },
      {
        title: '5 Forces de Porter - Analyse Concurrentielle',
        content: STRATEGIE_PORTER,
        category: 'strategie',
        subcategory: 'concurrence',
        tags: ['porter', '5-forces', 'concurrence', 'fournisseurs', 'clients', 'substituts', 'entrants'],
      },
      {
        title: 'Matrice BCG - Portefeuille de Produits',
        content: STRATEGIE_BCG,
        category: 'strategie',
        subcategory: 'portefeuille',
        tags: ['bcg', 'matrice', 'portefeuille', 'etoiles', 'vaches-a-lait', 'dilemmes', 'poids-morts'],
      },
      {
        title: 'Hoshin Kanri - Deploiement Strategique',
        content: STRATEGIE_HOSHIN,
        category: 'strategie',
        subcategory: 'deploiement',
        tags: ['hoshin', 'kanri', 'deploiement-strategique', 'catchball', 'matrice-en-x', 'vision'],
      },
    ],
  },
  {
    name: 'Benchmarks sectoriels',
    type: 'BENCHMARK',
    description:
      'Donnees de benchmark par secteur pour les TPE/PME : ratios financiers, KPIs operationnels, taux de gaspillage typiques.',
    documents: [
      {
        title: 'Ratios Financiers par Secteur',
        content: BENCHMARK_RATIOS,
        category: 'benchmark',
        subcategory: 'financier',
        tags: ['ratios', 'financier', 'marge', 'rentabilite', 'tresorerie', 'bfr', 'benchmark'],
      },
      {
        title: 'KPIs Operationnels par Secteur',
        content: BENCHMARK_KPI,
        category: 'benchmark',
        subcategory: 'operationnel',
        tags: ['kpi', 'operationnel', 'trs', 'satisfaction', 'qualite', 'productivite', 'benchmark'],
      },
      {
        title: 'Taux de Gaspillage Typiques par Secteur',
        content: BENCHMARK_GASPILLAGE,
        category: 'benchmark',
        subcategory: 'gaspillage',
        tags: ['gaspillage', 'muda', 'benchmark', 'potentiel', 'gains', 'lean', 'secteur'],
      },
    ],
  },
  {
    name: 'Templates',
    type: 'TEMPLATE',
    description:
      'Modeles de documents operationnels pour les TPE/PME : plan d\'action, memoire technique, plan qualite.',
    documents: [
      {
        title: 'Template Plan d\'Action',
        content: TEMPLATE_PLAN_ACTION,
        category: 'template',
        subcategory: 'gestion-projet',
        tags: ['template', 'plan-action', 'suivi', 'qqoqccp', 'priorite', 'pilotage'],
      },
      {
        title: 'Template Memoire Technique',
        content: TEMPLATE_MEMOIRE,
        category: 'template',
        subcategory: 'appel-offres',
        tags: ['template', 'memoire-technique', 'appel-offres', 'marche-public', 'proposition'],
      },
      {
        title: 'Template Plan Qualite',
        content: TEMPLATE_QUALITE,
        category: 'template',
        subcategory: 'qualite',
        tags: ['template', 'plan-qualite', 'paq', 'controle', 'non-conformite', 'tracabilite'],
      },
    ],
  },
];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Seeding knowledge base...\n');

  for (const base of SEED_DATA) {
    const kb = await prisma.knowledgeBase.create({
      data: {
        name: base.name,
        type: base.type,
        description: base.description,
        isPublic: true,
      },
    });

    for (const doc of base.documents) {
      await prisma.knowledgeDocument.create({
        data: {
          knowledgeBaseId: kb.id,
          title: doc.title,
          sourceType: 'MANUAL',
          language: 'fr',
          category: doc.category,
          subcategory: doc.subcategory,
          tags: doc.tags,
          rawText: doc.content,
          status: 'PENDING',
        },
      });
    }

    console.log(
      `  ✅ Created base "${base.name}" with ${base.documents.length} documents`
    );
  }

  const totalDocs = SEED_DATA.reduce((acc, b) => acc + b.documents.length, 0);
  console.log(
    `\n🎉 Done! Created ${SEED_DATA.length} knowledge bases with ${totalDocs} documents total.`
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
