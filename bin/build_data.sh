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

query data/total_sexe "
SELECT i.date, IF(p.sexe = \"H\", \"Hommes\", \"Femmes\") as sexe, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
GROUP BY i.date, p.sexe"

query data/commissions_sexe "
SELECT i.date, IF(p.sexe = \"H\", \"Hommes\", \"Femmes\") as sexe, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
WHERE i.type = \"commission\"
GROUP BY i.date, p.sexe"

query data/hemicycle_sexe "
SELECT i.date, IF(p.sexe = \"H\", \"Hommes\", \"Femmes\") as sexe, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
WHERE i.type <> \"commission\"
GROUP BY i.date, p.sexe"

query data/total_oldnew "
SELECT i.date, IF(url_ancien_cpc IS NULL, \"Nouveaux députés\", \"Députés réélus\") as oldnew, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
GROUP BY i.date, oldnew"

query data/commissions_oldnew "
SELECT i.date, IF(url_ancien_cpc IS NULL, \"Nouveaux députés\", \"Députés réélus\") as oldnew, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
WHERE i.type = \"commission\"
GROUP BY i.date, oldnew"

query data/hemicycle_oldnew "
SELECT i.date, IF(url_ancien_cpc IS NULL, \"Nouveaux députés\", \"Députés réélus\") as oldnew, sum(i.nb_mots) as total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
WHERE i.type <> \"commission\"
GROUP BY i.date, oldnew"

bin/assemble_data.py > data/parole-deputes.csv
