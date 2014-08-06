angular.module('pang', []).factory('pang', function($rootScope) {
  return {


    /*****************************************************************
     *
     * pang.initialize(appId, jsKey)
     *
     *  Initialize pang object
     *
     ****************************************************************/
    initialize: function(appId, jsKey) {

      //create the hash for all tables the user uses
      $rootScope.pangTables = {};

      //create the hash for all the arrays corresponding to the tables
      $rootScope.pangArrays = {};

      //initialize Parse
      Parse.initialize(appId, jsKey);

    }, // pang.initialize()


    /*****************************************************************
     *
     * pang.Table('tableName')
     *
     *  Create array from Parse table which contains convenient methods
     *
     ****************************************************************/
    Table: function(__className__, options, promise) {
      var table = Parse.Object.extend(__className__);
      $rootScope.pangTables[__className__] = table;
      $rootScope.pangArrays[__className__] = array = [];
      array.__className__ = __className__;
      array.__autoSync__ = false;   // do not auto sync by default
      array.__syncInterval__ = 5000;// 5 second auto sync interval by default

      if(options) {
        if(options.autoSync) {
          array.__autoSync__ = options.autoSync;
        }
        if(options.syncInterval) {
          array.__syncInterval__ = options.syncInterval;
        }
      }

      //fetch all the objects from Parse and convert them to array
      var query = new Parse.Query(table);
      query.find({

        //successfully connected, so convert to array
        success: function(objects) {

          //convert to array
          for(var i = 0; i < objects.length; i++) {
            var object = {};
            for(attrKey in objects[i].attributes) {
              object[attrKey] = objects[i].get(attrKey);
            }
            object.__parseObjectId__ = objects[i].id;
            array[i] = object;
          }

          //apply the changes
          $rootScope.$apply();

          //call the promises' success callback
          if(promise && promise.success) {
            promise.success(array);
          }
        },

        //error, so call the promises' error callback
        error: function(error) {
          if(promise && promise.error) {
            promise.error(error);
          }
        }
      });


      /*****************************************************************
       *
       * addParseObject(object, promise)
       *
       *  Add a new object to Parse
       *
       ****************************************************************/
      var addParseObject = function(object, promise) {

        //get the table and create a bare object
        var table = $rootScope.pangTables[array.__className__];
        var parseObject = new table();

        //fill the object will all the correct attributes
        for(attrKey in object) {
          parseObject.set(attrKey, object[attrKey]);
        }

        //save the new object to Parse
        parseObject.save(null, {

          //success so call the promise
          success: function(parseObject) {
            object.__parseObjectId__ = parseObject.id;
            if(promise && promise.success) {
              promise.success(parseObject);
            }
          },

          //error so call the promise
          error: function(error) {
            if(promise && promise.error) {
              promise.error(error);
            }
          }
        });

      } // addParseObject()


      /*****************************************************************
       *
       * deleteParseObject(object, promise)
       *
       *  Delete the object in Parse
       *
       ****************************************************************/
      var deleteParseObject = function(object, promise) {

        //get the object's table and the parseObject
        var table = $rootScope.pangTables[array.__className__];
        var query = new Parse.Query(table);
        query.get(object.__parseObjectId__, {

          //found the parseObject so try to delete
          success: function(parseObject) {
            parseObject.destroy({
              
              //successfully delete, so call promise
              success: function() {
                if(promise && promise.success) {
                  promise.success();
                }
              },

              //error deleteing, so call promise
              error: function(error) {
                if(promise && promise.error) {
                  promise.error(error);
                }
              }
            });
          },

          //could not find parseObject so call promise
          error: function(error) {
            if(promise && promise.error) {
              promise.error(error);
            }
          }

        });

      } // deleteParseObject()


      /*****************************************************************
       *
       * updateParseObject(object, promise)
       *
       *  Update Parse with the current data in the object
       *
       ****************************************************************/
      var updateParseObject = function(object, promise) {

        //get the table and the Parse object
        var table = $rootScope.pangTables[array.__className__];
        var query = new Parse.Query(table);
        query.get(object.__parseObjectId__, {

          //found the parseObject so try to delete
          success: function(parseObject) {

            //fill the object will all the correct attributes
            for(attrKey in object) {
              if(parseObject.get(attrKey)) {
                parseObject.set(attrKey, object[attrKey]);
              }
            }

            //save the new object to Parse
            parseObject.save(null, {

              //success so call the promise
              success: function(parseObject) {
                if(promise && promise.success) {
                  promise.success(parseObject);
                }
              },

              //error so call the promise
              error: function(error) {
                if(promise && promise.error) {
                  promise.error(error);
                }
              }
            });
          },

          //could not find parseObject so call promise
          error: function(error) {
            if(promise && promise.error) {
              promise.error(error);
            }
          }
        });

      } // updateParseObject()


      /*****************************************************************
       *
       * Table.add(object, promise)
       *
       *  Add a new object and update on Parse
       *
       ****************************************************************/
      array.add = function(object, promise) {

        addParseObject(object, promise);
        array.push(object);

      } // array.add()


      /*****************************************************************
       *
       * Table.delete(object, promise)
       *
       *  Delete an object and remove from Parse
       *
       ****************************************************************/
      array.delete = function(object, promise) {

        deleteParseObject(object, promise);
        array.splice(array.indexOf(object), 1);

      } // array.delete()


      /*****************************************************************
       *
       * Table.update(object, promise)
       *
       *  Update the object and save to Parse
       *
       ****************************************************************/
      array.update = function(object, promise) {

        updateParseObject(object, promise);

      } // array.update()


      /*****************************************************************
       *
       * Table.sync(promise)
       *
       *  Sync all changes to Parse
       *
       ****************************************************************/
      array.sync = function(promise) {
        
        //get the corresponding table
        //var table = $rootScope.pangTables[array.__className__];

      } // array.sync()


      /*****************************************************************
       *
       * Watch deep changes in array and sync them
       *
       ****************************************************************/
      $rootScope.$watch('pangArrays.'+__className__, function(newArray, oldArray) {

        //if not in autoSyncMode then return
        if(array.__autoSync__ == false) {
          return;
        }

        //item added
        if(oldArray.length < newArray.length) {

          //take the difference to find the added object(s)
          var adds = newArray.filter(function(i) {return i.__parseObjectId__ == null});

          //add all the new objects to Parse and add the parseObjectIds to the array's objects
          for(var i = 0; i < adds.length; i++) {
            addParseObject(adds[i], {
              error: function(error) { console.log('Error adding a new Parse object!'); }
            });
          }

        //item deleted
        } else if(oldArray.length > newArray.length) {

          //take the difference to find the removed object(s)
          var rms = oldArray.filter(function(i) {
            for(var j = 0; j < newArray.length; j++) {
              if( i.__parseObjectId__ && newArray[j].__parseObjectId__ == i.__parseObjectId__) {
                return false;
              }
            }
            return true && i.__parseObjectId__;
          });

          //delete all the Parse objects no longer in the array
          for(var i = 0; i < rms.length; i++) {
            deleteParseObject(rms[i], {
              error: function(error) { console.log('Error deleting the Parse object!'); }
            });
          }

        //item changed but not added or deleted
        } else {

          //update every object that has changed
          for(var i = 0; i < oldArray.length; i++) {
            if(angular.equals(oldArray[i], newArray[i]) == false) {
              updateParseObject(newArray[i], {
                error: function(error) { console.log('Error updating the Parse object!'); }
              });
            }
          }
        }

      }, true); // $rootScope.$watch()

      return array;

    }, // pang.Table()


    /*****************************************************************
     *
     * pang.User()
     *
     *  Create a new user in Parse
     *
     ****************************************************************/
    User: function() {
      return Parse.User();

    } // pang.User()
  }
});


