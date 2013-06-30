var Pang = (function(){
    var pang = {};
    pang.create = function(appKey,jsKey,objectName) {
        newPang = {};
        Parse.initialize(appKey,jsKey);
        newPang.parseObject = Parse.Object.extend('Job');
        newPang.query = new Parse.Query(newPang.parseObject);

        newPang.fetch = function() {
            this.query.find({
                success: function(results) {
                    return results;
                },
                error: function(error) {
                    alert(error);
                }
            });
        }

        return newPang;
    }
    return pang;
})();