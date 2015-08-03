var setupNode = require('./node')
  , PassThrough = require('stream').PassThrough
  , duplexify = require('duplexify')
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
      , document: function(docId) {
          if(!docStreams[docId]) {
            docStreams[docId] = broadcast.createDuplexStream(new Buffer('document:'+docId, 'utf8'))
          }
          var readBroadcast = new PassThrough
          if(!Array.isArray(localClients[docId])) localClients[docId] = []
          localClients[docId].push(readBroadcast)

          var writable = new PassThrough
          writable.pipe(through(function(buf, enc, cb) {
            localClients[docId].forEach(function(s) {
              if(s === readBroadcast) return
              s.write(buf)
              cb()
            })
          }))
          writable.pipe(docStreams[docId])
          
          var readable = new PassThrough
          docStreams[docId].pipe(readable)
          readBroadcast.pipe(readable)

          var stream = duplexify(writable, readable)
          stream.on('end', function() {
            localClients[docId].splice(localClients[docId].indexOf(readBroadcast))
          })

          return stream
        }
      }
    }
    register(null, Broadcast)
  })
}
