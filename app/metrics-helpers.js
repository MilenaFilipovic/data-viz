const lookupNiceVariableNames = {
  'days_open_merged': 'Average # of days between open and merged',
  'payload.pull_request.base.repo.open_issues_count': 'Average # of open issues per repository',
  'payload.pull_request.changed_files': 'Average # of changed files per Pull Request',
  'payload.pull_request.comments': 'Average # of comments per Pull Request',
  'payload.pull_request.number': 'Average # of Pull Requests',
  'payload.pull_request.commits': 'Average # of commits per Pull Request',
  'number_prs': 'Total number of opened pull requests',
  'number_actors': 'Total number of unique actors',
  //    PUT NUMBER OF CLOSED / MERGED PRS
};


function drawGraphs(metricName, filteredStats, generalMean) {
  let yMax = 1.2 * math.max(filteredStats.concat(generalMean).map(x => x[1])),
    yMin = 0.8 * math.max(math.min(filteredStats.concat(generalMean).map(x => x[1])), 0);

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

  x.domain(d3.extent(filteredStats, function(d) {
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
    .x(function(d) {
      return x(d[0]);
    })
    .y(function(d) {
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
    .attr("stroke", lookupLegendColors['Selected language'])
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  g.append("path")
    .datum(generalMean)
    .attr("fill", "none")
    .attr("stroke", lookupLegendColors['Average across all languages'])
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



  let focus_lang = g.append("g")
    .attr("class", "focus")
    .style("display", "none");

  let focus_mean = g.append("g")
    .attr("class", "focus")
    .style("display", "none");

  let focus = [];
  focus[0] = focus_lang;
  focus[1] = focus_mean;

  for (i = 0; i < 2; i++) {


    focus[i].append("line")
      .attr("class", "y-hover-line hover-line")
      .attr("y1", 0)
      .attr("y2", heightMetrics);

    focus[i].append("line")
      .attr("class", "x-hover-line hover-line")
      .attr("x1", widthMetrics)
      .attr("x2", widthMetrics);

    focus[i].append("circle")
      .attr("r", 3);

    focus[i].append("text")
      .attr("x", 15)
      .attr("dy", "-.45em")
      .attr("font-size", "12px")
      .attr('font-weight', 'bold');
  }

  svg.append("rect")
    .attr("transform", "translate(" + marginMetrics.left + "," + marginMetrics.top + ")")
    .attr("class", "overlay")
    .attr("width", widthMetrics)
    .attr("height", heightMetrics)
    .on("mouseover", function() {
      for (i = 0; i < 2; i++) {
        focus[i].style("display", null);
      }
    })
    .on("mouseout", function() {
      for (i = 0; i < 2; i++) {
        focus[i].style("display", "none");
      }
    })
    .on("mousemove", mousemove);

    let bisectDate = d3.bisector(function(d) {
      return d[0];
    }).left;

  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]),
      i = bisectDate(filteredStats, x0, 1),
      d0 = filteredStats[i - 1],
      d1 = filteredStats[i],
      g0 = generalMean[i - 1],
      g1 = generalMean[i];

    var met = [];
    met[0] = x0 - d0.year > d1.year - x0 ? d1 : d0;
    met[1] = x0 - g0.year > g1.year - x0 ? g1 : g0;

    for (i = 0; i < 2; i++) {
      focus[i].attr("transform", "translate(" + x(met[i][0]) + "," + y(met[i][1]) + ")");
      focus[i].select("text").text(function() {
        return math.round(met[i][1], 1);
      });
      focus[i].select(".x-hover-line").attr("x2", widthMetrics + widthMetrics);
      focus[i].select(".y-hover-line").attr("y2", heightMetrics - y(met[i][1]));
    }
  }
}

function drawMetrics(languageStats, allStats, statistic) {
  /**
   * Draw charts in side bar
   *
   * @param {array} languageStats - array with aggregate statistics for a specify language
   * @param {array} allStats - array with aggregate statistics of all languages
   * @param {string} statistic - metric that will be drawed and it filters languageStats and allStats too
   */

  let metricName = lookupNiceVariableNames[statistic];

  let filteredStats = languageStats
    .filter(x => x['statistic'] == statistic & x['metric'] == 'mean')
    .map(x => [x['cohort'], x['value']]);

  let generalMean = allStats
    .filter(x => x['statistic'] == statistic & x['metric'] == 'mean')
    .map(x => [x['cohort'], x['value']]);

  drawGraphs(metricName, filteredStats, generalMean);
}


function drawgeneralMetrics(generalStatistcs, statistic, language) {
  /**
   * Draw charts in side bar (this is almost the same this that in `drawMetrics` but it was split in a different
   * function due to the schema of the files are different and it would require a change in package `grab_data` )
   *
   * @param {array} generalStatistics - array with PR and common actors of all languages
   * @param {string} statistic - metric that will be drawed
   * @param {string} language - selected language
   */

  let metricName = lookupNiceVariableNames[statistic];

  let filteredStats = generalStatistcs
    .filter(x => x['language'] == language)
    .map(x => [x['cohort'], x[statistic]]);

  let generalMean = generalStatistcs
    .filter(x => x['language'] == 'all')
    .map(x => [x['cohort'], x[statistic]]);

  drawGraphs(metricName, filteredStats, generalMean);
}
