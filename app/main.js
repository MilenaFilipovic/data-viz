let languagesDataFile = 'data/languages_50_2017-07.csv';
let networkDataFile = 'data/network_50_2017-07.csv';
const statisticsDataFile = 'data/agg_stats_2017-07-01_2017-11-30__processedat_2017-12-18.csv';
const generalDataFile = 'data/agg_general_2017-07-01_2017-11-30__processedat_2017-12-18.csv';

const colorConextions = "#E0E0E0";
const slidBar = "675px";
const shiftMain = "375px";

let filteredLanguages = [];
let firstCall = 1;

let svg;
let metricsBox;
let lastLayout; //store layout between updates

const wChord = 1000,
    hChord = 1000,
    rInner = hChord / 2.6,
    rOut = rInner - 30,
    paddingChord = 0.02;

const wMetrics = 320, hMetrics = 200;
const marginMetrics = {top: 30, right: 30, bottom: 30, left: 45},
    widthMetrics = wMetrics - marginMetrics.left - marginMetrics.right,
    heightMetrics = hMetrics - marginMetrics.top - marginMetrics.bottom;

const marginChord = {top: 20, right: 20, bottom: 20, left: 20},
    widthChord = wChord - marginChord.left - marginChord.right,
    heightChord = hChord - marginChord.top - marginChord.bottom;

const lookupLegendColors = {
    'Selected language': '#000080',
    'Average across all languages': '#FF4500'
};

const lookupNiceParadigmNames = {
    'multi': 'Multi-Paradigm',
    'oob': 'Object-Oriented',
    'scripted': 'Scripted',
    'procedural': 'Procedural',
    'imperative': 'Imperative',
    'functional': 'Functional',
    'declarative': 'Declarative',
    'undefined': 'Undefined'
};

const lookupColorLanguage = {
    'multi': "#31a354",
    'oob': "#756bb1",
    'scripted': "#238443",
    'procedural': "#b10026",
    'imperative': "#386cb0",
    'undefined': "#40f3ff",
    'functional': "#f03b20",
    'declarative': "#fa9fb5"
};

const aggMetrics = ["days_open_merged",
    "payload.pull_request.base.repo.open_issues_count",
    "payload.pull_request.changed_files",
    "payload.pull_request.commits"];

const months = {
  7 : 'July',
  8 : 'August',
  9 : 'September',
  10 : 'October',
  11 : 'November'
};

let applyLog = 1;
let sortingMethod = 'paradigm';

function applyLogarithm(value){
    applyLog = value;
    loadChords();
}
function setSortingMethod(method){
    sortingMethod = method;
    loadChords();
}

function drawChord(matrix, labels, stats, genMetrics) { // try to improve those callings and refactor
    /**
     * Draw chord diagram where the connections are the the log of the number of common actors of two languages
     *
     * @param {2d array} matrix - i,j element is the lof of number of common actor between 2 languages
     * @param {array} labels - array containing languages' names
     * @param {array} stats - array where each element is a dicionary containing aggregated informations about each language
     * @param {array} genMetrics - array where each element is a dicionary containing informations about each language
     */

     d3.selectAll().remove();

    labels = labels.filter( function(el) {
           return !filteredLanguages.includes(el['language']);
           } );
       let chord;
     switch (sortingMethod) {
       case 'paradigm': chord = d3.chord().padAngle(paddingChord); break;
       case 'ascending': chord = d3.chord().padAngle(paddingChord).sortGroups(d3.ascending).sortChords(d3.ascending); break;
       case 'descending': chord = d3.chord().padAngle(paddingChord).sortGroups(d3.descending).sortChords(d3.descending); break;
     }

    if(firstCall){
      metricsBox = d3.select("#chord")
          .append("div")
          .attr("class", "general-metrics-box")
          .attr("id", "general-metrics-box")
          .style("visibility", "hidden");

      svg = d3.select("#chord")
          .append("svg:svg")
          .attr("width", widthChord)
          .attr("height", heightChord)
          .append("svg:g")
          .attr("transform", "translate(" + widthChord / 2 + "," + heightChord / 2 + ")");

      firstCall = 0;
    }
    let groupG = svg.selectAll("g.group")
        .data(chord(matrix).groups);

    let newGroups = groupG.enter().append("g")
      .attr("class", "group");

    groupG.exit()
      .transition()
          .duration(3000)
          .attr("opacity", 0)
          .remove();

    svg.selectAll("g.chord").remove();
    let chordPaths =  svg.append("svg:g")
        .attr("class", "chord")
        .selectAll("path")
        .data(chord(matrix), chordKey);

    let newChords = chordPaths.enter()
        .append("svg:path")
        .filter(function (d) {
            return d.source.index != d.target.index;
        });

    chordPaths.exit().transition()
          .duration(500)
          .attr("opacity", 0)
          .remove();
    newChords.transition()
          .duration(1500)
          .style("fill", colorConextions)
          .attr("opacity", 1) //optional, just to observe the transition
        .attrTween("d", chordTween(lastLayout))
        .transition()
          .duration(500)
          .attr("d", d3.ribbon().radius(rOut))
              .style("opacity", 1); //reset opacity




    let wrapper = svg.append("g").attr("class", "chordWrapper");

    let g = wrapper.selectAll("g.group")
        .data(chord(matrix).groups)
        .enter().append("g")
        .attr("class", "group");

    let paths = g.append("path")
        .style("stroke", function (d) {
            return lookupColorLanguage[labels[d.index]['paradigm']];
        })
        .style("fill", function (d) {
            return lookupColorLanguage[labels[d.index]['paradigm']];
        })
        .style("stroke", "black")
        .style("opacity", 0.7)
        .attr("d", d3.arc().innerRadius(rOut).outerRadius(rInner))
        .on("mouseover", fade(0.00, "visible"))
        .on("mousemove", fade(0.00, "visible"))
        .on("mouseout", fade(1, "hidden"))
        .on("click", function (d) {
            closeSlideBar();
            document.getElementById("main").style.marginLeft = shiftMain;
            document.getElementById("side-menu").style.width = slidBar;
            showMetrics(d, "side-menu");
        });


    let pathLabels = g.append("text")
        .each(function (d) {
            d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr("class", "labels")
        .attr("dy", ".35em")
        .attr("transform", function (d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (rInner + 5) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .style("text-anchor", function (d) {
            return d.angle > Math.PI ? "end" : null;
        })
        .text(function (d, i) {
            return labels[i]['language'];
        })
        .on("click", function (d, i) {removeLanguage(d, i, labels)});

    paths.transition()
            .duration(1500)
            .attr("opacity", 0)
            .remove()
        .attrTween("d", arcTween(lastLayout))
            .transition().duration(100).attr("opacity", 1);

    pathLabels.transition()
            .duration(1500)
            .attr("opacity", 0)
            .remove()
        .transition().duration(100).attr("opacity", 1);

    function fade(opacity, showInfos) {
        /**
         * Show information of the selected language when the mouse is on and hide other languages
         *
         * @param {number} opacity - degree of visibility of other languages not related with the select one
         * @param {boolean} showInfos - true to show informations about PR's, # actors and language paradigm
         */

        return function (g, i) {
            svg.selectAll("g.chord path")
                .filter(function (d) {
                    return d.source.index != i && d.target.index != i;
                })
                .transition()
                .style("opacity", opacity);

            if (showInfos == "visible") {
                let language = labels[i]['language'];
                let paradigm = labels[i]['paradigm'];
                let generalMetrics = avgPrsAndActors(genMetrics.filter(x => x['language'] == language));

                var list = document.getElementById("general-metrics-box");
                if (list.hasChildNodes()) {
                    while (list.hasChildNodes()) {
                        list.removeChild(list.firstChild);
                    }
                }

                var p = document.createElement('p');
                p.className = "title-general-metrics-box";
                p.innerHTML = language;
                p.style.color = lookupColorLanguage[paradigm];
                document.getElementById('general-metrics-box').appendChild(p);

                var p = document.createElement('div');
                p.className = "title-general-metrics-box";
                p.innerHTML = "Avg PRs/month: " + generalMetrics['meanPrs'] +
                    "<br/>Avg Actors/month: " + generalMetrics['meanActors'] +
                    "<br/>Avg PRs/Actor: " + math.round(generalMetrics['meanPrs'] / generalMetrics['meanActors'])  ;
                document.getElementById('general-metrics-box').appendChild(p);
            }
            metricsBox
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                .style("visibility", showInfos);
        }
    }

    function showMetrics(d, containerIdToAppend) {
        /**
         * Show information of the selected language when the mouse is on and hide other languages
         *
         * @param {Object} d - chord element of the selected language
         * @param {integer} containerIdToAppend - container ID to append the informations about the selected language
         */

        let language = labels[d.index]['language'],
            paradigm = labels[d.index]['paradigm'];

        let titleContainer = document.createElement("div");
        titleContainer.className = "metrics-title";
        titleContainer.innerHTML = language + " - " + lookupNiceParadigmNames[paradigm];
        titleContainer.style.color = lookupColorLanguage[paradigm];
        document.getElementById(containerIdToAppend).appendChild(titleContainer);

        let top5Languages = getTopCorrLanguages(matrix[d.index], 5);
        let languagesCorr = document.createElement("div");
        languagesCorr.className = "text-top-languages";
        let languagesHTML = 'Top Correlated Languages: ';
        for (i in top5Languages) {
            let lang = top5Languages[i];
            let param = labels.filter(x => x['language'] == lang).map(x => x['paradigm']);
            languagesHTML += "<span style=\"color:" + lookupColorLanguage[param] + ";cursor: pointer;\">" + lang + ", </span>"
        }
        languagesHTML = languagesHTML.slice(0, -9); // works, but it is not good!
        languagesCorr.innerHTML = languagesHTML;
        document.getElementById(containerIdToAppend).appendChild(languagesCorr);

        for (var key in lookupLegendColors) {
            var boxContainer = document.createElement("span");
            boxContainer.style.marginRight = "50px";
            var box = document.createElement("span");
            var label = document.createElement("span");
            label.className = "legend-text";
            label.innerHTML = "\t" + key;
            box.className = "legend-box";
            box.style.backgroundColor = lookupLegendColors[key];
            boxContainer.appendChild(box);
            boxContainer.appendChild(label);
            document.getElementById(containerIdToAppend).appendChild(boxContainer);
        }

        let filteredStats = stats.filter(x => x['language'] == labels[d.index]['language']),
            allStats = stats.filter(x => x['language'] == 'all');


        drawgeneralMetrics(genMetrics, 'number_prs', language);
        drawgeneralMetrics(genMetrics, 'number_actors', language);
        aggMetrics.map(x => drawMetrics(filteredStats, allStats, x))
    }

    function getTopCorrLanguages(conections, ntop) {
        let topLanguagesPositions = _.zip(new Array(conections.length).fill().map((e, i) => i), conections)
            .sort(function (a, b) {
                return a[1] - b[1]
            }).reverse().slice(1, ntop + 1).map(x => x[0]);
        let topLanguages = [];
        for (i in topLanguagesPositions) {
            topLanguages.push(labels.map(x => x['language'])[topLanguagesPositions[i]])
        }
        return topLanguages
    }

    function avgPrsAndActors(generalLanguage) {
        metrics = {};
        metrics['meanPrs'] = math.round(math.mean(generalLanguage.map(x => x['number_prs'])));
        metrics['meanActors'] = math.round(math.mean(generalLanguage.map(x => x['number_actors'])));

        return metrics
    }

    lastLayout = chord(matrix);
}

function closeSlideBar() {
    /**
     * Close slide bar when it is activated
     */
    document.getElementById("main").style.marginLeft = "0px";
    let list = document.getElementById("side-menu");
    if (list.hasChildNodes()) {
        while (list.childElementCount > 1) {
            list.removeChild(list.lastChild);
        }
    }
    document.getElementById("side-menu").style.width = 0;
}


function loadChords(){
  d3.queue()
      .defer(d3.csv, languagesDataFile)
      .defer(d3.csv, networkDataFile)
      .defer(d3.csv, generalDataFile)
      .defer(d3.csv, statisticsDataFile)
      .await(function (error, languages, network, generalStats, stats) {
          /***
           * Function treats and reads the data, call functions to build the network matrix and draw the Chord diagram
           */
          network = network.map(rowConverterNetwork);
          stats = stats.map(rowConverterStatistics);
          generalStats = generalStats.map(rowConverterStatgeneral);

          let matrix = getMatrixCommonActors(network, filteredLanguages);
          if (applyLog){
              matrix = matrix.map(row => row.map(x => x > 30 ? Math.log(x) : 0));
          }
          drawChord(matrix, languages, stats, generalStats);
      });
}


function chordTween(oldLayout) {
    //this function will be called once per update cycle

    //Create a key:value version of the old layout's chords array
    //so we can easily find the matching chord
    //(which may not have a matching index)

    let oldChords = {};

    if (oldLayout) {
        oldLayout.forEach( function(chordData) {
            oldChords[ chordKey(chordData) ] = chordData;
        });
    }

    return function (d, i) {
        //this function will be called for each active chord
        let tween;
        let old = oldChords[ chordKey(d) ];
        if (old) {
            if (d.source.index != old.source.index ){
                old = {
                    source: old.target,
                    target: old.source
                };
            }

            tween = d3.interpolate(old, d);
        }
        else {
            //create a zero-width chord object
            let emptyChord = {
                source: { startAngle: d.source.startAngle,
                         endAngle: d.source.startAngle},
                target: { startAngle: d.target.startAngle,
                         endAngle: d.target.startAngle}
            };
            tween = d3.interpolate( emptyChord, d );
        }
        return function (t) {
            //this function calculates the intermediary shapes
            let path = d3.ribbon().radius(rOut);
            return path(tween(t));
        };
    };
}

function chordKey(data) {
    return (data.source.index < data.target.index) ?
        data.source.index  + "-" + data.target.index:
        data.target.index  + "-" + data.source.index;
}

function arcTween(oldLayout) {
    //this function will be called once per update cycle
    let arc = d3.arc()
        .innerRadius(rOut)
        .outerRadius(rInner);
    let oldGroups = {};
    if (oldLayout) {
        oldLayout.groups.forEach( function(groupData) {
            oldGroups[ groupData.index ] = groupData;
        });
    }

    return function (d, i) {
        let tween;
        let old = oldGroups[d.index];
        if (old) { //there's a matching old group
            tween = d3.interpolate(old, d);
        }
        else {
            //create a zero-width arc object
            let emptyArc = {startAngle:d.startAngle,
                            endAngle:d.startAngle};
            tween = d3.interpolate(emptyArc, d);
        }

        return function (t) {
            return arc( tween(t) );
        };
    };
}


function removeLanguage(d, i, labels) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        filteredLanguages.push(labels[i]['language']);
        updateFilters();
        loadChords();
}

function regex_escape(str) {
    return str.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-\#]', 'g'), '\\$&');
}

function returnLanguage(language, i){
    let index = filteredLanguages.indexOf(language);
    filteredLanguages.splice(index, 1);
    d3.select('#'+regex_escape(language)).remove();
    updateFilters();
    loadChords();
}

function updateFilters(){
  if (filteredLanguages.length > 0){
    d3.select("#clear_button").style("opacity", 1);
  }else{
    d3.select("#clear_button").style("opacity", 0);
  }
  let filters = d3.select('#filtered_languages')
            .selectAll('li')
            .data(filteredLanguages);
  // Enter
  filters.enter()
          .append('li')
          .attr('class', 'list-group-item')
          .attr("id", function(d,i) { return d; })
          .on("click", function(d, i){
                        returnLanguage(d);
                      })
          .text(function(d) { return d; });
  // Exit
  filters.exit().remove();
}

function returnAllLanguages(){
    filteredLanguages = [];
    d3.select('#filtered_languages')
              .selectAll('li')
              .remove();
    d3.select("#clear_button").style("opacity", 0);
    loadChords();
}

function getMonthlyChord(year_picked, month_picked){
  let date = ((month_picked < 10)?'0'+ month_picked:month_picked) + year_picked ;
  d3.select("#date-picker-value").text('Data for '+months[month_picked] + ' of 20' + year_picked);
  languagesDataFile = 'data/languages_50_20' + date.substring(2,4) +'-' + date.substring(0,2) + '.csv';
  networkDataFile = 'data/network_50_20' + date.substring(2,4) +'-' + date.substring(0,2) + '.csv';
  loadChords();
}

  loadChords();
  d3.select("#clear_button")
    .style("opacity", 0)
    .on("click", returnAllLanguages);
  d3.select("#date_picker")
        .attr("min", 7)
        .attr("max", 11)
        .attr("step", 1).on("input", function() {
        getMonthlyChord(17, this.value);
  });
  d3.select("#date_picker").attr("value", 7);
  getMonthlyChord(17,7);
