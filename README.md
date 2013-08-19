# Pangular
An [AngularJS](http://www.angularjs.org) module which allows for easy synchronization with [Parse.com](http://www.parse.com) applications.

##Usage

Add the Pangular module and your ready to go.
``` javascript
angular.module('myApp', ['pang']);

function ObjectCtrl($scope, PangObject) {
	//controller implementation
}
```

##Example
Controller
``` javascript
function PangTestCtrl($scope, PangObject) {
	Parse.initialize('yourAppId','yourJsKey');
	var numberOfObjects = 0;

	//initialize the PangObject
	$scope.objects = PangObject.new('Snippet');
	$scope.objects.initialize().then(function() {
		$scope.$apply();
		numberOfObjects = $scope.objects.data.length;
	});

	//deleting data
	$scope.deleteObject = function(object) {
		$scope.objects.delete(object).then(function() {
			console.log('Deleted object');
			$scope.$apply();
		}, function() {
			console.lof('Error deleting object!');
		});
	}

	//adding data
	$scope.addObject = function() {
		numberOfObjects = numberOfObjects + 1;
		$scope.objects.add({name: numberOfObjects.toString()}).then(function() {
			console.log('Object added');
			$scope.$apply()
		}, function() {
			console.log('Error adding object!');
		});
	}
}
```

View
``` html
<!-- a table which lists all data in the pangObject data array -->
<table class="table table-striped table-bordered table-condensed table-hover">
	<tr>
		<th>Objects</th>
	</tr>
	<tr ng-repeat="object in objects.data">
		<td ng-click="deleteObject(object)">{{object.name}}</td>
	</tr>
	<tr>
		<td ng-click="addObject()" style="color: darkgrey">Add Object...</td>
	</tr>
</table>
```

##Dependencies
1. [AngularJS](http://www.angularjs.org)
2. [JQuery](http://jquery.com)
3. [Parse](http://www.parse.com) application
