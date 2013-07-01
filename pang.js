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

        		//loop through every object currently in scope
        		for(var index in newArray) {
        			var angularObject = angularObjects[index];

        			//create a new parse object and save
        			if(!angularObject.parseObject) {
        				var parseObject = new conn.parseObject();
	    				parseObject.save(angularObject,{
	    					error: function(error) {
	    						console.log('Error, could not save: '+error);
	    					}
	    				});
	    				angularObject.parseObject = parseObject;
        			}
        		}

        		//remove all objects which no longer exist in the scope
        		for(var index1 in oldArray) {
        			var obj1 = oldArray[index1].parseObject;
        			if(!obj1) {
        				continue;
        			}
        			var found = false;
        			for(var index2 in newArray) {
        				var obj2 = newArray[index2].parseObject;
        				if(obj1.id == obj2.id) {
        					found = true;
        				}
        			}

        			//the objects wasn't found in the scope so remove it
        			if(!found) {
        				oldArray[index1].parseObject.destroy();
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