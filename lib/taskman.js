/*
   Copyright 2012-2013 Bryan Hughes <bryan@theoreticalideations.com>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

/**
 * Tests if 'it' is a specific 'type'. If type is omitted, then it will return the type.
 *
 * @function
 * @param it the variable to test
 * @param {String} [type] the type to test against, e.g. 'String'
 * @returns {Boolean|String} The type of 'it' if 'type' was not supplied, else true or false if 'it' is of type 'type.'
 */
function is(it, type) {
	var t = it === void 0 ? '' : ({}).toString.call(it),
		m = t.match(/^\[object (.+)\]$/),
		v = m ? m[1] : 'Undefined';
	return type ? type === v : v;
}

/**
 * Create an instance of a task manager
 *
 * @constructor
 * @name Taskman
 */
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

	/**
	 * Resets the task so that it can be used again. All registered tasks and dependencies are discarded.
	 *
	 * @function
	 * @name Taskman#reset
	 */
	this.reset = function() {
		tasks = [],
		currentTaskID = 1,
		completionCallback = undefined,
		cancelCallback = undefined,
		tasksRemaining = undefined,
		canceled = false;
	};

	/**
	 * Adds a task to the manager.
	 *
	 * @function
	 * @name Taskman#add
	 * @param {String} [taskID] The identifier of the task. If ommitted, a task is generated automatically with the
	 *		form '@<integer>'.
	 * @param {String|Array} [dependencies] The task ID(s) of the task's dependencies. This is the same as calling
	 *		taskman.createDependency(task, dependencies).
	 * @param {function(finish, cancel)} task The task to add.
	 * @returns The taskID
	 * @throws Task ID is already taken.
	 * @throws Task is not a function.
	 */
	this.add = function(taskID, dependencies, taskFunc) {

		// Parse and validate the task ID
		if (is(taskID, 'Function')){
			taskFunc = taskID;
			dependencies = [];
			taskID = '@' + currentTaskID++;
		}
		else if (is(taskID, 'Array')) {
			taskFunc = dependencies;
			dependencies = taskID;
			taskID = '@' + currentTaskID++;
		} else if (!is(taskID, 'String')) {
			taskID = taskID.toString();
		}
		if (getTaskById(taskID)) {
			throw new Error('Task ID "' + taskID + '" is already taken');
		}

		// Parse the dependencies
		if(is(dependencies, 'Function')) {
			taskFunc = dependencies;
			dependencies = [];
		} else if (is(dependencies, 'String')) {
			dependencies = [dependencies];
		} else if (!is(dependencies, 'Array')) {
			dependencies = [];
		}

		// Validate the task function
		if (!is(taskFunc, 'Function')) {
			throw new Error('Task function is not a function');
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
					followTask,
					i, len;
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

	/**
	 * Creates a dependency between two or more tasks
	 *
	 * @function
	 * @name Taskman#createDependency
	 * @param {String|Array} targets The task ID(s) target or targets to create dependencies for. If more than one target is
	 *		supplied, every dependency specified is set as a dependency of each target.
	 * @param {String|Array} dependencies The task ID(s) of the dependency or dependencies of the targets.
	 * @throws Unsupported targets type. The targets parameter is not a string or an array.
	 * @throws Unsupported dependencies type. The dependencies parameter is not a string or an array.
	 */
	this.createDependency = function(targets, dependencies, count) {

		// Validate the targets list
		if (is(targets, 'String')) {
			targets = [targets];
		} else if (!is(targets, 'Array')) {
			throw new Error('Unsupported targets type "' + is(targets) + '"');
		}

		// Validate the dependencies list
		if (is(dependencies, 'String')) {
			dependencies = [dependencies];
		} else if (!is(dependencies, 'Array')) {
			throw new Error('Unsupported dependencies type "' + is(dependencies) + '"');
		}

		var targetsLength = targets.length,
			dependenciesLength = dependencies.length,
			task,
			dependency,
			followTasks,
			taskDependencies,
			i, j;

		// Validate the count
		count = isNaN(count) || count < 0 || count >= dependenciesLength ? dependenciesLength : count;

		// Validate the dependencies and targets
		for(i = 0; i < dependenciesLength; i++) {
			if (!getTaskById(dependencies[i])) {
				throw new Error('Dependency "' + dependencies[i] + '" not found');
			}
		}
		for(i = 0; i < targetsLength; i++) {
			if (!getTaskById(targets[i])) {
				throw new Error('Task "' + targets[i] + '" not found');
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

	/**
	 * Clears all of the dependencies for the supplied targets
	 *
	 * @name Taskman#clearDependencies
	 * @function
	 * @param {String|Array} targets The task ID's of the targets to clear the dependencies for.
	 */
	this.clearDependencies = function(targets) {

		// Validate the tasks list
		var len = tasks.length,
			i = 0,
			task;
		if (is(targets, 'String')) {
			targets = [targets];
		} else if (!is(targets, 'Array')) {
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

	/**
	 * Automatically creates a dependency between every task such that the next task does not run until the task before
	 * it has completed. Any tasks added after this method is called are not serialized.
	 *
	 * @name Taskman#serializeTasks
	 * @function
	 */
	this.serializeTasks = function() {
		this.clearDependencies();

		var len = tasks.length,
			i = 1;
		for(; i < len; i++) {
			this.createDependency(tasks[i].taskID, tasks[i - 1].taskID);
		}
	};

	/**
	 * Runs the scheduled tasks. Any changes to the dependencies after this method is called are ignored.
	 *
	 * @name Taskman#run
	 * @function
	 * @param {Boolean} serializeTasksFlag Convienience flag that calls {@link Taskman@serializeTasks} under the hood
	 * @param {function()} completion The function to call once all tasks have completed successfully
	 * @param {function(customData)} cancel The function to call if one of the tasks calls {@link Taskman#cancel} or
	 *		its cancel function. The data passed in to {@link Taskman#cancel} is supplied as the argument to this
	 *		function.
	 */
	this.run = function(serializeTasksFlag, completionFunc, cancelFunc) {

		// Parse and validate the serializeTasks flag
		if (is(serializeTasksFlag, 'Function')) {
			cancelFunc = completionFunc;
			completionFunc = serializeTasksFlag;
			serializeTasksFlag = false;
		}

		// If either function is not actually a function, force it to something falsy
		!is(completionFunc, 'Function') && (completionFunc = undefined);
		!is(cancelFunc, 'Function') && (cancelFunc = undefined);

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

	/**
	 * Cancels the run in progress and calls the cancel callback supplied to {@link Taskman#run}, if available.
	 *
	 * @name Taskman#cancel
	 * @function
	 * @param customData Data to be passed to the cancel callback.
	 */
	this.cancel = function(customData) {
		canceled = true;
		cancelCallback && cancelCallback(customData);
	};
};