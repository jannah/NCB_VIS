/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).on('ready', function () {
    initNCB();
});
var data;
var summaryFile = 'data/summary_flat.csv';
var notesFile = 'data/notes.json';
var nodesFile = 'data/nodes.csv';
function initNCB()
{
    data = loadData(summaryFile);
    sankeyData = loadSankeyData();
    nodesData = loadData(nodesFile)
//    console.log(sankeyData);
    drawSankey(sankeyData, nodesData, '#sankey');
    notes = loadNotes();
//    console.log(data);
    var c1 = new tableChart();
    var assets = _.filter(data, {Type: 'Assets'});
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
function loadData(dataFile)
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
            + "<span class='year y1 " + d[0].values[0].class + "'> (" + d[0].values[0].Year + ")</span>"
            + "<span class='amount y1 " + d[0].values[0].class + "'> " + format(d[0].values[0].Amount) + " SR</span><br>"
            + "<span class='year y2 " + d[1].values[0].class + "'> (" + d[1].values[0].Year + ")</span>"
            + "<span class='amount y2 " + d[1].values[0].class + "'> " + format(d[1].values[0].Amount) + " SR</span>"
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
                        var title = note ? note.note + '. ' + note.title : d;
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
                if (d.values[0].values[0]['class'] !== 'title') {
                    bar.append('rect')
                            .attr({
                                x: axisW,
                                y: yScale(d.key),
                                height: yScale.rangeBand(),
                                width: cw,
                                class: 'ncb-tooltip placeholder',
                                title: getTitleHTML(d.values)
                            });
                }
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

    return chart;
}

//var sankey

var sankeyFile = 'data/sankey.csv';
function loadSankeyData(dafaFile)
{
    var data = loadData(sankeyFile);
    console.log(data);

    var graph = {"nodes": [], "links": []};

    data.forEach(function (d) {
        graph.nodes.push({"name": d.source});
        graph.nodes.push({"name": d.target});
        graph.links.push({"source": d.source,
            "target": d.target,
            "value": +d.value});
    });

    // return only the distinct / unique nodes
    graph.nodes = d3.keys(d3.nest()
            .key(function (d) {
                return d.name;
            })
            .map(graph.nodes));

    // loop through each link replacing the text with its index from node
    graph.links.forEach(function (d, i) {
        graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
        graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
    });

    //now loop through each nodes to make nodes an array of objects
    // rather than an array of strings
    graph.nodes.forEach(function (d, i) {
        graph.nodes[i] = {"name": d};
    });
    return graph;
}

var drawSankey = function (sankeyData, nodesData, target) {


    var margin = {top: 10, right: 10, bottom: 2, left: 10},
    width = $(target).width() - margin.left - margin.right,
            height = $(target).height() - margin.top - margin.bottom;

    var formatNumber = d3.format("0,000"),
            format = function (d) {
                return formatNumber(d) + " SR";
            },
            color = d3.scale.category20();

    var svg = d3.select(target).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(24)
            .size([width, height]);

    var path = sankey.link();


    sankey
            .nodes(sankeyData.nodes)
            .links(sankeyData.links)
            .layout(128);

    var link = svg.append("g").selectAll(".link")
            .data(sankeyData.links)
            .enter().append("path")
            .attr("class", function (d) {
                c = _.select(nodesData, {name: d.target.name})[0]
                return "link ncb-tooltip " + c.group_stroke;
            })
            .attr("d", path)
            .attr('title', function (d) {
                return d.source.name + " → " + d.target.name + "\n" + format(d.value);
            })
            .style("stroke-width", function (d) {
                return Math.max(1, d.dy);
            })
            .sort(function (a, b) {
                return b.dy - a.dy;
            });
    /*
     link.append("title")
     .text(function (d) {
     return d.source.name + " → " + d.target.name + "\n" + format(d.value);
     });
     */
    var node = svg.append("g").selectAll(".node")
            .data(sankeyData.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .call(d3.behavior.drag()
                    .origin(function (d) {
                        return d;
                    })
                    .on("dragstart", function () {
                        this.parentNode.appendChild(this);
                    })
                    .on("drag", dragmove));

    node.append("rect")
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth())
            .attr('class', function (d) {
                console.log(d);

                var d2 = _.select(nodesData, {name: d.name})[0];
                console.log(d2);
                return d2.group;
            })
            .classed('ncb-tooltip', true)
            .attr('title', function (d) {
//                console.log(d);
                return d.name + '<br>' + format(d.value);
            })
//          /*  .style("fill", function (d) {
//                return d.color = color(d.name.replace(/ .*/, ""));
//            })
//  /          .style("stroke", function (d) {
//                return d3.rgb(d.color).darker(2);
//            })*/
            .append("title")
            .text(function (d) {
                return d.name + "\n" + format(d.value);
            });


    var tt = node.append("text")
            .attr("x", -6)
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .attr("dy", "0em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .attr('class', 'ncb-tooltip')
            .attr('title', function (d) {
                return d.name + "\n" + format(d.value);
            });
    tt1 = tt.append('tspan')
            .attr({x: -6, dy: '0em'})
            .text(function (d) {
                var names = d.name.split(' ');
                left = names.splice(0, 5);
                return left.join(' ');
            })
//            .attr('class', 'ncb-tooltip')
            .attr('title', function (d) {
                return d.name + "\n" + format(d.value);
            });
    tt2 = tt.append('tspan')
            .attr({x: -6, dy: '1em'})
            .text(function (d) {
                var names = d.name.split(' ');
                left = names.splice(0, 5);
//                console.log(names);
                return names.join(' ');
            })
//            .attr('class', 'ncb-tooltip')
            .attr('title', function (d) {
                return d.name + "\n" + format(d.value);
            });
    ;

    tt.filter(function (d) {
        return d.x < width / 2;
    })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");
    tt1.filter(function (d) {
        return d.x < width / 2;
    }).attr("x", 6 + sankey.nodeWidth());
    tt2.filter(function (d) {
        return d.x < width / 2;
    }).attr("x", 6 + sankey.nodeWidth());

    function dragmove(d) {
        d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
        sankey.relayout();
        link.attr("d", path);
    }



};