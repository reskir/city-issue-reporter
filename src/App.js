import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

class App extends Component {
  constructor() {
    super();
    this.fetchFromStorage = this.fetchFromStorage.bind(this);
  }

  fetchFromStorage() {}

  render() {
    return (
      <div className="App">
        <form
          className="App-form"
          action="/"
          enctype="multipart/form-data"
          method="post"
        >
          <input className="App-upload" type="file" name="foo" />
          <button className="App-submit" type="submit" value="Upload">
            Upload!
          </button>
        </form>
      </div>
    );
  }
}

export default App;
