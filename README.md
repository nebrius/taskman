Taskman
============

Taskman is a node.js library for managing (possibly) asynchronous operations. This library strives to be different from
other asynchronous operations managers by focusing on the relationships between tasks. Tasks that have no dependencies
are run first, and tasks that do have dependencies are run as soon as their dependencies have completed.

To use a task manager, you must first instantiate an instance.
```javascript
var Task = require("node-taskman"),
	task = new Task();
```

Then you add your tasks in the form of functions. The task function should call either the finish or cancel method passed
in to it once the task has completed/errored. This will trigger any dependents this task has.
```javascript
var task1 = task.add(function(finish, cancel){
	console.log("I am a task");
	setTimeout(function(){
		finish();
	}, 1000);
});
```

Next, specify the relationships between the different tasks.
```javascript
task.createDependency(task3, [task1, task2]);
```

Finally, run and enjoy!
```javascript
task.run(function(){
	console.log("success!");
})
```

You can instantiate as many taskmans as you want, and can even nest taskmans inside of each other. See ```examples/``` for other interesting ways of using taskman.

# Install
In [node.js](http://nodejs.org/) and [npm](http://github.com/isaacs/npm):

	npm install taskman

# Methods

## add

### Description
Adds a task to the manager.

### Signature
```javascript
taskman.add(taskID, dependencies, task)
```

### Parameters
* taskID <String> _optional_ The identifier of the task. If ommitted, a task is generated automatically with the form "@".  
* dependencies <String | Array> _optional_
		The task ID(s) of the task's dependencies. This is the same as calling taskman.createDependency(task, dependencies).
* task <function(finish, cancel)> The task to add.

### Throws
* Task ID is already taken.
* Task is not a function.

### Returns
The task ID of the newly created task.

## cancel

### Description
Cancels the run in progress and calls the cancel callback supplied to Taskman#run, if available.

### Signature
```javascript
taskman.cancel(customData)
```

### Parameters
* customData <any> _optional_ Data to be passed to the cancel callback.

## clearDependencies

### Description
Clears all of the dependencies for the supplied targets

### Signature
```javascript
taskman.clearDependencies(targets)
```

### Parameters
* targets <String | Array> _optional_ The task ID's of the targets to clear the dependencies for. If no targets are specified, all dependencies are cleared.

## createDependency

### Description
Creates a dependency between two or more tasks

### Signature
```javascript
taskman.createDependency(targets, dependencies)
```

### Parameters
* targets <String | Array> The task ID(s) target or targets to create dependencies for. If more than one target is supplied, every dependency specified is set as a dependency of each target.
* dependencies <String | Array> The task ID(s) of the dependency or dependencies of the targets.

### Throws
* Unsupported targets type. The targets parameter is not a string or an array.
* Unsupported dependencies type. The dependencies parameter is not a string or an array.

## reset

### Description
Resets the task so that it can be used again. All registered tasks and dependencies are discarded.

### Signature
```javascript
taskman.reset()
```

## run

### Description
Runs the scheduled tasks. Any changes to the dependencies after this method is called are ignored.

### Signature
```javascript
taskman.run(serializeTasksFlag, completion, cancel)
```

### Parameters
* serializeTasksFlag <Boolean> Convienience flag that calls Taskman@serializeTasks under the hood
* completion <function()> The function to call once all tasks have completed successfully
* cancel <function(customData)> The function to call if one of the tasks calls Taskman#cancel or its cancel function. The data passed in to Taskman#cancel is supplied as the argument to this function.

## serializeTasks

### Description
Automatically creates a dependency between every task such that the next task does not run until the task before it has completed. Any tasks added after this method is called are not serialized.

### Signature
```javascript
taskman.serializeTasks()
```