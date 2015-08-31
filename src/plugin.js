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
	"Basic " + new Buffer( hookUser + ":" + hookPass ).toString( "base64" ) :
	undefined;
var hookURL = process.env.HOOK_URL || "/nonstop/event";
var eventRooms = process.env.EVENT_ROOMS || "nonstop-events";
eventRooms = eventRooms.split( "," );

function ensureWebHook( robot ) {
	var headers = authHeader ? { Authorization: authHeader } : undefined;
	nonstop.checkWebhook( robot.name, hookIP, hookPort, hookURL, headers )
		.then(
				function() {
					_.each( eventRooms, function( room ) {
						try {
							robot.messageRoom( room, "Web hook integration established successfully." );
						} catch ( ex ) {
						}
					} );
				},
				function() {
					_.each( eventRooms, function( room ) {
						try {
							robot.messageRoom( room, "Web hook integration could not be established." );
						} catch ( ex ) {
						}
					} );
				}
			);
}

function onWebHook( robot, req, res ) {
	var ev = req.body;
	_.each( eventRooms, function( room ) {
		try {
			robot.messageRoom(
				room,
				formatEvent( ev )
			);
		} catch ( ex ) {
		}
	} );
	res.status( 200 ).send( "Ok" );
}

function formatEvent( ev ) {
	switch ( ev.topic ) {
		case "host.registered":
			return format(
				"*Host Registered With Index*:\r\n```%s```",
					formatJSON( {
						host: ev.name,
						port: ev.port,
						state: ev.state,
						package: {
							project: ev.package.project,
							owner: ev.package.owner,
							branch: ev.package.branch,
							verison: ev.package.version || "any"
						}
					} )
				);
		case "host.downloading":
			return format(
				"*Host Downloading Package*:\r\n```%s```",
					formatJSON( {
						host: ev.host.name,
						port: ev.host.port,
						state: ev.host.state,
						uptime: ev.host.uptime,
						downloading: {
							project: ev.project,
							owner: ev.owner,
							branch: ev.branch,
							version: ev.version
						},
						package: {
							project: ev.package.project,
							owner: ev.package.owner,
							branch: ev.package.branch,
							verison: ev.package.version || "any"
						}
					} )
				);
		case "host.installing":
			return format(
				"*Host Installing Package*:\r\n```%s```",
					formatJSON( {
						host: ev.host.name,
						port: ev.host.port,
						state: ev.host.state,
						uptime: ev.host.uptime,
						downloading: {
							project: ev.project,
							owner: ev.owner,
							branch: ev.branch,
							version: ev.version
						},
						package: {
							project: ev.package.project,
							owner: ev.package.owner,
							branch: ev.package.branch,
							verison: ev.package.version || "any"
						}
					} )
				);
		default:
			return format( "*Unspecified Event*:\r\n```%s```", formatJSON( ev ) );
	}
}

function formatJSON( obj ) {
	var json = JSON.stringify( _.omit( obj, [ "topic" ] ), null, 2 );
}

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

	if ( hookIP && hookPort ) {
		robot.router.post( hookURL, onWebHook.bind( undefined, robot ) );
		ensureWebHook( robot );
	}
}

module.exports = setup;
