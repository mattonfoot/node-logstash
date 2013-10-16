var base_input = require('../lib/base_input'),
    util = require('util'),
    rabbitmq = require('rabbit.js'),
    logger = require('log4node');

function InputRabbitMQ() {
  base_input.BaseInput.call(this);

  this.config = {
    name: 'Rabbitmq',
    host_field: 'target',
    required_params: ['socket']
    optional_params: ['unserializer'],
    default_values: {
      'unserializer': 'json_logstash',
    }
  }
}

util.inherits(InputRabbitMQ, base_input.BaseInput);

InputRabbitMQ.prototype.afterLoadConfig = function(callback) {
  logger.info('Start listening on rabbitmq', this.target + ', socket: ' + this.socket);

  this.configure_unserialize(this.unserializer);

  var context = rabbitmq.createContext('amqp://' + this.target);

  context.on('ready', function() {
    this.socket = context.socket('SUB');

    this.socket.setEncoding('utf8');

    this.socket.on('error', function(err) {
      if (err) {
        return this.emit('init_error', err);
      }
    }.bind(this));

    this.socket.on('data', function(data) {
      this.unserialize_data(data,  function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        this.emit('error', 'Unable to parse data ' + data);
      }.bind(this));

      this.socket.connect(this.socket);

      this.emit('init_ok');

      logger.info('Rabbitmq ready on ' + this.target + ', socket: ' + this.socket);

      callback();
    }.bind(this));
    
  }.bind(this));

  context.on('error', function(err) {
    this.emit('init_error', err);
  }.bind(this));
}

InputRabbitMQ.prototype.close = function(callback) {
  logger.info('Closing input rabbitmq', this.target);

  this.socket.destroy();

  callback();
}

exports.create = function() {
  return new InputRabbitMQ();
}
