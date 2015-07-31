var Smoke = require('smokesignal')
  , findPort = require('find-free-port')
  , MuxDmx = require('mux-dmx')
  , 
/**
 * Interface: A factory producing broadcasts (duplex streams) per document
 * which output newly processed changesets in real-time and consume them to broadcast them.
 *
 * At all times, there should only be one entity that writes to a broadcast, but there may be multiple consumers.
 */



var streams = {}

module.exports = function (opts, cb) {
  findPort(opts.port, function(er, port) {
    if(er) throw er
    var node = Smoke.createNode({
      port: port
    , address: Smoke.localIp(opts.networkMask)
    , seeds: opts.seeds
    })
    
    var mux = MuxDmx()
    node.broadcast.pipe(mux).pipe(node.broadcast)
    
    cb(null, mux)
  })
}
