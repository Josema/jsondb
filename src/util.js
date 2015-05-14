

jsondb.util.isModifier = function( k ) {
    return (k==jsondb.modifier.filter || k==jsondb.modifier.orderby);
};

// http://jsperf.com/typeof-array-5-ways
jsondb.util.isArray = function( arr ) {
    return arr instanceof Array;
};

// http://jsperf.com/js-for-loop-vs-array-indexof/272
jsondb.util.indexOf = function(arr, tosearch) {

    for ( var i=0, t=arr.length; i<t; i++ )
        if ( arr[i] === tosearch )
            return i;

    return -1;

};

jsondb.util.stringify = function( elem ) {
    return JSON.stringify( elem );
};

jsondb.util.parse = function( str ) {

    return JSON.parse(str, function (k, v) {
        
        //http://jsperf.com/serializing-date-on-json-parse
        if ( typeof v === 'string' ) {
            var regexp = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.exec(v);
            if ( regexp )
                return new Date(v);
        }

        return v;

    });
};

// https://github.com/Josenzo/sortBy
jsondb.util.orderby = (function(){
    

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



jsondb.util.match = function( item, index, query ) {

    if (typeof item != 'object')
        return false;

    var k;
    for (k in query)

        if ( !jsondb.util.isModifier(k) )

            if ( !item.hasOwnProperty(k) || query[k] !== item[k] )

                return false;
        

    return true;

};
