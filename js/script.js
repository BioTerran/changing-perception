
let that = this;
this.selectedData = ['Cows', 'Pigs', 'Sheep', 'Chickens', 'Turkeys'];
this.allData = ['Cows', 'Chickens', 'Pigs', 'Turkeys', 'Sheep'];
this.colorScale = d3.scaleOrdinal()
    .domain(Object.keys(that.selectedData))
    .range(['#E74C3C', '#2ECC71', '#8E44AD', '#F39C12', '#3498DB']);

let checkboxes = ['#cowCheckbox', '#chickenCheckbox', '#pigCheckbox', '#turkeyCheckbox', '#sheepCheckbox'];

//Parses the JSON string dates into JS dates.
function parseDate(dateString) {
    let dateArr = dateString.split(' ');
    let year = parseInt(dateArr[1]);

    let month = -1;
    switch (dateArr[0]) {
        case 'Jan':
            month = 1;
            break;
        case 'Feb':
            month = 2;
            break;
        case 'Mar':
            month = 3;
            break;
        case 'Apr':
            month = 4;
            break;
        case 'May':
            month = 5;
            break;
        case 'Jun':
            month = 6;
            break;
        case 'Jul':
            month = 7;
            break;
        case 'Aug':
            month = 8;
            break;
        case 'Sep':
            month = 9;
            break;
        case 'Oct':
            month = 10;
            break;
        case 'Nov':
            month = 11;
            break;
        case 'Dec':
            month = 12;
            break;
    }
    return new Date(year, month, 1);
}

// Used to update displayed slaughter counts.
function updateSlaughterCounts(cow, pigs, sheep, chicken, turkeys, months) {
    d3.select('#cowSlaughterCount').text(cow.toLocaleString());
    d3.select('#chickenSlaughterCount').text(chicken.toLocaleString());
    d3.select('#pigSlaughterCount').text(pigs.toLocaleString());
    d3.select('#turkeySlaughterCount').text(turkeys.toLocaleString());
    d3.select('#sheepSlaughterCount').text(sheep.toLocaleString());

    d3.select('#cowMonthlySlaughterCount').text(parseInt((cow/months)).toLocaleString());
    d3.select('#chickenMonthlySlaughterCount').text(parseInt((chicken/months)).toLocaleString());
    d3.select('#pigMonthlySlaughterCount').text(parseInt((pigs/months)).toLocaleString());
    d3.select('#turkeyMonthlySlaughterCount').text(parseInt((turkeys/months)).toLocaleString());
    d3.select('#sheepMonthlySlaughterCount').text(parseInt((sheep/months)).toLocaleString());

    let totalCount = (cow + chicken + pigs + turkeys + sheep) / months;
    d3.select('#secondCount').text(parseInt((totalCount/(30*24*60*60))).toLocaleString());
    d3.select('#minuteCount').text(parseInt((totalCount/(30*24*60))).toLocaleString());
    d3.select('#hourCount').text(parseInt((totalCount/(30*24))).toLocaleString());
    d3.select('#dayCount').text(parseInt((totalCount/30)).toLocaleString());
    d3.select('#weekCount').text(parseInt((totalCount/4)).toLocaleString());
}

// Used to highlight hovered data.
function highlightCallback(id, style) {
    if (id.includes('Card')) {
        d3.select(id).classed('highlightedCard', style);
    } else {
        d3.select(id).classed('highlightedLabel', style);
    }
}

// Used to create the html for the legend div.
function updateLegendDiv() {
    let htmlString = '';
    that.allData.forEach(function(d) {
        if (that.selectedData.includes(d)) {
            htmlString = htmlString.concat('<div class="row" style="padding-left: 10px"><div class="col"> ' + d + '</div><div class="col"><div class="legend-color" style="background: ' + that.colorScale(d) + '"></div></div></div>')
        }
    });

    d3.select('#legend-div').html(htmlString);
}

// Update selected data.
function updateSelectedData() {
    let tempSelectedData = [];
    checkboxes.forEach(function(d) {
        if (d3.select(d).property('checked')) {
            switch (d) {
                case '#cowCheckbox':
                    tempSelectedData.push('Cows');
                    break;
                case '#chickenCheckbox':
                    tempSelectedData.push('Chickens');
                    break;
                case '#pigCheckbox':
                    tempSelectedData.push('Pigs');
                    break;
                case '#turkeyCheckbox':
                    tempSelectedData.push('Turkeys');
                    break;
                case '#sheepCheckbox':
                    tempSelectedData.push('Sheep');
                    break;
            }
        }
    });

    that.selectedData = tempSelectedData;
    that.graph.updateSelectedData(that.selectedData);

    that.updateLegendDiv();
}

// Update legend and checkboxes.
updateLegendDiv();
checkboxes.forEach(function(id) {
    d3.select(id).on('change', function(d) {
        that.updateSelectedData();
    });
});

// Create and start slaughter counter.
function killCounter() {
    let seconds = parseInt(d3.select('#seconds').text());
    seconds++;

    d3.select('#seconds').text(seconds);
    d3.select('#totalAnimalKilledCount').text(parseInt(seconds * 312.421).toLocaleString());
}
setInterval(killCounter, 1000);

// Resets all checkboxes to true. Displays all data.
function resetCheckboxes() {
    d3.select('#chickenCheckbox').property('checked', true);
    d3.select('#pigCheckbox').property('checked', true);
    d3.select('#cowCheckbox').property('checked', true);
    d3.select('#sheepCheckbox').property('checked', true);
    d3.select('#turkeyCheckbox').property('checked', true);
    that.updateSelectedData();
}

///////////////////////////////////////////
///////////////////////////////////////////
// Load slaughter count data.
///////////////////////////////////////////
///////////////////////////////////////////
d3.json('data/SlaughterCounts.json').then( data => {

    // Convert string dates to JS dates.
    that.data = data.map(function(d) {
        d['Date'] = parseDate(d['Date']);
        return d;
    });

    // Keep reference to this data.
    that.data = data;

    // Create the main chart
    that.graph = new Graph(that.data, that.updateSlaughterCounts, that.highlightCallback, that.colorScale);
    that.graph.updateGraph();

    // Append the tooltip to the graph.
    d3.select('#graph-div')
        .append('div')
        .attr('class', 'tooltip')
        .attr('id', 'tooltip')
        .style("opacity", 0);

    // Create the slider using the noUISlider (https://refreshless.com/nouislider/).
    that.slider = document.getElementById('timeSlider');
    noUiSlider.create(slider, {
        start: [2010, 2020],
        step: 1,
        margin: 1,
        connect: true,
        range: {
            'min': 1986,
            'max': 2020
        }
    });

    // Append text label for current range.
    d3.select('#timeSlider').append('h3')
        .attr('id', 'currentTimeRange')
        .text('');

    // Add on update function to update the displayed graph.
    let currentTimeRange = document.getElementById('currentTimeRange');
    slider.noUiSlider.on('update', function (values, handle) {
        currentTimeRange.innerHTML = 'Year Range: ' + parseInt(values[0]) + ' to ' + parseInt(values[1]);
        that.graph.updateTimeRange(values[0], values[1]);
    });

    // Add click events to chart types button
    d3.select('#stackedAreaChartBtn')
        .on('click', function() {
            that.graph.updateChartType('Stacked Area Chart');
        });

    d3.select('#streamgraphBtn')
        .on('click', function() {
            that.graph.updateChartType('Streamgraph');
        });
});

///////////////////////////////////////////
///////////////////////////////////////////
// Set highlight callbacks for card hovers
///////////////////////////////////////////
///////////////////////////////////////////
d3.select('#cowCard').on('mouseover', function(d) {
   that.graph.highlightPath('#path-Cows', 0.5);
    that.highlightCallback('#cowLabel', true);
    that.highlightCallback('#cowMonthlyLabel', true);
}).on('mouseout', function(d) {
    that.graph.highlightPath('#path-Cows', 1.0);
    that.highlightCallback('#cowLabel', false);
    that.highlightCallback('#cowMonthlyLabel', false);
});

d3.select('#chickenCard').on('mouseover', function(d) {
    that.graph.highlightPath('#path-Chickens', 0.5);
    that.highlightCallback('#chickenLabel', true);
    that.highlightCallback('#chickenMonthlyLabel', true);
}).on('mouseout', function(d) {
    that.graph.highlightPath('#path-Chickens', 1.0);
    that.highlightCallback('#chickenLabel', false);
    that.highlightCallback('#chickenMonthlyLabel', false);
});

d3.select('#pigCard').on('mouseover', function(d) {
    that.graph.highlightPath('#path-Pigs', 0.5);
    that.highlightCallback('#pigLabel', true);
    that.highlightCallback('#pigMonthlyLabel', true);
}).on('mouseout', function(d) {
    that.graph.highlightPath('#path-Pigs', 1.0);
    that.highlightCallback('#pigLabel', false);
    that.highlightCallback('#pigMonthlyLabel', false);
});

d3.select('#turkeyCard').on('mouseover', function(d) {
    that.graph.highlightPath('#path-Turkeys', 0.5);
    that.highlightCallback('#turkeyLabel', true);
    that.highlightCallback('#turkeyMonthlyLabel', true);
}).on('mouseout', function(d) {
    that.graph.highlightPath('#path-Turkeys', 1.0);
    that.highlightCallback('#turkeyLabel', false);
    that.highlightCallback('#turkeyMonthlyLabel', false);
});

d3.select('#sheepCard').on('mouseover', function(d) {
    that.graph.highlightPath('#path-Sheep', 0.5);
    that.highlightCallback('#sheepLabel', true);
    that.highlightCallback('#sheepMonthlyLabel', true);
}).on('mouseout', function(d) {
    that.graph.highlightPath('#path-Sheep', 1.0);
    that.highlightCallback('#sheepLabel', false);
    that.highlightCallback('#sheepMonthlyLabel', false);
});

///////////////////////////////////////////
///////////////////////////////////////////
// Set up the intro tour.
///////////////////////////////////////////
///////////////////////////////////////////
this.introTour = new Shepherd.Tour({
    defaultStepOptions: {
        cancelIcon: {
            enabled: true
        },
        scrollTo: { behavior: 'smooth', block: 'center' }
    },
    useModalOverlay: true
});

this.introTour.addStep({
    title: 'Intro',
    text: `This tool explores data from the United States Department of Agriculture regarding land animal slaughter counts. The data goes from 1986 to now.`,
    attachTo: {
        element: '#header-col',
        on: 'bottom'
    },
    buttons: [
        {
            action() {
                return this.back();
            },
            classes: 'shepherd-button-secondary',
            text: 'Back'
        },
        {
            action() {
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.introTour.addStep({
    title: 'Graph',
    text: `A graph is provided that can show the change of slaughter counts over time in the United States. There is a slider bar that allows you to change the current time range you are viewing.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                return this.back();
            },
            classes: 'shepherd-button-secondary',
            text: 'Back'
        },
        {
            action() {
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'graph'
});

this.introTour.addStep({
    title: 'Statistics',
    text: `This area shows the total counts over the time period, the average monthly counts, reference population counts, and the count since the page was loaded. On hover, that card will highlight the data for its corresponding animal.`,
    attachTo: {
        element: '#stats-col',
        on: 'left'
    },
    buttons: [
        {
            action() {
                return this.back();
            },
            classes: 'shepherd-button-secondary',
            text: 'Back'
        },
        {
            action() {
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'creating'
});

this.introTour.addStep({
    title: 'Chart Options',
    text: `This area provides the ability to customize the displayed chart as well as the chart legend.`,
    attachTo: {
        element: '#chart-options-row',
        on: 'top'
    },
    buttons: [
        {
            action() {
                return this.back();
            },
            classes: 'shepherd-button-secondary',
            text: 'Back'
        },
        {
            action() {
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'creating'
});

///////////////////////////////////////////
///////////////////////////////////////////
// Set up the guided walkthrough.
///////////////////////////////////////////
///////////////////////////////////////////
this.guidedWalkthrough = new Shepherd.Tour({
    defaultStepOptions: {
        cancelIcon: {
            enabled: true
        },
        classes: 'class-1 class-2',
        scrollTo: { behavior: 'smooth', block: 'center' }
    },
    useModalOverlay: true
});

this.guidedWalkthrough.addStep({
    title: 'Back in 1986',
    text: `Looking at the data in 1986, the US population at this time was around 240 million. We see that the total slaughter counts for land animals in the United States was around 400 million a month. Most of these were chickens as shown in green. Next largest were Turkeys and then Pigs, Cows, and Sheep.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                d3.select('#chickenCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 without Chickens',
    text: `Removing chickens, we see that Turkey slaughter counts reach a peak during November totaling close to 20 million in one month.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                d3.select('#turkeyCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 without Chickens or Turkeys',
    text: `Removing chickens and turkeys we see, that Pigs, Sheep, and Cows fluctuate around their average slaughter counts for all of the year.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                that.slider.noUiSlider.set([1986, 1996]);
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 to 1996',
    text: `From 1986 to 1996, we see that monthly slaughter counts increase from around 400 million to 600 million. While the US population grew from 240 million to 270 million people.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                d3.select('#chickenCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 to 1996 without Chickens',
    text: `From 1986 to 1996 without Chickens, we see that monthly slaughter counts for the other animals remain around the same value.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                d3.select('#turkeyCheckbox').property('checked', false);
                d3.select('#sheepCheckbox').property('checked', false);
                d3.select('#pigCheckbox').property('checked', false);
                d3.select('#cowCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 to 1996 only Chickens',
    text: `From 1986 to 1996, the growth in Chicken slaughter counts is the main contributor to most of the growth from 400 million to 600 million in total slaughter counts.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 to 1996 Counts',
    text: `Over this time period over 60 billion Chickens were slaughtered, followed by over 2.6 billion Turkeys and 1.8 billion Pigs.`,
    attachTo: {
        element: '#infoCounts',
        on: 'left'
    },
    buttons: [
        {
            action() {
                that.slider.noUiSlider.set([1986, 2006]);
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 to 2006',
    text: `From 1986 to 2006, we see that total slaughter counts surpass 700 million. The US population grew from 240 million in 1986 to 298 million in 2006`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                d3.select('#turkeyCheckbox').property('checked', false);
                d3.select('#sheepCheckbox').property('checked', false);
                d3.select('#pigCheckbox').property('checked', false);
                d3.select('#cowCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 to 2006 only Chickens',
    text: `From 1986 to 2006, we see that once again a growth in the slaughter of Chickens is the main contributor to the growth.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '1986 to 2006 Counts',
    text: `Over this time period over 143 billion Chickens were slaughtered, followed by over 5.3 billion Turkeys and 3.7 billion Pigs.`,
    attachTo: {
        element: '#infoCounts',
        on: 'left'
    },
    buttons: [
        {
            action() {
                that.slider.noUiSlider.set([2006, 2019]);
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: '2006 to 2019',
    text: `From 2006 to 2019, we see that for all five animals the monthly slaughter counts remain around the same values from 2006 to 2019. US population grew from 298 million in 2006 to 329 million in 2019.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.slider.noUiSlider.set([1986, 2019]);
                that.resetCheckboxes();
                d3.select('#pigCheckbox').property('checked', false);
                d3.select('#chickenCheckbox').property('checked', false);
                d3.select('#sheepCheckbox').property('checked', false);
                d3.select('#turkeyCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Cows from 1986 to 2019',
    text: `From 1986 to 2019, the monthly Cow slaughter count has gone slightly down and fluctuates near 5 million Cows slaughtered monthly.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                d3.select('#cowCheckbox').property('checked', false);
                d3.select('#pigCheckbox').property('checked', false);
                d3.select('#sheepCheckbox').property('checked', false);
                d3.select('#turkeyCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Chickens from 1986 to 2019',
    text: `From 1986 to 2019, the monthly Chicken slaughter count grew immensely and fluctuates near 650 million Chickens slaughtered monthly.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                d3.select('#cowCheckbox').property('checked', false);
                d3.select('#chickenCheckbox').property('checked', false);
                d3.select('#sheepCheckbox').property('checked', false);
                d3.select('#turkeyCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Pigs from 1986 to 2019',
    text: `From 1986 to 2019, the monthly Pig slaughter count has grown and fluctuates near 18 million Pigs slaughtered monthly.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                d3.select('#cowCheckbox').property('checked', false);
                d3.select('#chickenCheckbox').property('checked', false);
                d3.select('#sheepCheckbox').property('checked', false);
                d3.select('#pigCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Turkeys from 1986 to 2019',
    text: `From 1986 to 2019, the monthly Turkey slaughter count grew till around 1997 and then very slightly decreased till 2019. It fluctuates near 18 million Turkeys slaughtered monthly.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                d3.select('#cowCheckbox').property('checked', false);
                d3.select('#chickenCheckbox').property('checked', false);
                d3.select('#pigCheckbox').property('checked', false);
                d3.select('#turkeyCheckbox').property('checked', false);
                that.updateSelectedData();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Sheep from 1986 to 2019',
    text: `From 1986 to 2019, the monthly Sheep slaughter count has decreased over this time period and fluctuates near 350,000 Sheep slaughtered monthly.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Slaughter Counts from 1986 to 2019',
    text: `Over this time period, a whomping 258 billion Chickens (more than 33 times the current world population) have been slaughtered in the United States. Follow by over 8.5 billion Turkeys, 6.7 billion Pigs, 2.3 billion Cows, and 236 million Sheep.`,
    attachTo: {
        element: '#infoCounts',
        on: 'left'
    },
    buttons: [
        {
            action() {
                that.slider.noUiSlider.set([2018, 2019]);
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Average Monthly Slaughter Counts',
    text: `These are the average monthly slaughter counts for last year.`,
    attachTo: {
        element: '#infoCounts',
        on: 'left'
    },
    buttons: [
        {
            action() {
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Average Slaughter Count per Time Period',
    text: `We can see that based on these estimates, every day around 27 million animals are slaughtered in the United States for meat.`,
    attachTo: {
        element: '#refAndCountPerTimePeriod',
        on: 'left'
    },
    buttons: [
        {
            action() {
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Since Loading This Page',
    text: `For reference, this is an estimated amount of how many animals have been slaughtered since this page was first loaded.`,
    attachTo: {
        element: '#currentCountRow',
        on: 'left'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                that.slider.noUiSlider.set([1986, 2019]);
                return this.next();
            },
            text: 'Next'
        }
    ],
    id: 'intro'
});

this.guidedWalkthrough.addStep({
    title: 'Conclusion',
    text: `We have explored some of the trends in America's Meat History over the past 33 years regarding the United States monthly slaughter counts for Cows, Chickens, Pigs, Turkeys, and Sheep for meat. Since around 2006, the total monthly slaughter count has fluctuated around the same count. This could be due to a variety of different reasons, for example: more non-meat alternatives, more food imports, more fish consumption, and/or a rise in vegetarian and vegan diets. I encourage you to continue to study more about your personal diet and become a more informed consumer.\n Thank you for your time, and feel free to use this tool to explore this data on your own. Best wishes.`,
    attachTo: {
        element: '#graph-div',
        on: 'right'
    },
    buttons: [
        {
            action() {
                that.resetCheckboxes();
                return this.next();
            },
            text: 'Finish'
        }
    ],
    id: 'intro'
});

// Set onclick listener for guided walkthrough play button.
d3.select('#play-button').on('click', function(){
    that.graph.updateChartType('Stacked Area Chart');
    that.slider.noUiSlider.set([1986, 1987]);
    that.resetCheckboxes();
    that.guidedWalkthrough.start();
});

// Start the intro tour on page load.
that.introTour.start();