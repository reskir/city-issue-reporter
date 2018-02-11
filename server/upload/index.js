// Imports the Google Cloud client library
const Storage = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");

// Creates a client
const storage = new Storage();
const client = new vision.ImageAnnotatorClient();

const uploadAndCheck = async filename => {
  const bucketName = "reskir-37494.appspot.com";

  // uploads a local file to the bucket
  return await storage
    .bucket(bucketName)
    .upload(filename)
    .then(response => {
      const image = `gs://${response[0].metadata.bucket}/${response[0].metadata
        .name}`;
      return client
        .textDetection(image)
        .then(results => {
          const textAnnotations = results[0].textAnnotations;
          console.log("Text detection:");
          return {
            textDetection:
              textAnnotations.map(text => text.description) ||
              "No text detected",
            image
          };
        })
        .catch(err => {
          console.error("ERROR:", err);
        });

      console.log(response[0].metadata.selfLink);
      console.log(`${filename} uploaded to ${bucketName}.`);
    })
    .catch(err => {
      console.error("ERROR:", err);
    });
};

module.exports = uploadAndCheck;
