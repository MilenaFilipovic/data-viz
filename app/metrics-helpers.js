const lookupNiceVariableNames = {'days_open_merged': 'Mean of days between open and merged',
                                 'payload.pull_request.base.repo.open_issues_count': 'Mean of open issues per repo',
                                 'payload.pull_request.changed_files': 'Mean of Changed files per PR',
                                 'payload.pull_request.comments': 'Mean of comments per PR',
                                 'payload.pull_request.number': "Mean of PR's number"};


function statsOfAllLanguages(stats) {
    statistics = stats.map(x => x['statistic'])

        // console.log(stats[0])
    return {}
}


function drawMetrics(languageStats, language, statistic) {

    let name = lookupNiceVariableNames[statistic];

    let daysOpenMerged = languageStats
        .filter(x => x['statistic'] == statistic & x['metric'] == "mean")
        .map(x => [x['cohort'], x['value']]);

    let svg = d3.select("#metrics-box")
        .append("svg:svg")
        .attr("width", wMetrics)
        .attr("height", hMetrics)
        .append("svg:g");

    g = svg.append("g")
        .attr("transform", "translate(" + marginMetrics.left + "," + marginMetrics.top + ")");

    var x = d3.scaleTime()
        .rangeRound([0, widthMetrics]);

    var y = d3.scaleLinear()
        .domain([0, 10])
        .rangeRound([heightMetrics, 0]);

    x.domain(d3.extent(daysOpenMerged, function (d) {
        return d[0];
    }));

    let nObs = daysOpenMerged.length;
    g.append("g")
        .attr("transform", "translate(0," + heightMetrics + ")")
        .call(d3.axisBottom(x).ticks(nObs + 1));

    var line = d3.line()
        .x(function (d) {
            return x(d[0]);
        })
        .y(function (d) {
            return y(d[1]);
        });

    g.append("g")
        .call(d3.axisLeft(y).ticks(nObs + 2))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("dy", "0.71em");

    g.append("path")
        .datum(daysOpenMerged)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);

}