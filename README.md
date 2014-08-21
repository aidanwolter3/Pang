# Pang
Improves the [Parse.com](http://www.parse.com) javascript library for automatic data synchronization with [AngularJS](http://www.angularjs.org) applications.

[Demo](http://aidanwolter3.github.com/Pang)

##Installation
Include the Pang module in your html
``` html
<script src="pang.js"></script>
```

Inject the Pang module as a dependency
``` javascript
angular.module('myApp', ['pang'])
.controller('PangTestCtrl', function($scope, pang) {
```

##Usage
First, initialize Parse and Pang at the same time
``` javascript
pang.initialize(appId, jsKey);
```

Next, build a new Collection with a Parse table.
``` javascript
$scope.objects = pang.Collection(ParseTable).build();
```
The array `objects` will synchronize with Parse.com when you use these methods
``` javascript
//add a new object
$scope.objects.add({name: 'Object Name'});

//delete an object
$scope.objects.delete(index);

//update an existing object
$scope.objects.update(index);
```

If you would only like to fetch objects with a certain condition
``` javascript
$scope.objects = pang.Collection(ParseTable).where('isAwesome', true).build();
```

Or even sort the objects
``` javascript
//ascending
$scope.objects = pang.Collection(ParseTable).order('updatedAt').build();

//descending
$scope.objects = pang.Collection(ParseTable).order('updatedAt', false).build();
```

##Auto Syncing
Pang has the capability to detect changes in the collection and automatically update them
``` javascript
$scope.objects = pang.Collection(ParseTable).setAutoSync(true).build();
```

Use can then use any methods you'd like to change the contents of the collection
``` javascript
$scope.objects.push({name: 'New Name'});
$scope.objects.splice(index, 2)
$scope.objects[index].name = 'This is a new name';
```

**Note that a request to Parse will be sent on every single change.**
*I would recommend not directly using ng-model with object attributes when using AutoSync*


##Permissions
By default Pang will not add an ACL to the objects. You can do this by passing in another argument to the `add` method
``` javascript
var newAcl = new Parse.ACL(Parse.User.current());
newAcl.setPublicReadAccess(true);
$scope.objects.add({name: 'New Name'}, {acl: newAcl});
```

Determine if the current user has `write` permissions with
``` javascript
$scope.objects[index].canWrite
```

##Changing Users
Use `pang.User.logIn()` and `pang.User.logOut()` instead of the Parse functions to also update the collections. (if a user logs out, then the private objects will be removed from the collection)
``` javascript
pang.User.logIn(username, password);
pang.User.logOut();
```


##Other
Here are some things which are used by Pang, but you will probably never use. They are available just in case, though.

* Every object in the collection has a `parseObjectId` which can be used to find the corresponding Parse Object.
* `$scope.object.fetch()` can be used to recollect all the objects.
* `$scope.objects.autoSync` can be changed after calling build if needed.


##Suggestions?
Please, let me know!
