

var jsondb = {

    collectionid: '_id',

    lastid: new Date().getTime(),

    modifier: {
        filter: '$filter',
        orderby: '$orderby'
    },

    util: {},


    find: function( collection, query, callback, eachcallback ) { // Array: all the items founds

        var results = [], typequery = typeof query;

        // if has 0 parameters return all the items of the collection
        if (typequery == 'undefined' || query === null) {

            if (callback)
                callback( collection );

            return collection;

        }





        // If query is a object
        if ( query && typequery == 'object' ) {

            // If query is a item of the collection itself
            var index_query = jsondb.util.indexOf(collection, query);
            if ( index_query > -1 ) {

                if (eachcallback)
                    eachcallback( collection[index_query],  index_query);

                results = [ collection[index_query] ];

                if (callback)
                    callback( results );

                return results;
            }

        }

        // If query is a int (index of the collection)
        else if (typequery == 'number') {

            if ( collection.hasOwnProperty( query ) ) {

                if (eachcallback)
                    eachcallback( collection[query],  query);

                results = [ collection[query] ];

                if (callback)
                    callback( results );

                return results;
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
            len = collection.length,
            keep_searching = true,
            k,
            hastofind = false;




        // Modifiers
        if ( query.hasOwnProperty( jsondb.modifier.filter ) )
            modifier_filter = query[jsondb.modifier.filter];


        if ( query.hasOwnProperty( jsondb.modifier.orderby ) )
            modifier_orderby = (typeof query[jsondb.modifier.orderby] == 'object') ?
                query[jsondb.modifier.orderby]
            : 
                [query[jsondb.modifier.orderby]];



        // Detect if the query has any property
        for (k in query) {
            if ( !jsondb.util.isModifier(k) ) {
                hastofind = true;
                break;
            }
        }


        // Finding!
        for (; index<len; index++) {

            if ( ( hastofind ) ? jsondb.util.match( collection[index], index, query ) : true ) {

                if ( ( modifier_filter ) ? modifier_filter( collection[index], index, query ) : true ) {

                    if (eachcallback)
                        keep_searching = eachcallback( collection[index],  index );

                    results.push( collection[index] );

                    if (keep_searching === false)
                        break;

                }
            }
        }


        // Order by
        if ( modifier_orderby )
            jsondb.util.orderby.apply(results, modifier_orderby);

        if (callback)
            callback( results );

        return results;

    },





    findOne: function( collection, query, callback ) { // Object: first element found for the query given

        var order = query.hasOwnProperty( jsondb.modifier.orderby );

        return this.find( collection, query, function(items){

            callback(items[0] || null);

        }, function(){

            return order;

        })[0] || null;

    },





    insert: function( collection, items, eachcallback ) { // Array: items inserted

        if ( !jsondb.util.isArray( items ) )
            items = [items];

        var _id,
            index_collection,
            index = 0,
            len = items.length,
            topush = [];

        for (; index<len; index++) {

            if ( items[index] && typeof items[index] == 'object' && !items[index].hasOwnProperty(jsondb.collectionid) ) {
                _id = new Date().getTime();
                items[index][jsondb.collectionid] = jsondb.lastid = _id = (_id <= jsondb.lastid) ? jsondb.lastid+1 : _id;
            }

            topush.push( items[index] );
            index_collection = collection.push( items[index] );

            if ( eachcallback )
                eachcallback( items[index], index_collection-1, _id, index );
        }

        return topush;

    },


    update: function(collection, query, data, callback, eachcallback ) { // Void

        var k;

        this.find( collection, query, callback, function( item, index ){

            for (k in data) {

                //if ( !item.hasOwnProperty(k) || data[k] !== item[k] )

                if (eachcallback)
                    eachcallback( item, index );

                item[k] = data[k];

            }

        });
        

    },


    remove: function( collection, query, callback, eachcallback ) { // Void

        var toremove = [],
            index,
            i = 0,
            len;


        this.find( collection, query, function(items){

            for (len = toremove.length; i<len; i++) {

                index = toremove[i]-i;

                if (eachcallback)
                    eachcallback( collection[index], toremove[i] );

                collection.splice( index, 1 );

            }

            if (callback)
                callback( toremove );

        }, function(item, index){

            toremove.push(index);

        });

    }


};





