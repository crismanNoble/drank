$(function(){
	$('.item').click(function(){
		logDrink($(this));
	});
});

function logDrink(drink){
	var drinkType = drink.attr('id');
	$.post("/drank/add/", { 'drink': drinkType });
}