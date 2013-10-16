var base_output = require('../lib/base_output'),
    util = require('util'),
    rabbitmq = require('rabbit.js'),
    logger = require('log4node');

function OutputRabbitMQ() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Rabbitmq',
    host_field: 'target',
    required_params: ['socket']
    optional_params: ['format', 'serializer'],
    default_values: {
      'format': '#{message}',
      'serializer': 'json_logstash',
    }
  }
}

util.inherits(OutputRabbitMQ, base_output.BaseOutput);

OutputRabbitMQ.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to rabbitmq', this.target + ', socket: ' + this.socket);

  this.configure_serialize(this.serializer, this.format);

  var context = rabbitmq.createContext('amqp://' + this.target);

  context.on('ready', function() {
    this.socket = context.socket('PUB');

    this.socket.connect(this.socket);

    callback();
  }.bind(this));

  context.on('error', function(err) {
    this.emit('init_error', err);
  }.bind(this));
}

OutputRabbitMQ.prototype.process = function(data) {
  this.socket.write(this.serialize_data(data), 'utf8');
}

OutputRabbitMQ.prototype.close = function(callback) {
  logger.info('Closing output to rabbitmq', this.target);

  this.socket.destroy();

  callback();
}

exports.create = function() {
  return new OutputRabbitMQ();
}
