#!/bin/bash

# TODO :
#-------
# - cleanup ministeres QE old legis
# - fix renouveau field on old legis
# - add dossier on interventions/amdmts ?


cd $(dirname $0)/..
source bin/config.sh
mkdir -p data

LEGI=$1
if [ -z "$1" ]; then
  LEGI=15
fi

if [ $LEGI -eq 13 ]; then
  AMDTSJOIN="JOIN parlementaire_amendement pa ON (pa.amendement_id = a.id AND pa.numero_signataire = 1)
JOIN parlementaire p ON p.id = pa.parlementaire_id
WHERE a.numero RLIKE '^[0-9]'
AND"
else
  AMDTSJOIN="JOIN parlementaire p ON p.id = auteur_id
WHERE"
fi

if [ $LEGI -ne 15 ]; then
  CLEAN_MINISTERES="'', \"'\"),"
  ENCODE="iso-8859-15"
else
  CLEAN_MINISTERES="'’', \"'\"),"
  ENCODE="utf-8"
fi

function query {
  echo $1_$LEGI.tsv
  echo "$2" | iconv -t "$ENCODE" | mysql $MYSQLID $DBNAME | iconv -f "$ENCODE" -t "utf-8" > $1_$LEGI.tsv
}

query data/parole "
SELECT
  i.date,
  i.parlementaire_groupe_acronyme AS groupes,
  p.sexe AS genre,
  IF(p.url_ancien_cpc IS NULL, 'nouveaux', 'anciens') AS renouveau,
  IF(i.type = 'commission', 'commissions', 'hemicycle') AS debats,
  IF(i.fonction IN ('président', 'présidente'), 'presidence', IF(i.nb_mots > 20, 'longues', 'invectives')) AS interventions,
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
  IF(a.numero RLIKE '^[0-9]', 'hemicycle', 'commissions') AS origine,
  SUM(a.nb_multiples) AS total
FROM amendement a
$AMDTSJOIN a.sort <> 'Rectifié'
GROUP BY a.date, groupes, genre, renouveau, sorts, origine
ORDER BY a.date, groupes, genre, renouveau, sorts, origine"

query data/questions "
SELECT
  q.date,
  q.parlementaire_groupe_acronyme AS groupes,
  p.sexe AS genre,
  IF(p.url_ancien_cpc IS NULL, 'nouveaux', 'anciens') AS renouveau,
  IF(q.motif_retrait IS NOT NULL, 'retrait', IF(q.reponse = '', 'attente', 'reponse')) AS statut,
  @mois:=FLOOR(DATEDIFF(IF(q.date_cloture, q.date_cloture, CURDATE()), q.date) / 365 * 12) as mois,
  IF(@mois < 3, @mois + 1, IF(@mois < 6, '3-6', IF(@mois < 12, '6-12', '12+'))) as duree,
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    SUBSTRING(q.ministere, 1, POSITION('/' IN q.ministere) - 2),
    $CLEAN_MINISTERES
    'auprès de la ', 'auprès du '),
    \"Secrétariat d'État, auprès du \", ''),
    'Ministère auprès du ', ''),
    \"ministre d'État, \", ''),
    'chargé d', 'd'),
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
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    CONCAT(t.type, IF(t.type_details IS NOT NULL AND t.type_details NOT LIKE 'de la %', CONCAT(' ', t.type_details), '')),
    'Proposition de ', ''),
    'résolution tendant à la ', ''),
    'résolution modifiant le R', 'r'),
    ' en application de Article 34-1 de la Constitution', ''),
    ' demandant la suspension de poursuites, de détention ou de mesures privatives ou restrictives de liberté', ''),
    ' portant mise en accusation du Président de la République devant la Haute Cour de justice', ''),
    'sur les travaux conduits par les institutions européennes', 'européenne'),
    'portant sur des propositions d\'actes communautaires', 'européenne'
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

