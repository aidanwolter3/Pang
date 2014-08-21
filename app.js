//the main app
var pangTest = angular.module('pangTest', ['ngResource', 'pang'])

//the controller for the tests
.controller('PangTestCtrl', function($scope, pang) {

	//initialize the Pang Object
  pang.initialize('GqBCNGLwUKpoq8CW3zhV8Q2bDovMsHsPPUaYYW8F','19QUZxLzX8bZSZ4IGpOkfSWvQUGdnU38e4Dih5Pm');

  //create the snippet table and populate
  $scope.objects = pang.Collection('Snippet').order('name').build();

  //handle login/logout info
  $scope.loggedIn = Parse.User.current() ? true : false;
  $scope.login = function() {
    pang.User.logIn('testusername', '13661');
    $scope.loggedIn = true;
  }
  $scope.logout = function() {
    pang.User.logOut();
    $scope.loggedIn = false;
  }

  //delete an object
	$scope.deleteObject = function($index) {
    if($scope.objects[$index].canWrite == true) {
      $scope.objects.delete($index);
    } else {
      alert('You do not have permission to write!');
    }
	}

	//add a new object
	$scope.addObject = function() {

    if(Parse.User.current()) {
      var parseACL = new Parse.ACL(Parse.User.current());
      parseACL.setPublicReadAccess($scope.pubReadChecked == true);
      parseACL.setPublicWriteAccess($scope.pubWriteChecked == true);
      $scope.objects.add({name: $scope.inputText}, {acl: parseACL});
    } else {
      alert('You do not have permission to write!');
    }
 	}

	//update an object
	$scope.updateObject = function($index) {
    if($scope.objects[$index].canWrite == true) {
      var object = $scope.objects[$index];
      object.name = $scope.inputText;
      $scope.objects.update(object);
    } else {
      alert('You do not have permission to write!');
    }
	}

});
