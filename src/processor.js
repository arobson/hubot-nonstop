var _ = require( "lodash" );
var nonstop = require( "./nonstop" );
var format = require( "util" ).format;

function filterOptions( options ) {
	return _.omit( options, function( v, k ) {
		return v === undefined;
	} );
}

function formatCriteria( criteria ) {
	var list = _.reduce( criteria, function( acc, val, key ) {
		if ( val ) {
			acc.push( format( "%s = %s", key, val ) );
		}
		return acc;
	}, [] );
	return list.join( ", " );
}

function formatError( err ) {
	return err.stack ? err.stack.replace( "\n", "\n > " ) : err.message;
}

function isPackageName( arg ) {
	return !arg ? false : /[.]tar[.]gz$/.test( arg ) ||
	arg.split( "-" ).length > 6 ||
	arg.split( "~" ).length > 6;
}

function isSpecifier( arg ) {
	return isSha( arg ) || isVersion( arg );
}

function isSha( arg ) {
	return /[a-fA-F0-9]{8}/.test( arg );
}

function isVersion( arg ) {
	return /[0-9]+[.][0-9]+[.][0-9]+([- ][0-9]+)?/.test( arg );
}

function reply( res ) {
	var args = Array.prototype.slice.call( arguments, 1 );
	var message = format.apply( undefined, args );
	return res.reply( message );
}

function send( res ) {
	var args = Array.prototype.slice.call( arguments, 1 );
	var message = format.apply( undefined, args );
	return res.send( message );
}

module.exports = {
	"host.commit": function showCommit( res, hostName ) {
		function onStatus( status ) {
			if ( status ) {
				var info = status.installed || status.package;
				var link = format( "https://github.com/%s/%s/commit/%s", info.owner, info.project, info.slug );
				reply( res, "Here is a link to the latest commit on *%s* - %s", hostName, link );
			} else {
				return reply( res, "There is no registered host named *%s*", hostName );
			}
		}

		function onError( err ) {
			return reply( res, "An error occurred while trying to get latest commit on *%s* \r\n> %s",
			hostName, formatError( err ) );
		}

		return nonstop.getHostStatus( hostName )
		.then( onStatus, onError );
	},
	"host.list": function listHosts( res ) {
		function onHosts( list ) {
			var hosts = _.pluck( list, "name" ).join( "\r\n\t" );
			return reply( res, "I found %d host(s) registered in the index:\r\n\t%s", list.length, hosts );
		}

		function onError( err ) {
			return reply( res, "An error occurred getting the host list \r\n> %s",
			formatError( err ) );
		}

		return nonstop.getHosts()
		.then( onHosts, onError );
	},
	"host.status": function hostStatus( res, arg1, arg2 ) {
		var hostName = arg1 === "of" || arg1 === "for" ? arg2 : arg1;

		function onStatus( status ) {
			if ( status ) {
				reply( res, "Here is the status of *%s*:", hostName );
				return send( res, "```\n%s\n```", JSON.stringify( status, null, 2 ) );
			} else {
				return reply( res, "There is no registered host named *%s*", hostName );
			}
		}

		function onError( err ) {
			return reply( res, "An error occurred while trying to get status for *%s* \r\n> %s",
			hostName, formatError( err ) );
		}

		return nonstop.getHostStatus( hostName )
		.then( onStatus, onError );
	},
	"host.uptime": function hostUptime( res, arg1, arg2 ) {
		var hostName = arg1 === "of" || arg1 === "for" ? arg2 : arg1;

		function onStatus( status ) {
			if ( status ) {
				reply( res, "Uptime for *%s*:\r\n\tHost uptime - %s\r\n\tService uptime - %s",
				hostName, status.uptime.host, status.uptime.service );
			} else {
				return reply( res, "There is no registered host named *%s*", hostName );
			}
		}

		function onError( err ) {
			return reply( res, "An error occurred while trying to get uptime for *%s* \r\n> %s",
			hostName, formatError( err ) );
		}

		return nonstop.getHostStatus( hostName )
		.then( onStatus, onError );
	},
	"host.search": function hostSearch( res, prep, project, owner, branch, specifier ) {
		var version, sha;
		if ( isSpecifier( project ) && !owner && !branch && !specifier ) {
			specifier = project;
			project = undefined;
		}
		version = isVersion( specifier ) ? specifier : undefined;
		sha = isSha( specifier ) ? specifier : undefined;

		var options = filterOptions( {
			project: project,
			owner: owner,
			branch: branch,
			slug: sha,
			version: version
		} );
		var criteria = formatCriteria( options );

		function onHosts( list ) {
			var hosts = _.pluck( list, "name" ).join( "\r\n\t" );
			return reply( res, "I found %d host(s) where _%s_.\r\n\t%s", list.length, criteria, hosts );
		}

		function onError( err ) {
			return reply( res, "An error occurred searching for hosts where _%s_ \r\n> %s",
			criteria, formatError( err ) );
		}

		return nonstop.getHostsBy( options );
	},
	"host.command": function commandHost( res, command, hostName ) {
		function onSent( response ) {
			return reply( res, "I told *%s* to _%s_; it replied, `%s`", response.message );
		}

		function onError( err ) {
			return reply( res, "An error occurred telling *%s* to _%s_ \r\n> %s",
			hostName, command, formatError( err ) );
		}

		return nonstop.sendHostCommand( hostName, command )
		.then( onSent, onError );
	},
	"host.set": function setHostConfig( res, hostName, property, value ) {
		function onSent( response ) {
			return reply( res, "*%s* is setting `%s` to `%s`",
			hostName, property, value );
		}

		function onError( err ) {
			return reply( res, "An error occurred changing *%s*'s `%s` to `%s` \r\n> %s",
			hostName, property, value, formatError( err ) );
		}

		var ops = [];
		if ( value === "undefined" ) {
			ops.push( { op: "remove", field: property } );
		} else {
			ops.push( { op: "change", field: property, value: value } );
		}

		return nonstop.sendHostSetting( hostName, ops )
		.then( onSent, onError );
	},
	"package.list": function( res ) {
		function onPackages( list ) {
			var packages = _.pluck( list, "file" ).join( "\r\n\t" );
			return reply( res, "I found %d packages(s) in the index:\r\n\t%s", list.length, packages );
		}

		function onError( err ) {
			return reply( res, "An error occurred getting the package list \r\n> %s",
			formatError( err ) );
		}

		return nonstop.getPackages()
		.then( onPackages, onError );
	},
	"package.promote": function( res, project, owner, branch, specification ) {
		var version, sha;
		if ( isPackageName( project ) ) {
			var parts = /"~"/.test( project ) ? project.split( "~" ) : project.split( "-" );
			project = parts[ 0 ];
			owner = parts[ 1 ];
			branch = parts[ 2 ];
			specification = parts[ 3 ];
		} else if ( isSpecifier( project ) && !owner && !branch && !specification ) {
			specification = project;
			project = undefined;
		}
		version = isVersion( specification ) ? specification : undefined;
		sha = isSha( specification ) ? specification : undefined;

		var options = filterOptions( {
			project: project,
			owner: owner,
			branch: branch,
			slug: sha,
			version: version
		} );
		var criteria = formatCriteria( options );

		function onResult( result ) {
			return reply( res, "Promoted `%s` to `%s`", result.promoted, result.release );
		}

		function onError( err ) {
			if ( err.count ) {
				var list = err.matches.join( "\r\n\t" );
				return reply( res, "Too many packages (%d) matched the criteria: _%s_ \r\n\t: %s",
				err.count, criteria, list );
			} else {
				return reply( res, "An error occurred promoting the package where _%s_ \r\n> %s",
				criteria,
				formatError( err ) );
			}
		}

		return nonstop.promotePackage( options )
			.then( onResult, onError );
	},
	"package.search": function( res, prep, project, owner, branch, specifier ) {
		var version, sha;
		if ( isPackageName( project ) ) {
			var parts = /"~"/.test( project ) ? project.split( "~" ) : project.split( "-" );
			project = parts[ 0 ];
			owner = parts[ 1 ];
			branch = parts[ 2 ];
			specification = parts[ 3 ];
		} else if ( isSpecifier( project ) && !owner && !branch && !specifier ) {
			specifier = project;
			project = undefined;
		}
		version = isVersion( specifier ) ? specifier : undefined;
		sha = isSha( specifier ) ? specifier : undefined;

		var options = filterOptions( {
			project: project,
			owner: owner,
			branch: branch,
			slug: sha,
			version: version
		} );
		var criteria = formatCriteria( options );

		function onPackages( list ) {
			var packages = _.pluck( list, "file" ).join( "\r\n\t" );
			return reply( res, "I found %d packages(s) in the index matching _%s_:\r\n\t%s", list.length, criteria, packages );
		}

		function onError( err ) {
			return reply( res, "An error occurred getting packages matching _%s_ \r\n> %s",
			criteria,
			formatError( err ) );
		}

		return nonstop.getPackagesBy( options )
		.then( onPackages, onError );
	},
	"package.versions": function( res, prep, project, owner, branch ) {
		var options = filterOptions( {
			project: project,
			owner: owner,
			branch: branch
		} );
		var criteria = formatCriteria( options );

		function onPackages( list ) {
			var versions = _.map( list, function( package ) {
				return format( "\r\n\t%s - %s", package.version, package.slug );
			} );
			return reply( res, "Here is the list of package versions for packages matching _%s_:\r\n\t%s", criteria, versions );
		}

		function onError( err ) {
			return reply( res, "An error occurred getting versions for packages matching _%s_ \r\n> %s",
			criteria,
			formatError( err ) );
		}

		return nonstop.getPackagesBy( options )
		.then( onPackages, onError );
	}
};
