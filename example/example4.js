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

   This example shows how to cancel a task run mid-flight
 */

var Task = require('../'),
	task = new Task();

task.add('task 1',function(finish) {
	console.log('task 1 start');
	setTimeout(function(){
		console.log('task 1 finish');
		finish();
	}, 1000);
});

task.add('task 2',function(finish) {
	console.log('task 2 start');
	setTimeout(function(){
		console.log('task 2 finish');
		finish();
	}, 2000);
});

task.add('task 3',function(finish, cancel) {
	console.log('task 3 start');
	cancel({ message: 'Task 3 caused an error' });
});

task.add('task 4',['task 2'], function(finish) {
	console.log('task 4 start');
	setTimeout(function(){
		console.log('task 4 finish');
		finish();
	}, 4000);
});

task.createDependency('task 3', ['task 1', 'task 2'], 1);

console.log('Starting tests...');
task.run(function() {
	console.log('All tests finished');
}, function(customData) {
	console.log(customData.message);
});