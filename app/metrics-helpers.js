const lookupNiceVariableNames = {'days_open_merged': 'Mean of days between open and merged',
                                 'payload.pull_request.base.repo.open_issues_count': 'Mean of open issues per repo',
                                 'payload.pull_request.changed_files': 'Mean of Changed files per PR',
                                 'payload.pull_request.comments': 'Mean of comments per PR',
                                 'payload.pull_request.number': "Mean of PR's number",
                                 'payload.pull_request.commits': 'Mean of commits per PR'};


function drawMetrics(languageStats, allStats, statistic) {

    let metricName = lookupNiceVariableNames[statistic];

    let filteredStats = languageStats
        .filter(x => x['statistic'] == statistic & x['metric'] == 'mean')
        .map(x => [x['cohort'], x['value']]);

    let geralMean = allStats
        .filter(x => x['statistic'] == statistic & x['metric'] == 'mean')
        .map(x => [x['cohort'], x['value']]);

    let yMax = allStats.filter(x => x['statistic'] == statistic & x['metric'] == '95%')
        .map(x => x['value'])
        .reduce(function (a, b) {
            return Math.max(a,b)
        });

    let yMin = allStats.filter(x => x['statistic'] == statistic & x['metric'] == '5%')
        .map(x => x['value'])
        .reduce(function (a, b) {
            return Math.min(a, b)
        });

    let svg = d3.select("#side-menu")
        .append("svg:svg")
        .attr("width", wMetrics)
        .attr("height", hMetrics)
        .append("svg:g");

    g = svg.append("g")
        .attr("transform", "translate(" + marginMetrics.left + "," + marginMetrics.top + ")");

    let x = d3.scaleTime()
        .rangeRound([0, widthMetrics]);

    let y = d3.scaleLinear()
        .domain([yMin, yMax])
        .rangeRound([heightMetrics, 0]);

    x.domain(d3.extent(filteredStats, function (d) {
        return d[0];
    }));

    let nObs = filteredStats.length;
    g.append("g")
        .attr("transform", "translate(0," + heightMetrics + ")")
        .call(d3.axisBottom(x)
            .ticks(nObs + 1)
            .tickFormat(d3.timeFormat("%b"))
        );

    let line = d3.line()
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
        .datum(filteredStats)
        .attr("fill", "none")
        .attr("stroke", lookupLegendColors['Mean of language'])
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    g.append("path")
        .datum(geralMean)
        .attr("fill", "none")
        .attr("stroke", lookupLegendColors['Mean of all'])
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .style("stroke-dasharray", ("3, 3"))
        .attr("stroke-width", 1.2)
        .attr("d", line);

    g.append("text")
        .attr("x", (widthMetrics / 2))
        .attr("y", 0 - (marginMetrics.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(metricName);
}