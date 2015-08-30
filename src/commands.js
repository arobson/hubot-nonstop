module.exports = {
	"host.commit": [
		/^(\S*) commit$/,
		/^(\S*) latest$/
	],
	"host.list": [ /^list hosts$/ ],
	"host.status": [
		/^(\S*) status$/,
		/^status (of |for )?(.*)$/
	],
	"host.uptime": [
		/^(\S*) uptime$/,
		/^uptime (of |for )?(.*)$/
	],
	"host.search": [
		/hosts (with |of |for )?([^\s\/\\]+)?[\/\\]?([^\s\/\\]+)?[\/\\]?([^\s]+)?\s?([a-fA-F0-9]{8}|[0-9]+[.][0-9]+[.][0-9]+[- ][0-9]+)?/
	],
	"host.command": [ /^(start|stop|reset) (\S*)$/ ],
	"host.set": [ /^(\S*)[: ](\S*)[ ]?=[ ]?(\S*)$/ ],
	"package.list": [ /^list packages$/ ],
	"package.promote": [
		/^promote (\S+)$/,
		/^promote ([^\s\/\\]+)[\/\\]([^\s\/\\]+)[\/\\]([^\s]+)\s?([a-fA-F0-9]{8}|[0-9]+[.][0-9]+[.][0-9]+[- ][0-9]+)$/
	],
	"package.search": [
		/packages (with |of |for )?([^\s\/\\]+)?[\/\\]?([^\s\/\\]+)?[\/\\]?([^\s]+)?\s?([a-fA-F0-9]{8}|[0-9]+[.][0-9]+[.][0-9]+[- ][0-9]+)?/
	],
	"package.versions": [
		/versions (with |of |for )?([^\s\/\\]+)?[\/\\]?([^\s\/\\]+)?[\/\\]?([^\s]+)?/
	]
};
