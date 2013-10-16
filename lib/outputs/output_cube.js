var base_output = require('../lib/base_output'),
    util = require('util'),
    dgram = require('dgram'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputCube() {
  abstract_udp.AbstractUdp.call(this);
  this.config.name = 'Cube';
  this.config.optional_params.push('type');
  this.config.default_values['type'] = '#{type}';
}

util.inherits(OutputCube, abstract_udp.AbstractUdp);

OutputCube.prototype.afterLoadConfig = function(callback) {
  this.abstractAfterLoadConfig(callback);
}

OutputGelf.prototype.format_payload = function(data, callback) {
   var m = {
    type: this.replaceByFields(data, this.type).toLowerCase() || 'logstash',
    source_host: data['host'],
    timestamp: (new Date(data['@timestamp'])).getTime() / 1000,
  };
  for (key in data) {
    if (!key.match(/^@/) && key != 'message' && key != 'host' && key != 'type') {
      m[key] = data[key];
    }
  }
  
  logger.debug('Sending CUBE Data', m);
  
  callback(new Buffer(this.serialize_data(m)));
}

OutputCube.prototype.to = function() {
  return ' Cube ' + this.host + ':' + this.port;
}

exports.create = function() {
  return new OutputCube();
}

var extend = (function(){

    var toString = Object.prototype.toString,
        obj = '[object Object]';

    return function extend( deep /*, obj1, obj2, obj3 */ ) {
        // take first argument, if its not a boolean
        var args = arguments,
            i = deep === true ? 1 : 0,
            key,
            target = args[i];

        for ( ++i; i < args.length; ++i ) {
            for (key in args[i]) {
				var targetKey = key.replace(/-/ig, '_');

                if ( deep === true &&
                     target[targetKey] &&
                     // if not doing this check you may end in
                     // endless loop if using deep option
                     toString.call(args[i][key]) === obj &&
                     toString.call(target[targetKey]) === obj ) {

                    extend( deep, target[targetKey], args[i][key] );
                } else {
                    target[targetKey] = args[i][key];
                }
            }
        }

        return target;
    };
}());
