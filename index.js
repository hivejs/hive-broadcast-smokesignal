/** 
 * hive.js 
 * Copyright (C) 2013-2016 Marcel Klehr <mklehr@gmx.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License version 2
 * as published by the Mozilla Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the Mozilla Public License
 * along with this program.  If not, see <https://www.mozilla.org/en-US/MPL/2.0/>.
 */
var setupNode = require('./node')

module.exports = setup
module.exports.consumes = ['config', 'logger', 'broadcast']
module.exports.provides = []

function setup(plugin, imports, register) {
  var config = imports.config
    , broadcast = imports.broadcast
    , logger = imports.logger.getLogger('broadcast-smokesignal')

  setupNode(config.get('broadcast-smokesignal'), logger, function(er, b) {
    b.on('error', function(e) {
      logger.warn(e.stack || e)
    })
    broadcast.registerTransport(b)
    register()
  })
}
