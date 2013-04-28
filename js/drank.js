$(function(){
	$('.item').click(function(){
		logDrink($(this));
	});
});

function logDrink(drink){
	var drinkType = drink.attr('id');
	$.ajax({
		url: '/drank/add',
		type: 'POST',
		data: {'drinkType':drinkType}
	}).success(function(){
		console.log('nice, it worked');
	}).fail(function(){
		console.log('oops, not working');
	});
}