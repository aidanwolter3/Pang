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
      pangCollection.autoSync = true; //automagically sync objects by default


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

      //only iterate over objects which pass through the filter
      //collection.filter = function(


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
          }
        }
      }, true);


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



//     /*****************************************************************
//      *
//      * pang.initialize(appId, jsKey)
//      *
//      *  Initialize pang object
//      *
//      ****************************************************************/
//     initialize: function(appId, jsKey) {
// 
//       //create the hash for all tables the user uses
//       $rootScope.pangTables = {};
// 
//       //create the hash for all the arrays corresponding to the tables
//       $rootScope.pangArrays = {};
// 
//       //initialize Parse
//       Parse.initialize(appId, jsKey);
// 
//     }, // pang.initialize()
// 
// 
//     /*****************************************************************
//      *
//      * pang.Table('tableName')
//      *
//      *  Create array from Parse table which contains convenient methods
//      *
//      ****************************************************************/
//     Table: function(__className__, options, promise) {
//       var table = Parse.Object.extend(__className__);
//       $rootScope.pangTables[__className__] = table;
//       $rootScope.pangArrays[__className__] = array = [];
//       array.__className__ = __className__;
//       array.__autoSync__ = false;   // do not auto sync by default
//       array.__syncInterval__ = 5000;// 5 second auto sync interval by default
//       //TO IMPLEMENT syncInterval needs to change how often the $watch operates
// 
//       if(options) {
//         if(options.autoSync) {
//           array.__autoSync__ = options.autoSync;
//         }
//         if(options.syncInterval) {
//           array.__syncInterval__ = options.syncInterval;
//         }
//       }
// 
//       //fetch all the objects from Parse and convert them to array
//       var query = new Parse.Query(table);
//       query.find({
// 
//         //successfully connected, so convert to array
//         success: function(objects) {
// 
//           //convert to array
//           for(var i = 0; i < objects.length; i++) {
//             var object = {};
//             for(attrKey in objects[i].attributes) {
//               object[attrKey] = objects[i].get(attrKey);
//             }
//             object.__parseObjectId__ = objects[i].id;
//             array[i] = object;
//           }
// 
//           //apply the changes
//           $rootScope.$apply();
// 
//           //call the promises' success callback
//           if(promise && promise.success) {
//             promise.success(array);
//           }
//         },
// 
//         //error, so call the promises' error callback
//         error: function(error) {
//           if(promise && promise.error) {
//             promise.error(error);
//           }
//         }
//       });
// 
// 
//       /*****************************************************************
//        *
//        * addParseObject(object, promise)
//        *
//        *  Add a new object to Parse
//        *
//        ****************************************************************/
//       var addParseObject = function(object, promise) {
// 
//         //get the table and create a bare object
//         var table = $rootScope.pangTables[array.__className__];
//         var parseObject = new table();
// 
//         //fill the object will all the correct attributes
//         for(attrKey in object) {
//           parseObject.set(attrKey, object[attrKey]);
//         }
// 
//         //save the new object to Parse
//         parseObject.save(null, {
// 
//           //success so call the promise
//           success: function(parseObject) {
//             object.__parseObjectId__ = parseObject.id;
//             if(promise && promise.success) {
//               promise.success(parseObject);
//             }
//           },
// 
//           //error so call the promise
//           error: function(error) {
//             if(promise && promise.error) {
//               promise.error(error);
//             }
//           }
//         });
// 
//       } // addParseObject()
// 
// 
//       /*****************************************************************
//        *
//        * deleteParseObject(object, promise)
//        *
//        *  Delete the object in Parse
//        *
//        ****************************************************************/
//       var deleteParseObject = function(object, promise) {
// 
//         //get the object's table and the parseObject
//         var table = $rootScope.pangTables[array.__className__];
//         var query = new Parse.Query(table);
//         query.get(object.__parseObjectId__, {
// 
//           //found the parseObject so try to delete
//           success: function(parseObject) {
//             parseObject.destroy({
//               
//               //successfully delete, so call promise
//               success: function() {
//                 if(promise && promise.success) {
//                   promise.success();
//                 }
//               },
// 
//               //error deleteing, so call promise
//               error: function(error) {
//                 if(promise && promise.error) {
//                   promise.error(error);
//                 }
//               }
//             });
//           },
// 
//           //could not find parseObject so call promise
//           error: function(error) {
//             if(promise && promise.error) {
//               promise.error(error);
//             }
//           }
// 
//         });
// 
//       } // deleteParseObject()
// 
// 
//       /*****************************************************************
//        *
//        * updateParseObject(object, promise)
//        *
//        *  Update Parse with the current data in the object
//        *
//        ****************************************************************/
//       var updateParseObject = function(object, promise) {
// 
//         //get the table and the Parse object
//         var table = $rootScope.pangTables[array.__className__];
//         var query = new Parse.Query(table);
//         query.get(object.__parseObjectId__, {
// 
//           //found the parseObject so try to delete
//           success: function(parseObject) {
// 
//             //fill the object will all the correct attributes
//             for(attrKey in object) {
//               if(parseObject.get(attrKey)) {
//                 parseObject.set(attrKey, object[attrKey]);
//               }
//             }
// 
//             //save the new object to Parse
//             parseObject.save(null, {
// 
//               //success so call the promise
//               success: function(parseObject) {
//                 if(promise && promise.success) {
//                   promise.success(parseObject);
//                 }
//               },
// 
//               //error so call the promise
//               error: function(error) {
//                 if(promise && promise.error) {
//                   promise.error(error);
//                 }
//               }
//             });
//           },
// 
//           //could not find parseObject so call promise
//           error: function(error) {
//             if(promise && promise.error) {
//               promise.error(error);
//             }
//           }
//         });
// 
//       } // updateParseObject()
// 
// 
//       /*****************************************************************
//        *
//        * Table.add(object, promise)
//        *
//        *  Add a new object and update on Parse
//        *
//        ****************************************************************/
//       array.add = function(object, promise) {
// 
//         addParseObject(object, promise);
//         array.push(object);
// 
//       } // array.add()
// 
// 
//       /*****************************************************************
//        *
//        * Table.delete(object, promise)
//        *
//        *  Delete an object and remove from Parse
//        *
//        ****************************************************************/
//       array.delete = function(object, promise) {
// 
//         deleteParseObject(object, promise);
//         array.splice(array.indexOf(object), 1);
// 
//       } // array.delete()
// 
// 
//       /*****************************************************************
//        *
//        * Table.update(object, promise)
//        *
//        *  Update the object and save to Parse
//        *
//        ****************************************************************/
//       array.update = function(object, promise) {
// 
//         updateParseObject(object, promise);
// 
//       } // array.update()
// 
// 
//       /*****************************************************************
//        *
//        * Table.sync(promise)
//        *
//        *  Sync all changes to Parse
//        *
//        ****************************************************************/
//       array.sync = function(promise) {
//         //TO IMPLEMENT
//         
//         //add all objects that do not have a __parseObjectId__
//         //delete all objects with a __parseObjectId__ that are not on Parse (not sure how yet)
//         //update all objects with a __parseObjectId__ that are on Parse but are not equal (also not sure how yet)
// 
//       } // array.sync()
// 
// 
//       /*****************************************************************
//        *
//        * Watch deep changes in array and sync them
//        *
//        ****************************************************************/
//       $rootScope.$watch('pangArrays.'+__className__, function(newArray, oldArray) {
// 
//         //if not in autoSyncMode then return
//         if(array.__autoSync__ == false) {
//           return;
//         }
// 
//         //item added
//         if(oldArray.length < newArray.length) {
// 
//           //take the difference to find the added object(s)
//           var adds = newArray.filter(function(i) {return i.__parseObjectId__ == null});
// 
//           //add all the new objects to Parse and add the parseObjectIds to the array's objects
//           for(var i = 0; i < adds.length; i++) {
//             addParseObject(adds[i], {
//               error: function(error) { console.log('Error adding a new Parse object!'); }
//             });
//           }
// 
//         //item deleted
//         } else if(oldArray.length > newArray.length) {
// 
//           //take the difference to find the removed object(s)
//           var rms = oldArray.filter(function(i) {
//             for(var j = 0; j < newArray.length; j++) {
//               if( i.__parseObjectId__ && newArray[j].__parseObjectId__ == i.__parseObjectId__) {
//                 return false;
//               }
//             }
//             return true && i.__parseObjectId__;
//           });
// 
//           //delete all the Parse objects no longer in the array
//           for(var i = 0; i < rms.length; i++) {
//             deleteParseObject(rms[i], {
//               error: function(error) { console.log('Error deleting the Parse object!'); }
//             });
//           }
// 
//         //item changed but not added or deleted
//         } else {
// 
//           //update every object that has changed
//           for(var i = 0; i < oldArray.length; i++) {
//             if(angular.equals(oldArray[i], newArray[i]) == false) {
//               updateParseObject(newArray[i], {
//                 error: function(error) { console.log('Error updating the Parse object!'); }
//               });
//             }
//           }
//         }
// 
//       }, true); // $rootScope.$watch()
// 
//       return array;
// 
//     }, // pang.Table()
// 
// 
//     /*****************************************************************
//      *
//      * pang.User()
//      *
//      *  Create a new user in Parse
//      *
//      ****************************************************************/
//     User: function() {
//       //TO IMPLEMENT
//       return Parse.User();
// 
//     } // pang.User()
  }
});


