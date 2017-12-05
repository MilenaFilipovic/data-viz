const networkDataFile = 'data/network_50_2017-08-01_2017-10-31__processedat_2017-12-04.csv';
const languagesDataFile = 'data/langues_50_2017-08-01_2017-10-31__processedat_2017-12-04.csv';

const w = 900,
      h = 800,
      rInner = h / 2.4,
      rOut = rInner - 20,
      padding = 0.01,
      textDist = 60;

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


function rowConverter(d) {
    return {
        language1: d.language1,
        language2: d.language2,
        common_actors: parseFloat(d.common_actors)
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
            return fill(d.index);
        })
        .style("opacity", 0.5)
        .attr("d", d3.arc().innerRadius(rOut).outerRadius(rInner))
        .on("mouseover", fade(0.05, "visible"))
        .on("mousemove", fade(0.05, "visible"))
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
                return fill(d.source.index);
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
        .attr("class", "labels")
        .style("text-anchor", "middle")
        .attr("xlink:href", "#wavy")
        .attr("startOffset", "50%")
        .each(function (d) {
            d.angle = ((d.startAngle + d.endAngle) / 2);
        })
        .attr("transform", function (d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (Math.min(width, height) / 2 - textDist) + ")"
                + "rotate(90)"
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


d3.csv(languagesDataFile, function (error, languages) {
    if (error) throw error;

    d3.csv(networkDataFile, rowConverter, function (error, data) {
        if (error) throw error;

        console.log(languages)
        let matrix = getMatrixCommonActors(data);
        let logMatrix = matrix.map(row => row.map(x => x!=0 ? Math.log(x): 0));

        drawChord(logMatrix, languages['columns'])

    });
});
