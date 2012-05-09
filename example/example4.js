var Task = require("../"),
	task = new Task();

task.add("task 1",function(finish) {
	console.log("task 1 start");
	setTimeout(function(){
		console.log("task 1 finish");
		finish();
	}, 1000);
});

task.add("task 2",function(finish) {
	console.log("task 2 start");
	setTimeout(function(){
		console.log("task 2 finish");
		finish();
	}, 2000);
});

task.add("task 3",function(finish, err) {
	console.log("task 3 start");
	err({ message: "Task 3 caused an error" });
});

task.add("task 4",["task 2"], function(finish) {
	console.log("task 4 start");
	setTimeout(function(){
		console.log("task 4 finish");
		finish();
	}, 4000);
});

task.createDependency("task 3", ["task 1", "task 2"], 1);

console.log("Starting tests...");
task.run(false, true, function() {
	console.log("All tests finished");
}, function(customData) {
	console.log(customData.message);
});