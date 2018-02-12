import React, { Component } from "react";
import "./App.css";

class App extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div className="App">
        <form
          className="App-form"
          action="/"
          enctype="multipart/form-data"
          method="post"
          target="uploader_iframe"
        >
          <input className="App-upload" type="file" name="foo" />
          <button className="App-submit" type="submit" value="Upload">
            Upload!
          </button>
        </form>
        <br />
        <br />
        <iframe id="uiframe" name="uploader_iframe" />
      </div>
    );
  }
}

export default App;
