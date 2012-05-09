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
		cancelCallback,
		tasksRemaining,
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
	
	this.reset = function() {
		tasks = [],
		currentTaskID = 1,
		completionCallback = undefined,
		cancelCallback = undefined,
		tasksRemaining = undefined,
		canceled = false;
	};
	
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
			
			initialStartCount: 0,
			
			startCount: 0,
			
			taskID: taskID,
			
			followTasks: [],
			
			dependencies: [],
			
			func: function() {
				var followTasks = this.followTasks,
					followTask;
				taskFunc(function() { // finish func
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
				}, function(customData) { // cancel func
					self.cancel(customData);
				});
			}
		});
		
		this.createDependency(taskID, dependencies);
		
		return taskID;
	};
	
	this.createDependency = function(targets, dependencies, count) {
		
		// Validate the targets list
		if (is(targets, "String")) {
			targets = [targets];
		} else if (!is(targets, "Array")) {
			throw new Error("Unsupported task type '" + is(targets) + "'");
		}
		
		// Validate the dependencies list
		if (is(dependencies, "String")) {
			dependencies = [dependencies];
		} else if (!is(dependencies, "Array")) {
			throw new Error("Unsupported dependencies type '" + is(dependencies) + "'");
		}
		
		var targetsLength = targets.length,
			dependenciesLength = dependencies.length,
			task,
			dependency,
			followTasks,
			taskDependencies,
			i, j,
			taskIsAlreadyDependency;
		
		// Validate the count
		count = isNaN(count) || count < 0 || count >= dependenciesLength ? dependenciesLength : count;
		
		// Validate the dependencies and targets
		for(i = 0; i < dependenciesLength; i++) {
			if (!getTaskById(dependencies[i])) {
				throw new Error("Dependency '" + dependencies[i] + "' not found");
			}
		}
		for(i = 0; i < targetsLength; i++) {
			if (!getTaskById(targets[i])) {
				throw new Error("Task '" + targets[i] + "' not found");
			}
		}
		
		// Link the dependencies and targets if they haven't already been linked
		for(i = 0; i < dependenciesLength; i++) {
			followTasks = getTaskById(dependencies[i]).followTasks;
			for(j = 0; j < targetsLength; j++) {
				task = targets[j];
				!~followTasks.indexOf(task) && followTasks.push(task);
			}
		}
		for(i = 0; i < targetsLength; i++) {
			task = getTaskById(targets[i]);
			taskDependencies = task.dependencies;
			for(j = 0; j < dependenciesLength; j++) {
				dependency = dependencies[j];
				!~taskDependencies.indexOf(dependency) && taskDependencies.push(dependency);
			}
			task.initialStartCount += count;
		}
	};
	
	this.clearDependencies = function(targets) {
		
		// Validate the tasks list
		var len = tasks.length,
			i = 0,
			task;
		if (is(targets, "String")) {
			targets = [targets];
		} else if (!is(targets, "Array")) {
			targets = [];
			for(; i < len; i++) {
				targets.push(tasks[i].taskID);
			}
		}
		
		// Clear the dependencies
		len = tasks.length,
		i = 0;
		for(; i < len; i++) {
			task = tasks[i];
			task.initialStartCount = 0;
			task.dependencies = [];
			task.followTasks = [];
		}
	};
	
	this.serializeTasks = function() {
		this.clearDependencies();
		
		var len = tasks.length,
			i = 1;
		for(; i < len; i++) {
			this.createDependency(tasks[i].taskID, tasks[i - 1].taskID);
		}
	};
	
	this.run = function(serializeTasksFlag, completionFunc, cancelFunc) {
		
		// Parse and validate the serializeTasks flag
		if (is(serializeTasksFlag, "Function")) {
			cancelFunc = completionFunc;
			completionFunc = serializeTasksFlag;
			serializeTasksFlag = false;
		}
		
		// If either function is not actually a function, force it to something falsy
		!is(completionFunc, "Function") && (completionFunc = undefined);
		!is(cancelFunc, "Function") && (cancelFunc = undefined);
		
		serializeTasksFlag && this.serializeTasks();
		
		var len = tasks.length,
			i = 0,
			task;
		completionCallback = completionFunc;
		cancelCallback = cancelFunc;
		tasksRemaining = len;
		for(; i < len; i++) {
			task = tasks[i];
			task.startCount = task.initialStartCount;
			if(!task.startCount) {
				task.func();
			}
		}
	};
	
	this.cancel = function(customData) {
		canceled = true;
		cancelCallback && cancelCallback(customData);
	};
};