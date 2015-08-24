# Description:
#   A plugin for communicating with nonstop index and service hosts.
#   Recommendation: run your bot within a nonstop service host and
#   get automatic deployments. See README for details.
#
# Configuration:
#   THE INDEX VARIABLES ARE REQUIRED!
#     INDEX_HOST=<nonstop index machine name or IP>
#     INDEX_PORT=<nonstop index port>
#     INDEX_TOKEN=<client token>
#     INDEX_FREQUENCY=<frequency to check for updates in ms>
#
#   USED WHEN SETTING UP NONSTOP WEBHOOK TO CALL BACK TO YOUR HUBOT
#     HOOK_IP=<public IP of container server>
#     HOOK_PORT=<public port of container server>
#     HOOK_URL=<the url to call>
#
#   THESE ARE ONLY USED IF YOU'RE HOSTING WITHIN A NONSTOP SERVICE HOST
#     HOSTNAME=<your bot name>
#     PACKAGE_BRANCH=<the branch to use>
#     PACKAGE_OWNER=<the fork/owner to use>
#     PACKAGE_PROJECT=<the project name>
#     SERVICE_NAME=<your bot name>
#     SERVICE_HOST_IP=<public IP of container server>
#     SERVICE_HOST_NAME=<public machine name of container server>
#     SERVICE_PORT_LOCAL=<nonstop service host port>
#     SERVICE_PORT_PUBLIC=<public port for service host>
#
# Commands:
#   list hosts - lists all service hosts
#   <hostName> status - displays the status of the host last reported
#   status of|for <hostName> - displays the status of the host last reported
#   <hostName> uptime - displays the uptime of host last reported
#   uptime of|for <hostName> - displays the uptime of the host last reported
#   hosts of|for|with <project>/<owner>/<branch> <slug>|<version> - finds all hosts hosting a package matching criteria
#   start|stop|reset <hostName> - sends start, stop or reset command to host
#   <hostName>:<property>=<value> - sets a package filter property to change what packages a host will consider
#   list packages - lists all packages in the index
#   promote <fileName> - promotes package to release by file name
#   promote <project>/<owner>/<branch> <slug>|<version> - promotes a single package matching the criteria
#   packages of|for|with <project>/<owner>/<branch> <slug>|<version> - finds all packages matching criteria
#   versions of|for|with <project>/<owner>/<branch> - finds all versions for the matched package
#

plugin = require "../src/plugin"

module.exports = (robot) ->
	plugin( robot );
