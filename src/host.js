var _ = require( "lodash" );
var halon = require( "halon" );
var request = require( "request" );

function buildRootUrl( cfg ) {
	return [
	( cfg.ssl ? "https" : "http" ),
	"://",
	cfg.host,
	":",
	cfg.port,
	cfg.api
	].join( "" );
}

function checkClient( state ) {
	if ( !state.client ) {
		var opts = {
			root: state.url,
			adapter: halon.requestAdapter( request )
		};
		state.client = halon( opts );
		state.connection = state.client
            .on( "rejected", function( client, err ) {
	console.log( "Failed to connect to host at %s with %s. Retrying.", state.url, err.stack );
	setTimeout( function() {
					state.connection = state.client.connect();
				}, 1000 );
            }, true )
            .connect();
	}
}

function command( state, check, cmd ) {
	check();
	return state.connection
		.then(
            function( client ) {
	return client.control.command( { command: cmd } );
            }
        );
}

function configure( state, check, ops ) {
	check();
	return state.connection
		.then(
            function( client ) {
	return client.control.configure( { body: ops } );
            }
        );
}

function setup( info ) {
	var config = {
		host: info.ip || info.host,
		port: info.port,
		api: "/api"
	};

	var state = {
		client: undefined,
		connection: undefined,
		url: buildRootUrl( config )
	};

	var check = checkClient.bind( undefined, state );

	return {
		command: command.bind( undefined, state, check ),
		configure: configure.bind( undefined, state, check )
	};
}

module.exports = setup;
