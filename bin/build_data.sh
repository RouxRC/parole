#!/bin/bash

cd $(dirname $0)/..
source bin/config.sh

function query {
  echo "$2" | mysql $MYSQLID $DBNAME | sed 's/\t/,/g' > $1.csv
}

mkdir -p data

query data/parole "
SELECT
  i.date,
  i.parlementaire_groupe_acronyme as groupes,
  p.sexe as genre,
  IF(p.url_ancien_cpc IS NULL, \"nouveaux\", \"anciens\") as renouveau,
  IF(i.type = \"commission\", \"commissions\", \"hemicycle\") as debats,
  IF(i.nb_mots > 20, \"longues\", \"invectives\") as interventions,
  sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
GROUP BY i.date, groupes, genre, renouveau, debats, interventions"

query data/amendements "
SELECT
  a.date,
  a.auteur_groupe_acronyme as groupes,
  p.sexe as genre,
  IF(p.url_ancien_cpc IS NULL, \"nouveaux\", \"anciens\") as renouveau,
  REPLACE(a.sort, \" avant séance\", \"\") as sorts,
  sum(a.nb_multiples) as total
FROM amendement a
JOIN parlementaire p ON p.id = a.auteur_id
WHERE a.sort <> \"Rectifié\"
GROUP BY a.date, groupes, genre, renouveau, sorts"

# ADD dossier when filter autofilled
