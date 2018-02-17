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
      console.log("File saved to", filename);
    })
    .catch(err => {
      throw err;
    });
  // uploads a local file to the bucket
  return await storage
    .bucket(bucketName)
    .upload(`./${image}`)
    .then(response => {
      const image = `gs://${response[0].metadata.bucket}/${
        response[0].metadata.name
      }`;
      return client
        .textDetection(image)
        .then(results => {
          const pattern = /[a-zA-Z]{3}\s[0-9]{3}/;
          const textAnnotations = results[0].textAnnotations;
          const mobileNumbers = textAnnotations
            .map(text => text.description)
            .join("")
            .match(pattern)[0];
          if (mobileNumbers) {
            return {
              textDetection: mobileNumbers
                ? `Automobilio numeriai: ${mobileNumbers}`
                : "Automobilio numerių nerasta"
            };
          }
          return {
            textDetection: textAnnotations
              .map(text => text.description)
              .join("")
          };
        })
        .catch(err => {
          console.error("ERROR:", err);
        });
    })
    .catch(err => {
      console.error("ERROR:", err);
    });
};

module.exports = checkPhoto;
