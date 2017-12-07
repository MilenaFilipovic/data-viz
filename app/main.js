const networkDataFile = 'data/network_50_2017-07.csv';
const languagesDataFile = 'data/languages_50_2017-07.csv';
const statisticsDataFile = 'data/agg_stats_2017-07-01_2017-11-30__processedat_2017-12-05.csv';
const geralDataFile = 'data/agg_general_2017-07-01_2017-11-30__processedat_2017-12-05.csv';

const w = 900,
    h = 800,
    rInner = h / 2.6,
    rOut = rInner - 20,
    padding = 0.02;

const margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;


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


function rowConverterStatistics(d) {
    return {
        statistic: d.column,
        metric: d.metric,
        cohort: d.cohort,
        language: d.language,
        value: d.value != "" ? parseFloat(d.value) : 0

    }
}


function rowConverterStatGeral(d) {
    return {
        cohort: d.cohort,
        language: d.language,
        number_prs: parseFloat(d.number_prs),
        number_actors: parseFloat(d['actor.display_login'])

    }
}


function drawChord(matrix, labels, generalMetrics) {
    let fill = d3.scaleOrdinal(d3.schemeCategory20);
    let chord = d3.chord().padAngle(padding);

    let metricsBox = d3.select("#chord")
        .append("div")
        .attr("class", "box")
        .style("visibility", "hidden");

    let svg = d3.select("#chord")
        .append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


    svg.append("svg:g")
        .selectAll("path")
        .data(chord(matrix).groups)
        .enter()
        .append("svg:path")
        .style("fill", function (d) {
            return fill(d.index);
        })
        .style("stroke", function (d) {
            return "black";
        })
        .style("opacity", 0.5)
        .attr("d", d3.arc().innerRadius(rOut).outerRadius(rInner))
        .on("mouseover", fade(0.00, "visible"))
        .on("mousemove", fade(0.00, "visible"))
        .on("mouseout", fade(1, "hidden"));


    svg.append("svg:g")
        .attr("class", "chord")
        .selectAll("path")
        .data(chord(matrix))
        .enter()
        .append("svg:path")
        .filter(function (d) {
            return d.source.index != d.target.index;
        })
        .style("fill", function (d) {
            return "lightgray";
        })
        .attr("d", d3.ribbon().radius(rOut))
        .style("opacity", 1);

    let wrapper = svg.append("g").attr("class", "chordWrapper");

    let g = wrapper.selectAll("g.group")
        .data(chord(matrix).groups)
        .enter().append("g")
        .attr("class", "group");

    g.append("path")
        .style("stroke", function (d) {
            return fill(d.index);
        })
        .style("fill", function (d) {
            return fill(d.index);
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
            return labels[i];
        });


    function fade(opacity, showInfos) {
        return function (g, i) {
            svg.selectAll("g.chord path")
                .filter(function (d) {
                    return d.source.index != i && d.target.index != i;
                })
                .transition()
                .style("opacity", opacity);

            // svg.selectAll("g.chord path")
            //     .filter(function (d) {
            //         return d.target.index == i;
            //     })
            //     .transition()
            //     .style("fill", "grey");

            if (showInfos == "visible") {
                let language = labels[i];
                metricsBox.text("Coucou! I'm " + language + " + details soon!!")
            }
            metricsBox
                .style("color", "red")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                .style("visibility", showInfos);
        }
    }
}


function monthlyPRs(language, d) {
    return d.filter(x => x['language'] == language)
}

/*
d3.queue()
    .defer(d3.csv, languagesDataFile)
    .defer(d3.csv, networkDataFile)
    .defer(d3.csv, geralDataFile)
    .defer(d3.csv, statisticsDataFile)
    .await(function(error, languages, network, geralStats, stats) {

        network = network.map(rowConverterNetwork);
        stats = stats.map(rowConverterStatistics);
        geralStats = geralStats.map(rowConverterStatGeral)
        console.log(geralStats)

        let matrix = getMatrixCommonActors(network);
        let logMatrix = matrix.map(row => row.map(x => x > 15 ? Math.log(x) : 0));
        drawChord(matrix, languages['columns'])

    });
*/
    //'data/network_50_2017-07.csv';
    //'data/languages_50_2017-07.csv';

  d3.select("#date_picker")
        .attr("min", 7)
        .attr("max", 11)
        .attr("step", 1).on("input", function() {
        get_monthly_chord(17, this.value);
});
d3.select("#date_picker").attr("value", 7);
get_monthly_chord(17,7);

function get_monthly_chord(year_picked, month_picked){
  let date = ((month_picked < 10)?'0'+ month_picked:month_picked) + year_picked ;
  d3.select("#date_picker-value").text('Month '+ month_picked + ' of year 20' + year_picked);
  d3.select("#chord").selectAll("*").remove();
  d3.queue()
      .defer(d3.csv, 'data/languages_50_20' + date.substring(2,4) +'-' + date.substring(0,2) + '.csv')
      .defer(d3.csv, 'data/network_50_20' + date.substring(2,4) +'-' + date.substring(0,2) + '.csv')
      .defer(d3.csv, geralDataFile)
      .defer(d3.csv, statisticsDataFile)
      .await(function(error, languages, network, geralStats, stats) {

          network = network.map(rowConverterNetwork);
          stats = stats.map(rowConverterStatistics);
          geralStats = geralStats.map(rowConverterStatGeral)
          console.log(geralStats)

          let matrix = getMatrixCommonActors(network);
          drawChord(matrix, languages['columns'])

      });
    }
/*
    document.getElementById('july17').addEventListener('change', function(){
      get_monthly_chord(this);
      }
      ,false);
    document.getElementById('august17').addEventListener('change', function(){
      get_monthly_chord(this);
      }
      ,false);
      */
// d3.csv(languagesDataFile, function (error, languages) {
//     if (error) throw error;
//
//     d3.csv(networkDataFile, rowConverterNetwork, function (error, network) {
//
//         if (error) throw error;
//
//         d3.csv(statisticsDataFile, rowConverterStatistics, function (error, statistics) {
//
//             if (error) throw error;
//
//             console.log(monthlyPRs("Python", statistics));
//
//             let matrix = getMatrixCommonActors(network);
//             let logMatrix = matrix.map(row => row.map(x => x > 15 ? Math.log(x) : 0));
//
//             drawChord(logMatrix, languages['columns'])
//
//         });
//
//     });
// });
