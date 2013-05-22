$(function(){

	$('#logout').hide();

	$('.item').each(function(){
		var itemID = $(this).attr('id');
			getStats(itemID);
			drawChart(itemID);
	});

	if(document.location.hash == '#a'){
		createCookie('s','testing',30);
		$('#logout').show();	
	}

	$('#logout').click(function(){
		eraseCookie('s');
		$('#logout').hide();
	});

	if(readCookie('s')){
		$('#logout').show();
	}

	$('.svgWrap').on('dragmove', function(ev, drag) {
  		drag.horizontal();
    	var dist = drag.location[0];
    	var parentDiv = $(this).parent();
    	var rightSwipe = drag.location[0] > 0;
	    if(Math.abs(dist) > 100){
	        parentDiv.find('.itemStats').addClass('plusOne');
	    } else {
	    	parentDiv.find('.itemStats').removeClass('plusOne');	
	    }
		}).on('draginit',function(){
			//console.log('started a drag');
		}).on('dragend',function(ev, drag){
	    	var dist = drag.location[0];
	    	var rightSwipe = drag.location[0] > 0;
	    	console.log(dist);
		    if(Math.abs(dist) > 100){
		        //console.log('threshold past');
		        if(rightSwipe) {
		            $(this).animate({left:'100%'},500).delay(3000).animate({left:'0%'},500);
		            logDrink($(this).parent());    
		        } else {
		            $(this).animate({left:'-100%'},500).delay(3000).animate({left:'0%'},500);;
		        }
		    } else {
		        $(this).animate({left:0},500);
		    }
	});
	

});

function logDrink(drink){
	var drinkType = drink.attr('id');
	var sess = readCookie('s');
	if (sess) {
		$.ajax({
			type: 'POST',
			url: "/drank/add/",
			data: {'drink': drinkType, 'session': sess}
		}).done(function(data){
			//console.log(data);
			getStats(drinkType);
			updateChart(drinkType);
		});
	}
}

function showStats(drink){
	drink.find('.svgWrap').animate({left:'100%'}).delay(3000).animate({left:'0%'});
}

function getStats(drinkType){
	//$('#'+drinkType).find('.total').hide();
	$.ajax({
		type:'POST',
		url: "/drank/get/",
		data: {'drink': drinkType}
	}).done(function(data){
		//console.log(data);
		data = $.parseJSON(data);
		//console.log(data.allData);
		$('#'+drinkType).find('.total').text(data.total);
		$('#'+drinkType).find('.today').text(data.daily);
		//$('#'+drinkType).find('.total').fadeIn();
	});

	return false;
}

function returnStats(drinkType){
	var returnData;
	console.log(drinkType);
	$.ajax({
		type:'POST',
		url: "/drank/get/",
		data: {'drink': drinkType},
		async: false
	}).done(function(data){
		data = $.parseJSON(data);
		returnData = data.allData;
	});

	//console.log('RETURN DATA//');
	//console.log(returnData);

	return returnData;
}

/*
COOKIE HANLDLING
via Quirksmode's article: http://www.quirksmode.org/js/cookies.html
*/

function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

function addDailyTotals(itemID){

}
function getLastWeek(){
    var today = new Date();
    var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    return lastWeek;
}
var lastWeekTS = getLastWeek().getTime();

function oneWeekDates(){
	var newObj = {};
	for (var i=0; i<7; i++){
		var today = new Date();
		var thisDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6-i));
		var da = thisDate.getDate();
		if (da < 10){
			da = '0' + da;
		}
		var mo = thisDate.getMonth() + 1;
		if (mo < 10){
			mo = '0' + mo;
		}
		newObj[(mo+'/'+da)] = 0;	
	}
	return newObj;
}

function oneWeekDateArray(){
	var newObj = [];
	for (var i=0; i<7; i++){
		var today = new Date();
		var thisDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6-i));
		var da = thisDate.getDate();
		if (da < 10){
			da = '0' + da;
		}
		var mo = thisDate.getMonth() + 1;
		if (mo < 10){
			mo = '0' + mo;
		}
		newObj.push(mo+'/'+da);	
	}
	return newObj;	
}

function getItemWeeklyData(itemID){
	var dailyData = oneWeekDates();
	var data = [];
	var dates = oneWeekDateArray();

	var itemData = returnStats(itemID);

	itemData.map(function(d){
		mo = d.time.split(' ')[0].split('-')[1];
		da = d.time.split(' ')[0].split('-')[2];
		yr = d.time.split(' ')[0].split('-')[0];
		var thisTS = new Date(mo+'/'+da+'/'+yr).getTime();
		if (thisTS > lastWeekTS) {
			dailyData[mo+'/'+da] += 1;
		}
	});

	dates.map(function(d){
		data.push(dailyData[d]);
	});

	return data;
}

function updateChart(itemID) {

	//update the data array
	var data = getItemWeeklyData(itemID);

	console.log(data);

	//update relavent chart dependancies
	var max = d3.max(data);

	var yScale = d3.scale.linear()
		.domain([0,max])
		.range([0,100]);

	var svg = d3.select('#'+itemID+' .chart');

	//bind the new data
	svg.selectAll("rect")
   		.data(data); 

   	//draw the chart again
	svg.selectAll("rect")
		.data(data)
		.attr('y',function(d){
			return 100 - yScale(d) + '%';
		})
		.attr('height',function(d){
			return yScale(d) + '%';
		});
}

function drawChart(itemID) {

	//lets get some colors going on

	var colors = ['#2d4f73','#345c85','#3b6898','#4375aa'];
	var color = '';

	if(itemID == 'water') {
		color = colors[0]
	} else if (itemID == 'coffee') {
		color = colors[1];
	} else if (itemID == 'beer') {
		color = colors[2];
	} else if (itemID == 'smoothie') {
		color = colors[3];
	} else {
		color = colors[0];
	}

	var data = getItemWeeklyData(itemID);

	//need to loop thru the obj and push the property to a single array
	console.log(data);

	if(itemID == 'info'){
		//'it is info, not gonna make the chart
		return false;
	}

	var max = d3.max(data);
	if (max < 3) {max = 3;}

	var barWidth = Math.round(100/data.length) + '%';

	var yScale = d3.scale.linear()
		.domain([0,max])
		.range([0,100]);

	//not sure i need this one
	var xScale = d3.scale.linear()
		.domain([0,7])
		.range([0,'98%']);

	var svg = d3.select('#'+itemID+' .itemStats').append('svg');

	svg.attr('class','chart');

	svg.selectAll('rect')
		.data(data)
		.enter()
		.append('rect')
		.attr('x',function(d,i){
			//return xScale(i);
			return i*14 + '%';
		})
		.attr('y',function(d){
			return 100 - yScale(d) + '%';
		})
		.attr('height',function(d){
			return yScale(d) + '%';
		})
		.attr('width',barWidth)
		.attr('fill',color)
		.attr('stroke',color)
		.attr('stroke-width','1px');
}