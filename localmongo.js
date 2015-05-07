

var localmongo = (function() {


	var keys = {},
		lastid = new Date().getTime();

	// http://jsperf.com/typeof-array-5-ways
	var isArray = function( arr ) {
		return arr instanceof Array;
	};

	// http://jsperf.com/js-for-loop-vs-array-indexof/272
	var indexOf = function(arr, tosearch) {

		for (var i=0, t=arr.length; i<t; i++)
			if (arr[i] === tosearch)
				return i;

		return -1;

	};

	var stringify = function( elem ) {
		return JSON.stringify( elem );
	};


	var find_function = function( item, index, query ) {

		var k;

		for (k in query)

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


				find: function( selector, callback, returnindex ) { // Array: all the items founds


					// if has 0 parameters return all the items of the collection
					if (arguments.length == 0)
						return keys[key];



					var filter;

					// If selector is a object
					if (selector && typeof selector == 'object') {

						// If selector is a item of the collection itself
						var index_selector = indexOf(keys[key], selector);
						if ( index_selector > -1 ) {

							if (callback)
								callback( keys[key][index_selector],  index_selector);

							return [ (returnindex) ? index_selector : keys[key][index_selector] ];
						}

						// If selector is a query
						filter = find_function;
					}

					// If selector is a int (index of the collection)
					else if (typeof selector == 'number') {

						if ( keys[key].hasOwnProperty( selector ) ) {

							if (callback)
								callback( keys[key][selector],  selector);

							return [ (returnindex) ? selector : keys[key][selector] ];
						}
						else
							return [];
					}

					// If selector is a function-filter
					else if (typeof selector == 'function')
						filter = selector;

					else
						return [];






					var index = 0,
						len = keys[key].length;
						results = [];


					for (; index<len; index++) {

						if ( filter( keys[key][index], index, selector ) ) {

							if (callback)
								callback( keys[key][index],  index );

							results.push( (returnindex) ? index : keys[key][index] );

						}
					}


					return results;

				},







				findOne: function( selector ) { // Object: first element found for the selector given

				},













				insert: function( items, callback ) { // Void

					if ( !isArray( items ) )
						items = [items];

					var _id,
						index_collection,
						index = 0,
						len = items.length,
						topush = [];

					for (; index<len; index++) {

						if ( items[index].hasOwnProperty(_id) ) {
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


				},






				update: function( selector, data, callback ) { // Void

					var k;

					this.find( selector, function( item, index ){

						for (k in data) {

							//if ( !item.hasOwnProperty(k) || data[k] !== item[k] )

							if (callback)
								callback( keys[key][index], index );

							item[k] = data[k];

						}

					}, true);
					
					this.save();

				},






				remove: function( selector, callback ) { // Void

					var toremove = this.find( selector, null, true ),
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