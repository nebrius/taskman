var Task = require("../"),
	task = new Task(),
	task2,
	task3,
	task4;

task.add("task 1", function(finish) {
	console.log("task 1 start");
	setTimeout(function(){
		console.log("task 1 finish");
		finish();
	}, 1000);
});

task2 = task.add(function(finish) {
	console.log("task 2 start");
	setTimeout(function(){
		console.log("task 2 finish");
		finish();
	}, 2000);
});

task3 = task.add(function(finish) {
	console.log("task 3 start");
	setTimeout(function(){
		console.log("task 3 finish");
		finish();
	}, 3000);
});

task4 = task.add([task2, task3], function(finish) {
	console.log("task 4 start");
	setTimeout(function(){
		console.log("task 4 finish");
		finish();
	}, 4000);
});

task.createDependency(task3, ["task 1", task2], 1);

console.log("Starting tests...");
task.run(function() {
	console.log("All tests finished");
});