angular.module('pang',[]).
service('Pang',function($rootScope){
    var pang = {};
    pang.connections = [];
    pang.init = function(data) {
        Parse.initialize(data.appKey,data.jsKey);
    }

    pang.addConnection = function(parseClassName, angularArray) {
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
        this.connections = [connection];
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