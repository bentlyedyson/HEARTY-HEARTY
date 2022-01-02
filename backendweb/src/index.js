require('dotenv').config()

const express = require("express");
const https = require("https");
const fs = require('fs');
const path = require("path");
const { spawn } = require("child_process");

const app = express()
const port = process.env.PORT || 3000;
// PTB root
const ptbRoot = "https://physionet.org/files/ptb-xl/1.0.1/";
const tempFolder = "tmp/";

/**
 * Utility functions
 */

 function fileDeleteHandler(err) {
  if(err) {
    console.log("unlink failed", err);
  } else {
    console.log("file deleted");
  }
}

// Utility to download file to temp
function downloadFile(url, dest, cbSuc=()=>{}, cbErr=()=>{}) {
  // Creates folder if it does not exist
  if (!fs.existsSync(path.dirname(dest))) {
    fs.mkdirSync(path.dirname(dest), {
      recursive: true,
    });
  }

  // Download the file
  https.get(url, function(response) {
    if (response.statusCode !== 200) return cbErr(`Error getting file from PTB-XL database! ${response.statusCode}`);

    const file = fs.createWriteStream(dest);
    response.pipe(file);
    file.on('finish', function() {
      file.close(cbSuc);  // close() is async, call cb after close completes.
    });

  }).on('error', function(err) { // Handle errors
    fs.unlink(dest, fileDeleteHandler); // Delete the file async. (But we don't check the result)
    if (cbErr) cbErr(err.message);
  });
}

/**
 * Inits the server. Generating and downloading all the files that it needs
 */
function initServer() {
  // Generate temporary folder
  if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder, {
      recursive: true,
    });
  }

  const neededFiles = ["ptbxl_database.csv", "scp_statements.csv"];

  // Downloads the ptb csv files
  for (file of neededFiles) {
    if (!fs.existsSync(file)) {
      downloadFile(ptbRoot+file, file, () => {
        console.log(`Successfully downloaded ${file}`);
      }, (err) => {
        throw Error(`Failed to download ${file}: ${err}`);
      })
    }
  }
}

/**
 * Routes
 */

app.get("/waveform/:wid", (req, res) => {
  const wid = req.params.wid.padStart(5, '0');
  const wid_path = `records100/${wid.substring(0, 2).padEnd(5, '0')}/${wid}_lr`;

  const wfdbFile = ptbRoot + wid_path;
  const tempFile = tempFolder + wid_path;

  downloadFile(wfdbFile + ".hea", tempFile + ".hea", () => {
    downloadFile(wfdbFile + ".dat", tempFile + ".dat", () => {

      // Get waveform
      const proc = spawn(process.env.PYTHON, [
        "src/wfdbizer.py",
        path.resolve(tempFile),
      ]);

      proc.stdout.on("data", (data) => {
        const result = data.toString().trim();
        res.send(result);

        // Delete file
        fs.unlink(tempFile + ".hea", fileDeleteHandler);
        fs.unlink(tempFile + ".dat", fileDeleteHandler);
      });

      proc.stderr.on("data", (data) => {
        res.statusCode = 500;
        res.send(`Error getting data!`);
      });

    }, (err) => {
      // Callback for error dat
      res.statusCode = 400;
      res.send(`Error downloading ${wfdbFile}.dat file! ${err}`);
    });
  }, (err) => {
    // Callback for error hea
    res.statusCode = 400;
    res.send(`Error downloading ${wfdbFile}.hea file! ${err}`);
  });
});

app.get("/data/:wid", (req, res) => {
  const wid = req.params.wid.padStart(5, '0');
  const wid_path = `records100/${wid.substring(0, 2).padEnd(5, '0')}/${wid}_lr`;

  // Get data
  // Do stuff
  const proc = spawn(process.env.PYTHON, [
    "src/ptb_getter.py",
    wid_path,
  ]);

  proc.stdout.on("data", (data) => {
    const result = data.toString().trim();
    res.send(JSON.parse(result));
  });

  proc.stderr.on("data", (data) => {
    res.statusCode = 404;
    res.send(`Error getting data!`);
  });
});

initServer();
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
})
