let networkDataFile = 'data/network_50_2017-07.csv';
let languagesDataFile = 'data/languages_50_2017-07.csv';
const statisticsDataFile = 'data/agg_stats_2017-07-01_2017-11-30__processedat_2017-12-05.csv';
const geralDataFile = 'data/agg_general_2017-07-01_2017-11-30__processedat_2017-12-05.csv';

//create number formatting functions
var formatPercent = d3.format("%");
var numberFormat = d3.format(".1f");

let firstCall = 1;
const w = 900,
    h = 800,
    rInner = h / 2.6,
    rOut = rInner - 20,
    padding = 0.02;

const margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

filteredLanguages = [];

d3.select("#date_picker")
      .attr("min", 7)
      .attr("max", 11)
      .attr("step", 1).on("input", function() {
      get_monthly_chord(17, this.value);
});
d3.select("#date_picker").attr("value", 7);
get_monthly_chord(17,7);
d3.select("#clear_button")
  .style("opacity", 0)
  .on("click", returnAllLanguages);

function returnAllLanguages(){
    filteredLanguages.length = 0;
    d3.select('#filtered_languages')
              .selectAll('li')
              .remove();
    d3.select("#clear_button").style("opacity", 0);
    loadChords();
  }

function getMatrixCommonActors(data) {
    // This function is a simplified version of https://gist.github.com/eesur/0e9820fb577370a13099#file-mapper-js-L4
    let mmap = {}, matrix = [], counter = 0;
    let values = _.uniq(_.pluck(data, "language1"));
    values = values.filter( function(el) {
             return !filteredLanguages.includes(el);
             } );
    values.map(function (v) {
        if (!mmap[v]) {
            mmap[v] = {name: v, id: counter++, data: data}
        }
    });

    _.each(mmap, function (a) {
        if (!matrix[a.id]) matrix[a.id] = [];
        _.each(mmap, function (b) {
            let recs = _.filter(data, function (row) {
                return (row.language1 === a.name && row.language2 === b.name && !filteredLanguages.includes(a.name) && !filteredLanguages.includes(b.name));
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



//create the arc path data generator for the groups
let arc = d3.arc()
        .innerRadius(rOut)
        .outerRadius(rInner);

//create the chord path data generator for the chords
let path = d3.ribbon().radius(rOut);

let fill = d3.scaleOrdinal(d3.schemeCategory20);

//define the default chord layout parameters
//within a function that returns a new layout object;
//can create multiple chord layouts
//that are the same except for the data.
function getDefaultLayout() {
    return d3.chord().padAngle(padding).sortGroups(d3.descending);
}

let lastLayout; //store layout between updates
let matrixData;
let svg = d3.select("#chord");
function drawChord(matrix, labels, generalMetrics) {

   labels = labels.filter( function(el) {
            return !filteredLanguages.includes(el);
            } );
    console.log(labels);

    let metricsBox = d3.select("#chord");

    /*** Initialize the visualization ***/
    if(firstCall){
      metricsBox = metricsBox
          .append("div")
            .attr("class", "box")
            .style("visibility", "hidden");

      svg = svg
          .append("svg:svg")
            .attr("width", width)
            .attr("height", height)
          .append("svg:g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
      firstCall = 0;
    }

    let chord = getDefaultLayout();
    chord = chord(matrix);

    /* Create/update "group" elements */
    let groupG = svg.selectAll("g.group")
        .data(chord.groups);


    groupG.exit()
        .transition()
            .duration(1500)
            .attr("opacity", 0)
            .remove();
    //remove after transitions are complete
    let newGroups = groupG.enter().append("g")
        .attr("class", "group");
    //Create the title tooltip for the new groups
    newGroups.append("title")
        .text(function(d, i) {
          return numberFormat(d.value)
              + " Users using "
              + labels[i] + numberFormat(i) + "";
      });

    let tmp = newGroups.append("path")
              .style("fill", function (d) {
                  return fill(d.index);
              })
              .style("stroke", function (d) {
                  return "black";
              })
              .style("opacity", 0.5)
              .attr("d", arc)
              .on("mouseover", fade(0.00, "visible", labels, metricsBox))
              .on("mousemove", fade(0.00, "visible", labels, metricsBox))
              .on("mouseout", fade(1, "hidden", labels, metricsBox));

      //update the paths to match the layout
      groupG.select("path")
          .transition()
              .duration(1500)
              .attr("opacity", 0.5) //optional, just to observe the transition
          .attrTween("d", arcTween(lastLayout))
              .transition().duration(100).attr("opacity", 1) //reset opacity
          ;

      //create the group labels
        newGroups.append("svg:text")
            .each(function (d) {
                d.angle = (d.startAngle + d.endAngle) / 2;
            })
            .attr("class", "labels")
            .attr("dy", ".35em")
            .text(function (d, i) {
                return labels[i];
            })
            .attr("transform", function (d) {
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                    + "translate(" + (rInner + 5) + ")"
                    + (d.angle > Math.PI ? "rotate(180)" : "");
            })
            .style("text-anchor", function (d) {
                return d.angle > Math.PI ? "end" : null;
            })
            .on("click", function (d, i) {removeLanguage(d, i, labels)})
            .transition()
                .duration(1500)
                .attr("transform", function(d) {
                    d.angle = (d.startAngle + d.endAngle) / 2;
                    //store the midpoint angle in the data object
                    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
                        " translate(" + (rInner + 5) +  ")" +
                        (d.angle > Math.PI ? " rotate(180)" : " rotate(0)");
                    //include the rotate zero so that transforms can be interpolated
                })
                .style("text-anchor", function (d) {
                    return d.angle > Math.PI ? "end" : null;
                });
      /*
      newGroups.append("svg:text")
      .each(function (d) {
          d.angle = (d.startAngle + d.endAngle) / 2;
      })
        .attr("transform", function (d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (rInner + 5) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .style("text-anchor", function (d) {
            return d.angle > Math.PI ? "end" : null;
        })
        .on("click", function (d, i) {removeLanguage(d, i, labels)});
*/
      //position group labels to match layout
      /*groupG.select("text")
          .transition()
              .duration(1500)
              .attr("transform", function(d) {
                  d.angle = (d.startAngle + d.endAngle) / 2;
                  //store the midpoint angle in the data object
                  return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
                      " translate(" + (rInner + 5) +  ")" +
                      (d.angle > Math.PI ? " rotate(180)" : " rotate(0)");
                  //include the rotate zero so that transforms can be interpolated
              })
              .style("text-anchor", function (d) {
                  return d.angle > Math.PI ? "end" : null;
              })
              .on("click", function (d, i) {removeLanguage(d, i, labels)});
*/
      /* Create/update the chord paths */
      let chordPaths = svg.selectAll("path.chord")
          .data(chord, chordKey );

      //create the new chord paths
      let newChords = chordPaths.enter()
          .append("path")
          .filter(function (d) {
              return d.source.index != d.target.index;
          })
          .attr("class", "chord");

      // Add title tooltip for each new chord.
      newChords.append("title");

      // Update all chord title texts
      chordPaths.select("title")
          .text(function(d) {
                  return [numberFormat(d.source.value),
                          " Users using ",
                          labels[d.source.index],
                          " and ",
                          labels[d.target.index]].join("");
          });
      //handle exiting paths:
      chordPaths.exit().transition()
          .duration(1500)
          .attr("opacity", 0)
          .remove();

      //update the path shape
      chordPaths.transition()
          .duration(1500)
          .style("fill", function (d) {
              return "lightgray";
          })
          .attr("opacity", 0.5) //optional, just to observe the transition
          .attrTween("d", chordTween(lastLayout))
          .transition()
            .duration(100)
            .attr("d", path)
            .style("opacity", 1); //reset opacity

        groupG.on("mouseover", function(d) {
            chordPaths.classed("fade", function (p) {
                return ((p.source.index != d.index) && (p.target.index != d.index));
            });
        svg.on("mouseout", function() {
            if (this == svg.node() )
                //only respond to mouseout of the entire circle
                //not mouseout events for sub-components
                chordPaths.classed("fade", false);
        });
        });
      lastLayout = chord;

/*
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
            .attr("d", path)
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
            })
            .on("click", function (d, i) {removeLanguage(d, i, labels)});
*/
}

function arcTween(oldLayout) {
    //this function will be called once per update cycle
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
            return path(tween(t));
        };
    };
}
function chordKey(data) {
    return (data.source.index < data.target.index) ?
        data.source.index  + "-" + data.target.index:
        data.target.index  + "-" + data.source.index;

    //create a key that will represent the relationship
    //between these two groups *regardless*
    //of which group is called 'source' and which 'target'
}
function fade(opacity, showInfos, labels, metricsBox) {
    return function (g, i) {
        let svg = d3.select("#chord");
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

function removeLanguage(d, i, labels) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        filteredLanguages.push(labels[i]);
        //alert(labels[i]);
        updateFilters();
        loadChords();
}

function returnLanguage(language, i){
    let index = filteredLanguages.indexOf(language);
    filteredLanguages.splice(index, 1);
    //filters.exit().remove();

    d3.select('#'+language).remove();
    updateFilters();
    loadChords();
    console.log(filteredLanguages)
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

function loadChords(){
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
    drawChord(matrix, languages['columns'])
    });
}

function get_monthly_chord(year_picked, month_picked){
  let date = ((month_picked < 10)?'0'+ month_picked:month_picked) + year_picked ;
  d3.select("#date_picker-value").text('Month '+ month_picked + ' of year 20' + year_picked);
  languagesDataFile = 'data/languages_50_20' + date.substring(2,4) +'-' + date.substring(0,2) + '.csv';
  networkDataFile = 'data/network_50_20' + date.substring(2,4) +'-' + date.substring(0,2) + '.csv';
  loadChords();
  }



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
