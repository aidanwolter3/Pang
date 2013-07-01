angular.module('pang',[]).
service('Pang',function($rootScope){
    var pang = {};
    pang.connections = [];
    pang.init = function(data) {
        Parse.initialize(data.appKey,data.jsKey);
    }

    pang.addConnection = function(parseClassName, angularArray) {
        $rootScope.$watch(angularArray,function(newArray, oldArray) {

        	//as long as the angular data store exists
        	if(newArray || oldArray) {

                //sending scope changes to Parse
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

            //functions which each connection implements
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

            conn.add = function(data) {
                var obj = new conn.parseObject();
                obj.save(data,{
                    error: function(error) {
                        console.log('Error, could not save: '+error)
                    }
                });
                var angularObject = data;
                data.parseObject = obj;
                $rootScope.jobs.push(angularObject);
            }

            return conn;
        })();
        this.connections.push(connection);
        this.fetch();
    }

    pang.fetch = function() {
        for(var index in this.connections) {
            this.connections[index].fetch();
        }
    }

    pang.add = function(parseClassName, data) {
        for(var index in this.connections) {
            connection = this.connections[index];
            if(connection.parseClassName == parseClassName) {
                connection.add(data);
                break;
            }
        }
    }

    return pang;
});