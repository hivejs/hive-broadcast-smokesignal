var Smoke = require('smokesignal')
  , findPort = require('find-free-port')
  , MuxDmx = require('mux-dmx')


var streams = {}

module.exports = function (opts, logger, cb) {
  findPort(opts.port, function(er, port) {
    if(er) throw er
    var node = Smoke.createNode({
      port: port
    , address: Smoke.localIp(opts.networkMask)
    , seeds: opts.seeds
    , logger: logger
    })
    
    var mux = MuxDmx()
    node.broadcast.pipe(mux).pipe(node.broadcast)
    
    node.start()
    
    cb(null, mux)
  })
}
