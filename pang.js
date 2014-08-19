angular.module('pang', []).factory('pang', function($rootScope) {
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

      $rootScope.collections = [];

    }, // pang.initialize()

 
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
            for(var i = 0; i < pangCollection.length; i++) {
              pangCollection[i] = null;
            }

            //convert the results to an array of objects with attributes
            for(var i = 0; i < coll.length; i++) {
              var object = {};
              for(attrKey in coll.at(i).attributes) {
                object[attrKey] = coll.at(i).get(attrKey);
              }
              object.parseObjectId = coll.at(i).id;
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
      pangCollection.add = function(attr) {
        
        pangCollection.push(attr);
        addParseObject(pangCollection[pangCollection.length-1]);

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
        deleteParseObject(oldObject);
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
        updateParseObject(object);
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
                addParseObject(pangCollection[i]);
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
                deleteParseObject(obj);
              }
            }

          //object changed but not added or deleted
          } else {
            console.log('changed');
            
            //update every object that has changed
            for(var i = 0; i < oldValue.length; i++) {
              if(angular.equals(oldValue[i], newValue[i]) == false) {
                updateParseObject(newValue[i]);
              }
            }
          }
        }
      }, true); // $rootScope.$watch()


      /*--------------------------------------------------------------
      Methods which manage the actual Parse objects
      --------------------------------------------------------------*/


      /***************************************************************
      *
      * addParseObject()
      *
      *  Add a new object to Parse
      *
      ***************************************************************/
      var addParseObject = function(object) {

        //get the table and create a bare object
        var klass = Parse.Object.extend(pangCollection.className);
        var parseObject = new klass();

        //fill the object will all the correct attributes
        for(attrKey in object) {
          parseObject.set(attrKey, object[attrKey]);
        }

        //save the new object to Parse
        parseObject.save(null, {
          success: function(parseObject) {
            object.parseObjectId = parseObject.id;
          }
        });

      } // addParseObject()


      /***************************************************************
      *
      * deleteParseObject()
      *
      *  Delete the object in Parse
      *
      ***************************************************************/
      var deleteParseObject = function(object) {

        //get the parseObject
        var query = new Parse.Query(pangCollection.className);
        query.get(object.parseObjectId, {

          //found the parseObject so try to delete
          success: function(parseObject) {
            parseObject.destroy();
          }
        });

      } // deleteParseObject()


      /***************************************************************
      *
      * updateParseObject()
      *
      *  Update Parse with the current data in the object
      *
      ***************************************************************/
      var updateParseObject = function(object) {

        //get the Parse object
        var query = new Parse.Query(pangCollection.className);
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


      return pangCollection;
    } // pang.Collection()
  }
});


