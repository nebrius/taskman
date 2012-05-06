/*
remove flag to enable/disable squelching of errors try/catch coupled with errorFunc
re-architect to allow multiple runs...all pre-run methods set initialStartCount and run copies initialStartCount to startCount
add clearDependencies() method
Update synchronizeTasks() to call clearDependencies()
add reset() method that removes tasks/dependencies/etc
Test adding multiple identical dependencies
Test multiple runs
*/

function is(it, type) {
	// summary:
	//		Tests if "it" is a specific "type". If type is omitted, then
	//		it will return the type.
	//
	// returns:
	//		Boolean if type is passed in
	//		String of type if type is not passed in
	var t = it === void 0 ? "" : ({}).toString.call(it),
		m = t.match(/^\[object (.+)\]$/),
		v = m ? m[1] : "Undefined";
	return type ? type === v : v;
}

module.exports = function() {
	
	var tasks = [],
		currentTaskID = 1,
		completionCallback,
		errorCallback,
		tasksRemaining,
		propogateExceptions = false;
		canceled = false;
		
	function getTaskById(taskID) {
		var len = tasks.length,
			i = 0,
			task;
		for(; i < len; i++) {
			task = tasks[i];
			if (task.taskID === taskID) {
				return task;
			}
		}
		// Return undefined
	}
	
	function runTask(task) {
		try {
			task.func();
		} catch(e) {
			console.log("caught an exception");
			errorCallback && errorCallback(e);
			if (propogateExceptions) {
				throw e;
			}
		}
	}
	
	this.add = function(taskID, dependencies, taskFunc) {
		
		// Parse and validate the task ID
		if (is(taskID, "Function")){
			taskFunc = taskID;
			dependencies = [];
			taskID = "@" + currentTaskID++;
		}
		else if (is(taskID, "Array")) {
			taskFunc = dependencies;
			dependencies = taskID;
			taskID = "@" + currentTaskID++;
		} else if (!is(taskID, "String")) {
			taskID = taskID.toString();
		}
		if (getTaskById(taskID)) {
			throw new Error("Task ID '" + taskID + "' is already taken");
		}
		
		// Parse the dependencies
		if(is(dependencies, "Function")) {
			taskFunc = dependencies;
			dependencies = [];
		} else if (is(dependencies, "String")) {
			dependencies = [dependencies];
		} else if (!is(dependencies, "Array")) {
			dependencies = [];
		}
		
		// Validate the task function
		if (!is(taskFunc, "Function")) {
			throw new Error("Task function is not a function");
		}
		
		var self = this;
		tasks.push({
			
			startCount: 0,
			
			taskID: taskID,
			
			followTasks: [],
			
			dependencies: [],
			
			func: function() {
				var followTasks = this.followTasks,
					followTask;
				taskFunc(function() { // success func
					if (!canceled) {
						tasksRemaining--;
						if (!tasksRemaining) {
							completionCallback && completionCallback.apply(this,arguments);
						} else  {
							len = followTasks.length;
							for(i = 0; i < len; i++) {
								followTask = getTaskById(followTasks[i]);
								if (followTask && !(--followTask.startCount)) {
									followTask.func();
								}
							}
						}
					}
				}, function(customData) { // error func
					self.cancel();
					throw customData;
				});
			}
		});
		
		this.createDependency(taskID, dependencies);
		
		return taskID;
	};
	
	this.createDependency = function(tasks, dependencies, count) {
		
		// Validate the tasks list
		if (is(tasks, "String")) {
			tasks = [tasks];
		} else if (!is(tasks, "Array")) {
			throw new Error("Unsupported task type '" + is(tasks) + "'");
		}
		
		// Validate the dependencies list
		if (is(dependencies, "String")) {
			dependencies = [dependencies];
		} else if (!is(dependencies, "Array")) {
			throw new Error("Unsupported dependencies type '" + is(dependencies) + "'");
		}
		
		var tasksLength = tasks.length,
			dependenciesLength = dependencies.length,
			task,
			dependency,
			followTasks,
			taskDependencies,
			i, j,
			taskIsAlreadyDependency;
		
		// Validate the count
		count = isNaN(count) || count < 0 || count >= dependenciesLength ? dependenciesLength : count;
		
		// Validate the dependencies and tasks
		for(i = 0; i < dependenciesLength; i++) {
			if (!getTaskById(dependencies[i])) {
				throw new Error("Dependency '" + dependencies[i] + "' not found");
			}
		}
		for(i = 0; i < tasksLength; i++) {
			if (!getTaskById(tasks[i])) {
				throw new Error("Task '" + tasks[i] + "' not found");
			}
		}
		
		// Link the dependencies and tasks if they haven't already been linked
		for(i = 0; i < dependenciesLength; i++) {
			followTasks = getTaskById(dependencies[i]).followTasks;
			for(j = 0; j < tasksLength; j++) {
				task = tasks[j];
				!~followTasks.indexOf(task) && followTasks.push(task);
			}
		}
		for(i = 0; i < tasksLength; i++) {
			task = getTaskById(tasks[i]);
			taskDependencies = task.dependencies;
			for(j = 0; j < dependenciesLength; j++) {
				dependency = dependencies[j];
				!~taskDependencies.indexOf(dependency) && taskDependencies.push(dependency);
			}
			task.startCount += count;
		}
	};
	
	this.serializeTasks = function() {
		var len = tasks.length,
			i = 1;
			
		for(; i < len; i++) {
			this.createDependency(tasks[i].taskID, tasks[i - 1].taskID);
		}
	};
	
	this.run = function(serializeTasksFlag, propogateExceptionsFlag, completionFunc, errorFunc) {
		
		// Parse and validate the serializeTasks flag
		if (is(serializeTasksFlag, "Function")) {
			completionFunc = serializeTasksFlag;
			errorFunc = propogateExceptionsFlag;
			serializeTasksFlag = false;
			propogateExceptionsFlag = false;
		}
		
		// Parse and validate the propogateExceptions flag
		if (is(propogateExceptionsFlag, "Function")) {
			completionFunc = propogateExceptionsFlag;
			errorFunc = completionFunc;
			propogateExceptionsFlag = false;
		}
		
		// Parse and validate completion and error functions
		!is(completionFunc, "Function") && (completionFunc = undefined);
		!is(errorFunc, "Function") && (errorFunc = undefined);
		
		serializeTasksFlag && this.serializeTasks();
		propogateExceptions = propogateExceptionsFlag;
		
		var len = tasks.length,
			i = 0,
			task;
		completionCallback = completionFunc;
		errorCallback = errorFunc;
		tasksRemaining = len;
		for(; i < len; i++) {
			task = tasks[i];
			if(!task.startCount) {
				runTask(task);
			}
		}
	};
	
	this.cancel = function() {
		canceled = true;
		var len = tasks.length,
			i = 0,
			task;
		for(; i < len; i++) {
			task = tasks[i];
			task.followTasks = [];
			task.dependencies = [];
		}
	};
};