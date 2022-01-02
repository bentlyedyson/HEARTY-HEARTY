require('dotenv').config()

const express = require("express");
const https = require("https");
const fs = require('fs');
const path = require("path");
const { spawn } = require("child_process");
const app = express()
const port = process.env.PORT || 3000;

// Generate temporary folder
const tempFolder = "tmp/";
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder, {
    recursive: true,
  });
}

// PTB root
const ptbRoot = "https://physionet.org/files/ptb-xl/1.0.1/";

function fileDeleteHandler(err) {
  if(err) {
    console.log("unlink failed", err);
  } else {
    console.log("file deleted");
  }
}

// Utility to download file to temp
function downloadFile(url, dest, cbSuc, cbErr) {
  // Creates folder if it does not exist
  if (!fs.existsSync(path.dirname(dest))) {
    fs.mkdirSync(path.dirname(dest), {
      recursive: true,
    });
  }

  // Download the file
  const request = https.get(url, function(response) {
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

app.get('/waveform', (req, res) => {
  const { wid } = req.query;
  
  const wfdbFile = ptbRoot + wid;
  const tempFile = tempFolder + wid;

  downloadFile(wfdbFile + ".hea", tempFile + ".hea", () => {
    downloadFile(wfdbFile + ".dat", tempFile + ".dat", () => {

      // Do stuff
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

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
})
