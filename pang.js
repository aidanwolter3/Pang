function PangObject(className) {

    //verify that the parse file is included
    if(typeof Parse == 'undefined') {
        console.log('Error: Pang needs the Parse SDK to be included!');
        return;
    }

    this.className = className;
}

//Functions

PangObject.prototype.initialize = function() {
    var pangObject = this;
    pangObject.data = [];
    pangObject.parseObjects = [];

    var promise = {};
    var parseObject = Parse.Object.extend(this.className);
    var query = new Parse.Query(parseObject);

    promise.then = function(successFtn, errorFtn) {
        query.find({
            success: function(objects) {
                for(var index in objects) {
                    object = objects[index];
                    dataObject = $.extend({parseObjectId: object.id},object.attributes);
                    pangObject.parseObjects.push(object);
                    pangObject.data.push(dataObject);
                }
                successFtn();
            },
            error: function(error) {
                console.log('Pang encountered an error while fetching data from Parse!');
                errorFtn();
            }
        });
    }
    return promise;
}

PangObject.prototype.add = function(newData) {
    var pangObject = this;

    var promise = {};
    var parseObject = Parse.Object.extend(this.className);
    var newParseObject = new parseObject;

    promise.then = function(successFtn, errorFtn) {
        newParseObject.save(newData, {
            success: function(object) {
                pangObject.data.concat($.extend({parseObjectId: object.id},object.attributes));
                pangObject.parseObjects.push(object);
                successFtn(object.id);
            },
            error: function(error) {
                errorFtn(null);
            }
        });
    }
    return promise;
}