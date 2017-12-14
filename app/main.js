// const networkDataFile = 'data/network_50_2017-08-01_2017-10-31__processedat_2017-12-04.csv';
// const languagesDataFile = 'data/langues_50_2017-08-01_2017-10-31__processedat_2017-12-04.csv';
const languagesDataFile = 'data/langues_50_2017-11-01_2017-11-30__processedat_2017-12-09.csv';
const networkDataFile = 'data/network_50_2017-11-01_2017-11-30__processedat_2017-12-09.csv';
const statisticsDataFile = 'data/agg_stats_2017-08-01_2017-10-31__processedat_2017-11-23.csv';
const geralDataFile = 'data/agg_general_2017-08-01_2017-10-31__processedat_2017-11-23.csv';

const wChord = 900,
    hChord = 900,
    rInner = hChord / 2.6,
    rOut = rInner - 20,
    paddingChord = 0.02;

const wMetrics = 200, hMetrics = 200;
const marginMetrics = {top: 20, right: 20, bottom: 20, left: 23},
    widthMetrics = wMetrics - marginMetrics.left - marginMetrics.right,
    heightMetrics = hMetrics - marginMetrics.top - marginMetrics.bottom;

const marginChord = {top: 20, right: 20, bottom: 20, left: 20},
    widthChord = wChord - marginChord.left - marginChord.right,
    heightChord = hChord - marginChord.top - marginChord.bottom;


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

const aggMetrics = ["days_open_merged", "payload.pull_request.base.repo.open_issues_count"];


function getMatrixCommonActors(data) {
    // This function is a simplified version of https://gist.github.com/eesur/0e9820fb577370a13099#file-mapper-js-L4
    let mmap = {}, matrix = [], counter = 0;
    let values = _.uniq(_.pluck(data, "language1"));

    values.map(function (v) {
        if (!mmap[v]) {
            mmap[v] = {name: v, id: counter++, data: data}
        }
    });

    _.each(mmap, function (a) {
        if (!matrix[a.id]) matrix[a.id] = [];
        _.each(mmap, function (b) {
            let recs = _.filter(data, function (row) {
                return (row.language1 === a.name && row.language2 === b.name);
            });

            if (!recs[0]) {
                matrix[a.id][b.id] = 0
            }
            else {
                matrix[a.id][b.id] = +recs[0].common_actors
            }
        });
    });
    return matrix;
}


function rowConverterNetwork(d) {
    return {
        language1: d.language1,
        language2: d.language2,
        common_actors: parseFloat(d.common_actors)
    }
}

var parseTime = d3.timeParse("%Y-%m");

function rowConverterStatistics(d) {
    return {
        statistic: d.column,
        metric: d.metric,
        cohort: parseTime(d.cohort),
        language: d.language,
        value: d.value != "" ? parseFloat(d.value) : 0

    }
}


function rowConverterStatGeral(d) {
    return {
        cohort: d.cohort,
        language: d.language,
        number_prs: d.number_prs != "" ? parseFloat(d.number_prs) : 0,
        number_actors: d.number_actors != "" ? parseFloat(d['actor.display_login']) : 0

    }
}


function drawChord(matrix, labels, stats, generalMetrics) { // try to improve those callings
    let chord = d3.chord().padAngle(paddingChord);

    let metricsBox = d3.select("#chord")
        .append("div")
        .attr("class", "geral-metrics-box")
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
        })
        .style("stroke", "black")
        .style("opacity", 0.5)
        .attr("d", d3.arc().innerRadius(rOut).outerRadius(rInner))
        .on("mouseover", fade(0.00, "visible"))
        .on("mousemove", fade(0.00, "visible"))
        .on("mouseout", fade(1, "hidden"))
        .on("click", function (d) {
            d3.select("body")
                .append("div")
                .attr("id", "metrics-box")
                .attr("class", "metrics-box")
                .style("visibility", "visible");

            let filteredStats = stats.filter(x => x['language'] == labels[d.index]['language']),
                language = labels[d.index]['language'];
            for (i in aggMetrics) {
                drawMetrics(filteredStats, language, aggMetrics[i])
            }
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
        .style("fill", "#f0f0f0")
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
                metrics = avgPrsAndActors(generalMetrics.filter(x => x['language'] == language));
                // TODO: improve text format
                metricsBox.text("<h1 style='color: blue'> oi </h1>")
                // metricsBox.text(language + "\nAvg Prs:"
                //     + metrics['meanPrs'] + "\nAvg Uniq. Actors: "
                //     + metrics['meanActors'] + "\nClick pour plus information");
            }
            metricsBox
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                .style("visibility", showInfos);
        }
    }

    function avgPrsAndActors(geralLanguage) {
        metrics = {};
        metrics['meanPrs'] = math.round(math.mean(geralLanguage.map(x => x['number_prs'])));
        metrics['meanActors'] = math.round(math.mean(geralLanguage.map(x => x['number_actors'])));

        return metrics
    }
}


d3.queue()
    .defer(d3.csv, languagesDataFile)
    .defer(d3.csv, networkDataFile)
    .defer(d3.csv, geralDataFile)
    .defer(d3.csv, statisticsDataFile)
    .await(function (error, languages, network, geralStats, stats) {

        network = network.map(rowConverterNetwork);
        stats = stats.map(rowConverterStatistics);
        geralStats = geralStats.map(rowConverterStatGeral);

        let matrix = getMatrixCommonActors(network);
        let logMatrix = matrix.map(row => row.map(x => x > 30 ? Math.log(x) : 0));
        drawChord(logMatrix, languages, stats, geralStats);

        document.addEventListener('click', function (event) {
            let specifiedElement = document.getElementById("metrics-box");
            if (specifiedElement != null) {
                if (!specifiedElement.contains(event.target)) {
                    console.log('click outside');
                    // specifiedElement.remove()
                }
            }
        });
        //
        // languageStats = stats.filter(x => x['language'] == 'Python')
        //
        // let daysOpenMerged = languageStats
        //     .filter(x => x['statistic'] == "days_open_merged" & x['metric'] == "mean")
        //     .map(x => [x['cohort'], x['value']]);
        // console.log(daysOpenMerged)
        let means = statsOfAllLanguages(stats)

    });
