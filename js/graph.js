/** Class implementing the Graph. */
class Graph {
    /**
     * Creates a Graph Object
     */
    constructor(data, countCallback, highlightCallback, colorScale) {
        let that = this;

        // Map data to five main animals from 1985.
        this.data = data;
        this.data = this.data.filter(function(d) {
            return d['Date'] >= new Date(1985, 11, 20);
        });
        this.data = this.data.map(function(d) {
            d['Cows'] = d['Cattle'] + d['Steers'] + d['Heifers'] + d['Beef cows'] + d['Dairy cows'] + d['Bulls and stags'] + d['Calves'];
            d['Pigs'] = d['Hogs'] + d['Barrows and gilts'] + d['Sows'] + d['Boars and stags'];
            d['Sheep'] = d['Sheep and lambs'] + d['Lambs and yearlings'] + d['Mature sheep'];
            d['Chickens'] = d['Broilers'] + d['Other chickens'];
            return d;
        });

        // Set color scale, displayed data and displayed columns.
        this.colorScale = colorScale;
        this.displayedData = this.data;
        this.displayedColumns = ['Cows', 'Pigs', 'Sheep', 'Chickens', 'Turkeys'];
        this.displayStreamgraph = false;

        // Get largest date for data and set current time range.
        this.maxDate = d3.max(this.data.map(d => d['Date']));
        this.startDate = new Date(2011, 1, 1);
        this.endDate = this.maxDate;

        // Create g groups and labels
        this.gPaths = d3.select('#graph-svg').append('g')
            .attr('id', 'g-paths');

        this.gXAxis = d3.select('#graph-svg').append('g')
            .attr('id', 'g-xAxis');

        this.gYAxis = d3.select('#graph-svg').append('g')
            .attr('id', 'g-yAxis');

        this.labels = d3.select('#graph-svg').append('g')
            .attr('id', 'g-labels');

        this.labels.append('text')
            .attr('x', 507)
            .attr('y', 13)
            .attr('font-size', 'large')
            .style('font-weight', 'bold')
            .text('Date');

        this.labels.append('text')
            .attr('x', 2)
            .attr('y', 75)
            .attr('font-size', 'large')
            .style('font-weight', 'bold')
            .text('Slaughter Count');

        // Set callbacks
        this.countCallback = countCallback;
        this.highlightCallback = highlightCallback;
    }

    /**
     * Update the initial Graph to display.
     */
    updateGraph() {
        let that = this;

        // Display only current time range.
        this.displayedData = this.data;
        this.displayedData = this.displayedData.filter(function(d) {
            return d['Date'] >= that.startDate && d['Date'] <= that.endDate;
        });

        // Referencing the API guide on github: https://github.com/d3/d3-shape#stacks
        // https://d3-wiki.readthedocs.io/zh_CN/master/Stack-Layout/
        // https://github.com/d3/d3/wiki/Gallery

        // Create a date scale for the for the current time range.
        let dateScale = d3.scaleTime()
            .domain([that.startDate, that.endDate])
            .range([70, 990]);

        // Get a total count for slaughter for selected time range and columns.
        this.maxSlaughter = 0;
        let totalSlaugherCounts = this.displayedData.map((d) => {
            let totalSlaughter = 0;
            for (let i = 0; i < that.displayedColumns.length; i++) {
                totalSlaughter += d[that.displayedColumns[i]];
            }

            if (totalSlaughter > that.maxSlaughter) {
                that.maxSlaughter = totalSlaughter;
            }
            return {date: d['Date'], totalSlaughter: totalSlaughter};
        });

        // Create the stack object to convert data into usable form for stack based visualizations.
        let stackOffset;
        if (this.displayStreamgraph) {
            stackOffset = d3.stackOffsetSilhouette;

            this.slaughterScale = d3.scaleLinear()
                .domain([0, that.maxSlaughter/2])
                .range([300, 100]);
        } else {
            stackOffset = d3.stackOffsetNone;

            this.slaughterScale = d3.scaleLinear()
                .domain([0, that.maxSlaughter])
                .range([590, 100]);
        }

        // Create data based on columns to display.
        let stack = d3.stack()
            .keys(that.displayedColumns)
            .order(d3.stackOrderDescending)
            .offset(stackOffset);
        this.seriesData = stack(that.displayedData);

        // Create the area object to draw the visualization.
        let area = d3.area()
            .x(d => dateScale(d.data['Date']))
            .y0(d => that.slaughterScale(d[0]))
            .y1(d => that.slaughterScale(d[1]));

        // Draw the visualization.
        this.gPaths
            .selectAll('path')
            .data(that.seriesData)
            .join(enter => enter.append("path")
                    .attr('fill', ({key}) => {
                        // Use the key to get the fill color.
                        return that.colorScale(key);
                    })
                    .attr('d', area)
                    .attr('id', d => 'path-' + d.key)
                    .on("mouseover", function(d) {
                        // Render tooltip.
                        d3.select('#tooltip')
                            .html(that.tooltipRender(d))
                            .style('opacity', '0.9')
                            .style('left', (d3.event.x) - 50 + 'px')
                            .style('top', (d3.event.y) - 75 + 'px');

                        // Change opacity of path.
                        d3.select('#' + d3.event.target.id).style('opacity', 0.5);
                    })
                    .on("mouseleave", function() {
                        // Hide tooltip.
                        d3.select('#tooltip')
                            .style('opacity', '0');

                        d3.select('#' + d3.event.target.id).style('opacity', 1.0);
                    }),
                update => update
                    .attr('fill', ({key}) => {
                        // Use the key to get the fill color.
                        return that.colorScale(key);
                    })
                    .attr('d', area)
                    .attr('id', d => 'path-' + d.key)
                    .on("mouseover", function(d) {
                        // Render tooltip.
                        d3.select('#tooltip')
                            .html(that.tooltipRender(d))
                            .style('opacity', '0.9')
                            .style('left', (d3.event.x) - 50 + 'px')
                            .style('top', (d3.event.y) - 75 + 'px');

                        // Change opacity of path.
                        d3.select('#' + d3.event.target.id).style('opacity', 0.5);

                        // Use callback to update highlight data.
                        that.updateHighlightedData(d3.event.target.id, true);
                    })
                    .on("mouseleave", function() {
                        // Hide tooltip.
                        d3.select('#tooltip')
                            .style('opacity', '0');

                        d3.select('#' + d3.event.target.id).style('opacity', 1.0);

                        // Use callback to update highlight data.
                        that.updateHighlightedData(d3.event.target.id, false);
                    }),
                exit => exit.remove()
            );

        // Create the axis for the date x axis.
        let xAxis = d3.axisBottom().scale(dateScale);
        this.gXAxis
            .call(xAxis)
            .attr('transform', 'translate(0,20)');

        // Create the slaughter count y axis.
        let yAxis = d3.axisRight().scale(that.slaughterScale);
        this.gYAxis
            .call(yAxis)
            .attr('transform', 'translate(0,-10)');

        // Using callback update slaughter counts displayed.
        this.updateSlaughterCounts();
    }

    // Used to update the current time range from the slider and update the graph.
    updateTimeRange(startYear, endYear) {
        this.startDate = new Date(startYear, 1, 1);
        if (endYear === 2020) {
            this.endDate = new Date(2019, 11, 1);
        } else {
            this.endDate = new Date(endYear, 1, 1);
        }

        this.updateGraph();
    }

    // Used to change between a stacked area graph and a streamgraph.
    updateChartType(chartType) {
        if (chartType === 'Stacked Area Chart') {
            this.displayStreamgraph = false;
        } else {
            this.displayStreamgraph = true;
        }

        this.updateGraph();
    }

    // Used to update the total slaughter counts for the time range.
    updateSlaughterCounts() {
        let retObj = {};
        retObj = {
            'Cows': 0.0,
            'Pigs': 0.0,
            'Sheep': 0.0,
            'Chickens': 0.0,
            'Turkeys': 0.0,
        };

        for (let i = 0; i < this.displayedData.length; i++) {
            retObj['Cows'] += parseFloat(this.displayedData[i]['Cows']);
            retObj['Pigs'] += parseFloat(this.displayedData[i]['Pigs']);
            retObj['Sheep'] += parseFloat(this.displayedData[i]['Sheep']);
            retObj['Chickens'] += parseFloat(this.displayedData[i]['Chickens']);
            retObj['Turkeys'] += parseFloat(this.displayedData[i]['Turkeys']);
        }

        this.countCallback(retObj['Cows'], retObj['Pigs'], retObj['Sheep'], retObj['Chickens'], retObj['Turkeys'], this.displayedData.length);
    }

    // Used to highlight the data statistics for hovered data.
    updateHighlightedData(key, style) {
        switch (key) {
            case 'path-Chickens':
                that.highlightCallback('#chickenLabel', style);
                that.highlightCallback('#chickenMonthlyLabel', style);
                that.highlightCallback('#chickenCard', style);
                break;
            case 'path-Cows':
                that.highlightCallback('#cowLabel', style);
                that.highlightCallback('#cowMonthlyLabel', style);
                that.highlightCallback('#cowCard', style);
                break;
            case 'path-Pigs':
                that.highlightCallback('#pigLabel', style);
                that.highlightCallback('#pigMonthlyLabel', style);
                that.highlightCallback('#pigCard', style);
                break;
            case 'path-Turkeys':
                that.highlightCallback('#turkeyLabel', style);
                that.highlightCallback('#turkeyMonthlyLabel', style);
                that.highlightCallback('#turkeyCard', style);
                break;
            case 'path-Sheep':
                that.highlightCallback('#sheepLabel', style);
                that.highlightCallback('#sheepMonthlyLabel', style);
                that.highlightCallback('#sheepCard', style);
                break;
        }
    }

    // Used to update a highlighted path.
    highlightPath(id, opacity) {
        d3.select(id).style('opacity', opacity);
    }

    // Updated to update the displayed columns.
    updateSelectedData(selected) {
        this.displayedColumns = selected;
        this.updateGraph();
    }

    // Returns html to render the tooltip on hover.
    tooltipRender(d) {
        let format = d3.format(',.0f');

        let total = 0;
        for (let i = 0; i < d.length; i++) {
            total += d[i].data[d.key];
        }

        let average = total/d.length;

        let text = "<h2>" + d.key + "</h2>" + '<h3>Average Monthly Slaughter Count</h3><h3>for Current Range: </h3>' + format(average) + ' ' + d.key;
        return text;
    }
}
