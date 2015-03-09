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
  * parse2pangObject()
  *
  *  Converts a Parse type object to an object Pang can deal with
  *
  *******************************************************************/
  var parse2pangObject = function(parseObject) {
    var object = {};
    for(attrKey in parseObject.attributes) {

      //if object is a pointer
      if(parseObject.attributes[attrKey] && parseObject.attributes[attrKey].id) {
        var subObject = parseObject.attributes[attrKey];
        object[attrKey] = {
          className: subObject.__proto__.className,
          parseObjectId: subObject.id
        }

      //otherwise regular attribute
      } else {
        object[attrKey] = parseObject.get(attrKey);
      }
    }

    //add the other details
    object.parseObjectId = parseObject.id;
    object.className = parseObject.__proto__.className;

    //get the write permissions
    acl = parseObject.getACL();
    if(acl != null) {
      userPermissions = null;
      if(Parse.User.current()) {
        userPermissions = acl.permissionsById[Parse.User.current().id];
      }
      publicPermissions = acl.permissionsById['*'];
      object.canWrite = (userPermissions
                      && userPermissions.write == true)
                  || (publicPermissions
                      && publicPermissions.write == true);
    } else {
      object.canWrite = true;
    }

    //add the updatedAt key
    object.updatedAt = parseObject.updatedAt.toISOString();

    return object;
  } // parse2pangObject()


  /*******************************************************************
  *
  * pang2parseObject()
  *
  *  Convert from a Pang object to a Parse object.
  *
  *******************************************************************/
  var pang2parseObject = function(pangObject, options) {

    //if object has already been saved, fetch it from Parse and apply the changes
    if(pangObject.parseObjectId) {
      var query = new Parse.Query(pangObject.className);
      query.get(pangObject.parseObjectId, {

        //found the parseObject so try to update
        success: function(parseObject) {
          for(var attrKey in pangObject) {
            if(attrKey == 'className' || attrKey == 'parseObjectId' || attrKey == 'canWrite') {
              continue;
            }
      
            //if key is a pointer to another object
            if(pangObject[attrKey] && pangObject[attrKey].parseObjectId) {
              var pangObj = pangObject[attrKey];
              var subObject = new Parse.Object(pangObj.className);
              subObject.id = pangObj.parseObjectId;
              parseObject.set(attrKey, subObject);
      
            //otherwise regular key
            } else {
              parseObject.set(attrKey, pangObject[attrKey]);
            }
          }

          //return the finished parseObject
          if(options && options.success) {
            options.success(parseObject);
          }
        },

        //error finding parseObject
        error: function(error) {
          if(options && options.error) {
            options.error(error);
          }
        }
      });

      return;
    }

    //no existing parse object yet so get the table and create a bare object
    var klass = Parse.Object.extend(pangObject.className);
    var parseObject = new klass();

    //fill the object will all the correct attributes
    for(var attrKey in pangObject) {

      if(attrKey == 'className' || attrKey == 'parseObjectId' || attrKey == 'canWrite') {
        continue;
      }

      //if key is a pointer to another object
      if(pangObject[attrKey] && pangObject[attrKey].parseObjectId) {
        var pangObj = pangObject[attrKey];
        var parseObj = new Parse.Object(pangObj.className);
        parseObj.id = pangObj.parseObjectId;
        for(var newKey in pangObj) {
          parseObj.newKey = pangObj[newKey];
        }
        parseObject.set(attrKey, parseObj);

      //otherwise regular key
      } else {
        parseObject.set(attrKey, pangObject[attrKey]);
      }
    }

    //return the finished parseObject
    if(options && options.success) {
      options.success(parseObject);
    }
  } // pang2parseObject()


  /*******************************************************************
  *
  * addParseObject()
  *
  *  Add a new object to Parse
  *
  *******************************************************************/
  var addParseObject = function(object, options) {

    //new parse object
    pang2parseObject(object, {

      success: function(parseObject) {

        //add the ACL if a current user exists
        if(options && options.acl != null) {
          parseObject.setACL(options.acl);
        }

        //save the new object to Parse
        parseObject.save(null, {
          success: function(parseObject) {
            object.parseObjectId = parseObject.id;

            //get the write permissions
            acl = parseObject.getACL();
            if(acl != null) {
              userPermissions = null;
              if(Parse.User.current()) {
                userPermissions = acl.permissionsById[Parse.User.current().id];
              }
              publicPermissions = acl.permissionsById['*'];
              object.canWrite = (userPermissions
                                && userPermissions.write == true)
                              || (publicPermissions
                                && publicPermissions.write == true);

            //no ACL so everyone has complete permissions
            } else {
              object.canWrite = true;
            }

            //add the updatedAt key
            object.updatedAt = parseObject.updatedAt.toISOString();

            //call the promise
            if(options && options.success) {
              options.success(parseObject);
            }
          },

          //error saving the object
          error: function(error) {
            if(options && options.error) {
              options.error(error);
            }
          }
        });
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
  var deleteParseObject = function(object, options) {

    //get the parseObject
    var query = new Parse.Query(object.className);
    query.get(object.parseObjectId, {

      //found the parseObject so try to delete
      success: function(parseObject) {
        parseObject.destroy({
          success: function() {
            if(options && options.success) {
              options.success(parseObject);
            }
          },
          error: function(error) {
            if(options && options.error) {
              options.error(error);
            }
          }
        });
      },
      error: function(error) {
        if(options && options.error) {
          options.error(error);
        }
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
  var updateParseObject = function(object, options) {

    //fetch the parseObject to update
    pang2parseObject(object, {
      success: function(parseObject) {

        //save the new object to Parse
        parseObject.save({
          success: function(parseObject) {

            //update the updatedAt key
            object.updatedAt = parseObject.updatedAt.toISOString();

            //call the promise
            if(options && options.success) {
              options.success(parseObject);
            }
          },

          //error saving the object
          error: function(error) {
            if(options && options.error) {
              options.error(error);
            }
          }
        });
      },
      error: function(error) {
        if(options && options.error) {
          options.error(error);
        }
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

      /***************************************************************
      *
      * pangCollection.get()
      *
      *  Get a specific pang object using a pointer from another
      *  object.
      *
      ***************************************************************/
      pangCollection.get = function(ptr, promise) {

        //create a new query for the temporary collection
        var query = new Parse.Query(pangCollection.className);

        query.get(ptr.parseObjectId, {

          //found object
          success: function(object) {
            if(promise && promise.success) {
              promise.success(parse2pangObject(object));
            }
          },

          //could not find object
          error: function(error) {
            if(promise && promise.error) {
              promise.error(error);
            }
          }
        });
      }


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
      * pangCollection.exists()
      *
      *  Add the attributes to the list of matchs to add to the query.
      *
      ***************************************************************/
      pangCollection.exists = function(key, existence) {
        pangCollection.exists[key] = existence != null ? existence : true;
        return pangCollection;
      } // pangCollection.exists()


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
      pangCollection.build = function(promise) {

        //create a new query for the collection
        var query = new Parse.Query(pangCollection.className);

        //add all the needed matches to the query
        for(match in pangCollection.queryMatches) {
          query.equalTo(match, pangCollection.queryMatches[match]);
        }

        //add all the needed existences to the query
        for(key in pangCollection.exists) {

          //ascending
          if(pangCollection.exists[key] == true) {
            query.exists(key);

          //descending
          } else {
            query.doesNotExist(key);
          }
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
        pangCollection.fetch({
          success: function(objects) {
            if(promise && promise.success) {
              promise.success(objects);
            }
          },
          error: function(error) {
            if(promise && promise.error) {
              promise.error(error);
            }
          }
        });

        return pangCollection;
      } // pangCollection.build()


      /***************************************************************
      *
      * pangCollection.fetch()
      *
      *  Fetch all the objects with the query
      *
      ***************************************************************/
      pangCollection.fetch = function(promise) {
        pangCollection.collection.fetch({
          success: function(coll) {

            //empty the array of objects
            var size = pangCollection.length;
            for(var i = size; i > 0; i--) {
              pangCollection.splice(i-1, 1);
            }

            //convert the results to an array of objects with attributes
            for(var i = 0; i < coll.length; i++) {
              var object = parse2pangObject(coll.at(i));
              pangCollection[i] = object;
            }

            //apply the changes
            $rootScope.$apply();

            if(promise && promise.success) {
              promise.success(coll);
            }
          },

          //if ran into error
          error: function(error) {
            if(promise && promise.error) {
              promise.error(error);
            }
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
        
        //create clone of old options with new 'success'
        newOptions = {};
        for(key in options) {
          if(key != 'success') {
            newOptions[key] = options[key];
          }
        }
        newOptions.success = function(object) {
          pangCollection.reorder();
          if(options && options.success) {
            options.success(object);
          }
          $rootScope.$apply();
        }

        //add acl to new options if in attr and not autoSyncing
        if(pangCollection.autoSync == false && attr.ACL != null) {
          newOptions.acl = attr.ACL;
          delete attr.ACL;
        }
        
        pangCollection.push(attr);
        var pangObject = pangCollection[pangCollection.length-1];
        pangObject.className = pangCollection.className;

        if(pangCollection.autoSync == false) {
          addParseObject(pangObject, newOptions);
        }

        return pangCollection;
      } // pangCollection.add()


      /***************************************************************
      *
      * pangCollection.delete()
      *
      *  Manually delete an object from the array and Parse.
      *
      ***************************************************************/
      pangCollection.delete = function(index, options) {

        //clone the options but change success
        newOptions = {};
        for(key in options) {
          if(key != 'success') {
            newOptions[key] = options[key];
          }
        }
        newOptions.success = function(object) {
          pangCollection.reorder();
          if(options && options.success) {
            options.success(object);
          }
          $rootScope.$apply();
        }

        var oldObject = pangCollection[index];
        pangCollection.splice(index, 1);

        if(pangCollection.autoSync == false) {
          deleteParseObject(oldObject, pangCollection.className, newOptions);
        }
        
        return pangCollection;
      } // pangCollection.delete()


      /***************************************************************
      *
      * pangCollection.update()
      *
      *  Update the attributes of the object in Parse.
      *
      ***************************************************************/
      pangCollection.update = function(object, options) {

        //clone the options but change success
        newOptions = {};
        for(key in options) {
          if(key != 'success') {
            newOptions[key] = options[key];
          }
        }
        newOptions.success = function(object) {
          pangCollection.reorder();
          if(options && options.success) {
            options.success(object);
          }
          $rootScope.$apply();
        }

        updateParseObject(object, newOptions);
        return pangCollection;
      } // pangCollection.update()


      /***************************************************************
      *
      * pangCollection.reorder()
      *
      *  Order the objects again. Executed after every add() and
      *  update()
      *
      ***************************************************************/
      pangCollection.reorder = function() {

        //order the array now that a new item has been added
        pangCollection.sort(function(a, b) {

          //loop through every order until keys are different and can be compared
          for(key in pangCollection.orders) {
            if(a[key] != b[key]) {

              //if key does not exist in object always shift down
              if(a[key] == null) {
                return -1;
              } else if(b[key] == null) {
                return 1;
              }

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
      } // pangCollection.reorder()

      
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
              
              var object = pangCollection[i]
              if(object.parseObjectId == null) {

                //create an acl in the options if necessary
                var aclOptions = {};
                if(object.ACL != null) {
                  aclOptions.acl = object.ACL;

                  //update the canWrite attribute
                  userPermissions = null;
                  if(Parse.User.current()) {
                    userPermissions = aclOptions.acl.permissionsById[Parse.User.current().id];
                  }
                  publicPermissions = aclOptions.acl.permissionsById['*'];
                  object.canWrite = (userPermissions
                                  && userPermissions.write == true)
                              || (publicPermissions
                                  && publicPermissions.write == true);
                } else {
                  object.canWrite = true;
                }

                addParseObject(object, aclOptions);
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
            
            //update every object that has changed
            for(var i = 0; i < oldValue.length; i++) {
              if(angular.equals(oldValue[i], newValue[i]) == false) {
                updateParseObject(newValue[i]);
              }
            }
          }
        }
      }, true); // $rootScope.$watch()

      return pangCollection;
    } // pang.Collection()
  }
});


