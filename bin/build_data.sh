#!/bin/bash

cd $(dirname $0)/..
source bin/config.sh

function query {
  echo "$2" | mysql $MYSQLID $DBNAME | sed 's/\t/,/g' > $1.csv
}

mkdir -p data

query data/total_groupes "
SELECT date, parlementaire_groupe_acronyme as groupes, sum(nb_mots) as total
FROM intervention
WHERE parlementaire_groupe_acronyme IS NOT NULL
GROUP BY date, parlementaire_groupe_acronyme"

query data/commissions_groupes "
SELECT date, parlementaire_groupe_acronyme as groupes, sum(nb_mots) as total
FROM intervention
WHERE parlementaire_groupe_acronyme IS NOT NULL
AND type = \"commission\"
GROUP BY date, parlementaire_groupe_acronyme"

query data/hemicycle_groupes "
SELECT date, parlementaire_groupe_acronyme as groupes, sum(nb_mots) as total
FROM intervention
WHERE parlementaire_groupe_acronyme IS NOT NULL
AND type <> \"commission\"
GROUP BY date, parlementaire_groupe_acronyme"

query data/total_genre "
SELECT i.date, IF(p.sexe = \"H\", \"Hommes\", \"Femmes\") as genre, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
GROUP BY i.date, p.sexe"

query data/commissions_genre "
SELECT i.date, IF(p.sexe = \"H\", \"Hommes\", \"Femmes\") as genre, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
WHERE i.type = \"commission\"
GROUP BY i.date, p.sexe"

query data/hemicycle_genre "
SELECT i.date, IF(p.sexe = \"H\", \"Hommes\", \"Femmes\") as genre, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
WHERE i.type <> \"commission\"
GROUP BY i.date, p.sexe"

query data/total_renouveau "
SELECT i.date, IF(url_ancien_cpc IS NULL, \"Nouveaux députés\", \"Députés réélus\") as renouveau, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
GROUP BY i.date, renouveau"

query data/commissions_renouveau "
SELECT i.date, IF(url_ancien_cpc IS NULL, \"Nouveaux députés\", \"Députés réélus\") as renouveau, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
WHERE i.type = \"commission\"
GROUP BY i.date, renouveau"

query data/hemicycle_renouveau "
SELECT i.date, IF(url_ancien_cpc IS NULL, \"Nouveaux députés\", \"Députés réélus\") as renouveau, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
WHERE i.type <> \"commission\"
GROUP BY i.date, renouveau"

bin/assemble_data.py > data/parole-deputes.csv
