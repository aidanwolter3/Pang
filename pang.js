angular.module('pang', []).factory('pang', function($rootScope) {


  /*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  !
  ! Convenience methods
  !
  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/


  /*------------------------------------------------------------------
  Methods which manage the actual Parse objects
  ------------------------------------------------------------------*/

  /*******************************************************************
  *
  * addParseObject()
  *
  *  Add a new object to Parse
  *
  *******************************************************************/
  var addParseObject = function(object, className, acl) {

    //get the table and create a bare object
    var klass = Parse.Object.extend(className);
    var parseObject = new klass();

    //fill the object will all the correct attributes
    for(attrKey in object) {
      parseObject.set(attrKey, object[attrKey]);
    }

    //add the ACL if a current user exists
    if(acl != null) {
      parseObject.setACL(acl);
    }

    //save the new object to Parse
    parseObject.save(null, {
      success: function(parseObject) {
        object.parseObjectId = parseObject.id;

        //get the write permissions
        acl = parseObject.getACL();
        userPermissions = null;
        if(Parse.User.current()) {
          userPermissions = acl.permissionsById[Parse.User.current().id];
        }
        publicPermissions = acl.permissionsById['*'];
        object.canWrite = (userPermissions
                          && userPermissions.write == true)
                        || (publicPermissions
                          && publicPermissions.write == true);
        $rootScope.$apply();


      }
    });

  } // addParseObject()


  /*******************************************************************
  *
  * deleteParseObject()
  *
  *  Delete the object in Parse
  *
  *******************************************************************/
  var deleteParseObject = function(object, className) {

    //get the parseObject
    var query = new Parse.Query(className);
    query.get(object.parseObjectId, {

      //found the parseObject so try to delete
      success: function(parseObject) {
        parseObject.destroy();
      }
    });

  } // deleteParseObject()


  /*******************************************************************
  *
  * updateParseObject()
  *
  *  Update Parse with the current data in the object
  *
  *******************************************************************/
  var updateParseObject = function(object, className) {

    //get the Parse object
    var query = new Parse.Query(className);
    query.get(object.parseObjectId, {

      //found the parseObject so try to update
      success: function(parseObject) {

        //fill the object will all the correct attributes
        for(attrKey in object) {
          if(parseObject.get(attrKey)) {
            parseObject.set(attrKey, object[attrKey]);
          }
        }

        //save the new object to Parse
        parseObject.save();
      }
    });

  } // updateParseObject()


  /*------------------------------------------------------------------
  Other methods
  ------------------------------------------------------------------*/

  /*******************************************************************
  *
  * recollect()
  *
  *  Run 'fetch' for all the collections.
  *
  *******************************************************************/
  var recollect = function() {
    for(var i = 0; i < $rootScope.collections.length; i++) {
      $rootScope.collections[i].fetch();
    }
  } // recollect()

  
  /*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  !
  ! pang
  !
  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
  return {


    /*****************************************************************
    *
    * pang.initialize(appId, jsKey)
    *
    *  Initialize pang object
    *
    *****************************************************************/
    initialize: function(appId, jsKey) {

      //initialize Parse
      Parse.initialize(appId, jsKey);

      //hold all the collections in the scope for the $watches
      $rootScope.collections = [];

    }, // pang.initialize()


    /*****************************************************************
    *
    * pang.User
    *
    *  Return the current user if available
    *
    *****************************************************************/
    User: {
      logIn: function(username, password, promise) {
        Parse.User.logIn(username, password, {
          success: function(user) {
            recollect();
            if(promise && promise.success) {
              promise.success(user);
            }
          },
          error: function(error) {
            if(promise && promise.error) {
              promise.error(error);
            }
          }
        });
      },
      logOut: function() {
        Parse.User.logOut();
        recollect();
      }
    }, 

 
    // /*****************************************************************
    // *
    // * pang.Class()
    // *
    // *  Create a pang Class
    // *
    // *****************************************************************/
    // Class: function(className) {
    //   var klass = Parse.Object.extend(className);
    //   klass.name = className;

    //   //add a new object inheriting from klass with specified attributes
    //   klass.add = function(attr) {
    //   }

    //   return klass;

    // }, // pang.Class()


    /*****************************************************************
    *
    * pang.Collection()
    *
    *  Create a pang Collection which can fetch objects with a Parse
    *  query and collection.
    *
    *****************************************************************/
    Collection: function(className, promise) {
      var pangCollection = [];
      $rootScope.collections.push(pangCollection);

      pangCollection.className = className;
      pangCollection.queryMatches = {};
      pangCollection.orders = {};
      pangCollection.autoSync = false; //do not automagically sync objects by default


      /*****************************************************************
      *
      * pangCollection.canWrite()
      *
      *  Returns whether the current user can write to the object
      *
      *****************************************************************/
      pangCollection.canWrite = function(object, promise) {

        //get the parseObject
        var query = new Parse.Query(pangCollection.className);
        query.get(object.parseObjectId, {

          //found the parseObject so determine if current user can write to it
          success: function(parseObject) {
            var currentUser = Parse.User.current();

            //first check for public write access
            var publicAcl = parseObject.getACL().permissionsById['*'];
            if(publicAcl && publicAcl.write == true) {
              if(promise && promise.yes) {
                promise.yes();
                return;
              }
            }

            //if no public write access and no current user, return false
            if(currentUser == null) {
              promise.no();
              return;
            }

            //if user logged in, check for write access
            var userAcl = parseObject.getACL().permissionsById[''+currentUser.id];
            if(userAcl && userAcl.write == true) {
              if(promise && promise.yes) {
                promise.yes();
              }
            } else if(promise && promise.no) {
              promise.no();
            }
          }
        });
      } // pangCollection.canWrite()


      /***************************************************************
      *
      * pangCollection.where()
      *
      *  Add the attributes to the list of matchs to add to the query.
      *
      ***************************************************************/
      pangCollection.where = function(attr) {
        for(key in attr) {
          pangCollection.queryMatches[key] = attr[key];
        }
        return pangCollection;
      } // pangCollection.where()


      /***************************************************************
      *
      * pangCollection.order()
      *
      *  Add a sorting key and direction to the query
      *
      ***************************************************************/
      pangCollection.order = function(key, direction) {
        pangCollection.orders[key] = direction != null ? direction : true;
        return pangCollection;
      }


      /***************************************************************
      *
      * pangCollection.setAutoSync()
      *
      *  Sets whether the sync mode should be auto or manual
      *
      ***************************************************************/
      pangCollection.setAutoSync = function(val) {
        pangCollection.autoSync = val;
        return pangCollection;
      }


      /***************************************************************
      *
      * pangCollection.build()
      *
      *  Build the collection with a query which implements all the
      *  specified 'wheres'. Fetch the objects with the query
      *
      ***************************************************************/
      pangCollection.build = function() {

        //create a new query for the collection
        var query = new Parse.Query(pangCollection.className);

        //add all the needed matches to the query
        for(match in pangCollection.queryMatches) {
          query.equalTo(match, pangCollection.queryMatches[match]);
        }

        //add sorting to the query which has been specified by the user with 'order'
        for(key in pangCollection.orders) {

          //ascending
          if(pangCollection.orders[key] == true) {
            query.addAscending(key);

          //descending
          } else {
            query.addDescending(key);
          }
        }

        //create a Parse collection and fetch
        var CollectionClass = Parse.Collection.extend({model: pangCollection.className, query: query});
        pangCollection.collection = new CollectionClass();

        //fetch the objects
        pangCollection.fetch();

        return pangCollection;
      } // pangCollection.build()


      /***************************************************************
      *
      * pangCollection.fetch()
      *
      *  Fetch all the objects with the query
      *
      ***************************************************************/
      pangCollection.fetch = function() {
        pangCollection.collection.fetch({
          success: function(coll) {

            //empty the array of objects
            var size = pangCollection.length;
            for(var i = size; i > 0; i--) {
              pangCollection.splice(i-1, 1);
            }

            //convert the results to an array of objects with attributes
            for(var i = 0; i < coll.length; i++) {
              var object = {};
              for(attrKey in coll.at(i).attributes) {
                object[attrKey] = coll.at(i).get(attrKey);
              }
              object.parseObjectId = coll.at(i).id;

              //get the write permissions
              acl = coll.at(i).getACL();
              userPermissions = null;
              if(Parse.User.current()) {
                userPermissions = acl.permissionsById[Parse.User.current().id];
              }
              publicPermissions = acl.permissionsById['*'];
              object.canWrite = (userPermissions
                              && userPermissions.write == true)
                          || (publicPermissions
                              && publicPermissions.write == true);

              pangCollection[i] = object;
            }

            //apply the changes
            $rootScope.$apply();
          }
        });
        return pangCollection;
      } // pangCollection.build()
        

      /*--------------------------------------------------------------
      Methods for manual managment of a collection
      --------------------------------------------------------------*/


      /***************************************************************
      *
      * pangCollection.add()
      *
      *  Manually add a new object to the array and Parse.
      *
      ***************************************************************/
      pangCollection.add = function(attr, options) {
        
        pangCollection.push(attr);
        if(options != null && options.acl != null) {
          addParseObject(pangCollection[pangCollection.length-1], pangCollection.className, options.acl);
        } else {
          addParseObject(pangCollection[pangCollection.length-1], pangCollection.className);
        }

        //order the array now that a new item has been added
        pangCollection.sort(function(a, b) {

          //loop through every order until keys are different and can be compared
          for(key in pangCollection.orders) {
            if(a[key] != b[key]) {

              //ascending
              if(pangCollection.orders[key] == true) {
                return b[key] > a[key] ? -1 : 1;
              
              //descending
              } else {
                return b[key] > a[key] ? 1 : -1;
              }
            }
          }

          return 0;
        });
        return pangCollection;
      } // pangCollection.add()


      /***************************************************************
      *
      * pangCollection.delete()
      *
      *  Manually delete an object from the array and Parse.
      *
      ***************************************************************/
      pangCollection.delete = function(index) {
        var oldObject = pangCollection[index];
        pangCollection.splice(index, 1);
        deleteParseObject(oldObject, pangCollection.className);
        return pangCollection;
      } // pangCollection.delete()


      /***************************************************************
      *
      * pangCollection.update()
      *
      *  Update the attributes of the object in Parse.
      *
      ***************************************************************/
      pangCollection.update = function(object) {
        updateParseObject(object, pangCollection.className);
        return pangCollection;
      } // pangCollection.update()

      // //sync all changes to Parse
      // collection.sync = function() {
      // } // collection.sync()
      // 


      /***************************************************************
      *
      * $watch the collection to auto synchronize
      *
      ***************************************************************/
      $rootScope.$watch('collections[collections.length-1]', function(newValue, oldValue) {
        if(pangCollection.autoSync) {

          //object added
          if(newValue.length > oldValue.length) {

            //find the objects which have not been added to Parse yet and add them
            for(var i = 0; i < pangCollection.length; i++) {
              if(pangCollection[i].parseObjectId == null) {
                addParseObject(pangCollection[i], pangCollection.className);
              }
            }

          //object removed
          } else if(newValue.length < oldValue.length) {

            //find the objects which were removed and delete them from Parse
            for(var i = 0; i < oldValue.length; i++) {
              var obj = oldValue[i];
              var shouldDelete = true
              if(obj.parseObjectId == null) continue;
              for(var j = 0; j < newValue.length; j++) {
                if(newValue[j].parseObjectId == obj.parseObjectId) {
                  shouldDelete = false;
                  continue;
                }
              }
              if(shouldDelete) {
                deleteParseObject(obj, pangCollection.className);
              }
            }

          //object changed but not added or deleted
          } else {
            console.log('changed');
            
            //update every object that has changed
            for(var i = 0; i < oldValue.length; i++) {
              if(angular.equals(oldValue[i], newValue[i]) == false) {
                updateParseObject(newValue[i], pangCollection.className);
              }
            }
          }
        }
      }, true); // $rootScope.$watch()

      return pangCollection;
    } // pang.Collection()
  }
});


