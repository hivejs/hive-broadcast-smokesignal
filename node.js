var Smoke = require('smokesignal')
  , findPort = require('find-free-port')


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


    node.start()

    cb(null, node.broadcast)
  })
}
