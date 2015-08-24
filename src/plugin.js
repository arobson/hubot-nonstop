var _ = require( "lodash" );
var commands = require( "./commands" );
var processor = require( "./processor" );
var parser = require( "./parser" );
var nonstop = require( "./nonstop" );
var format = require( "util" ).format;

var hookIP = process.env.SERVICE_HOST_IP || process.env.SERVICE_HOST_NAME || process.env.HOOK_IP;
var hookPort = process.env.HOOK_PORT || process.env.EXPRESS_PORT;
var hookUser = process.env.EXPRESS_USER;
var hookPass = process.env.EXPRESS_PASSWORD;
var authHeader = ( hookUser && hookPass ) ?
	"Basic " + new Buffer( username + ":" + password ).toString("base64") :
	undefined;
var hookURL = process.env.HOOK_URL || "/nonstop/event";
var eventRooms = process.env.EVENT_ROOMS || "nonstop-events";
eventRooms = eventRooms.split( "," );

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

	if( hookIP && hookPort ) {
		robot.router.post( hookURL, function( req, res ) {
			var ev = req.body;
			var json = JSON.stringify( _.omit( ev, [ "topic" ] ), null, 2 );
			_.each( eventRooms, function( room ) {
				try {
					robot.messageRoom(
						room,
						format( "*Event* - `%s`:\r\n```%s```", ev.topic, json )
					);
				} catch( ex ) {

				}
			} );
			res.status( 200 ).send( "Ok" );
		} );
		var headers = authHeader ? { "Authorization": authHeader } : undefined;
		nonstop.checkWebhook( robot.name, hookIP, hookPort, hookURL, headers )
			.then(
				function() {
					_.each( eventRooms, function( room ) {
						try {
							robot.messageRoom( room, "Web hook integration established successfully." );
						} catch( ex ) {

						}
					} );
				},
				function() {
					_.each( eventRooms, function( room ) {
						try {
							robot.messageRoom( room, "Web hook integration could not be established." );
						} catch( ex ) {

						}
					} );
				}
			);
	}
}

module.exports = setup;
