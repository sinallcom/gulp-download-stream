'use strict';

var chai = require('chai');

var describe = require('mocha').describe;
var it = require('mocha').it;
var expect = chai.expect;

var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var gutil = require('gulp-util');
var through = require('through2');
var stream = require('stream');
var dummy1 = 'http://dummy.com/file1.txt';
var dummy2 = 'http://dummy.com/file2.txt';
var dummyContent = 'This is the content of the request';

describe('gulp-download-stream', function() {
  var download, mockUtil, mockRequest, target, mockery;

  beforeEach(function() {
    mockery = require('mockery');
    mockery.enable({
      warnOnUnregistered: false
    });

    var source = stream.Readable();
    source._read = function() {
      this.push(dummyContent);
      this.push(null);
    };
    mockRequest = sinon.stub();
    mockRequest.returns(source);
    mockery.registerMock('request', function(options) {
      return mockRequest(options);
    });

    sinon.stub(gutil, 'log', function() {});

    download = require('..', true);
  });

  it('returns a readable stream', function() {
    var isReadable = require('isstream').isReadable;
    var fileStream = download(dummy1);
    expect(isReadable(fileStream)).to.be.true;
  });


  it('passes a single URL from a string to request', function(done) {
    download(dummy1)
      .on('end', function() {
         expect(mockRequest).to.have.been.calledWith({
           url: dummy1,
           encoding: null
         });
         done();
      })
      .pipe(through({objectMode:true}));
  });

  it('passes a single URL from an object to request', function(done) {
    download({
      url: dummy1
    })
      .on('end', function() {
         expect(mockRequest).to.have.been.calledWith({
           url: dummy1,
           encoding: null
         });
         done();
      })
      .pipe(through({objectMode:true}));
  });

  it('passes an array of strings to request', function(done) {
    download([dummy1, dummy2])
      .on('end', function() {
         expect(mockRequest).to.have.been.calledWith({
           url: dummy1,
           encoding: null
         });
         expect(mockRequest).to.have.been.calledWith({
           url: dummy2,
           encoding: null
         });
         done();
      })
      .pipe(through({objectMode:true}));
  });

  it('passes the content of the response to the Vinyl file', function(done) {
    download({
      url: dummy1
    })
      .pipe(through({objectMode:true}, function(chunk, enc, callback) {
        chunk.contents.pipe(through(function(chunk, enc, callback) {
          expect(chunk.toString()).to.equal(dummyContent);
          done();
        }));
      }));
  });

  afterEach(function() {
    gutil.log.restore();
    mockery.deregisterAll();
    mockery.disable();
  });
});
