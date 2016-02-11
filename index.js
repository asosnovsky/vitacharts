
/**
 * vChart, a general class for creating Charts
 * @param  {String} chartid 
 * @param  {Object} opt 	{colors,oncolors,xformat,yformat,xlab,ylab,tiplabel,xnames,ynames}
 */
function vChart(chartid, opt) {
	/*Set Defaults*/
	var options = {// general options
		colors 			: ["#5127EB","#E23131"], //Color of graphics
		oncolors 		: ["#7D5FEB","#E25E5E"], // Color after on-hover
		xformat 		: function(a) {return a}, // format of xaxis
		yformat 		: function(a) {return a}, // format of yaxis
		xlab 			: "x", // label of xaxis
		ylab 			: "y", // label of yaxis
		tiplabel		: ["x","y"], // labels for tooltip
		xnames 			: ["x0","x1"],  // names of x variables
		ynames 			: ["y0","y1"],  // names of y variables
		animation_time 	: 300, // animation time
		color_cat 		: false
	},
	axisOptions = {// Axis options
		xto0 		: false, yto0: false, 
		categories 	: false,
		xlim_max	: false, xlim_min: false,
		ylim_max	: false, ylim_min: false,
		noxtick 	: false, noytick : false,
		hideX 		: false, hideY 	 : false,
		orderset 	: false
	} 
	margins 	= {top: 70, right: 50, bottom: 50, left: 50};
	
	/*Globals*/
	var svg, svg_g, x, y, data;

	/*Internal Methods*/
	/**
	 * Size helpers
	 */
	var owh  = window.innerHeight, oww = window.innerWidth,
		htwr = (window.innerHeight/window.innerWidth),
		opwh  = [600, 600];
	/**
	 * Get the size of the window
	 * @return {Object} {height,width,radius}
	 */
	function getSize() {
		htwr = (window.innerHeight/window.innerWidth);
		if(Math.abs(owh - window.innerHeight) > Math.abs(oww-window.innerWidth)) {			
			opwh = [ opwh[0], opwh[0]*htwr ];
			var ret = {
				hbox   : opwh,
				width  : 0.95*opwh[0] - margins.left - margins.right,
				height : 0.9*opwh[1] - margins.top - margins.bottom
			}
		}	else	{
			opwh = [ opwh[1]/htwr, opwh[1] ];
			var ret = {
				hbox   : opwh,
				width  : 0.95*opwh[0] - margins.left - margins.right,
				height : 0.9*opwh[1] - margins.top - margins.bottom
			}
		};
		owh  = window.innerHeight, oww = window.innerWidth;
		return ret;
	}

	/*"Constructor"*/
		setup();
	/**
	 * Main setup (runs when class is built): 
	 * -> builds svg
	 * -> initiates onresize events.
	 * [[WILL DELETE EVERYTHING IN `chartid`]]
	 * @return {} 
	 */
	function setup() {
		d3.select(chartid).html("");
		svg = d3.select(chartid)
					.append("svg")
					.attr("preserveAspectRatio", "xMinYMax meet")
				   	.attr("viewBox", "0 0 " + getSize().hbox)

		svg_g = svg.append("g")
				.attr("class","vchart-gstate");
		d3.select(window).on('resize',function(){
			svg.attr("viewBox", "0 0 " + getSize().hbox)
			plotevents.trigger('update');
		})
	}
	/**Event Handler**/
	var plotevents 	= new (function(){
		var e = {data:{},update:{}};
		this.register = function(type, func) {
			var id = Object.keys(e[type]).length+'-'+(Math.random().toString(20).substring(2,6));
			e[type][id] = func;
			return id;
		}
		this.remove = function(type,id) {
			if(e[type][id]) {delete e[type][id]};
		} 
		this.trigger = function(type,data) {
			Object.keys(e[type]).forEach(function(key){e[type][key](data)});
		}
		this.subtrigger = function(type, id, data) {
			e[type][id](data);
		}
	})()
	/**
	 * Generates a domain relative to scale-type
	 * @param  {Array} 	dt    data
	 * @param  {String} type  scale-type
	 * @param  {Scale} 	scale d3.sclae
	 * @param  {String} vname variable name
	 */
	function domainmkr(dt, type, scale, vname, lmin, lmax) {
		switch(type) {
			case 'linear'	: scale.domain([(lmin!==false)?lmin:(d3.min(dt, function(d) { return d[vname];})), (lmax!==false)?lmax:(d3.max(dt, function(d) { return d[vname];}))]);break;
			case 'ordinal'	: scale.domain( (axisOptions.categories) || (dt.map(function(d) { return d[vname]; })) ); break;
			default 		: console.error('Invalid domain type')
		}
	}

	/**
	 * updates the range bdrys
	 * @param  {Scale} scale 
	 * @param  {String} type  linear|ordinal
	 * @param  {Array} bdry  [min,max]
	 * @return {Scale}       
	 */
	function updaterange(scale, type, bdry) 		{
		switch(type) {
			case 'linear'	: return scale.range(bdry); break;
			case 'ordinal'	: return scale.rangeRoundBands(bdry, .1); break;
			default 		: console.error('Invalid domain type')
		}
	}

	/*External Methods*/
	/**
	 * Builds the x/y axes
	 * @param  {Object} opt [description]
	 * @return {this}     
	 */ var xsvg,ysvg,xscale,yscale;
	this.buildAxis 	= function(opt) {
		Object.keys(opt || {}).forEach(function(key) {if(Object.keys(axisOptions).indexOf(key) > -1) {axisOptions[key] = opt[key];}});
		/*Set default*/
		xscale = 'linear';
		yscale = 'linear';
		/*Helper Functions*/
		/**
		 * Generates a scale-name relative to contructor-type
		 * @param  {Constructor} constr 
		 * @return {String}        scale-type
		 */
		function scalemkr(constr) {
			switch(constr) { 
				case Number: return 'linear'; break;
				case String: return 'ordinal'; break;
				default: console.error('Wrong variable type, can only process strings and numbers.');
			}
		}
		/*Builders*/
		/**
		 * Builds the axes
		 * [[WILL REMOVE PREVIOUS AXES!]]
		 */
		function build(dt) {
			if(xsvg) xsvg.remove();
			x 		= d3.scale[xscale]();
			xsvg 	= svg.append("g")
						.attr("class", "x vchart-axis")
						.attr("transform", "translate(" + (margins.left) + "," + ((axisOptions.xto0?y(0):(getSize().height))+margins.top-margins.bottom) + ")");
						
			if(ysvg) ysvg.remove();
			y 		= d3.scale[yscale]();
			ysvg 	= svg.append("g")
						.attr("class", "y vchart-axis")
						.attr("transform", "translate(" + (axisOptions.yto0?(x(0)+margins.left):(margins.left)) + ","+(margins.top-margins.bottom)+")");

			xlabsvg = xsvg.append("text")
				.attr("class", "vchart-label")
				.attr("font-size", "1.2em"), 

			ylabsvg = ysvg.append("text")
				.attr("class", "vchart-label")
				.attr("font-size", "1.2em");
		}
		/**
		 * Updates Axes
		 */
		function update() {
			var xAxis 	= d3.svg.axis()
						.scale(x)
						.orient("bottom")
						.tickFormat(axisOptions.noxtick?function(){}:options.xformat),
				yAxis 	= d3.svg.axis()
						.scale(y)
						.orient("left")
						.tickFormat(axisOptions.noytick?function(){}:options.yformat);
			/*Range*/
			updaterange(x, xscale, [0, getSize().width]);
			updaterange(y, yscale, [getSize().height, 0]);

			/*Location*/
			xsvg.transition().duration(options.animation_time)
				.attr("transform", "translate(" + (margins.left) + "," + ((axisOptions.xto0?y(0):(getSize().height))+margins.top-margins.bottom) + ")")
				.call(xAxis).style("opacity",(axisOptions.hideX?0:1));
			ysvg.transition().duration(options.animation_time)
				.attr("transform", "translate(" + (axisOptions.yto0?(x(0)+margins.left):(margins.left)) + ","+(margins.top-margins.bottom)+")")
				.call(yAxis).style("opacity",(axisOptions.hideY?0:1));


			/*Labels*/
			xlabsvg.transition().duration(options.animation_time)
				.attr("x", getSize().width)
				.attr("y", 40)
				.style("text-anchor", "end")
				.text(options.xlab);
			ylabsvg.transition().duration(options.animation_time)
				.attr("transform", "rotate(-90)")
				.attr("y", -70)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(options.ylab);
		}

		/**
		 * Set new data to axes
		 * @param  {Array} dt data
		 */
		function updata(dt) {
			if((dt[0][options.xnames[0]] !== undefined) && (dt[0][options.ynames[0]] !== undefined)) {
				if(scalemkr(dt[0][options.xnames[0]].constructor) !== xscale || scalemkr(dt[0][options.ynames[0]].constructor) !== yscale) {
					xscale = scalemkr(dt[0][options.xnames[0]].constructor);
					yscale = scalemkr(dt[0][options.ynames[0]].constructor);
					build();
				}
				axisOptions.xscale = (xscale === "linear")&&(yscale === "ordinal") ;
				axisOptions.yscale = (yscale === "linear")&&(xscale === "ordinal");
				domainmkr(dt, xscale, x, options.xnames[0],axisOptions.xlim_min,axisOptions.xlim_max);
				domainmkr(dt, yscale, y, options.ynames[0],axisOptions.ylim_min,axisOptions.ylim_max);
			} else {console.error("Invalid x,y names")}
		}

		/*Construct axes and push update/data events*/
		build();
		plotevents.register('data',updata);
		plotevents.register('update',update);

		return this;
	}

	/**
	 * builds state for plot
	 * @param  {String} type dot|bar
	 * @return {this}      
	 */
	var beId, ueId, ptype = 'none';// memos
	this.buildPlot = function(type) 	{
			if(beId && ueId) {
				plotevents.remove('data',beId);
				plotevents.remove('update',ueId);
				d3.selectAll('.vchart-gstate').remove();
				svg_g = svg.append("g")
					.attr("class","vchart-gstate");
			}
			ptype = type;
			/*locals*/
			var substate, bardata, piedata,
				color, oncolors, text, path, xmin = 0,
				tip = d3.tip()//tooltip
					.attr('class', 'd3-tip')
					.offset([-10, 0])
					.html(function(d) {
						return "Not Set."
					});

			/*Helper Functions*/
			/**
			 * prepares data for bar-plot
			 * (to avoid stack overflow)
			 * @param  {Array} 	dt data
			 * @return {Array}     sorted-data
			 */
			var bar_titleorder;
			function bardataprep(dt) 	{
				bardata = [],bar_titleorder = {};
				dt.forEach(function(d) {
					var x0 = 0,title = d[options[(axisOptions.yscale)?('xnames'):('ynames')][0]];
					score = 0;
					options[(axisOptions.yscale)?('ynames'):('xnames')].map(function(xn){
						score += Math.pow(d[xn],2);						
						return {title: title, 
							cat: xn, x1:d[xn]} 
					}).sort(function(a,b){return a.x1-b.x1})
					.forEach(function(a){
						a.x0 = x0; 
						x0 += a.x1;
						xmin = Math.min(x0,xmin);
						bardata.push(a);
					});
					bar_titleorder[title] = Math.sqrt(score);
				});
			}

			/**
			 * prepares data for pie-plot
			 * (to avoid stack overflow)
			 * @param  {Array} 	dt data
			 * @return {Array}     sorted-data
			 */
			function pieprep(dt){
				var tot = 0;
				var pie 	= d3.layout.pie()
						.sort(null)
						.value(function(d) { tot+=d[options.xnames[0]];return d[options.xnames[0]]; })
				return piedata = pie(dt).map(function(d){
					d.data.prec = d3.format('.0%')(d.data[options.xnames[0]]/tot);
					return d;
				});
			}

			/*Builders*/
			/**
			 * Builds plot
			 * @param  {Array} dt data
			 */
			function build(dt) {
				color = d3.scale.ordinal().range(options.colors);
				oncolors = d3.scale.ordinal().range(options.oncolors);
				if(substate) {
					substate.remove();
				}
				switch(type){
					case "pie": //pie chart
						axisOptions.hideY = axisOptions.hideX = true;
						state 		= svg_g.selectAll(".vchart-state").data(pieprep(dt)).enter();
						substate 	= state.append("g")
										.attr("class", "vchart-state");
						path = substate.append("path")
								.on('mouseover', function(d){
									d3.select(this).style('fill', function(d) { return oncolors(d.data[options.xnames[0]]); });
								})
								.on('mouseout', function(d){
									d3.select(this).style('fill', function(d) { return color(d.data[options.xnames[0]]); });
								});
						text = substate.append("text")
									.on('mouseover',tip.show)
									.on('mouseout', tip.hide)
									.call(tip);
						break;
					case "dot": // scatterplot
						axisOptions.hideY = axisOptions.hideX = false;
						state 		= svg_g.selectAll(".vchart-state").data(dt).enter();
						substate 	= state.append("circle")
							.attr("class", "vchart-state");
						substate.data(data)
							.attr("r", 0)
							.style("fill","#000000")
							.style("opacity",0)
							.on('mouseover', function(d){
								d3.select(this).style('fill', function(d) { return oncolors(d[options.ynames[1]||options.ynames[0]]); });
								tip.show(d)
							})
							.on('mouseout', function(d){
								d3.select(this).style('fill', function(d) { return color(d[options.ynames[1]||options.ynames[0]]); });
								tip.hide(d)
							}).call(tip);
						break;
					case "bar": // barplot
						axisOptions.hideY = axisOptions.hideX = false;
						bardataprep(dt);
						state 		= svg_g.selectAll(".vchart-state").data(bardata).enter();
						substate 	= state.append("rect")
							.attr("class", "vchart-state")
							.attr("width",0)
							// .attr("height",0)
							.attr("y",x(0))
							.on('mouseover', function(d){
								d3.select(this).style('fill', function(d) { return oncolors(d.cat); });
								tip.show(d)
							})
							.on('mouseout', function(d){
								d3.select(this).style('fill', function(d) { return color(d.cat); });
								tip.hide(d)
							}).call(tip);
						break;
					default: console.error("Must specify a plot-type");
				}
			}
			/**
			 * Updates state
			 */
			function update() {
				if(data) {
					//Reset Domains
					domainmkr(data, xscale, x, options.xnames[0],axisOptions.xlim_min,axisOptions.xlim_max);
					domainmkr(data, yscale, y, options.ynames[0],axisOptions.ylim_min,axisOptions.ylim_max);
				
					switch(type) {
						case "dot": //scatterplot
							tip.html(function(d) {
								return  [[options.xnames,options.xformat],[options.ynames,options.yformat]].map(function(opt){
									return opt[0].map(function(name){
										return "<span>" + name + "</span>: " + "<span>" + (isNaN(d[name])?d[name]:opt[1](d[name])) + "</span>";
									}).join('<br>')
								}).join('<br>');
							});
							color.domain(options.color_cat?options.color_cat:options.ynames);
							oncolors.domain(color.domain());
							substate.data(data).transition().duration(options.animation_time)
								.attr("r", 4)
								.attr("cx", function(d) { return x(d[options.xnames[0]]) + margins.left;})
								.attr("cy", function(d) { return y(d[options.ynames[0]]) + margins.top-margins.bottom;})
								.style("fill", function(d) { return color(d[options.ynames[options.color_cat?1:0]]);}) 
								.style("opacity",1);
							break;
						case "bar": //barplot
							tip.html(function(d) {
								return "<u>" + d.title + "</u><br>" + 
										[d.cat,options[(axisOptions.yscale)?('yformat'):('xformat')](d.x1)].map(function(k){
											return "<span>" + k + "</span>" 
										}).join(': ');
							});
							if( axisOptions.yscale )	{
								//Set X/Y domains
								axisOptions.orderset&&(x.domain(x.domain().sort(function(a,b){return bar_titleorder[a] - bar_titleorder[b]})));
								y.domain([xmin, y.domain()[1]]);
								//reset colors
								color.domain(options.ynames);
								oncolors.domain(color.domain());
								//build state
								substate.data(bardata).transition().duration(1.5*options.animation_time)
									.attr("transform", "translate("+margins.left+"," + (margins.top-margins.bottom) + ")")
									.attr("x", function(d) { return x(d.title); })
									.attr("width", x.rangeBand())
									.attr("y", function(d) { return y(d.x1) })
									.attr("height", function(d) { return Math.abs(y(d.x1)-y(d.x0)); })
								.style("fill", function(d) { return color(d.cat);});

							}	else if( axisOptions.xscale )	{
								//Set X/Y domains
								axisOptions.orderset&&(y.domain(y.domain().sort(function(a,b){return bar_titleorder[a] - bar_titleorder[b]})));
								x.domain([xmin, x.domain()[1]]);
								//reset colors
								color.domain(options.xnames);
								oncolors.domain(color.domain());
								//build state
								substate.data(bardata).transition().duration(1.5*options.animation_time)
									.attr("transform", "translate(0," + (margins.top-margins.bottom) + ")")
									.attr("y", function(d) { return y(d.title); })
									.attr("height", y.rangeBand())
									.attr("x", function(d) { return x(d.x0)+margins.left; })
									.attr("width", function(d) { return Math.abs(x(d.x1)-x(d.x0)); })
								.style("fill", function(d) { return color(d.cat);});
							}	else 	{ console.error("Bar chart requires either x or y to be string")}
								substate.on('mousedown', onevents.svgpress);
							break;
						case "pie": //pie chart
							//set tooltip html
							tip.html(function(d) {
								return [[options.xnames,options.xformat],[options.ynames,options.yformat]].map(function(opt){
									return opt[0].map(function(name){
										return "<span>" + name + "</span>: " + "<span>" + (isNaN(d.data[name])?d.data[name]:opt[1](d.data[name])) + "</span>";
									}).join('<br>')
								}).join('<br>');
							});
							//define colors
								color = d3.scale.ordinal().range(options.colors);
								oncolors = d3.scale.ordinal().range(options.oncolors);
								color.domain(options.color_cat?options.color_cat:options.ynames);
								oncolors.domain(color.domain());
							//radius
								var radius = 0.9*Math.min.apply(false,getSize().hbox)/2; 
								svg_g.transition().duration(options.animation_time)
									.attr("transform", "translate(" + (getSize().width/2 + margins.left - margins.right) + "," + (getSize().height/2+margins.top-margins.bottom) + ")");
							//arc
								var arc 	= d3.svg.arc().outerRadius(radius);
									path.transition().duration(options.animation_time).attr("fill", function(d) { oncolors(d.data[options.xnames[0]]);return color(d.data[options.xnames[0]]); } )
										.attr("d", function(d){
											return arc(d).substr(0,arc(d).indexOf("L")) + "L0,0Z";
										});
										
									text.attr("transform", function(d) {d.innerRadius = 50;return "translate(" + arc.centroid(d) + ")";})
										.attr("text-anchor", "middle")
										.text(function(d) { return d.data.prec+' '+d.data[options.ynames[0]]; })
										.style("font-size","1.1em")
											
							break;		
						default: console.error("Wrong plot-type.");
					}
				}
			}
			// Store memos of ids
			beId = plotevents.register('data',build);
			ueId = plotevents.register('update',update);
		return this;
	}

	/**
	 * Add a trend line
	 * @param {String} type regression/simple
	 * @return {this}
	 */
	var tluid, trendline; //memo 
	this.addTrend = function(type) {
		var tlinedt = {};
		computeTrend();
		trendline = svg.append("line")
					.attr("class","vchart-trendline")
					.attr("stroke-width",5)
					.attr('x1',x(tlinedt.xy0[0]) + margins.left).attr('y1',y(tlinedt.xy0[1]) - margins.bottom + margins.top)
					.attr('x2',x(tlinedt.xy0[0]) + margins.left).attr('y2',y(tlinedt.xy0[1]) - margins.bottom + margins.top)
				
		
		/*Helpers*/
		function computeTrend()	{
			if( type && type.indexOf('r') === 0 ) {//regression-line
				var EX 	= data.map(function(d) {return d[options.xnames[0]]}).reduce(function(p,c) {return p+c})/data.length;
				var EY 	= data.map(function(d) {return d[options.ynames[0]]}).reduce(function(p,c) {return p+c})/data.length;
				var VX 	= data.map(function(d) {return (d[options.xnames[0]]-EX)^2}).reduce(function(p,c) {return p+c})/data.length;
				var cXY = data.map(function(d) {return (d[options.xnames[0]]-EX)*(d[options.ynames[0]]-EY)}).reduce(function(p,c) {return p+c})/data.length;
				var m 	= cXY/VX, b = EY-(cXY/VX)*EX;
					tlinedt.xy0 = [x.domain()[0],b+m*x.domain()[0]];
					tlinedt.xy1 = [x.domain()[1],b+m*x.domain()[1]];
			} 	else 	{//simple trendline
				tlinedt.xy0 = data.map(function(d) {return [d[options.xnames[0]],d[options.ynames[0]]]}).reduce(function(p,c) {if(p[0]>c[0]) {return c}else{return p}});
				tlinedt.xy1 = data.map(function(d) {return [d[options.xnames[0]],d[options.ynames[0]]]}).reduce(function(p,c) {if(p[0]<c[0]) {return c}else{return p}});
			}
		}
		/*Builder*/
		tluid = plotevents.register('update',function() {
			computeTrend();
			// update
			trendline.transition().duration(options.animation_time)
				.attr('x1',x(tlinedt.xy0[0]) + margins.left).attr('y1',y(tlinedt.xy0[1]) - margins.bottom + margins.top)
				.attr('x2',x(tlinedt.xy1[0]) + margins.left).attr('y2',y(tlinedt.xy1[1]) - margins.bottom + margins.top)
				.attr("stroke-width",1);
		});
		return this.update();
	}

	/**
	 * Removes a trend line
	 * @return {this} 
	 */
	this.removeTrend = function() {
		if(tluid)	{
			trendline.remove();
			plotevents.remove('update',tluid);
			tluid = false;
		}
		return this;
	}

	/**
	 * Adds data to chart
	 * @param  Array} dt      [{x0,x1,...,y0,y1,...}]
	 * @param  {Object} opt 	{colors,oncolors,xformat,yformat,xlab,ylab,tiplabel,xnames,ynames}
	 * @param  {Object} optAxes [description]
	 * @return {this}         
	 */
	this.data = function(dt, opt, optAxes) {
		data = dt || data;
		updateOpt(opt||{}, optAxes||{});
		plotevents.trigger('data',data);
		return this.update();
	}

	
	function updateOpt(opt, optAxes){
		Object.keys(opt || {}).forEach(function(key) {
			if(Object.keys(options).indexOf(key) > -1) {options[key] = opt[key];}
			if(key === 'margins') {margins = opt[key]};
		});
		Object.keys(optAxes || {}).forEach(function(key) {if(Object.keys(axisOptions).indexOf(key) > -1) {axisOptions[key] = optAxes[key];}});
	}
	
	/* 	
		Undocumented methods
	*/
	/**
	 * General update with no new data
	 * @param  {Object} opt 	{colors,oncolors,xformat,yformat,xlab,ylab,tiplabel,xnames,ynames}
	 * @param  {Object} optAxes [description]
	 * @return {this}         
	 */
	this.update = function(opt, optAxes, dt) {
		data = dt || data;
		updateOpt(opt||{}, optAxes||{});
		plotevents.trigger('update');
		plotevents.trigger('update');
		return this;
	}

	this.getOptions = function() {
		return options;
	}

	this.getAxisoptions = function() {
		return axisOptions;
	}

	this.currentType = function() {
		return ptype;
	}
	var onevents = {svgpress:{}};
	this.on = function(ename, func) {
		if(ueId) {
			onevents[ename] = func;
			plotevents.subtrigger('update', ueId);
		} else {console.warn('`on` should be called after plot is made')};
		return this;
	}
}
