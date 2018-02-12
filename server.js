const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fileUpload = require("express-fileupload");
const uploadAndCheck = require("./server/upload/index");

const app = express();
app.use(express.static(path.join(__dirname, "build")));
app.use(fileUpload());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.set("views", "./views");
app.set("view engine", "pug");

app.post("/", async (req, res) => {
  if (!req.files) return res.status(400).send("No files were uploaded!");
  const { foo } = req.files;
  const uploadTo = `uploads/${foo.name}`;
  foo.mv(uploadTo);
  uploadAndCheck(uploadTo).then(result => {
    const pattern = /[a-zA-Z]{3}\s[0-9]{3}/;
    let message;
    if (result.textDetection) {
      message = result.textDetection.join().match(pattern)
        ? result.textDetection.join().match(pattern)[0]
        : "Nerasta";
    }
    res.render("result", {
      title: "Hey",
      message,
      image: `http://storage.googleapis.com/reskir-37494.appspot.com/${foo.name}`
    });
  });
});

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(process.env.PORT || 7777);
