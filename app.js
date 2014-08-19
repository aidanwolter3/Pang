//These tests will require a parse table with a column 'name'
//You will have to fill in your own appId and jsKey into the Parse.initialize function


//the main app
var pangTest = angular.module('pangTest', ['ngResource', 'pang'])

//the controller for the tests
.controller('PangTestCtrl', function($scope, pang) {

	//initialize the Pang Object
  pang.initialize('GqBCNGLwUKpoq8CW3zhV8Q2bDovMsHsPPUaYYW8F','19QUZxLzX8bZSZ4IGpOkfSWvQUGdnU38e4Dih5Pm');

  //create the snippet table and populate
  $scope.objects = pang.Collection('Snippet').build();
  //$scope.objects = pang.Collection('Snippet').setAutoSync(true).collect();

  //delete the object
	$scope.deleteObject = function($index) {
    $scope.objects.splice($index, 1);
    //$scope.objects.delete($index);
	}

	//add a new object
	$scope.addObject = function() {
    $scope.objects.push({name: $scope.inputText});
    //$scope.objects.add({name: $scope.inputText});
 	}

	////update the object
	//$scope.updateObject = function($index) {
  //  var object = $scope.objects[$index];
  //  object.name = $scope.inputText;
	//}

});
