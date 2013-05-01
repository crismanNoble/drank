$(function(){

	$('#logout').hide();

	$('.drink').click(function(e){
		e.stopPropagation();
		logDrink($(this).parent().parent());
	});

	$('.item').click(function(){
		getStats($(this).attr('id'));
		showStats($(this));
	});

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
			showStats(drink);
		});
	} else {
		showStats(drink);
	}
}

function showStats(drink){
	drink.find('.svgWrap').fadeOut(500).delay(3000).fadeIn(500);
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