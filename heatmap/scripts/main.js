define(['scripts/d3.v3', 'scripts/elasticsearch'], function(d3, elasticsearch) {
  // "use strict";
  var margin = {
    top: 150,
    right: 10,
    bottom: 50,
    left: 100
  }
  var cellSize = 10;
  var col_number = 100;
  var legendElementWidth = cellSize * 3
  var colorBuckets = 21
  var colors = ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"]
  var client = new elasticsearch.Client({
    hosts: [
      'localhost:9200'
    ],
    sniffOnStart: true,
    log: {
      level: 'trace'
    }
  });
  var index_prefix = 'logstash-medium-db-'
  var today = new Date();
  var yesterday = today.setDate(today.getDate() - 1);
  // var year = today.getUTCFullYear();
  // var month = today.getUTCMonth()
  // var day = today.getUTCDate();
  var indexes = index_prefix + today.getUTCFullYear() + '.' +  ("0" + (today.getUTCMonth() + 1)).slice(-2)  + '.' + today.getUTCDate();
  indexes = 'logstash-medium-db-2015.02.14'
  client.search({
    index: indexes,
    scroll: '60s',
    body: {
      "facets": {
        "terms": {
          "terms": {
            "field": "hashKey",
            "order": "count",
            "size": 3000,
            "exclude": []
          },
          "facet_filter": {
            "fquery": {
              "query": {
                "filtered": {
                  "filter": {
                    "bool": {
                      "must": [{
                        "range": {
                          "@timestamp": {
                            "from": 1423899153820,
                            "to": 1423985553820
                          }
                        }
                      }, {
                        "terms": {
                          "table": [
                            "postdelta"
                          ]
                        }
                      }]
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }).then(function(resp) {
    // console.log(resp)
    // hits = resp.hits.hits
    terms = resp.facets.terms.terms
    i = 0
    data = terms.map(function(v) { 
      return { 'col' : +i % col_number, 'row' :  Math.floor(i++/col_number), 'value': +v.count, 'hashKey': v.term }
    }).sort(function(a, b) {
      if (a.row == b.row) {
        return parseFloat(+a.col) - parseFloat(+b.col)
      } else {
        return parseFloat(+a.row) - parseFloat(+b.row)
      }
    });
    min = data[data.length - 1].value
    max = data[0].value
    var row_number = Math.floor(data.length / col_number)
    var width = cellSize * col_number
    var height = cellSize * row_number
    var rowLabel = new Array(row_number)
    // for(var i = 0; i < row_number; i++){
    //   rowLabel[i] = (i * col_number).toString()
    // }
    var colorScale = d3.scale.quantile()
      .domain([min, max])
      .range(colors);
    var svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var rowSortOrder = false;
    var colSortOrder = false;
    var rowLabels = ""
    // svg.append("g")
    //   .selectAll(".rowLabelg")
    //   .data(rowLabel)
    //   .enter()
    //   .append("text")
    //   .text(function(d) {
    //     return d;
    //   })
    //   .attr("x", 0)
    //   .attr("y", function(d, i) {
    //     return (i + 1) * cellSize;
    //   })
    //   .style("text-anchor", "end")
    //   .attr("transform", "translate(-6," + cellSize / 1.5 + ")")
    //   .attr("class", function(d, i) {
    //     return "rowLabel mono r" + i;
    //   })
    //   .on("mouseover", function(d) {
    //     d3.select(this).classed("text-hover", true);
    //   })
    //   .on("mouseout", function(d) {
    //     d3.select(this).classed("text-hover", false);
    //   })
    //   .on("click", function(d, i) {
    //     rowSortOrder = !rowSortOrder;
    //     sortbylabel("r", i, rowSortOrder);
    //     d3.select("#order").property("selectedIndex", 4).node().focus();;
    //   });

    var colLabels = ""
    // svg.append("g")
    //   .selectAll(".colLabelg")
    //   .data(colLabel)
    //   .enter()
    //   .append("text")
    //   .text(function(d) {
    //     return d;
    //   })
    //   .attr("x", 0)
    //   .attr("y", function(d, i) {
    //     return (i + 1) * cellSize;
    //   })
    //   .style("text-anchor", "left")
    //   .attr("transform", "translate(" + cellSize / 2 + ",-6) rotate (-90)")
    //   .attr("class", function(d, i) {
    //     return "colLabel mono c" + i;
    //   })
    //   .on("mouseover", function(d) {
    //     d3.select(this).classed("text-hover", true);
    //   })
    //   .on("mouseout", function(d) {
    //     d3.select(this).classed("text-hover", false);
    //   })
    //   .on("click", function(d, i) {
    //     colSortOrder = !colSortOrder;
    //     sortbylabel("c", i, colSortOrder);
    //     d3.select("#order").property("selectedIndex", 4).node().focus();;
    //   });

    var heatMap = svg.append("g").attr("class", "g3")
      .selectAll(".cellg")
      .data(data, function(d) {
        return d.row + ":" + d.col;
      })
      .enter()
      .append("rect")
      .attr("x", function(d) {
        return d.col * cellSize;
      })
      .attr("y", function(d) {
        return d.row * cellSize;
      })
      .attr("class", function(d) {
        return "cell cell-border cr" + (d.row - 1) + " cc" + (d.col - 1);
      })
      .attr("width", cellSize)
      .attr("height", cellSize)
      .style("fill", function(d) {
        return colorScale(d.value);
      })
      .on("click", function(d) {
        var rowtext = d3.select(".r" + (d.row - 1));
        if (rowtext.classed("text-selected") == false) {
          rowtext.classed("text-selected", true);
        } else {
          rowtext.classed("text-selected", false);
        }
      })
      .on("mouseover", function(d) {
        //highlight text
        d3.select(this).classed("cell-hover", true);
        d3.selectAll(".rowLabel").classed("text-highlight", function(r, ri) {
          return ri == (d.row - 1);
        });
        d3.selectAll(".colLabel").classed("text-highlight", function(c, ci) {
          return ci == (d.col - 1);
        });

        //Update the tooltip position and value
        d3.select("#tooltip")
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 10) + "px")
          .select("#value")
          .text("hashKey: " + d.hashKey + "\nHits: " + d.value);
        //Show the tooltip
        d3.select("#tooltip").classed("hidden", false);
      })
      .on("mouseout", function() {
        d3.select(this).classed("cell-hover", false);
        d3.selectAll(".rowLabel").classed("text-highlight", false);
        d3.selectAll(".colLabel").classed("text-highlight", false);
        d3.select("#tooltip").classed("hidden", true);
      });
    var o = d3.scale.ordinal()
        .domain(colors)
        .rangeRoundBands([min, max]);
    var legend = svg.selectAll(".legend")
      .data(o.range())
      .enter().append("g")
      .attr("class", "legend");

    legend.append("rect")
      .attr("x", function(d, i) {
        return legendElementWidth * i;
      })
      .attr("y", height + (cellSize * 2))
      .attr("width", legendElementWidth)
      .attr("height", cellSize)
      .style("fill", function(d, i) {
        return colors[i];
      });

    legend.append("text")
      .attr("class", "mono")
      .text(function(d) {
        return d;
      })
      .attr("width", legendElementWidth)
      .attr("x", function(d, i) {
        return legendElementWidth * i;
      })
      .attr("y", height + (cellSize * 4));

    // Change ordering of cells


    d3.select("#order").on("change", function() {
      order(this.value);
    });

    function order(value) {
        if (value == "hashKey") {
          var t = svg.transition().duration(3000);
          t.selectAll(".cell")
            .attr("x", function(d) {
              return d.col * cellSize;
            })
            .attr("y", function(d) {
              return d.row * cellSize;
            });

          t.selectAll(".rowLabel")
            .attr("y", function(d, i) {
              return i * cellSize;
            });

          t.selectAll(".colLabel")
            .attr("y", function(d, i) {
              return i * cellSize;
            });

        } else if (value == "hits") {
          var t = svg.transition().duration(3000);
          t.selectAll(".cell")
            .attr("x", function(d) {
              return d.col * cellSize;
            })
            .attr("y", function(d) {
              return d.row  * cellSize;
            });

          t.selectAll(".rowLabel")
            .attr("y", function(d, i) {
              return i * cellSize;
            });

          t.selectAll(".colLabel")
            .attr("y", function(d, i) {
              return i * cellSize;
            });
        }
      }
      // 
    var sa = d3.select(".g3")
      .on("mousedown", function() {
        if (!d3.event.altKey) {
          d3.selectAll(".cell-selected").classed("cell-selected", false);
          d3.selectAll(".rowLabel").classed("text-selected", false);
          d3.selectAll(".colLabel").classed("text-selected", false);
        }
        var p = d3.mouse(this);
        sa.append("rect")
          .attr({
            rx: 0,
            ry: 0,
            class: "selection",
            x: p[0],
            y: p[1],
            width: 1,
            height: 1
          })
      })
      .on("mousemove", function() {
        var s = sa.select("rect.selection");

        if (!s.empty()) {
          var p = d3.mouse(this),
            d = {
              x: parseInt(s.attr("x"), 10),
              y: parseInt(s.attr("y"), 10),
              width: parseInt(s.attr("width"), 10),
              height: parseInt(s.attr("height"), 10)
            },
            move = {
              x: p[0] - d.x,
              y: p[1] - d.y
            };

          if (move.x < 1 || (move.x * 2 < d.width)) {
            d.x = p[0];
            d.width -= move.x;
          } else {
            d.width = move.x;
          }

          if (move.y < 1 || (move.y * 2 < d.height)) {
            d.y = p[1];
            d.height -= move.y;
          } else {
            d.height = move.y;
          }
          s.attr(d);

          // deselect all temporary selected state objects
          d3.selectAll('.cell-selection.cell-selected').classed("cell-selected", false);
          d3.selectAll(".text-selection.text-selected").classed("text-selected", false);

          d3.selectAll('.cell').filter(function(cell_d, i) {
            if (!d3.select(this).classed("cell-selected") &&
              // inner circle inside selection frame
              (this.x.baseVal.value) + cellSize >= d.x && (this.x.baseVal.value) <= d.x + d.width &&
              (this.y.baseVal.value) + cellSize >= d.y && (this.y.baseVal.value) <= d.y + d.height
            ) {

              d3.select(this)
                .classed("cell-selection", true)
                .classed("cell-selected", true);

              d3.select(".r" + (cell_d.row - 1))
                .classed("text-selection", true)
                .classed("text-selected", true);

              d3.select(".c" + (cell_d.col - 1))
                .classed("text-selection", true)
                .classed("text-selected", true);
            }
          });
        }
      })
      .on("mouseup", function() {
        // remove selection frame
        sa.selectAll("rect.selection").remove();

        // remove temporary selection marker class
        d3.selectAll('.cell-selection').classed("cell-selection", false);
        d3.selectAll(".text-selection").classed("text-selection", false);
      })
      .on("mouseout", function() {
        if (d3.event.relatedTarget.tagName == 'html') {
          // remove selection frame
          sa.selectAll("rect.selection").remove();
          // remove temporary selection marker class
          d3.selectAll('.cell-selection').classed("cell-selection", false);
          d3.selectAll(".rowLabel").classed("text-selected", false);
          d3.selectAll(".colLabel").classed("text-selected", false);
        }
      });
  });
});
