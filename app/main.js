const languagesDataFile = 'data/langues_50_2017-11-01_2017-11-30__processedat_2017-12-15.csv';
const networkDataFile = 'data/network_50_2017-11-01_2017-11-30__processedat_2017-12-15.csv';
const statisticsDataFile = 'data/agg_stats_2017-07-01_2017-11-30__processedat_2017-12-14.csv';
const geralDataFile = 'data/agg_general_2017-07-01_2017-11-30__processedat_2017-12-14.csv';

const colorConextions = "#F0F0F0";
const slidBar = "700px";
const shiftMain = "375px";

const wChord = 900,
    hChord = 900,
    rInner = hChord / 2.6,
    rOut = rInner - 30,
    paddingChord = 0.02;

const wMetrics = 300, hMetrics = 200;
const marginMetrics = {top: 30, right: 30, bottom: 30, left: 30},
    widthMetrics = wMetrics - marginMetrics.left - marginMetrics.right,
    heightMetrics = hMetrics - marginMetrics.top - marginMetrics.bottom;

const marginChord = {top: 20, right: 20, bottom: 20, left: 20},
    widthChord = wChord - marginChord.left - marginChord.right,
    heightChord = hChord - marginChord.top - marginChord.bottom;

const lookupLegendColors = {
    'Mean of Language': '#000080',
    'Mean of all Languages': '#FF4500'
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
    'undefined': "#f7f7f7",
    'functional': "#f03b20",
    'declarative': "#fa9fb5"
};

const aggMetrics = ["days_open_merged",
    "payload.pull_request.base.repo.open_issues_count",
    "payload.pull_request.changed_files",
    // "payload.pull_request.comments",
    "payload.pull_request.commits"];


function drawChord(matrix, labels, stats, generalMetrics) { // try to improve those callings
    let chord = d3.chord().padAngle(paddingChord);

    let metricsBox = d3.select("#chord")
        .append("div")
        .attr("class", "geral-metrics-box")
        .attr("id", "geral-metrics-box")
        .style("visibility", "hidden");

    let svg = d3.select("#chord")
        .append("svg:svg")
        .attr("width", widthChord)
        .attr("height", heightChord)
        .append("svg:g")
        .attr("transform", "translate(" + widthChord / 2 + "," + heightChord / 2 + ")");


    svg.append("svg:g")
        .selectAll("path")
        .data(chord(matrix).groups)
        .enter()
        .append("svg:path")
        .style("fill", function (d) {
            return lookupColorLanguage[labels[d.index]['paradigm']];
        });


    svg.append("svg:g")
        .attr("class", "chord")
        .selectAll("path")
        .data(chord(matrix))
        .enter()
        .append("svg:path")
        .filter(function (d) {
            return d.source.index != d.target.index;
        })
        .style("fill", colorConextions)
        .attr("d", d3.ribbon().radius(rOut))
        .style("opacity", 1);

    let wrapper = svg.append("g").attr("class", "chordWrapper");

    let g = wrapper.selectAll("g.group")
        .data(chord(matrix).groups)
        .enter().append("g")
        .attr("class", "group");

    g.append("path")
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
            showMetrics(d, "side-menu")
        });


    g.append("text")
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
        });


    function fade(opacity, showInfos) {
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
                let geralMetrics = avgPrsAndActors(generalMetrics.filter(x => x['language'] == language));

                var list = document.getElementById("geral-metrics-box");
                if (list.hasChildNodes()) {
                    while (list.hasChildNodes()) {
                        list.removeChild(list.firstChild);
                    }
                }

                var p = document.createElement('p');
                p.className = "title-geral-metrics-box";
                p.innerHTML = language
                p.style.color = lookupColorLanguage[paradigm];
                document.getElementById('geral-metrics-box').appendChild(p);

                var p = document.createElement('div');
                p.className = "title-geral-metrics-box";
                p.innerHTML = "Avg PRs/mois: " + geralMetrics['meanPrs'] +
                    "<br/>Avg Actors/mois: " + geralMetrics['meanActors'] +
                    "<br/>PRs/Actors: " + math.round(geralMetrics['meanPrs'] / geralMetrics['meanActors']) +
                    "<br/> <br/> Click to see more about";
                document.getElementById('geral-metrics-box').appendChild(p);
            }
            metricsBox
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                .style("visibility", showInfos);
        }
    }

    function showMetrics(d, containerIdToAppend) {
        let language = labels[d.index]['language'],
            paradigm = labels[d.index]['paradigm'];

        let titleContainer = document.createElement("div");
        titleContainer.className = "metrics-title";
        titleContainer.innerHTML = language + " - " + lookupNiceParadigmNames[paradigm];
        titleContainer.style.color = lookupColorLanguage[paradigm];
        document.getElementById(containerIdToAppend).appendChild(titleContainer);

        for (var key in lookupLegendColors) {
            var boxContainer = document.createElement("div");
            var box = document.createElement("div");
            var label = document.createElement("span");
            label.className = "legend-text";
            label.innerHTML = "     " + key;
            box.className = "legend-box";
            box.style.backgroundColor = lookupLegendColors[key];
            boxContainer.appendChild(box);
            boxContainer.appendChild(label);
            document.getElementById(containerIdToAppend).appendChild(boxContainer);
        }

        let filteredStats = stats.filter(x => x['language'] == labels[d.index]['language']),
            allStats = stats.filter(x => x['language'] == 'all');

        aggMetrics.map(x => drawMetrics(filteredStats, allStats, x))

    }

    function avgPrsAndActors(geralLanguage) {
        metrics = {};
        metrics['meanPrs'] = math.round(math.mean(geralLanguage.map(x => x['number_prs'])));
        metrics['meanActors'] = math.round(math.mean(geralLanguage.map(x => x['number_actors'])));

        return metrics
    }
}

function closeSlideBar() {
    document.getElementById("main").style.marginLeft = "0px";
    let list = document.getElementById("side-menu");
    if (list.hasChildNodes()) {
        while (list.childElementCount > 1) {
            list.removeChild(list.lastChild);
        }
    }
    document.getElementById("side-menu").style.width = 0;
}

d3.queue()
    .defer(d3.csv, languagesDataFile)
    .defer(d3.csv, networkDataFile)
    .defer(d3.csv, geralDataFile)
    .defer(d3.csv, statisticsDataFile)
    .await(function (error, languages, network, geralStats, stats) {

        // TODO: bundle edges +++++
        // TODO: draw metrics with PRs per month +
        // TODO: order based in language size (more on `grab_data` package) +
        // TODO: comment and improve JS code, it is a mess! ++
        // TODO: update read me +
        // TODO: fix issue regarding y-axis and 95% percentile ++++++ or insert a comment
        // TODO: insert top languages in side bar +
        // TODO: put ranking position for each metric ++
        // TODO: nice plot of dots

        network = network.map(rowConverterNetwork);
        stats = stats.map(rowConverterStatistics);
        geralStats = geralStats.map(rowConverterStatGeral);

        let matrix = getMatrixCommonActors(network);
        let logMatrix = matrix.map(row => row.map(x => x > 30 ? Math.log(x) : 0));
        drawChord(logMatrix, languages, stats, geralStats);
    });
