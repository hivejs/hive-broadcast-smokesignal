/**
 * hive.js
 * Copyright (C) 2013-2015 Marcel Klehr <mklehr@gmx.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var setupNode = require('./node')
  , PassThrough = require('stream').PassThrough
  , MuxDmx = require('mux-dmx')
  , through = require('through2')

module.exports = setup
module.exports.consumes = ['config', 'logger']
module.exports.provides = ['broadcast']

function setup(plugin, imports, register) {
  var config = imports.config
    , logger = imports.logger.getLogger('broadcast-smokesignal')
  var syncStreams = {}
    , docStreams = {}
    , localClients = {}
    , channels = {}
  setupNode(config.get('broadcast-smokesignal'), logger, function(er, broadcast) {
    broadcast.on('error', function(e) {
      logger.warn(e.stack || e)
    })
    var Broadcast = {
      broadcast: {
        stream: broadcast
      , sync: function(docId) {
          if(!syncStreams[docId]) {
            syncStreams[docId] = broadcast.createDuplexStream(new Buffer('sync:'+docId, 'utf8'))
          }
          return syncStreams[docId]
        }
      , registerChannel: function(id, fn) {
          if(channels[id.toString('base64')]) return
          channels[id.toString('base64')] = fn
        }
      , document: function(docId, user) {
          if(!docStreams[docId]) {
            docStreams[docId] = broadcast.createDuplexStream(new Buffer('document:'+docId, 'utf8'))
          }
          var b = MuxDmx()
          if(!Array.isArray(localClients[docId])) localClients[docId] = []
          localClients[docId].push(b)

          Object.keys(channels).forEach(function(channel) {
            var id = new Buffer(channel, 'base64')
              , readable = b.createDuplexStream(id)
              , writable = new PassThrough
            writable.pipe(through(function(buf, enc, cb) {
              if(Array.isArray(localClients[docId])) {
                localClients[docId].forEach(function(s) {
                  if(s === b) return
                  s.createDuplexStream(id).write(buf)
                })
              }
              cb()
            }))
            writable.pipe(docStreams[docId])
            channels[channel](user, docId, readable, writable)
          })

          b.on('end', function() {
            localClients[docId].splice(localClients[docId].indexOf(readBroadcast))
          })

          return b
        }
      }
    }
    register(null, Broadcast)
  })
}
