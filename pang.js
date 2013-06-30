var Pang = (function(){
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
                            $scope.$apply(function() {
                                $scope[conn.angularArray] = angularObjects;
                            });
                        },
                        error: function(error) {
                            console.log('Error: '+error);
                        }
                    });
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
        return pang;
    })();

