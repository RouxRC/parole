/* TODO
- adjust color/icons/displaylongnames
- option splitted view https://github.com/densitydesign/raw/blob/master/charts/barChart.js  https://bl.ocks.org/mbostock/9490313
- option streamgraph https://github.com/densitydesign/raw/blob/master/charts/streamgraph.js https://bl.ocks.org/mbostock/4060954
- option bubblechart on 3 facets https://github.com/densitydesign/raw/blob/master/charts/scatterPlot.js
- option crossings heatmap on 2 facets http://bl.ocks.org/ianyfchang/8119685
- add dynamic keys ?
- add other legislatures data
- add comparator with actual proportions when prop view
- data updates
- add filter cumul ?
- add transition d3 when switching view ?
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
      disabled: true,
      name: "13ème (2007 - 2012)"
    }, {
      id: "14",
      disabled: true,
      name: "14ème (2012 - 2017)"
    }, {
      id: "15",
      name: "15ème (2017 - ...)"
    }],
    activite: "parole",
    activites: [{
      id: "parole",
      name: "Temps de parole",
      icon: "mic",
      unit: "mots"
    }, {
      id: "amendements",
      name: "Amendements",
      icon: "spellcheck",
      unit: "amdts"
    }, {
      id: "propositions",
      name: "Propositions de lois",
      icon: "playlist_add",
      unit: "props"
    }, {
      id: "questions",
      name: "Questions écrites",
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
        {color: "#e53935", id: "LFI", name: "LFI"},
        {color: "#ff5252", id: "GDR", name: "GDR"},
        {color: "#F06292", id: "NG", name: "NG"},
        {color: "#FFA726", id: "LREM", name: "LREM"},
        {color: "#FF7043", id: "MODEM", name: "MODEM"},
        {color: "#42A5F5", id: "LC", name: "LC"},
        {color: "#5C6BC0", id: "LR", name: "LR"},
        {color: "#BDBDBD", id: "NI", name: "NI"}
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
      name: "Anciens et nouveaux élus",
      filterName: "Ancienneté",
      filterAll: "Tous les députés",
      icon: "repeat",
      selected: "total",
      legende: [
        {color: "#B39DDB", id: "anciens", name: "Députés réélus"},
        {color: "#B2DFDB", id: "nouveaux", name: "Nouveaux députés"}
      ]
    }, {
      id: "debats",
      name: "Commissions & Hémicycle",
      filterName: "Débats",
      filterAll: "Tous les débats",
      icon: "looks",
      selected: "total",
      only: "parole",
      legende: [
        {color: "#B39DDB", id: "commissions", name: "en Commissions", facetName: "Commissions"},
        {color: "#B2DFDB", id: "hemicycle", name: "en Hémicycle", facetName: "Hémicycle"}
      ]
    }, {
      id: "interventions",
      name: "Invectives & Interventions",
      filterName: "Interventions",
      filterAll: "Toutes les interventions",
      icon: "speaker_notes",
      selected: "total",
      only: "parole",
      legende: [
        {color: "#B39DDB", id: "invectives", name: "Invectives ( - de 20 mots )", facetName: "Invectives"},
        {color: "#B2DFDB", id: "longues", name: "Interventions longues"}
      ]
    }, {
      id: "sorts",
      name: "Sort des amendements",
      filterName: "Amendements",
      filterAll: "Tous les amendements",
      icon: "spellcheck",
      selected: "total",
      only: "amendements",
      legende: [
        {color: "#69F0AE", id: "Adopté", name: "Adoptés"},
        {color: "#80D8FF", id: "Retiré", name: "Retirés"},
        {color: "#B2DFDB", id: "Tombe", name: "Tombés"},
        {color: "#FFE57F", id: "Non soutenu", name: "Non soutenus"},
        {color: "#FFAB40", id: "Irrecevable", name: "Irrecevables"},
        {color: "#ef9a9a", id: "Rejeté", name: "Rejetés"},
        {color: "#9E9E9E", id: "Indéfini", name: "Indéfinis"}
      ]
    }, {
      id: "typeprop",
      name: "Type de propositions",
      filterName: "Types de propositions",
      filterAll: "Toutes les propositions",
      icon: "help",
      selected: "total",
      only: "propositions",
      legende: [
        {color: "lightgreen", id: "loi", name: "Lois (PPL)", facetName: "Lois"},
        {color: "orange", id: "loi organique", name: "Lois organiques (PPLO)", facetName: "Lois organiques"},
        {color: "lightyellow", id: "loi constitutionnelle", name: "Lois constitutionnelles", facetName: "Lois Constit."},
        {color: "darkgrey", id: "règlement de l'Assemblée nationale", name: "Règlement de l'AN"},
        {color: "grey", id: "résolution", name: "Résolutions (PPR)", facetName: "Résolutions"},
        {color: "lightblue", id: "résolution européenne", name: "Résolutions européennes", facetName: "Résolutions EU"},
      ]
    }, {
      id: "discute",
      name: "Statut des propositions",
      filterName: "Propositions",
      filterAll: "Toutes les propositions",
      icon: "help",
      selected: "total",
      only: "propositions",
      legende: [
        {color: "#B39DDB", id: "discute", name: "Discutées"},
        {color: "#B2DFDB", id: "attente", name: "En attente"}
      ]
    }, {
      id: "statut",
      name: "Statut des questions",
      filterName: "Questions",
      filterAll: "Toutes les questions",
      icon: "help",
      selected: "total",
      only: "questions",
      legende: [
        {color: "#B39DDB", id: "reponse", name: "Satisfaites"},
        {color: "#B3B7B5", id: "retrait", name: "Retirées"},
        {color: "#B2DFDB", id: "attente", name: "En attente"}
      ]
    }, {
      id: "duree",
      name: "Durée d'attente",
      filterName: "Durée d'attente",
      filterAll: "Toutes les questions",
      icon: "help",
      selected: "total",
      only: "questions",
      legende: [
        {color: "#69F0AE", id: "1", name: "moins d'un mois", facetName: "- d'un mois"},
        {color: "#80D8FF", id: "2", name: "moins de 2 mois", facetName: "- de 2 mois"},
        {color: "#B2DFDB", id: "3", name: "moins de 3 mois", facetName: "- de 3 mois"},
        {color: "#FFE57F", id: "3-6", name: "entre 3 et 6 mois", facetName: "3 à 6 mois"}
      ], extralegende: [
        {color: "#FFAB40", id: "6-12", name: "entre 6 mois et un an", facetName: "6 à 12 mois"},
        {color: "#ef9a9a", id: "12+", name: "plus d'un an", facetName: "+ d'un an"}
      ]
    }, {
      id: "ministre",
      name: "Ministère interrogé",
      filterName: "Ministère interrogé",
      filterAll: "Tous les ministères",
      icon: "flag",
      selected: "total",
      only: "questions",
      legende: [
        {color: "grey", id: "Premier ministre", name: "Premier ministre"},
        {color: "grey", id: "Ministère de l'intérieur", name: "Intérieur"},
        {color: "grey", id: "Ministère de la transition écologique et solidaire", name: "Transition écologique & solidaire"},
        {color: "grey", id: "Ministère de la justice", name: "Justice"},
        {color: "grey", id: "Ministère de l'Europe et des affaires étrangères", name: "Europe & Affaires étrangères"},
        {color: "grey", id: "Ministère des armées", name: "Armées"},
        {color: "grey", id: "Ministère de la cohésion des territoires", name: "Cohésion des territoires"},
        {color: "grey", id: "Ministère des solidarités et de la santé", name: "Solidarités & Santé"},
        {color: "grey", id: "Ministère de l'économie et des finances", name: "Économie & Finances"},
        {color: "grey", id: "Ministère de la culture", name: "Culture"},
        {color: "grey", id: "Ministère du travail", name: "Travail"},
        {color: "grey", id: "Ministère de l'éducation nationale", name: "Éducation nationale"},
        {color: "grey", id: "Ministère de l'agriculture et de l'alimentation", name: "Agriculture & Alimentation"},
        {color: "grey", id: "Ministère de l'action et des comptes publics", name: "Action & Comptes publics"},
        {color: "grey", id: "Ministère de l'enseignement supérieur, de la recherche et de l'innovation", name: "Enseignement supérieur"},
        {color: "grey", id: "Ministère des outre-mer", name: "Outre-mer"},
        {color: "grey", id: "Ministère des sports", name: "Sports"},
        {color: "grey", id: "Premier ministre, chargé de l'égalité entre les femmes et les hommes", name: "Égalité F / H"},
        {color: "grey", id: "Premier ministre, chargé des personnes handicapées", name: "Personnes Handicapées"},
        {color: "grey", id: "Premier ministre, chargé du numérique", name: "Numérique"},
        {color: "grey", id: "Ministère de la transition écologique et solidaire, chargé des transports", name: "Transports"},
        {color: "grey", id: "Ministère de l'Europe et des affaires étrangères, chargé des affaires européennes", name: "Affaires européennes"},
      ]
    }],
    resizing: null,
    data: {},
    cumul: false,
    prop: false,
    temps: "jours",
    hoverDate: "",
    showValues: false,
    help: false
  },
  computed: {
    dkey: function() { return this.activite + "_" + this.legislature; },
    unit: function() {
      var act = this.activite;
      return this.activites.filter(function(a) { return a.id === act; })[0].unit;
    },
    activiteIcon: function() {
      var act = this.activite;
      return this.activites.filter(function(a) { return a.id === act; })[0].icon;
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
      var facet = this.facet;
      return this.facets.filter(function(f) { return f.id === facet; })[0].legende;
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
    this.readUrl();
    window.addEventListener("hashchange", this.readUrl);
    window.addEventListener("resize", this.onResize);
    this.$watch(
      function() { return [this.dkey, this.facet, this.cumul, this.prop, this.temps]; },
      this.updateUrl
    );
  },
  methods: {
    onResize: function() {
      if (this.resizing) return clearTimeout(this.resizing);
      this.resizing = setTimeout(this.drawChart, 50);
    },
    selectFilter: function(optionId, filterId) {
      this.facets.filter(function(f) { return f.id === optionId; })
      .forEach(function(f) { f.selected = filterId; });
      this.updateUrl();
    },
    clearFilters: function() {
      this.facets.forEach(function(f) { f.selected = "total"; });
      this.updateUrl();
    },
    updateUrl: function() {
      window.location.hash = "activite=" + this.activite +
        "&leg=" + this.legislature +
        "&facet=" + this.facet +
        (this.activeFilters.length ? "&filters=" : "") +
        this.activeFilters.map(function(f) { return f.id + ":" + f.selected; }).join("|") +
        (this.cumul ? "&cumul" : "") +
        (this.prop ? "&prop" : "") +
        "&temps=" + this.temps;
    },
    readUrl: function() {
      var el, el2, options = {};
      window.location.hash.slice(1).split(/&/).forEach(function(opt) {
        el = opt.split(/=/);
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
      this.cumul = options.cumul;
      this.prop = options.prop;
      this.temps = options.temps || this.temps;
      if (!this.data[this.dkey]) {
        d3.select("svg g").remove();
        d3.tsv("data/" + this.dkey + ".tsv", function(d) {
          d.date = new Date(d.date);
          d.date.setHours(0);
          d.jours = d3.iso_jours(d.date);
          d.sems = d3.iso_sems(d.date);
          d.mois = d3.iso_mois(d.date);
          d.total = +d.total;
          return d;
        }, this.drawChart);
      } else this.$nextTick(this.drawChart);
    },
    drawChart: function(curData, error) {
      // Handle ajax result
      if (error) throw error;
      if (curData) this.data[this.dkey] = curData;
      else curData = this.data[this.dkey];
      if (!curData) return console.log("No data!");

      // Clear unavailable facet choice
      var facet = this.facet,
        only = this.facets.filter(function(f) { return f.id === facet; })[0].only;
      if (only && only !== this.activite) {
        this.facet = this.facets[0].id;
        return this.updateUrl();
      } else if (this.activite === "questions" && this.temps === "jours") {
        this.temps = "sems";
        return this.updateUrl();
      }

      // Prepare view settings
      var _cumul = this._cumul,
        _prop = this._prop,
        temps = this.temps,
        colors = {};
      this.legende.forEach(function(k) { colors[k.id] = k.color; });
      var keys = this.legende.map(function(k) { return k.id; });
      if (facet === "groupes") keys.reverse();

      // Agregate and filter data
      var hashdata = {},
        activeFilters = this.activeFilters;
      d3.nest()
      .key(function(d) { return d[temps]; })
      .key(function(d) { return d[facet]; })
      .rollup(function(lvs) { return d3.sum(lvs, function(d) {return d.total;}); })
      .entries(curData.filter(function(d) {
        return activeFilters.every(function(f) { return d[f.id] === f.selected; });
      })).forEach(function(k) {
        hashdata[k.key] = {};
        k.values.forEach(function(v) {
          hashdata[k.key][v.key] = v.value;
        });
      });

      // Build all dates data with cumul & prop
      var last = {},
        data = [],
        start = curData[0].date,
        end = new Date(curData[curData.length - 1].date);
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
            d3.timeFormat((temps !== "mois" ? "%e " : "") + "%B %Y")(d.date),
          sum: 0,
          sum_cumul: 0
        };
        keys.forEach(function(k) {
          o[k] = (hashdata[d.temps] || {})[k] || 0;
          o.sum += o[k];
          o[k+"_cumul"] = o[k] + (last[k+"_cumul"] || 0);
          o.sum_cumul += o[k+"_cumul"];
        });
        keys.forEach(function(k) {
          o[k+"_prop"] = (o.sum ? o[k] / o.sum : 0);
          o[k+"_cumul_prop"] = (o.sum_cumul ? o[k+"_cumul"] / o.sum_cumul : 0);
        });
        data.push(o);
        last = o;
      });
      
      // Setup dimensions
      var margin = {top: 40, right: 60, bottom: 40, left: 60},
        svgW = window.innerWidth - document.querySelector("aside").getBoundingClientRect().width,
        width = svgW - margin.left - margin.right,
        svgH = window.innerHeight - document.querySelector("nav").getBoundingClientRect().height - document.querySelector(".legende").getBoundingClientRect().height - 20,
        height = svgH - margin.top - margin.bottom,
        svg = d3.select("svg").attr("width", svgW).attr("height", svgH),
        xScale = d3.scaleTime().range([0, width]).domain([start, end]),
        xPosition = function(d) { return xScale(d3.max([start, d.date || d.data.date])); },
        xWidth = function(d) { return xScale(d3.min([end, d3.nextDate(d.date || d.data.date, temps)])) - xPosition(d); },
        yScale = d3.scaleLinear().range([height, 0]);
      if (!this.prop)
        yScale.domain([0, d3.max(data, function(d) { return d["sum"+_cumul]; })]);

      // Prepare svg
      d3.select("svg g").remove();
      var g = d3.select("svg")
      .attr("width", svgW)
      .attr("height", svgH)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Draw histogram
      g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys.map(function(k) { return k + _cumul + _prop; }))(data))
        .enter().append("g")
          .attr("fill", function(d) { return colors[d.key.replace(/_.*$/, "")] || "grey"; })
          .selectAll("rect")
          .data(function(d) { return d; })
          .enter().append("rect")
            .attr("x", xPosition)
            .attr("y", function(d) { return yScale(d[1]); })
            .attr("width", function(d) { return xWidth(d) - 0.5; })
            .attr("height", function(d) { return Math.max(0, yScale(d[0]) - yScale(d[1]) - 0.5); });

      // Draw axis
      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + (height) + ")")
        .call(d3.axisBottom(xScale).ticks(Math.floor(width / 175), d3.timeFormat("%d %b %y")));

      // Draw tooltips surfaces
      g.append("g")
        .selectAll("rect.tooltip")
        .data(data)
        .enter().append("rect")
          .classed("tooltip", true)
          .attr("x", xPosition)
          .attr("y", yScale.range()[1])
          .attr("width", xWidth)
          .attr("height", yScale.range()[0] - yScale.range()[1])
          .on("mouseover", function(d, idx, rects) { d3.select(rects[idx]).style("fill-opacity", 0.15); })
          .on("mousemove", this.displayTooltip)
          .on("mouseleave", this.clearTooltip);

      this.resizing = null;
    },
    displayTooltip: function(d) {
      this.hoverDate = d.legend;
      this.showValues = true;
      var tot = 0;
      for (var i=0, n=this.legende.length; i<n; i++) {
        var leg = this.legende[i],
          key = leg.id + this._cumul + this._prop;
        leg.value = d3.format(this.prop ? ".1%" : ",")(d[key]);
        tot += d[key];
      }
      d3.select(".tooltipBox")
      .style("left", d3.event.pageX - 60 + "px")
      .style("top", d3.event.pageY + 20 + "px")
      .style("display", (tot ? "block" : "none"));
    },
    clearTooltip: function(d, idx, rects) {
      this.showValues = false;
      d3.select(rects[idx]).style("fill-opacity", 0);
      d3.select(".tooltipBox").style("display", "none");
    }
  }
});
