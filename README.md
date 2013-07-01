# Pangular
An [AngularJS](http://www.angularjs.org) module which allows for easy synchronization with [Parse.com](http://www.parse.com) applications.

##Usage
Initiate Pangular with your Parse app keys.
``` javascript
Pang.init({appKey: 'appkey', jsKey: 'jskey'});
```

Add a connection between the 'Job' class in your Parse app and the array in $scope.jobs. Any changes made in $scope.jobs will automatically sync with Parse.
``` javascript
Pang.addConnection('Job','jobs');
```

Add the Pangular module.
``` javascript
angular.module('myApp',['pang']);

function JobCtrl($scope, Pang) {
	//controller implementation
}
```

##Example
Job controller
``` javascript
//job.js
angular.module('myApp',['pang']);

function JobCtrl($scope,Pang) {

    //setup the pang object
    Pang.init({appKey: 'appkey', jsKey: 'jskey'});
    Pang.addConnection('Job','jobs');

    $scope.addJob = function() {
        $scope.jobs.push({company: $scope.jobNameText});
        $scope.jobNameText = '';
    };

    $scope.deleteJob = function(item) {
        var index = $scope.jobs.indexOf(item);
        $scope.jobs.splice(index,1);
    }
}
```

Job view
``` html
<!doctype html>
<html ng-app="myApp">
  <head>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular.min.js"></script>
    <script src="assets/js/job.js"></script>
    <script src="assets/js/pang.js"></script>
    <script type="text/javascript" src="http://www.parsecdn.com/js/parse-1.0.24.min.js"></script>
  </head>
  <body>
    <div ng-controller="JobCtrl">
      <table>
        <tr>
          <th>Job company</th>
          <th></th>
        </tr>
        <tr ng-repeat="job in jobs">
          <td>{{job.company}}</td>
          <td><a href='' ng-click='deleteJob(job)'>Delete</a></td>
        </tr>
      </table>
      <form ng-submit="addJob()">
        <b>Name:</b>
        <input type="text" ng-model="jobNameText" placeholder="new job name...">
        </br>
      </form>
    </div>
  </body>
</html>
```

##Dependencies
1. [AngularJS](http://www.angularjs.org)
2. [Parse](http://www.parse.com) application