var setupNode = require('./node')

module.exports = setup
module.exports.consumes = ['config']
module.exports.provides = ['broadcast']

function setup(plugin, imports, register) {
  var config = imports.config
  var syncStreams = {}
    , docStreams = {}
  setupNode(config.get('broadcast-smokesignal'), function(er, broadcast) {
    var Broadcast = {
      broadcast: {
        stream: broadcast
      , sync: function(docId) {
          if(!syncStreams[docId]) {
            syncStreams[docId] = broadcast.createDuplexStream(new Buffer('sync:'+docId))
          }
          return syncStreams[docId]
        }
      , document: function(docId) {
          if(!docStreams[docId]) {
            docStreams[docId] = broadcast.createDuplexStream(new Buffer('document:'+docId))
          }
          return docStreams[docId]
        }
      }
    }
    register(null, Broadcast)
  })
}