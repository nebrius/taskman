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

    This example shows how to run four tasks in parallel
 */



var Task = require('../'),
	task = new Task();

task.add(function(finish) {
	console.log('task 1 start');
	setTimeout(function(){
		console.log('task 1 finish');
		finish();
	}, 1000);
});

task.add(function(finish) {
	console.log('task 2 start');
	setTimeout(function(){
		console.log('task 2 finish');
		finish();
	}, 2000);
});

task.add(function(finish) {
	console.log('task 3 start');
	setTimeout(function(){
		console.log('task 3 finish');
		finish();
	}, 3000);
});

task.add(function(finish) {
	console.log('task 4 start');
	setTimeout(function(){
		console.log('task 4 finish');
		finish();
	}, 4000);
});

console.log('Starting tests...');
task.run(function() {
	console.log('All tests finished');
});