/* TODO
- add zoom
- add comparator with actual MP proportions when prop view
- add data on deputes (and disable view options with forced days + no cumul/prop)
- add gouv to some data ?
- remove/disable unavailable filters ?
- option crossings heatmap on 2 facets http://bl.ocks.org/ianyfchang/8119685
- data table view ?
- option streamgraph https://github.com/densitydesign/raw/blob/master/charts/streamgraph.js https://bl.ocks.org/mbostock/4060954
- option bubblechart add view facet for color https://github.com/densitydesign/raw/blob/master/charts/scatterPlot.js
- vue split => display ombre globale en fond
- cloak app
- better display value, on click ?
- add dynamic keys ?
- add filter cumul ?
- add filter expérience politique via autres_mandats ? http://www.bfmtv.com/politique/infographie-le-profil-des-577-deputes-elus-passes-au-crible-1189731.html
- link (integrate?) trombi
*/
d3.formatDefaultLocale({
  "decimal": ",",
  "thousands": " ",
  "grouping": [3],
  "currency": ["€", ""],
});
d3.timeFormatDefaultLocale({
  "dateTime": "%A, le %e %B %Y, %X",
  "date": "%d/%m/%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  "shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  "months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  "shortMonths": ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."]
});
d3.defaultColors = [
  "#F48FB1", "#B39DDB", "#90CAF9", "#80DEEA", "#A5D6A7", "#E6EE9C", "#FFE082",
  "#FFAB91", "#ef9a9a", "#CE93D8", "#9FA8DA", "#81D4FA", "#80CBC4", "#C5E1A5",
  "#FFF59D", "#FFCC80", "#BCAAA4", "#E0E0E0", "#B0BEC5", "#64FFDA", "#40C4FF",
  "#8C9EFF", "#EA80FC", "#ff8a80", "#FFE57F"
];

d3.iso_jours = function(d) { return d3.timeFormat("%Y-%m-%d")(d); };
d3.iso_sems = function(d) {
  var dt = new Date(d - 86400000 * (d.getDay()-1));
  return d3.iso_jours(dt);
};
d3.iso_mois = function(d) {
  var dt = new Date(d);
  dt.setDate(1);
  return d3.iso_jours(dt);
};
d3.nextDate = function(d, dur) {
  var dt = new Date(d);
  if (dur === "mois") {
    dt.setMonth(dt.getMonth() + 1);
    dt.setDate(1);
  } else if (dur === "sems") {
    dt = new Date(d - 86400000 * (d.getDay()-1));
    dt.setDate(dt.getDate() + 7);
  } else dt.setDate(dt.getDate() + 1);
  return dt;
}

new Vue({
  el: "#parole",
  data: {
    legislature: "15",
    legislatures: [{
      id: "13",
      name: "2007 — 2012 (13e)"
    }, {
      id: "14",
      name: "2012 — 2017 (14e)"
    }, {
      id: "15",
      name: "2017 — 2022 (15e)"
    }],
    activite: "parole",
    activites: [{
      id: "parole",
      name: "Temps de parole",
      titre: "mots prononcés",
      icon: "mic",
      unit: "mots"
    }, {
      id: "amendements",
      name: "Amendements",
      titre: "amendements proposés",
      icon: "spellcheck",
      unit: "amdts"
    }, {
      id: "propositions",
      name: "Propositions de lois",
      titre: "propositions déposées",
      icon: "playlist_add",
      unit: "props"
    }, {
      id: "questions",
      name: "Questions écrites",
      titre: "questions écrites posées",
      icon: "help_outline",
      unit: "quests"
    }],
    facet: "groupes",
    facets: [{
      id: "groupes",
      name: "Groupes politiques",
      filterName: "Groupe politique",
      filterAll: "Tous les députés",
      icon: "people",
      selected: "total",
      legende: [
        {color: "#e53935", id: "LFI", name: "LFI", legi: ["15"]},
        {color: "#ff5252", id: "GDR", name: "GDR", legi: ["13", "14", "15"]},
        {color: "#69F0AE", id: "ECOLO", name: "ECOLO", legi: ["14"]},
        {color: "#F06292", id: "SRC", name: "SRC", legi: ["13", "14"]},
        {color: "#F06292", id: "SER", name: "SER", legi: ["14"]},
        {color: "#F06292", id: "NG", name: "NG", legi: ["15"]},
        {color: "#FFA726", id: "LREM", name: "LREM", legi: ["15"]},
        {color: "#FF7043", id: "MODEM", name: "MODEM", legi: ["15"]},
        {color: "#42A5F5", id: "NC", name: "NC", legi: ["13"]},
        {color: "#42A5F5", id: "UDI", name: "UDI", legi: ["14"]},
        {color: "#42A5F5", id: "LC", name: "LC", legi: ["15"]},
        {color: "#42A5F5", id: "UAI", name: "UAI", legi: ["15"]},
        {color: "#5C6BC0", id: "UMP", name: "UMP", legi: ["13", "14"]},
        {color: "#5C6BC0", id: "RUMP", name: "RUMP", legi: ["14"]},
        {color: "#5C6BC0", id: "LR", name: "LR", legi: ["14", "15"]},
        {color: "#BDBDBD", id: "NI", name: "NI", legi: ["13", "14", "15"]}
      ]
    }, {
      id: "genre",
      name: "Genres",
      filterName: "Genre",
      filterAll: "Tous les députés",
      icon: "wc",
      selected: false,
      legende: [
        {color: "#F48FB1", id: "F", name: "Femmes"},
        {color: "#90CAF9", id: "H", name: "Hommes"}
      ]
    }, {
      id: "renouveau",
      name: "Anciens & nouveaux élus",
      filterName: "Ancienneté",
      filterAll: "Tous les députés",
      icon: "repeat",
      selected: "total",
      legende: [
        {color: "#BCAAA4", id: "anciens", name: "Députés réélus"},
        {color: "#A5D6A7", id: "nouveaux", name: "Premier mandat"}
      ]
    }, {
      id: "debats",
      name: "Commissions & Hémicycle",
      filterName: "Type de débats",
      filterAll: "Toutes les interventions",
      icon: "looks",
      selected: "total",
      only: "parole",
      legende: [
        {color: "#CE93D8", id: "commissions", name: "en Commissions", facetName: "Commissions"},
        {color: "#80D8FF", id: "hemicycle", name: "en Hémicycle", facetName: "Hémicycle"}
      ]
    }, {
      id: "interventions",
      name: "Invectives & Interventions",
      filterName: "Type d'interventions",
      filterAll: "Toutes les interventions",
      icon: "speaker_notes",
      selected: "total",
      only: "parole",
      legende: [
        {color: "#E0E0E0", id: "presidence", name: "Présidence"},
        {color: "#FFE57F", id: "longues", name: "Interventions longues"},
        {color: "#FF9E80", id: "invectives", name: "Invectives ( - de 20 mots )", facetName: "Invectives"}
      ]
    }, {
      id: "origine",
      name: "Commissions & Hémicycle",
      filterName: "Type de dépôt",
      filterAll: "Tous les amendements",
      icon: "looks",
      selected: "total",
      only: "amendements",
      legende: [
        {color: "#CE93D8", id: "commissions", name: "en Commissions", facetName: "Commissions"},
        {color: "#80D8FF", id: "hemicycle", name: "en Hémicycle", facetName: "Hémicycle"}
      ]
    }, {
      id: "sorts",
      name: "Sorts des amendements",
      filterName: "Sort des amdts",
      filterAll: "Tous les amendements",
      icon: "check",
      selected: "total",
      only: "amendements",
      legende: [
        {color: "#69F0AE", id: "Adopté", name: "Adoptés"},
        {color: "#80D8FF", id: "Tombe", name: "Tombés"},
        {color: "#B2DFDB", id: "Retiré", name: "Retirés"},
        {color: "#FFE57F", id: "Non soutenu", name: "Non soutenus"},
        {color: "#FFAB40", id: "Irrecevable", name: "Irrecevables"},
        {color: "#ef9a9a", id: "Rejeté", name: "Rejetés"},
        {color: "#9E9E9E", id: "Indéfini", name: "Indéfinis"}
      ]
    }, {
      id: "typeprop",
      name: "Types de propositions",
      filterName: "Type de proposition",
      filterAll: "Toutes les propositions",
      icon: "format_list_bulleted",
      selected: "total",
      only: "propositions",
      legende: [
        {color: "#90A4AE", id: "loi constitutionnelle", name: "Lois constitutionnelles", facetName: "Lois Constit."},
        {color: "#FFE0B2", id: "loi organique", name: "Lois organiques (PPLO)", facetName: "Lois organiques"},
        {color: "#FFF176", id: "loi", name: "Lois (PPL)", facetName: "Lois"},
        {color: "#80CBC4", id: "résolution", name: "Résolutions (PPR)", facetName: "Résolutions"},
        {color: "#80D8FF", id: "résolution européenne", name: "Résolutions européennes", facetName: "Résolutions EU"},
        {color: "#B39DDB", id: "règlement de l'Assemblée nationale", name: "Règlement de l'AN"},
        {color: "#ff8a80", id: "création d'une commission d'enquête", name: "Commissions d'enquête"},
      ]
    }, {
      id: "discute",
      name: "Statuts des propositions",
      filterName: "État de discussion",
      filterAll: "Toutes les propositions",
      icon: "speaker_notes",
      selected: "total",
      only: "propositions",
      legende: [
        {color: "#69F0AE", id: "discute", name: "Discutées"},
        {color: "#FFE57F", id: "attente", name: "En attente"}
      ]
    }, {
      id: "ministre",
      name: "Ministères interrogés",
      filterName: "Ministère interrogé",
      filterAll: "Tous les ministères",
      icon: "flag",
      selected: "total",
      only: "questions",
      legende: [
        {id: "Premier ministre", name: "Premier ministre"},
        {id: "Ministère de l'intérieur", name: "Intérieur"},
        {id: "Ministère de la transition écologique et solidaire", name: "Transition écologique & solidaire"},
        {id: "Ministère de la justice", name: "Justice"},
        {id: "Ministère de l'Europe et des affaires étrangères", name: "Europe & Affaires étrangères"},
        {id: "Ministère des armées", name: "Armées"},
        {id: "Ministère de la cohésion des territoires", name: "Cohésion des territoires"},
        {id: "Ministère des solidarités et de la santé", name: "Solidarités & Santé"},
        {id: "Ministère de l'économie et des finances", name: "Économie & Finances"},
        {id: "Ministère de la culture", name: "Culture"},
        {id: "Ministère du travail", name: "Travail"},
        {id: "Ministère de l'éducation nationale", name: "Éducation nationale"},
        {id: "Ministère de l'agriculture et de l'alimentation", name: "Agriculture & Alimentation"},
        {id: "Ministère de l'action et des comptes publics", name: "Action & Comptes publics"},
        {id: "Ministère de l'enseignement supérieur, de la recherche et de l'innovation", name: "Enseignement supérieur"},
        {id: "Ministère des outre-mer", name: "Outre-mer"},
        {id: "Ministère des sports", name: "Sports"},
        {id: "Premier ministre, chargé de l'égalité entre les femmes et les hommes", name: "Égalité F / H"},
        {id: "Premier ministre, chargé des personnes handicapées", name: "Personnes Handicapées"},
        {id: "Premier ministre, chargé du numérique", name: "Numérique"},
        {id: "Ministère de la transition écologique et solidaire, chargé des transports", name: "Transports"},
        {id: "Ministère de l'Europe et des affaires étrangères, chargé des affaires européennes", name: "Affaires européennes"},
      ]
    }, {
      id: "duree",
      name: "Durée d'attente",
      filterName: "Durée d'attente",
      filterAll: "Toutes les questions",
      icon: "timer",
      selected: "total",
      only: "questions",
      legende: [
        {color: "#69F0AE", id: "1", name: "moins d'un mois", facetName: "- d'1 mois"},
        {color: "#80D8FF", id: "2", name: "entre 1 et 2 mois", facetName: "1 à 2 mois"},
        {color: "#B2DFDB", id: "3", name: "entre 2 et 3 mois", facetName: "2 à 3 mois"},
        {color: "#FFE57F", id: "3-6", name: "entre 3 et 6 mois", facetName: "3 à 6 mois"}
      ], extralegende: [
        {color: "#FFAB40", id: "6-12", name: "entre 6 mois et un an", facetName: "6 à 12 mois"},
        {color: "#ef9a9a", id: "12+", name: "plus d'un an", facetName: "+ d'1 an"}
      ]
    }, {
      id: "statut",
      name: "Statuts des questions",
      filterName: "Satisfaction",
      filterAll: "Toutes les questions",
      icon: "help",
      selected: "total",
      only: "questions",
      legende: [
        {color: "#69F0AE", id: "reponse", name: "Réponses obtenues", facetName: "Satisfaites"},
        {color: "#B2DFDB", id: "retrait", name: "Questions retirées", facetName: "Retirées"},
        {color: "#FFE57F", id: "attente", name: "En attente", facetName: "En attente"}
      ]
    }],
    compare: "",
    compares: [{
      id: "",
      icon: "sync_disabled",
      name: ""
    }],
    resizing: null,
    svgH: 0,
    data: {},
    curData: null,
    cumul: false,
    prop: false,
    temps: "sems",
    hoverDate: "",
    showValues: false,
    showCompare: false,
    help: false
  },
  computed: {
    dkey: function() { return this.activite + "_" + this.legislature; },
    titre: function() {
      var act = this.activite,
        curAct = this.activites.filter(function(a) { return a.id === act; })[0],
        facet = this.facet,
        curFacet = this.facets.filter(function(f) { return f.id === facet; })[0];
      return "Répartition entre " +
        curFacet.name.toLowerCase().replace(curAct.titre, "").replace(/ des? .*$/, "") +
        " des " + curAct.titre +
        " par les députés (" + this.legislature + "ème législature)";
    },
    unit: function() {
      var act = this.activite;
      return this.activites.filter(function(a) { return a.id === act; })[0].unit;
    },
    activiteIcon: function() {
      var act = this.activite;
      return this.activites.filter(function(a) { return a.id === act; })[0].icon;
    },
    comparables: function() {
      var compare = this.compare, legi = this.legislature;
      return this.compares.concat(this.facets).filter(function(f) { return f.id === compare; })[0].legende
        .filter(function(l) { return !l.legi || ~l.legi.indexOf(legi); });
    },
    compareIcon: function() {
      var compare = this.compare;
      return this.compares.concat(this.facets).filter(function(f) { return f.id === compare; })[0].icon;
    },
    availableCompare: function() {
      var act = this.activite;
      return this.compares.concat(this.facets.filter(function(f) { return !f.only || f.only === act ; }));
    },
    availableFacets: function() {
      var act = this.activite;
      return this.facets.filter(function(f) { return !f.only || f.only === act; });
    },
    facetIcon: function() {
      var facet = this.facet;
      return this.facets.filter(function(f) { return f.id === facet; })[0].icon;
    },
    legende: function() {
      var facet = this.facet, legi = this.legislature;
      return this.facets.filter(function(f) { return f.id === facet; })[0].legende
        .filter(function(l) { return !l.legi || ~l.legi.indexOf(legi); });
    },
    filtered: function() {
      var facet = this.facet;
      return this.facets.some(function(f) { return f.selected !== "total" && f.id !== facet; });
    },
    activeFilters: function() {
      var act = this.activite, facet = this.facet;
      return this.facets.filter(function(f) {
        return f.selected !== "total" && (!f.only || f.only === act) && f.id !== facet;
      });
    },
    _cumul: function() { return this.cumul ? "_cumul" : ""; },
    _prop: function() { return this.prop ? "_prop" : ""; }
  },
  mounted: function() {
    this.facets.forEach(function(f) {
      f.legende.forEach(function(l, i) {
        l.color = l.color || d3.defaultColors[i % d3.defaultColors.length];
      });
    });
    this.readUrl();
    this.updateFilterColors();
    window.addEventListener("hashchange", this.readUrl);
    window.addEventListener("resize", this.onResize);
    this.$watch(
      function() { return [this.dkey, this.facet, this.compare, this.cumul, this.prop, this.temps]; },
      this.updateUrl
    );
  },
  watch: {
    compare: function() { this.showCompare = false; }
  },
  methods: {
    onResize: function() {
      if (this.resizing) return clearTimeout(this.resizing);
      this.resizing = setTimeout(this.draw, 50);
    },
    selectFilter: function(optionId, filterId) {
      this.facets.filter(function(f) { return f.id === optionId; })
      .forEach(function(f) { f.selected = filterId; });
      this.updateFilterColors();
      this.updateUrl();
    },
    clearFilters: function() {
      this.facets.forEach(function(f) { f.selected = "total"; });
      this.updateFilterColors();
      this.updateUrl();
    },
    updateFilterColors: function() {
      this.facets.forEach(function(f) {
        f.color = null;
        f.legende.filter(function(l) { return l.id === f.selected; })
        .forEach(function(l) { f.color = l.color; });
      });
    },
    updateUrl: function() {
      window.location.hash = "activite=" + this.activite +
        "&leg=" + this.legislature +
        "&facet=" + this.facet +
        (this.compare ? "&compare=" + this.compare : "") +
        (this.activeFilters.length ? "&filters=" : "") +
        this.activeFilters.map(function(f) { return f.id + ":" + f.selected; }).join("|") +
        (this.cumul ? "&cumul" : "") +
        (this.prop ? "&prop" : "") +
        "&temps=" + this.temps;
    },
    readUrl: function() {
      var el, el2, options = {};
      window.location.hash.slice(1).split(/&/).forEach(function(opt) {
        el = decodeURIComponent(opt).split(/=/);
        if (el[0] === "filters") {
          options[el[0]] = {};
          el[1].split(/\|/).forEach(function(e) {
            el2 = e.split(/:/);
            options[el[0]][el2[0]] = el2[1];
          });
        } else options[el[0]] = el[1] || true;
      });
      this.legislature = options.leg || this.legislature;
      this.activite = options.activite || this.activite;
      this.facet = options.facet || this.facet;
      this.facets.forEach(function(f) { f.selected = (options.filters || {})[f.id] || "total"; });
      this.compare = options.compare || "";
      this.cumul = options.cumul;
      this.prop = options.prop;
      this.temps = options.temps || this.temps;
      if (!this.data[this.dkey]) {
        d3.tsv("data/" + this.dkey + ".tsv", function(d) {
          d.date = new Date(d.date);
          d.date.setHours(0);
          d.jours = d3.iso_jours(d.date);
          d.sems = d3.iso_sems(d.date);
          d.mois = d3.iso_mois(d.date);
          d.total = +d.total;
          return d;
        }, this.draw);
      } else this.$nextTick(this.draw);
    },
    draw: function(data, error) {
      // Handle ajax result
      if (error) throw error;
      if (data) this.data[this.dkey] = data;
      else data = this.data[this.dkey];
      if (!data) return console.log("No data!");

      // Clear unavailable facet choice
      var facet = this.facet, comp = this.compare, update = false,
        onlyF = this.facets.filter(function(f) { return f.id === facet; })[0].only,
        onlyC = (this.facets.filter(function(f) { return f.id === comp; })[0] || {}).only;
      if (onlyF && onlyF !== this.activite) {
        this.facet = this.facets[0].id;
        update = true;
      }
      if (onlyC && onlyC !== this.activite) {
        this.compare = "";
        update = true;
      }
      if (update) return this.updateUrl();

      // Prepare view settings
      var temps = this.temps
        keys = this.legende.map(function(k) { return k.id; }),
        compKeys = (comp ? this.comparables.map(function(k) { return "|" + k.id; }) : [""]);
      if (facet === "groupes") keys.reverse();

      // Agregate and filter data
      var hashdata = {},
        activeFilters = this.activeFilters;
      d3.nest()
      .key(function(d) { return d[temps]; })
      .key(function(d) { return d[facet] + (comp ? "|" + d[comp] : ""); })
      .rollup(function(lvs) { return d3.sum(lvs, function(d) {return d.total;}); })
      .entries(data.filter(function(d) {
        return activeFilters.every(function(f) { return d[f.id] === f.selected; });
      })).forEach(function(k) {
        hashdata[k.key] = {};
        k.values.forEach(function(v) {
          hashdata[k.key][v.key] = v.value;
        });
      });

      // Build all dates data with cumul & prop
      var last = {},
        curData = [],
        start = data[0].date,
        end = new Date(data[data.length - 1].date);
      end.setDate(end.getDate() + 1);
      d3.timeDay.range(start, end)
      .filter(function(d, idx) {
        return !idx || temps === "jours" ||
          (temps === "sems" && d.getDay() == 1) ||
          (temps === "mois" && d.getDate() == 1);
      }).map(function(d) {
        return {
          date: d,
          temps: d3["iso_"+temps](d)
        };
      }).forEach(function(d) {
        var o = {
          date: d.date,
          legend: (temps === "sems" ? "semaine du " : "") +
            d3.timeFormat((temps !== "mois" ? "%a %e " : "") + "%B %Y")(d.date),
          sum: 0,
          sum_cumul: 0,
          comp: {},
          comp_cumul: {}
        };
        keys.forEach(function(key) {
          compKeys.forEach(function(cKey) {
            var k = key + cKey;
            o[k] = (hashdata[d.temps] || {})[k] || 0;
            o.sum += o[k];
            o[k+"_cumul"] = o[k] + (last[k+"_cumul"] || 0);
            o.sum_cumul += o[k+"_cumul"];
            o.comp[cKey] = o[k] + (o.comp[cKey] || 0);
            o.comp_cumul[cKey] = o[k+"_cumul"] + (o.comp_cumul[cKey] || 0);
          });
        });
        keys.forEach(function(key) {
          compKeys.forEach(function(cKey) {
            var k = key + cKey,
              sum = (compKeys.length > 1 ? o.comp[cKey] : o.sum),
              tot = (compKeys.length > 1 ? o.comp_cumul[cKey] : o.sum_cumul);
            o[k+"_prop"] = (sum ? o[k] / sum : 0);
            o[k+"_cumul_prop"] = (tot ? o[k+"_cumul"] / tot : 0);
          });
        });
        curData.push(o);
        last = o;
      });
      this.curData = curData;
      var _cumul = this._cumul,
        yMax = d3.max(curData, function(d) { return (comp ? d3.max(Object.values(d["comp" + _cumul])) : d["sum" + _cumul]); });
      d3.select(".svg").selectAll("svg").remove();
      if (!comp)
        this.drawHistogram(keys, start, end, yMax, 0);
      else for (var i=0, n=this.comparables.length; i<n; i++)
        this.drawHistogram(keys, start, end, yMax, i);
      this.resizing = null;
      this.showCompare = true;
    },
    drawHistogram: function(keys, start, end, yMax, idx) {
      // Setup dimensions
      var _cumul = this._cumul,
        view = _cumul + this._prop,
        temps = this.temps,
        colors = {},
        comp = this.compare,
        comparable = (comp ? this.comparables[idx] : {}),
        margin = {top: (comp && idx ? 10 : 20), right: 90, bottom: 25, left: 60},
        svgW = window.innerWidth - document.querySelector("aside").getBoundingClientRect().width,
        width = svgW - margin.left - margin.right,
        mainH = window.innerHeight - document.querySelector("nav").getBoundingClientRect().height - document.getElementById("legende").getBoundingClientRect().height,
        svgH = Math.max(140, Math.floor((mainH) / (comp ? this.comparables.length : 1))),
        height = svgH - margin.top - margin.bottom,
        xScale = d3.scaleTime().range([0, width]).domain([start, end]),
        xPosition = function(d) { return xScale(d3.max([start, d.date || d.data.date])); },
        xWidth = function(d) { return xScale(d3.min([end, d3.nextDate(d.date || d.data.date, temps)])) - xPosition(d); },
        yScale = d3.scaleLinear().range([height, 0]);
      if (!this.prop) yScale.domain([0, yMax]);
      this.legende.forEach(function(k) { colors[k.id] = k.color; });
      this.svgH = svgH;

      // Prepare svg
      var g = d3.select(".svg")
      .style("height", mainH+"px")
      .append("svg")
        .attr("width", svgW)
        .attr("height", svgH)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Draw histogram
      g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(
          keys.map(function(k) { return k + (comp ? "|" + comparable.id : "") + view; })
        )(this.curData)).enter().append("g")
          .attr("fill", function(d) {
            return colors[d.key.replace(/_.*$/, "").replace(/\|.*$/, "")] || "grey";
          }).selectAll("rect")
          .data(function(d) { return d; })
          .enter().append("rect")
            .attr("x", xPosition)
            .attr("y", function(d) { return yScale(d[1]); })
            .attr("width", function(d) { return xWidth(d) - 0.5; })
            .attr("height", function(d) { return Math.max(0, yScale(d[0]) - yScale(d[1]) - 0.5); });

      // Draw axis
      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0, " + (height) + ")")
        .call(d3.axisBottom(xScale).ticks(Math.floor(width / 175), d3.timeFormat("%d %b %y")).tickSizeOuter(0));
      g.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", "translate(" + (width) + ", 0)")
        .call(d3.axisRight(yScale).ticks((comp ? 3 : 8), d3.format(this.prop ? "%" : ",d")).tickSizeOuter(0));

      // Draw tooltips surfaces
      g.append("g")
        .selectAll("rect.tooltip")
        .data(this.curData).enter().append("rect")
          .classed("tooltip", true)
          .attr("idx", idx)
          .attr("did", function(d, i) { return i; })
          .attr("x", xPosition)
          .attr("y", yScale.range()[1])
          .attr("width", xWidth)
          .attr("height", yScale.range()[0] - yScale.range()[1])
          .on("mouseover", function(d, i) { d3.selectAll('rect[did="' + i + '"]').style("fill-opacity", 0.25); })
          .on("mousemove", this.displayTooltip)
          .on("mouseleave", this.clearTooltip);

    },
    displayTooltip: function(d, i, rects) {
      this.hoverDate = d.legend;
      this.showValues = true;
      var extra = (this.compare ? "|" + this.comparables[d3.select(rects[i]).attr('idx')].id : "") + this._cumul + this._prop,
        fmt = d3.format(this.prop ? ".1%" : ",d");
      this.legende.forEach(function(l) { l.value = fmt(d[l.id + extra]); });
      d3.select(".tooltipBox")
      .style("left", d3.event.pageX - 60 + "px")
      .style("top", d3.event.pageY + 20 + "px")
      .style("display", "block");
    },
    clearTooltip: function(d, i) {
      this.showValues = false;
      d3.selectAll('rect[did="' + i + '"]').style("fill-opacity", 0);
      d3.select(".tooltipBox").style("display", "none");
    },
    exportData: function() {
      if (!this.curData) return;
      var filename = [
        d3.iso_jours(new Date()),
        this.activite + this.legislature,
        this.facet + (this.compare ? "-" + this.compare : ""),
        "par-" + this.temps
      ].join("_") + ".csv",
        compKeys = (this.compare ? this.comparables.map(function(d) { return d.id; }) : [""]),
        leg = this.legende,
        data = this.curData.map(function(d) {
          var cd = {
            date: d3.iso_jours(d.date),
            titre: d.legend,
            sum: d.sum,
            sum_cumul: d.sum_cumul
          };
          compKeys.forEach(function(c) {
            if (c) {
              cd["sum_" + c] = d.comp["|" + c];
              cd["sum_cumul_" + c] = d.comp_cumul["|" + c];
            }
            leg.forEach(function(l) {
              ["", "_prop", "_cumul", "_cumul_prop"].forEach(function(v) {
                cd[l.id + (c ? "-" + c : "") + v] = d[l.id + (c ? "|" + c : "") + v]
              });
            });
          });
          return cd;
        });
      saveAs(new Blob(d3.csvFormat(data).split('\r'), {type: "text/csv; charset=utf-8"}), filename);
    }
  }
});
