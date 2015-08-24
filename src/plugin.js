var _ = require( "lodash" );
var commands = require( "./commands" );
var processor = require( "./processor" );
var parser = require( "./parser" );

function setup( robot ) {
	var lists = _.values( commands );
	var patterns = _.flatten( lists );
	_.each( patterns, function( pattern ) {
		robot.hear( pattern, function( res ) {
			var data = parser( res.match[ 0 ] );
			var args = [ res ].concat( res.match.slice( 1 ) );
			return processor[ data.command ].apply( undefined, args );
		} );
	} );
}

module.exports = setup;
