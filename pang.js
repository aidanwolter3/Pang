angular.module('pang',[]).
service('Pang',function($rootScope){
    var pang = {};
    pang.connections = [];
    pang.init = function(data) {
        Parse.initialize(data.appKey,data.jsKey);
    }

    //creates a syncronizing connection between a Parse class and an array in the Angular scope
    pang.addConnection = function(parseClassName, angularArray) {

        //sets up the watcher to check for changes in the scope
        $rootScope.$watch(angularArray,function(newArray, oldArray) {

        	//as long as the angular data store exists
        	if(newArray || oldArray) {

                //determines what changes need to be synchronized to parse
                for(var i in oldArray) {
                    if(!oldArray[i].parseObject){ continue; }

                    var found = false;
                    for(var s in newArray) {
                        if(!oldArray[i].parseObject) {
                            console.log('could not find a parseobject for '+oldArray[i].company);
                        }

                        //check for new objects
                        if(!newArray[s].parseObject) {
                            var newParseObject = new conn.parseObject();
                            newParseObject.save(newArray[s],{
                                error: function(error) {
                                    console.log('could not save parseObject with error: '+error);
                                }
                            });
                            newArray[s].parseObject = newParseObject;
                        }
                        else if(oldArray[i].parseObject.id == newArray[s].parseObject.id) {

                            //check for modifications
                            for(var key in oldArray[i]) {
                                var wasChanged = false;
                                var newData = {};
                                if(key != 'parseObject' && oldArray[i][key] != newArray[s][key]) {
                                    newData[key] = newArray[s][key];
                                    wasChanged = true;
                                }
                                if(wasChanged) {
                                    newArray[s].parseObject.save(newData,{
                                        error: function(error) {
                                            console.log('could not save parseObject with error: '+error);
                                        }
                                    })
                                }
                            }
                            found = true;
                        }
                    }

                    //delete because no longer exists in scope
                    if(!found) {
                        oldArray[i].parseObject.destroy();
                    }
                }
        	};
        }, true);

        var connection = (function() {
            conn = {};
            conn.parseClassName = parseClassName;
            conn.angularArray = angularArray;
            conn.parseObject = Parse.Object.extend(parseClassName);
            conn.query = new Parse.Query(conn.parseObject);

            //fetches all data from Parse class and stores is in scope
            conn.fetch = function() {
                conn.query.find({
                    success: function(results) {
                        angularObjects = [];
                        for(var index in results) {
                            var result = results[index];
                            angularObject = {};
                            for(var key in result.attributes) {
                                angularObject[key.toString()] = result.get(key.toString());
                            }
                            angularObject.parseObject = result;
                            angularObjects.push(angularObject);
                        }
                        $rootScope.$apply(function() {
                            $rootScope[conn.angularArray] = angularObjects;
                        });
                    },
                    error: function(error) {
                        console.log('Error: '+error);
                    }
                });
            }

            return conn;
        })();
        this.connections.push(connection);
        connection.fetch();
    }

    return pang;
});