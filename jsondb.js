

var jsondb = (function() {

    var keys = {},
        lastid = new Date().getTime(),
        keyid = '_id',
        modifier = {
            filter: '$filter',
            orderby: '$orderby'
        };


    // http://jsperf.com/typeof-array-5-ways
    var isArray = function( arr ) {
        return arr instanceof Array;
    };

    // http://jsperf.com/js-for-loop-vs-array-indexof/272
    var indexOf = function(arr, tosearch) {

        for ( var i=0, t=arr.length; i<t; i++ )
            if ( arr[i] === tosearch )
                return i;

        return -1;

    };

    var stringify = function( elem ) {
        return JSON.stringify( elem );
    };


    // https://github.com/Josenzo/sortBy
    var orderby = (function(){
        

        // Utility to get deep propertis by the path given
        var get = function(obj, path) {

            try {
                for (var i = 0; i<path.length-1; i++)
                    obj = obj[ path[i] ];

                return obj[ path[i] ];
            } catch(e) {
                return obj;
            }

        };


        return function() {

            var property, one, two, diff, i=0, total=arguments.length, array=this, properties=[];


            // Storing the properties needed for the search
            for (; i<total; i++ ) {

                property = {};
                property.asc = 1;
                property.path = arguments[i].split('.');
                property.isdeep = property.path.length > 1;
                property.name = property.path[0];

                // Reverse
                if ( property.name.charAt(0) == '-' && !array[0].hasOwnProperty(property.name) ) {
                    property.asc = -1;
                    property.name = property.path[0] = property.name.slice(1);
                }

                properties.push( property );

            }





            array.sort(function check( a, b, j ) {

                // We check if the number is passed as parameter, if not we define it as 0 because is the first property to check
                if (typeof j != 'number')
                    j = 0;
                // If j is greater than the total of arguments mean that we checked all the properties and all of them give us 0
                else if ( j>(i-1) )
                    return 0;



                property = properties[j];

                // If the property is deep
                if ( property.isdeep ) {
                    one = get(a, property.path);
                    two = get(b, property.path);
                }
                else {
                    one = a[property.name];
                    two = b[property.name];
                }


                // The check
                if ( one === two )
                    diff = 0;

                else if ( typeof one == 'string' )
                    diff = ((one > two) ? 1 : -1) * property.asc;

                else if ( typeof one == 'number' || typeof one == 'boolean' || one instanceof Date )
                    diff = (one - two) * property.asc;

                else
                    return 1;

                // If diff is 0 we should recall the check function to check the other properties
                return diff || check( a, b, j+1 );

            });


            return array;

        }

    })();



    var ismodifier = function( k ) {
        return (k==modifier.filter || k==modifier.orderby);
    };


    var find = function( item, index, query ) {

        if (typeof item != 'object')
            return false;

        var k;
        for (k in query)

            if ( !ismodifier(k) )

                if ( !item.hasOwnProperty(k) || query[k] !== item[k] )

                    return false;
            

        return true;

    };



    return {

        set: function (key, item) {

            keys[key] = item;

            if (typeof item != 'string') {
                try {
                    item = stringify( item );
                } catch (e) {} 
            }

            localStorage.setItem(key, item);

        },


        get: function (key) {

            if ( keys.hasOwnProperty(key) )
                return keys[key];

            var item = localStorage.getItem( key );
            try {
                item = JSON.parse(item);
            } catch(e) {}

            keys[key] = item;
            return item;

        },


        remove: function (key) {
            delete keys[key];
            localStorage.removeItem( key );
        },



        collection: function( key ) {


            var methods = {


                find: function( query, callback, returnindex ) { // Array: all the items founds


                    // if has 0 parameters return all the items of the collection
                    if (arguments.length == 0)
                        return keys[key];




                    // If query is a object
                    if ( query && typeof query == 'object' ) {

                        // If query is a item of the collection itself
                        var index_query = indexOf(keys[key], query);
                        if ( index_query > -1 ) {

                            if (callback)
                                callback( keys[key][index_query],  index_query);

                            return [ (returnindex) ? index_query : keys[key][index_query] ];
                        }

                    }

                    // If query is a int (index of the collection)
                    else if (typeof query == 'number') {

                        if ( keys[key].hasOwnProperty( query ) ) {

                            if (callback)
                                callback( keys[key][query],  query);

                            return [ (returnindex) ? query : keys[key][query] ];
                        }
                        else
                            return [];
                    }

                    // // If query is a function to filter
                    // else if (typeof query == 'function')
                    //  filter = query;

                    else
                        return [];




                    var modifier_filter = false, 
                        modifier_orderby = false,
                        index = 0,
                        len = keys[key].length,
                        results = [],
                        keep_searching = true,
                        k,
                        hastofind = false;




                    // Modifiers
                    if ( query.hasOwnProperty( modifier.filter ) )
                        modifier_filter = query[modifier.filter];


                    if ( query.hasOwnProperty( modifier.orderby ) )
                        modifier_orderby = (typeof query[modifier.orderby] == 'object') ?
                            query[modifier.orderby]
                        : 
                            [query[modifier.orderby]];



                    // Detect if the query has any property
                    for (k in query) {
                        if ( !ismodifier(k) ) {
                            hastofind = true;
                            break;
                        }
                    }


                    // Finding!
                    for (; index<len; index++) {

                        if ( ( hastofind ) ? find( keys[key][index], index, query ) : true ) {

                            if ( ( modifier_filter ) ? modifier_filter( keys[key][index], index, query ) : true ) {

                                if (callback)
                                    keep_searching = callback( keys[key][index],  index );

                                results.push( (returnindex) ? index : keys[key][index] );

                                if (keep_searching === false)
                                    break;

                            }
                        }
                    }


                    // Order by
                    if ( modifier_orderby )
                        orderby.apply(results, modifier_orderby);


                    return results;

                },







                findOne: function( query ) { // Object: first element found for the query given

                    var order = query.hasOwnProperty( modifier.orderby );

                    return this.find( query, function(){

                        return order;

                    })[0] || null;

                },













                insert: function( items, callback ) { // Array: items inserted

                    if ( !isArray( items ) )
                        items = [items];

                    var _id,
                        index_collection,
                        index = 0,
                        len = items.length,
                        topush = [];

                    for (; index<len; index++) {

                        if ( items[index] && typeof items[index] == 'object' && !items[index].hasOwnProperty(keyid) ) {
                            _id = new Date().getTime();
                            items[index][keyid] = lastid = _id = (_id <= lastid) ? lastid+1 : _id;
                        }

                        topush.push( items[index] );
                        index_collection = keys[key].push( items[index] );

                        if ( callback )
                            callback( items[index], index_collection-1, _id, index );
                    }


                    // Concatening save is faster than: this.save();
                    // http://jsperf.com/localstorage-setitem-concatenating-vs-json-stringify
                    localStorage.setItem(key, 
                        (keys[key].length-topush.length == 0) ?
                            stringify( topush )
                        :
                            localStorage.getItem(key).slice(0,-1) + "," + stringify( topush ).slice(1)
                    );

                    return topush;

                },






                update: function( query, data, callback ) { // Void

                    var k;

                    this.find( query, function( item, index ){

                        for (k in data) {

                            //if ( !item.hasOwnProperty(k) || data[k] !== item[k] )

                            if (callback)
                                callback( keys[key][index], index );

                            item[k] = data[k];

                        }

                    }, true);
                    
                    this.save();

                },






                remove: function( query, callback ) { // Void

                    var toremove = this.find( query, null, true ),
                        index,
                        i = 0,
                        len = toremove.length;

                    for (; i<len; i++) {

                        index = toremove[i]-i;

                        if (callback)
                            callback( keys[key][index], index );

                        keys[key].splice( index, 1 );

                    }

                    this.save();

                },





                save: function() { // Void
                    localStorage.setItem(key, stringify( keys[key] ));
                },






                drop: function() { // Void
                    keys[key] = [];
                    localStorage.setItem(key, '[]');
                }

            };




            // var $this = this;

            keys[key] = this.get( key );

            if ( !isArray( keys[key] ) )
                methods.drop();

            return methods;

        }


    }

})();


