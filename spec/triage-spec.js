var MonitorFactory = require('../lib/triage'),
    pathLib        = require('path'),
    async          = require('async'),
    assert         = require('assert'),
    sinon          = require('sinon'),
    fs             = require('fs'),
    wrench         = require('wrench'),
    timeout        = 10000,
    rel            = function(path) {
      // relative path from test workspace to absolute path
      // TODO: rename
      return pathLib.join(__dirname, 'dummy_workspace', path);
    };

var createFile = function(filePath) {
  return function(callback) {
    fs.open(rel(filePath), 'w', callback);
  };
};

var changeFile = function(filePath, callback) {};

var removeFile = function(filePath, callback) {};

var prepareWorkspace = function(callback) {
  var backup          = pathLib.join(__dirname, 'dummy_workspace.bak'),
      dummy_workspace = pathLib.join(__dirname, 'dummy_workspace');
  // TODO: check dummy_workspace folder exists?
  wrench.rmdirRecursive(dummy_workspace, function() {
    wrench.copyDirRecursive(backup, dummy_workspace, callback);
  });
};

// dummy_workspace.bak
// └── home
//     ├── alan
//     │   ├── prj
//     │   └── video
//     └── john
//         ├── messages
//         └── prj

describe('typical workflow', function() {
  this.timeout(timeout);

  var spy = sinon.spy();

  // some specifications
  var bakHunt = {
        rule: /^\w+\.bak$/,
        event: 'created',
        handler: spy
      },
      inboxChange = {
        rule: 'inbox.txt',
        event: 'changed',
        handler: function(filePath) { this.emit('inbox changed') }
      },
      newUserVideo = {
        rule: /^(\w+)\/video\/(\w+\.mp4)$/,
        event: 'created',
        handler: spy
      };

  var newUserVideoMonitorFactory = new MonitorFactory([ newUserVideo ]),
      inboxChangeMonitorFactory  = new MonitorFactory([ inboxChange ]),
      bakHuntMonitorFactory      = new MonitorFactory([ bakHunt ]);

  before(function(done) {
    var options = {};

    // prepare test folder structure
    prepareWorkspace(function() {

      // create monitors
      async.parallel([
        function(callback) {
          newUserVideoMonitorFactory.create(rel('home'), options, callback);
        },
        function(callback) {
          callback(null, 'ok');
        }
      ], done);

    });
  });

  it('should properly emit all events on fs change', function(done) {
    // make some fs changes
    async.parallel([
      createFile('home/alan/video/birds.mp4')
    ], function() {
      // then wait
      setTimeout(function() {
        // and check results
        assert(spy.calledWith(rel('home/alan/video/birds.mp4')));
        done();
      }, timeout - 500);
    });

  });
});

