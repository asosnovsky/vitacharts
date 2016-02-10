# Vita Charts
## Making life easier with vCharts
Making D3 Charts simpler.
This is a charting library built around **d3**, it is a work in progress, so please give it time.

**It currently supports:**
- Auto-updates
- Responsiveness (limited for mobile and MS Edge)
- The following plot types:
    > Two types of Bar-charts, Scatter plots and Pie-Charts
- Regression and Trend lines
- recentering of x and y axis
- Tooltips
- highlighting
- color-sorting
- much more!

**Future Plans:**
- Fix sizing issue for mobile
- Numerical bar-charts (currently only categorical)
- line charts
- area charts
- support more than one trend line

Examples are avaible in [/examples/](/examples).

## Structure
To start a new plot, you must first construct a container in your `html`.
```{html}
	<div id="chart"></div>
```

Then you create a corresponding `js` class
```{js}
	var vchart = new vChart("#chart");
        vchart.buildAxis();
```
Please note that you must run `buildAxis` before any other function (even for pie-charts).
This will be fixed in later versions.

At this step we choose what chart we wish to build
```{js}
    vchart.buildPlot('<name of plot>');
```
Avaible plots are:
- `'bar'`, for barcharts
- `'dot'`, for scatter-plot
- `'pie'`, for pie-charts

Next we pass some data, as well as any relevant information
```{js}
    vchart.data(DATA,OPTIONS,AXIS-OPTIONS);
```
The data should be structured as such:
```{json}
    [{x0:1, y0:3}, {x0:60, y0:6}, {x0:85, y0:2}]
```
The names of the variables can be different and are set in options (by default they go by x0,y0).

In the future I intend to add more documentation, but for now, I will just leave here all the options and their defaults.
You can also see how the plot functions in the  [/examples/](/examples) folder.
```{js}
    OPTIONS = {// General options
		colors 			: ["#000000"], //Color of graphics
		oncolors 		: ["#000000"], // Color after on-hover
		xformat 		: function(a) {return a}, // format of xaxis
		yformat 		: function(a) {return a}, // format of yaxis
		xlab 			: "x", // label of xaxis
		ylab 			: "y", // label of yaxis
		tiplabel		: ["x","y"], // labels for tooltip
		xnames 			: ["x0","x1"],  // names of x variables
		ynames 			: ["y0","y1"],  // names of y variables
		animation_time 	: 300, // animation time
	},
	AXIS-OPTIONS = {// Axis options
	    xto0	    : false, // move xaxis to zero value of y
        yto0        : false, // move yaxis to zero value of x
		xlim_max	: false, // set lower limit for x-axis
        xlim_min    : false, // set lower limit for y-axis
		ylim_max	: false, // set upper limit for x-axis
        ylim_min    : false, // set upper limit for y-axis
		noxtick 	: false, // remove the x-axis tickers
        noytick     : false  // remove the y-axis tickers
	} 
```

## Trend/Regression line
We can add a trend or regression to the plot by doing the following
```{js}
    vchart.addTrend(TYPE);
```
By default you will have a simple trend line (that spans from lowest x to highest).
If you wish to use a regression line, simply pass `'r'` to TYPE.
Please note, At the time being only **one** trend line is supported.

To remove the line do this:
```{js}
    vchart.removeTrend();
```

## [Scatterplot](/examples/scatter-charts.html)
To make a simple scatter plot in one run, we do this:

![alt text][pic/scatter.png]

```{js}
    var data = [{x0:1, y0:3}, {x0:60, y0:6}, {x0:85, y0:2}];
        vchart.buildAxis().buildPlot('dot').data(data);
```

To update this plot at any time, do this:
```{js}
    vchart.data(newdata);
```
## Bar-Chart
There are two bar-charts avaible, horizantal and vertical. Each will depend on which values you choose to show as strings.
If x-values are strings, then you get a horizantal chart, otherwise a vertical.

Your data should look like this:
```{js}
    data = [{x0:0.418, y0:"g"}, {x0:0.33, y0:"s"}, {x0:0.789, y0:"m"}
```
or this
```{js}
    data = [{y0:0.418, x0:"g"}, {y0:0.33, x0:"s"}, {y0:0.789, x0:"m"}
```

And you may make a plot as such:
```{js}
    vchart.buildAxis().buildPlot('bar').data(data);
```

## Pie-chart
Data for pie chart is as follows:
```{js}
    data = [{x:5, y:"Sugar"}, {x:2, y:"Milk"}, {x:2, y:"Honey"}];
```

Now please note, that while the pie chart does not need an axis. You still need to build!
This is a temporary bug, I will fix in a later addition.

So to make the chart do the following:
```{js}
    vchart.buildAxis().buildPlot('pie').data(data);
```