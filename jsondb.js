

var jsondb = (function() {

	var keys = {},
		lastid = new Date().getTime(),
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

var sortBydeep=Array.prototype.sortBydeep=function(){var a=function(a,b){try{for(var c=0;c<b.length-1;c++)a=a[b[c]];return a[b[c]]}catch(d){return a}};return function(){var b,c,d,e,f,g,h=arguments.length-1,i=1,j=arguments[0];for(this instanceof Array&&(j=this,i=0);h>=i;h--)b=1,g=arguments[h].split("."),d=g.length>1,c=g[0],"-"!=c.charAt(0)||j[0].hasOwnProperty(c)||(b=-1,c=g[0]=c.slice(1)),j.sort(function(h,i){return d?(e=a(h,g),f=a(i,g)):(e=h[c],f=i[c]),e===f?0:(type=typeof e,"string"==type?(e>f?1:-1)*b:"number"==type||"boolean"==type||e instanceof Date?(e-f)*b:1)});return j}}();

	// https://github.com/Josenzo/sortBy
	var orderby = (function(){
	
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

			var asc, property, isdeep, one, two, path, i=arguments.length-1, until=0, array=this;

			for (; i>=until; i-- ) {

				asc = 1;
				path = arguments[i].split('.');
				isdeep = path.length > 1;
				property = path[0];

				// Reverse
				if ( property.charAt(0) == '-' && !array[0].hasOwnProperty(property) ) {
					asc = -1;
					property = path[0] = property.slice(1);
				}

				array.sort(function( a, b ) {


					if (isdeep) {
						one = get(a, path);
						two = get(b, path);
					}
					else {
						one = a[property];
						two = b[property];
					}



					if ( one === two )
						return 0;


					type = typeof one;

					if ( type == 'string' )
						return ((one > two) ? 1 : -1) * asc;

					if ( type == 'number' || type == 'boolean' || one instanceof Date )
						return (one - two) * asc;

					else
						return 1;

				});

			}

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
					// 	filter = query;

					else
						return [];




					var modifier_filter = false, 
						modifier_orderby = false,
						index = 0,
						len = keys[key].length,
						results = [],
						keep_searching = true,
						k,
						hastofind = false,
						finded,
						filtered;




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

						finded = ( hastofind ) ? find( keys[key][index], index, query ) : true;

						if ( finded ) {

							filtered = ( modifier_filter ) ? modifier_filter( keys[key][index], index, query ) : true;

							if ( filtered ) {

								if (callback)
									keep_searching = callback( keys[key][index],  index );

								results.push( (returnindex) ? index : keys[key][index] );

								if (keep_searching === false)
									break;

							}
						}
					}

					// Order by
					if ( modifier_orderby ) {
						// results = orderby.apply(results.slice(0), modifier_orderby);
						results = sortBydeep(results.slice(0), '-a', '_id')
					}

					return results;

				},







				findOne: function( query ) { // Object: first element found for the query given

					return this.find( query, function(){

						return false;

					})[0];

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

						if ( items[index] && typeof items[index] == 'object' && !items[index].hasOwnProperty(_id) ) {
							_id = new Date().getTime();
							items[index]._id = lastid = _id = (_id <= lastid) ? lastid+1 : _id;
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


