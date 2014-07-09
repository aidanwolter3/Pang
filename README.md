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

Initialize a new Pang object with a connection to a Parse table
``` javascript
$scope.objects = PangObject.new('ParseTable');
$scope.objects.initialize();
```

Add object
``` javascript
$scope.objects.add({name: 'Object Name'});
```

Delete object
``` javascript
var objectToDelete = $scope.objects.data[0];
$scope.objects.delete(objectToDelete);
```

Update object
``` javascript
var objectToUpdate = $scope.objects.data[0];
objectToUpdate.attribute = value;
$scope.objects.update(objectToUpdate);
```

##Example
Controller
``` javascript
function PangTestCtrl($scope, PangObject) {
	Parse.initialize('yourAppId','yourJsKey');
	var numberOfObjects = 0;

	//initialize the PangObject
	$scope.objects = PangObject.new('ObjectTable');
	$scope.objects.initialize().then(function() {
		$scope.$apply();
		numberOfObjects = $scope.objects.data.length;
	});

	//delete an object
	$scope.deleteObject = function(object) {
		$scope.objects.delete(object);
		numberOfObjects = numberOfObjects - 1;
	}

	//add an object
	$scope.addObject = function() {
		$scope.objects.add({name: numberOfObjects.toString()});
		numberOfObjects = numberOfObjects + 1;
	}

	//update the object
	$scope.updateObject = function(object) {
		object.name = $scope.newText;
		$scope.objects.update(object);
	}
}
```

View
``` html
<!-- a table which lists all data in the pangObject data array -->
<table>
	<tr>
		<th>Objects:</th>
	</tr>
	<tr ng-repeat="object in objects.data">
		<td>{{object.name}}</td>
		<td>
			<button class="btn-small btn-primary"
			        ng-click="updateObject(object)">update</button>
			<button class="btn-small btn-danger"
			        ng-click="deleteObject(object)">delete</button>
		</td>
	</tr>
</table>

<input ng-model="newText" placeholder="update text...">
<hr>
<button class="btn" ng-click="addObject()">New Object</button>
```

##Todo
**updateAll( )** data to and from Parse.
``` javascript
$scope.objects.updateAll();
```

**update( )** data in both directions (to and from Parse).
Also, using the timestamps, determine whether the local object or the object in Parse
is the most up-to-date. Update the object in both directions according to the
most up-to-date data.
``` javascript
$scope.objects[0].update();
```

##Dependencies
1. [AngularJS](http://www.angularjs.org)
2. [JQuery](http://jquery.com)
3. [Parse](http://www.parse.com) application
