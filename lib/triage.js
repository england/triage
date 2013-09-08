var watch        = require('watch'),
    EventEmitter = require('events').EventEmitter,
    pathLib      = require('path');

var possibleEvents = [ 'created', 'changed', 'removed' ];

function MonitorFactory(specifications) {
  var self = this;
  this.eventHandlers = {};
  possibleEvents.forEach(function(event) {
    self.eventHandlers[event] = [];
  });
  specifications.forEach(function(specification) {
    self.eventHandlers[specification.event].push(specification);
  });
};

MonitorFactory.prototype.create = function(path, options, callback) {
  var self = this;
  var handlersFor = function(event, filePath) {
    var handlers = [];
    var relativeFilePath = pathLib.relative(path, filePath);
    // XXX: use combined regex?
    self.eventHandlers[event].forEach(function(s) {
      if (relativeFilePath.match(s.rule)) {
        handlers.push(s.handler);
      }
    });
    return handlers;
  };
  var attachListeners = function(monitor) {
    var ee = new EventEmitter;
    callback(null, ee);
    possibleEvents.forEach(function(event) {
      if (self.eventHandlers[event].length > 0) {
        monitor.on(event, function(filePath) {
          handlersFor(event, filePath).forEach(function(handler) {
            handler.call(ee, filePath);
          });
        });
      };
    });
  };

  watch.createMonitor(path, attachListeners);
};

module.exports = MonitorFactory;
