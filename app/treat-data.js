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