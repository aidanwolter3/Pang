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
		$scope.$apply();
		numberOfObjects = $scope.objects.data.length;
	});

	$scope.deleteObject = function(object) {
		$scope.objects.delete(object).then(function() {
			console.log('Deleted object');
			$scope.$apply();
		}, function() {
			console.log('Error deleting object!');
		});
	}

	$scope.addObject = function() {
		numberOfObjects = numberOfObjects + 1;
		$scope.objects.add({name: numberOfObjects.toString()}).then(function() {
			console.log('Object added');
			$scope.$apply();
		}, function() {
			console.log('Error adding object!');
		});
	}
}
