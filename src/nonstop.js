var _ = require( "lodash" );
var halon = require( "halon" );
var request = require( "request" );
var hostFn = require( "./host" );
var registryClient, connection;

var index = {
	host: process.env.INDEX_HOST || "squatchatron.com",
	port: process.env.INDEX_PORT || 4444,
	api: "/api",
	token: process.env.INDEX_TOKEN || "daba7a5f-f5cb-4d2b-a4e0-fc3f91f09c2e"
};

var hostClients = {};

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

function checkClient() {
	var url = buildRootUrl( index );
	if ( !registryClient ) {
		var opts = {
			root: url,
			adapter: halon.requestAdapter( request )
		};
		if ( index.token ) {
			opts.headers = {
				authorization: "Bearer " + index.token
			};
		}
		registryClient = halon( opts );
		connection = registryClient
			.on( "rejected", function( client, err ) {
				console.log( "Failed to connect to registry at %s:%d with %s. Retrying.", index.host, index.port, err.stack );
				setTimeout( function() {
					connection = client.connect();
				}, 1000 );
			}, true )
			.connect();
	}
}

function getHosts() {
	checkClient();
	return connection
		.then( function( client ) {
			return client.host.list()
				.then( function( result ) {
					return result.hosts;
				} );
			} );
}

function getHostStatus( hostName ) {
	checkClient();
	return connection
		.then( function( client ) {
			return client.host.self( { name: hostName } )
				.then(
					function( result ) {
						var host = result.hosts[ 0 ];
						if ( host ) {
							host = _.omit( host, function( v, k ) {
								return /^[_]/.test( k );
							} );
						}
						return host;
					}
				);
			} );
}

function getHostsBy( filter ) {
	checkClient();
	return connection
		.then( function( client ) {
			return client.host.list( { "?": filter } )
				.then(
					function( result ) {
						return result.hosts;
					}
				);
			} );
}

function getPackages() {
	checkClient();
	return connection
		.then( function( client ) {
			return client.package.list()
				.then(
					function( result ) {
						return result.packages;
					}
				);
			} );
}

function getPackagesBy( filter ) {
	checkClient();
	return connection
		.then( function( client ) {
			return client.package.list( { "?": filter } )
				.then(
					function( result ) {
						return result.packages;
					}
				);
		} );
}

function getProjects() {
	checkClient();
	return connection
		.then( function( client ) {
			return client.package.projects()
				.then(
					function( result ) {
						return _.unique( result.project );
					}
				);
		} );
}

function getProjectsBy( filter ) {
	checkClient();
	return connection
		.then( function( client ) {
			return client.package.projects( { "?": filter } )
				.then(
					function( result ) {
						return _.unique( result.project );
					}
				);
		} );
}

function promotePackage( filter ) {
	checkClient();
	return connection
		.then( function( client ) {
			return client.package.promote( { "?": filter } );
		} );
}

function sendHostCommand( hostName, command ) {
	checkClient();
	return connection
		.then( function( client ) {
			return client.host.self( { name: hostName } )
				.then(
					function( result ) {
						var host = result.hosts[ 0 ];
						if ( host ) {
							var hostClient = hostClients[ host.name ];
							if ( !hostClient ) {
								hostClient = hostFn( host );
								hostClients[ host.name ] = hostClient;
							}
							return hostClient.command( command );
						} else {
							throw new Error( "No host named " + hostName + "exists in the registry" );
						}
					}
				);
		} );
}

function sendHostSetting( hostName, ops ) {
	checkClient();
	return connection
		.then( function( client ) {
			return client.host.self( { name: hostName } )
				.then(
					function( result ) {
						var host = result.hosts[ 0 ];
						if ( host ) {
							var hostClient = hostClients[ host.name ];
							if ( !hostClient ) {
								hostClient = hostFn( host );
								hostClients[ host.name ] = hostClient;
							}
							return hostClient.configure( ops );
						} else {
							throw new Error( "No host named " + hostName + "exists in the registry" );
						}
					}
				);
		} );
}

module.exports = {
	getHosts: getHosts,
	getHostStatus: getHostStatus,
	getHostsBy: getHostsBy,
	getPackages: getPackages,
	getPackagesBy: getPackagesBy,
	getProjects: getProjects,
	getProjectsBy: getProjectsBy,
	promotePackage: promotePackage,
	sendHostCommand: sendHostCommand,
	sendHostSetting: sendHostSetting
};
