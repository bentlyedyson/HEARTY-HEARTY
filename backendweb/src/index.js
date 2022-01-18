require('dotenv').config()

const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require('fs');
const path = require("path");
const { spawn } = require("child_process");

const app = express()
const port = process.env.PORT || 3000;
// PTB root
const ptbRoot = "https://physionet.org/files/ptb-xl/1.0.1/";
const tempFolder = "tmp/";

// Just allow all origins
app.use(cors());
app.use(express.json());

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
function downloadFile(url, dest, cb=()=>{}) {
  // Creates folder if it does not exist
  if (!fs.existsSync(path.dirname(dest))) {
    fs.mkdirSync(path.dirname(dest), {
      recursive: true,
    });
  }

  // Download the file
  https.get(url, function(response) {
    if (response.statusCode !== 200) return cb(`Error getting file from PTB-XL database! ${response.statusCode}`);

    const file = fs.createWriteStream(dest);
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });

  }).on('error', function(err) { // Handle errors
    fs.unlink(dest, fileDeleteHandler); // Delete the file async. (But we don't check the result)
    cb(err.message);
  });
}

function runPython(file, args, cb) {
  const proc = spawn(process.env.PYTHON, [
    file,
    ...args,
  ]);

  // Make sure we don't call the callback 2 times
  let sent = false;

  proc.stdout.on("data", (data) => {
    if (!sent) {
      cb(data.toString().trim());
      sent = true;
    }
  });

  proc.stderr.on("data", (data) => {
    if (!sent) {
      cb(data, "error");
      sent = true;
    }
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
      downloadFile(ptbRoot+file, file, (err) => {
        if (err) throw Error(`Failed to download ${file}: ${err}`);
        console.log(`Successfully downloaded ${file}`);
      });
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

  downloadFile(wfdbFile + ".hea", tempFile + ".hea", (err) => {
    if (err) {
      // Callback for error hea
      res.statusCode = 400;
      return res.send(`Error downloading ${wfdbFile}.hea file! ${err}`);
    }

    downloadFile(wfdbFile + ".dat", tempFile + ".dat", (err) => {
      if (err) {
        // Callback for error dat
        res.statusCode = 400;
        return res.send(`Error downloading ${wfdbFile}.dat file! ${err}`);
      }

      runPython("src/wfdbizer.py", [path.resolve(tempFile)], (result, err) => {
        if (err) {
          res.statusCode = 500;
          return res.send(`Error getting data!`);
        }
        res.send(JSON.parse(result));
        // Delete file
        fs.unlink(tempFile + ".hea", fileDeleteHandler);
        fs.unlink(tempFile + ".dat", fileDeleteHandler);
      });
    });
  });
});

app.get("/data/:wid", (req, res) => {
  const wid = req.params.wid.padStart(5, '0');
  const wid_path = `records100/${wid.substring(0, 2).padEnd(5, '0')}/${wid}_lr`;

  // Get data
  runPython("src/ptb_getter.py", [wid_path], (result, err) => {
    if (err) {
      res.statusCode = 400;
      return res.send(`Error getting data!`);
    }
    res.send(JSON.parse(result));
  });
});

app.post("/predict", (req, res) => {
  const { waveform } = req.body;

  // Create file for the waveform
  const filename = tempFolder + "predict-" + Math.random().toString(10);
  fs.writeFile(filename, JSON.stringify(waveform), (err) => {
    if (err) {
      res.statusCode = 400;
      fs.unlink(filename, fileDeleteHandler);
      return res.send(`Error saving waveform!\n${err}`);
    }

    runPython("src/predictor.py", [path.resolve(filename)], (result, err) => {
      if (err) {
        res.statusCode = 400;
        fs.unlink(filename, fileDeleteHandler);
        return res.send(`Error predicting data!\n${result}`);
      }
      res.send(JSON.parse(result));
    });
  });
})

initServer();
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
})
