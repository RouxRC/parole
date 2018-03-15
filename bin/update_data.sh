#!/bin/bash

cd $(dirname $0)/..
source bin/config.sh

git pull > /dev/null
bin/build_data.sh > /dev/null
if git diff data/*_$LEG.tsv | grep . > /dev/null; then
  git commit -m "autoupdate LEG$LEG" data/*_$LEG.tsv
  git push
fi

