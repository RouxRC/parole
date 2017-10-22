#!/bin/bash

cd $(dirname $0)/..
source bin/config.sh

LEGI=15
if [ ! -z "$1" ]; then
  LEGI=$1
fi

function query {
  echo "$2" | mysql $MYSQLID $DBNAME > $1_$LEGI.tsv
}

mkdir -p data

# ADD dossier on interventions/amdmts ?

query data/parole "
SELECT
  i.date,
  i.parlementaire_groupe_acronyme AS groupes,
  p.sexe AS genre,
  IF(p.url_ancien_cpc IS NULL, 'nouveaux', 'anciens') AS renouveau,
  IF(i.type = 'commission', 'commissions', 'hemicycle') AS debats,
  IF(i.nb_mots > 20, 'longues', 'invectives') AS interventions,
  SUM(i.nb_mots) AS total
FROM intervention i
JOIN parlementaire p ON p.id = i.parlementaire_id
GROUP BY i.date, groupes, genre, renouveau, debats, interventions
ORDER BY i.date, groupes, genre, renouveau, debats, interventions"

query data/amendements "
SELECT
  a.date,
  a.auteur_groupe_acronyme AS groupes,
  p.sexe AS genre,
  IF(p.url_ancien_cpc IS NULL, 'nouveaux', 'anciens') AS renouveau,
  REPLACE(a.sort, ' avant séance', '') AS sorts,
  SUM(a.nb_multiples) AS total
FROM amendement a
JOIN parlementaire p ON p.id = a.auteur_id
WHERE a.sort <> 'Rectifié'
GROUP BY a.date, groupes, genre, renouveau, sorts
ORDER BY a.date, groupes, genre, renouveau, sorts"

query data/questions "
SELECT
  q.date,
  q.parlementaire_groupe_acronyme AS groupes,
  p.sexe AS genre,
  IF(p.url_ancien_cpc IS NULL, 'nouveaux', 'anciens') AS renouveau,
  IF(q.motif_retrait IS NOT NULL, 'retrait', IF(q.reponse = '', 'attente', 'reponse')) AS statut,
  @mois:=FLOOR(DATEDIFF(IF(q.date_cloture, q.date_cloture, CURDATE()), q.date) / 365 * 12) as mois,
  IF(@mois < 3, @mois + 1, IF(@mois < 6, '3-6', IF(@mois < 12, '6-12', '12+'))) as duree,
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    SUBSTRING(q.ministere, 1, POSITION('/' IN q.ministere) - 2),
    '’', \"'\"),
    'auprès de la ', 'auprès du '),
    \"Secrétariat d'État, auprès du \", ''),
    'Ministère auprès du ', ''),
    \"ministre d'État, \", ''),
    'ministre ', 'Ministère '
  ) AS ministre,
  COUNT(q.id) AS total
FROM question_ecrite q
JOIN parlementaire p ON p.id = q.parlementaire_id
GROUP BY q.date, groupes, genre, renouveau, statut, duree, ministre
ORDER BY q.date, groupes, genre, renouveau, statut, duree, ministre"

query data/propositions "
SELECT
  t.date,
  p.groupe_acronyme AS groupes,
  p.sexe AS genre,
  IF(p.url_ancien_cpc IS NULL, 'nouveaux', 'anciens') AS renouveau,
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    CONCAT(t.type, IF(t.type_details IS NOT NULL, CONCAT(' ', t.type_details), '')),
    'Proposition de ', ''),
    'résolution tendant à la ', ''),
    'résolution modifiant le R', 'r'),
    ' en application de Article 34-1 de la Constitution', ''),
    'sur les travaux conduits par les institutions européennes', 'européenne'
  ) AS typeprop,
  IF(s.id IS NULL, 'attente', 'discute') AS discute,
  COUNT(DISTINCT(t.id)) AS total
FROM texteloi t
JOIN parlementaire_texteloi pt ON pt.texteloi_id = t.id
JOIN parlementaire p ON p.id = pt.parlementaire_id
LEFT JOIN section s ON s.id_dossier_an = t.id_dossier_an
WHERE t.type IN ('Proposition de loi', 'Proposition de résolution')
AND pt.importance = 1
GROUP BY t.date, groupes, genre, renouveau, typeprop, discute
ORDER BY t.date, groupes, genre, renouveau, typeprop, discute"

