#!/usr/bin/env python

import os, csv
from datetime import datetime, timedelta

data = {}
output = []
keys = []

for debats in ["total", "commissions", "hemicycle"]:
    for typ in ["groupes", "sexe", "oldnew"]:
        fil = "%s_%s" % (debats, typ)
        with open(os.path.join("data", "%s.csv" % fil)) as f:
            for row in csv.DictReader(f):
                if row["date"] not in data:
                    data[row["date"]] = {"date": row["date"]}
                field = "%s_%s" % (fil, row[typ])
                if field not in keys:
                    keys.append(field)
                data[row["date"]][field] = row["total"]

dates = sorted(data.keys())
dat = dates[0]
output.append(data[dat])
while dat != dates[-1]:
    dat = (datetime.strptime(dat, "%Y-%m-%d").date() + timedelta(days=1)).isoformat()
    if dat in data:
        output.append(data[dat])
    else:
        output.append({"date": dat})

keys = ["date"] + keys
print ",".join(keys)
for row in output:
    print ",".join([row.get(k, "0") for k in keys])

