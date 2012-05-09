var Task = require("../"),
	task = new Task();

task.add(function(finish) {
	console.log("task 1 start");
	setTimeout(function(){
		console.log("task 1 finish");
		finish();
	}, 1000);
});

task.add(function(finish) {
	console.log("task 2 start");
	setTimeout(function(){
		console.log("task 2 finish");
		finish();
	}, 2000);
});

task.add(function(finish) {
	console.log("task 3 start");
	setTimeout(function(){
		console.log("task 3 finish");
		finish();
	}, 3000);
});

task.add(function(finish) {
	console.log("task 4 start");
	setTimeout(function(){
		console.log("task 4 finish");
		finish();
	}, 4000);
});

console.log("Starting tests...");
task.run(function() {
	console.log("All tests finished");
});