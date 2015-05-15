

jsondb.localstorage = function ( dbname ) {

    var collections = {};

    var add_prefix = function(collection) {
        return dbname+'_'+collection;
    };


    return {

        set: function ( collection, item, inmemory ) {

            if (inmemory !== false)
                collections[collection] = item;

            if (typeof item != 'string') {
                try {
                    item = jsondb.util.stringify( item );
                } catch (e) {} 
            }

            localStorage.setItem( add_prefix(collection), item );

        },


        get: function ( collection, frommemory ) {

            if (frommemory === true)
                return localStorage.getItem( add_prefix(collection) );

            if ( collections.hasOwnProperty(collection) )
                return collections[collection];

            var item = localStorage.getItem( add_prefix(collection) );

            try {
                item = jsondb.util.parse(item);
            } catch(e) {}

            collections[collection] = item;

            return item;

        },


        remove: function ( collection ) {

            delete collections[collection];

            localStorage.removeItem( add_prefix(collection) );

        },



        collection: function( collection ) {

            var methods = {


                find: function( query, callback, eachcallback ) { // Array: all the items founds

                    return jsondb.find(collections[collection], query, callback, eachcallback );

                },


                findOne: function( query, callback ) { // Object: first element found for the query given

                    return jsondb.findOne(collections[collection], query, callback );

                },


                insert: function( items, callback, eachcallback ) { // Array: items inserted

                    var topush = jsondb.insert(collections[collection], items, eachcallback);

                    // Concatening save is faster than: this.save();
                    // http://jsperf.com/localstorage-setitem-concatenating-vs-json-stringify
                    $this.set(collection, 
                        (collections[collection].length-topush.length == 0) ?
                            jsondb.util.stringify( topush )
                        :
                            $this.get(collection, true).slice(0,-1) + "," + jsondb.util.stringify( topush ).slice(1)
                    , false);

                    if ( callback )
                        callback( topush );

                    return topush;

                },



                update: function( query, data, callback, eachcallback ) { // Void

                    var _this = this;

                    jsondb.update( collections[collection], query, data, function( items ) {

                        if ( callback )
                            callback( items );

                        _this.save();

                    }, eachcallback);
                    
                },






                remove: function( query, callback, eachcallback ) { // Void

                    var _this = this;

                    jsondb.remove( collections[collection], query, function( items ) {

                        if ( callback )
                            callback( items );

                        _this.save();

                    }, eachcallback);


                },





                save: function() { // Void
                    $this.set(collection, collections[collection] );
                },






                drop: function() { // Void
                    $this.set(collection, []);
                }

            };




            var $this = this;

            collections[collection] = $this.get( collection );

            if ( !jsondb.util.isArray( collections[collection] ) )
                methods.drop();

            return methods;

        }






    };


};



