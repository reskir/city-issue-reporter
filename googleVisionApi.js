const Storage = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");
const fs = require("fs");
const download = require("image-downloader");

// Creates a client
const storage = new Storage();
const client = new vision.ImageAnnotatorClient();

const checkPhoto = async filename => {
  const bucketName = "reskir-37494.appspot.com";
  const options = {
    url: filename,
    dest: "./uploads/" // Save to /path/to/dest/image.jpg
  };
  const image = await download
    .image(options)
    .then(({ filename, image }) => {
      return filename;
    })
    .catch(err => {
      throw err;
    });
  // uploads a local file to the bucket
  return await client
    .textDetection(image)
    .then(results => {
      const pattern = /[a-zA-Z]{3}\W[0-9]{3}/;
      const textAnnotations = results[0].textAnnotations;

      if (textAnnotations.length) {
        const mobileNumbers = textAnnotations
          .map(text => text.description)
          .join("")
          .match(pattern);
        if (mobileNumbers) {
          if (mobileNumbers[0]) {
            return {
              automobileNumbers: mobileNumbers[0].replace(/\.|\:|\s/g, ' ')
            }
          } else {
            return {
              automobileNumbers: null
            }
          }
        }
        return {
          automobileNumbers: null,
          textDetection: textAnnotations.map(text => text.description).join("")
        };
      }
      return {
          textDetection: "No text found"
      }
    })
    .catch(err => {
      console.error("ERROR:", err);
    });
};

module.exports = checkPhoto;
