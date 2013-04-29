$(function(){
	$('svg').click(function(e){
		e.stopPropagation();
		logDrink($(this).parent().parent());
	});

	$('.item').click(function(){
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
	$('#'+drinkType).find('.total').hide();
	$.post("/drank/get/", {'drink': drinkType})
	.done(function(data){
		console.log(data);
		$('#'+drinkType).find('.total').text(data);
		$('#'+drinkType).find('.total').fadeIn();
	});
	return false;
}