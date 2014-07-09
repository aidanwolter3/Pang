//These tests will require a parse table with a column named 'name'
//You will have to fill in your own appId and jsKey into the Parse.initialize function


//the main app
var pangTest = angular.module('pangTest', ['ngResource', 'pang']);

//the controller for the tests
function PangTestCtrl($scope, PangObject) {
	Parse.initialize('yourAppId','yourJsKey');
	var numberOfObjects = 0;

	//initialize the PangObject
	$scope.objects = PangObject.new('Snippet');
	$scope.objects.initialize().then(function() {
		numberOfObjects = $scope.objects.data.length;

		//whether each cell is up to date with the server
		$scope.upToDate = [];
		for(var i = 0; i < numberOfObjects; i++) {
			$scope.upToDate[i] = true;
		}

		//update the screen with the checkmarks and data
		$scope.$apply();
	});

	//delete the object
	$scope.deleteObject = function(object) {

		$scope.objects.delete(object).then(function() {
			console.log('Deleted object');

			//remove item for checking up to date
			delete $scope.upToDate[numberOfObjects-1];

			numberOfObjects = numberOfObjects - 1;
			$scope.$apply();

		//error
		}, function() {
			console.log('Error deleting object!');
		});
	}

	//add a new object
	$scope.addObject = function() {

		$scope.objects.add({name: numberOfObjects.toString()}).then(function() {
			console.log('Object added');

			//add a new item for checking up to date
			$scope.upToDate[numberOfObjects] = true;

			numberOfObjects = numberOfObjects + 1;
			$scope.$apply();

		//error
		}, function() {
			console.log('Error adding object!');
		});
	}

	//update the object
	$scope.updateObject = function($index, object) {

		//set not up to date
		$scope.upToDate[$index] = false;

		//update the local data
		object.name = $scope.newText;

		//update the Parse data
		$scope.objects.update(object).then(function() {
			console.log('Updated Object');

			//set is up to date
			$scope.upToDate[$index] = true;
			$scope.$apply();

		//error
		}, function() {
			console.log('Error updating object!');
		});
	}

}
