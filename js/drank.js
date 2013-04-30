$(function(){
	$('svg').click(function(e){
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

});

function logDrink(drink){
	var drinkType = drink.attr('id');
	$.post("/drank/add/", {'drink': drinkType })
	.done(function(){
		getStats(drinkType);
		showStats(drink);
	});
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
		console.log(data);
		data = $.parseJSON(data);
		$('#'+drinkType).find('.total').text(data.total);
		$('#'+drinkType).find('.today').text(data.daily);
		//$('#'+drinkType).find('.total').fadeIn();
	});

	return false;
}