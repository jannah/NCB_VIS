/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).on('ready', function () {
    initNCB();
});
var data;
var dataFile = 'data/summary_flat.csv';
var notesFile = 'data/notes.json';
function initNCB()
{
    data = loadData();
    notes = loadNotes();
    console.log(data);
    var c1 = new tableChart();
//    var assets = _.filter(data, {Type: 'Assets'});
//    console.log(assets);
    c1.draw(data, '#chart');
    activateTooltip();
}
function activateTooltip() {
    $('.ncb-tooltip').tooltip({html: true,
        'container': 'body',
        'placement': 'top'});
    $('.axis-text').popover({html: true,
        'container': 'body',
        'placement': 'right',
        'viewport': 'body'});
}
function loadData()
{
    var jqxhr = $.ajax({
        url: dataFile,
        async: false
    });
    var dataText = jqxhr.responseText;
    return loadCSV(dataText);
}
function loadNotes()
{
    var notesJSON = loadJSON(notesFile);
    _.forEach(notesJSON, function (d, i, a) {
        a[i].data = loadCSV(d.data, false);
    })
    console.log(notesJSON);
    return notesJSON;
}
function getNote(n)
{
//    console.log(n);
    var note = _.select(notes, {'note': n})[0];
//    console.log(note);
    return note;
}
function csvToHTML(csvData)
{
    var html = "<table class='table'>";
    format = d3.format("0,000");
    _.forEach(csvData, function (row, i)
    {
        html += "<tr>"
        _.forEach(row, function (cell) {

            var value = _.isNumber(cell) ? format(cell) : cell;
            html += "<td>" + value + "</td>"
        });

        html += "</tr>";
    });

    html += "</table>";
    return html;
}
function textToHTML(text) {
    text = text.split('\n');
    var html = "";

    _.forEach(text, function (t) {
        html += "<p>" + t + "</p>";
    });
    return html;
}
function getNoteHTML(n)
{
    var note = getNote(n);
    var html = "";
    if (note) {
        html = "<div class='note-body'>"
//                + "<div class='note-header'>" + note.title + "</div>"
                + "<div class='note-data'>" + csvToHTML(note.data) + "</div>"
                + "<div class='note-text'>" + textToHTML(note.text) + "</div>"
                + "</div>";
//        console.log(html);
    }
    return html;
}
function getTitleHTML(d) {
    format = d3.format("0,000");
    var html = "<div class='tooltip-body'>"
            + "<span class='item'>" + d[0].values[0].Item + "</span><br>"
            + "<span class='year y1 " + d[0].values[0].call + "'> (" + d[0].values[0].Year + ")</span>"
            + "<span class='amount y1 " + d[0].values[0].call + "'> " + format(d[0].values[0].Amount) + " SR</span><br>"
            + "<span class='year y2 " + d[1].values[0].call + "'> (" + d[1].values[0].Year + ")</span>"
            + "<span class='amount y2 " + d[1].values[0].call + "'> " + format(d[1].values[0].Amount) + " SR</span>"
            + "</div>";
    return html;
//            return d.Item + ' (' + d.Year + '): ' + format(d.Amount) + ' SR';
}

function loadJSON(jsonFile)
{
    var jqxhr = $.ajax({
        url: jsonFile,
        responseType: 'JSON',
        async: false
    });
    return jqxhr.responseJSON;
}


function loadCSV(csvText, header)
{
    var result = Papa.parse(csvText, {header: _.isUndefined(header) ? true : header, dynamicTyping: true, skipEmptyLines: true});
    return result.data;
}


var tableChart = function () {

    var chart = {};
    chart.draw = function (data, target, options)
    {


        var chartData = d3.nest()
                .key(function (d) {
                    return d.Item;
                })
                .key(function (d) {
                    return d.Year;
                })
                .entries(data);
        console.log(chartData);
        ;
        var titlesMap = {};

        _.forEach(chartData, function (d) {
//            console.log(d.values[0].values[0].class);
//            var result = {};
            titlesMap[d.key] = d.values[0].values[0].class;
//            return result;
        });
//        console.log(titlesMap);
        var max_cat_length = d3.max(data, function (d) {
            return d.Item.length;
        });
        var w = $(target).width(), h = $(target).height(), ch = h,
                axisW = max_cat_length * 7, cw = w - axisW,
                rowH = chartData.length;

        var max = d3.max(data, function (d) {
            return d.Amount;
        });

        console.log(w + '\t' + h);
        var svg = d3.select(target).append('svg').attr({width: w, height: h});
        var xScale = d3.scale.linear().domain([0, max]).range([0, cw]);
        var yScale = d3.scale.ordinal().rangeBands([0, h], .1, 1)
                .domain(data.map(function (d)
                {
                    return d.Item;
                }));
        var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom')
                .ticks(5)
                .tickFormat(function (d) {
                    var prefix = d3.formatPrefix(d);
                    return prefix.scale(d) + 'B';
                })
                .tickSize(-ch)
                .tickSubdivide(true);
//                .tickSize(1);
        var yAxis = d3.svg.axis().scale(yScale).orient('left');
        var yAxisGroup = svg.append('g').attr(
                {
                    class: "y axis",
                    width: w - cw,
                    height: ch
                }).append("g").attr("transform", "translate(" + (w - cw) + "," + 0 + ")")
                .call(yAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr({
                    class: function (d) {
                        return titlesMap[d];
//                        console.log(d);
                    },
                    "data-toggle": "popover",
                    title: function (d) {
                        var el = _.select(data, {'Item': d})[0];
                        var note = getNote(el.Note);
                        var title = note ? note.title : d;
                        return  title;
                    },
                    "data-content": function (d) {
                        var el = _.select(data, {'Item': d})[0];
//                        console.log(el.Note);
                        return getNoteHTML(el.Note);
                    }
                }).classed('axis-text', true);
        var xAxisGroup = svg.append('g').attr({
            'class': 'x axis',
            width: cw,
            height: 30,
            transform: 'translate(' + (w - cw) + ',' + (ch - 20) + ')'
        }).call(xAxis);

        bars = svg.append('g');
        _.forEach(chartData, function (d) {
//            console.log(d.values);
            var bar = bars.append('g');
            var amount1 = xScale(+d.values[0].values[0].Amount);
            var amount2 = xScale(+d.values[1].values[0].Amount);
            if (d.class !== 'title') {
                bar.append('rect')
                        .attr({
                            x: amount2 >= 0 ? axisW : axisW + amount2,
                            y: yScale(d.key),
                            height: yScale.rangeBand(),
                            width: Math.abs(amount2),
                            class: 'ncb-tooltip y2 ' + d.values[1].values[0]['class'] + (amount2 < 0 ? ' negative' : ''),
                            'data-year': d.values[1].values[0].Year,
                            'data-amount': d.values[1].values[0].Amount,
                            title: getTitleHTML(d.values)
                        });

                bar.append('rect')
                        .attr({
                            x: amount1 >= 0 ? axisW : axisW + amount1,
                            y: yScale(d.key) + yScale.rangeBand() / 4,
                            height: yScale.rangeBand() / 2,
                            width: Math.abs(amount1),
                            class: 'ncb-tooltip y1 ' + d.values[0].values[0]['class'] + (amount1 < 0 ? ' negative' : ''),
                            'data-year': d.values[0].values[0].Year,
                            'data-amount': d.values[0].values[0].Amount,
                            title: getTitleHTML(d.values)


                        });
            }
//            bar.append('text')
//                    .attr({
//                    });

        });
        /*  
         var bars = svg.append('g').selectAll('rect')
         .data(chartData).enter()
         .append('rect')
         .attr({
         x: axisW,
         y: function (d) {
         //                        console.log(d.key + '\t' + yScale(d.key)+'\t'+yScale.rangeBand());
         return yScale(d.key);
         },
         height: yScale.rangeBand() / 2,
         width: function (d) {
         console.log(d);
         return xScale(d.values[0].values[0].Amount);
         }
         })
         .append('rect')
         .attr({
         x: axisW,
         y: function (d) {
         return yScale(d.key) + yScale.rangeBand() / 2;
         },
         height: yScale.rangeBand() / 2,
         width: function (d) {
         console.log(d);
         return xScale(d.values[1].values[0].Amount);
         }
         });
         */
//        var yAxis = d3.axis.orien('bottom').call(yScale);
    };
    chart.draw2 = function (data, target, options)
    {


        var chartData = d3.nest()
                .key(function (d) {
                    return d.Type;
                })
                .key(function (d) {
                    return d.Item;
                })
                /*.key(function (d) {
                 return d.Year;
                 })*/
                .entries(data);
        console.log(chartData);
        _.forEach(chartData, function (d, i, a) {
//            console.log(a[i]);
            var total = d3.nest()
                    .key(function (d2) {

                        console.log(d2);
                        return 'Total ' + d2.Type;
                    })
                    .rollup(function (leaves) {
//                        console.log(leaves);
                        var item = _.forEach(leaves[0].values, function (l, i2)
                        {
                            var t = d3.sum(leaves, function (x) {
//                                console.log(x);
//                                console.log(x.values[i2].Amount);
                                return x.values[i2].Amount;
                            });
                            console.log(t);
                            return t;
                        });
                        console.log(item);
                        return item;
                    })
                    .entries(d.values);
            console.log(total);
        });
        console.log(chartData);
        var stats = d3.nest()
                .key(function (d) {
                    return d.Type;
                })
                .key(function (d) {
                    return d.Year;
                })
                .rollup(function (leaves) {
                    return {
                        total: d3.sum(leaves, function (d) {
//                            console.log(d);
                            return d.Amount;
                        }),
                        count: leaves.length};
                })
                .entries(data);
        console.log(stats);
        var max = d3.max(stats, function (d) {
//            console.log(d);
            return d3.max(d.values, function (d2) {
//                console.log(d2);
                return d2.values.total;
            });
        });
        var titles = d3.nest()
                .key(function (d) {
                    return d.Item;
                })
                .entries(data);
        console.log(titles);
        var max_cat_length = d3.max(titles, function (d) {
            return d.key.length;
        });
        console.log(max_cat_length);
        var w = $(target).width(), h = $(target).height(),
                axisW = max_cat_length * 2, cw = w - axisW,
                rowH = titles.length + chartData.length;
        var svg = d3.select(target).append('svg');
        var xScale = d3.scale.linear().domain([0, max]).range([0, w]);
        var yScale = d3.scale.ordinal().rangeBands([0, w], .1, 1)
                .domain(data.map(function (d)
                {
                    return d.Item;
                }));
        var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('left');
//        var yAxis = d3.axis.orien('bottom').call(yScale);
    };
    return chart;
}