var fs = require('fs');
var path = require('path');

var youtubedl = require('youtube-dl');

var fivebeans = require('fivebeans');
var client = new fivebeans.client('127.0.0.1', 11300);
client.connect(function(err) {
  if (err) throw err;
});

var mongoose = require('mongoose');
var Metadata = require('../models/metadata');

mongoose.connect("mongodb://localhost/hyperaudio01"); //FIXME conf

module.exports = function() {
  function DownloadHandler() {
    this.type = 'media';
  }

  DownloadHandler.prototype.work = function(payload, callback) {
    // console.log(payload);
    // console.log(path.join(__dirname, '../media/' + payload.media._id + '/'));

    if (payload.media.source.youtube || payload.media.source.unknown) {
      var folder = path.join(__dirname, '../media/' + payload.media._id + '/');
      try{
        fs.mkdirSync(folder);
      } catch (ignored) {}

      var url = (payload.media.source.youtube)?payload.media.source.youtube.url:payload.media.source.unknown.url;
      var dl = youtubedl.download(url,
        folder, [
          '--quiet',
          '--max-quality=18',
          '--output=%(autonumber)s.%(ext)s',
          '--write-info-json',
          '--write-annotations',
          '--write-thumbnail',
          '--all-formats',
          '--all-subs',
          '--write-auto-sub',
          '--extract-audio',
          '--audio-format=aac',
          '--keep-video'
        ]);

      dl.on('download', function(data) {
        console.log('filename: ' + data.filename);
        console.log('size: ' + data.size);
      });

      dl.on('error', function(err) {
        // throw err;
        console.log(err);
        // callback('bury');
      });

      dl.on('end', function(data) {
        console.log(data);

        Metadata.findById(payload.meta._id).exec(function(err, metadata) {
          if (!err) {
            // console.log('loaded metadata from db');
            metadata.download = data;
            metadata.save(function(err) {
              if (!err) {
                // console.log('saved metadata to db');
                // console.log(metadata);

                // send to another pipe
                client.use("probe", function(err, tubename) {
                  if (err) throw err;

                  client.put(1, 0, 0, JSON.stringify(['probe', {
                    type: "media",
                    payload: {
                      media: payload.media,
                      meta: metadata
                    }
                  }]), function(err, jobid) {
                    if (err) throw err;
                  });
                });

                callback('success');
              } else {
                console.log(err);
                callback('bury');
              }
            });
          } else {
            console.log(err);
            callback('bury');
          }
        });

      });

    } else {
      callback('bury');
    }

  };

  var handler = new DownloadHandler();
  return handler;
};
