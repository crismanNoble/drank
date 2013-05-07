$(function(){

	$('#logout').hide();

	drawChart();

	// $('.drink').click(function(e){
	// 	e.stopPropagation();
	// 	logDrink($(this).parent().parent());
	// });

	// $('.item').click(function(){
	// 	getStats($(this).attr('id'));
	// 	showStats($(this));
	// });

	$('.item').each(function(){
		getStats($(this).attr('id'));
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
		console.log('started a drag');
	}).on('dragend',function(ev, drag){
    	var dist = drag.location[0];
    	var rightSwipe = drag.location[0] > 0;
    	console.log(dist);
	    if(Math.abs(dist) > 100){
	        console.log('threshold past');
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
			console.log(data);
			getStats(drinkType);
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
		$('#'+drinkType).find('.total').text(data.total);
		$('#'+drinkType).find('.today').text(data.daily);
		//$('#'+drinkType).find('.total').fadeIn();
	});

	return false;
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

function drawChart(element) {
	var data = [5,6,7,8,2];

	var max = d3.max(data);

	var barWidth = (100/data.length) + '%';

	var yScale = d3.scale.linear()
		.domain([0,max])
		.range([100,0]);

	//not sure i need this one
	var xScale = d3.scale.linear()
		.domain([0,5])
		.range([0,'100%']);


	var svg = d3.select('.itemStats').append('svg');

	svg.attr('class','chart');

	svg.selectAll('rect')
		.data(data)
		.enter()
		.append('rect')
		.attr('x',function(d,i){
			return xScale(i);
		})
		.attr('y',function(d){
			return 100 - yScale(d) + '%';
		})
		.attr('height',function(d){
			return yScale(d) + '%';
		})
		.attr('width',barWidth)
		.attr('fill','white');
}