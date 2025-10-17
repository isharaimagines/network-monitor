const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const { PythonShell } = require("python-shell");
const fs = require("fs");
const isDev = process.argv.includes("--dev");

let mainWindow;
let pythonProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "build/icons/magnifying-glass.png"),
    title: "Network Monitor",
    show: false,
  });

  // In production, load from the src directory
  if (isDev) {
    mainWindow.loadFile("src/templates/index.html");
  } else {
    // In production, files are in the app directory
    mainWindow.loadFile(path.join(__dirname, "src/templates/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Restart Monitor",
          click: () => {
            restartPythonBackend();
          },
        },
        {
          label: "Stop Monitor",
          click: () => {
            stopPythonBackend();
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Network Monitor",
              message: "Network Monitor",
              detail:
                "A desktop application for monitoring network traffic and connections.\n\nVersion 1.0.0",
            });
          },
        },
        {
          label: "Install Python Dependencies",
          click: () => {
            installPythonDependencies();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Function to find Python executable
function findPythonExecutable() {
  return new Promise((resolve) => {
    const commands = ["python", "python", "py"];

    const tryNext = (index) => {
      if (index >= commands.length) {
        resolve(null);
        return;
      }

      const command = commands[index];
      const { spawn } = require("child_process");
      const pythonProcess = spawn(command, ["--version"]);

      pythonProcess.on("error", () => {
        tryNext(index + 1);
      });

      pythonProcess.stdout.on("data", () => {
        resolve(command);
      });

      pythonProcess.stderr.on("data", () => {
        tryNext(index + 1);
      });
    };

    tryNext(0);
  });
}

function getResourcePath() {
  if (isDev) {
    return __dirname;
  } else {
    // In production, the app is packaged in the resources/app directory
    return process.resourcesPath ? path.join(process.resourcesPath) : __dirname;
  }
}

function startPythonBackend() {
  findPythonExecutable().then((pythonCommand) => {
    if (!pythonCommand) {
      const errorMsg =
        "Python not found. Please install Python from https://python.org";
      console.error(errorMsg);
      if (mainWindow) {
        mainWindow.webContents.send("python-error", errorMsg);

        dialog.showErrorBox(
          "Python Not Found",
          "Python is required to run this application.\n\n" +
            "Please install Python from https://python.org and make sure it is added to your PATH.\n\n" +
            "After installing Python, restart the application."
        );
      }
      return;
    }

    console.log(`Using Python command: ${pythonCommand}`);

    const resourcePath = getResourcePath();
    const scriptPath = path.join(resourcePath, "src", "app.py");
    const scriptDir = path.join(resourcePath, "src");

    console.log("Resource path:", resourcePath);
    console.log("Script path:", scriptPath);
    console.log("Script directory:", scriptDir);

    // Check if the Python script exists
    if (!fs.existsSync(scriptPath)) {
      const errorMsg = `Python script not found: ${scriptPath}`;
      console.error(errorMsg);
      if (mainWindow) {
        mainWindow.webContents.send("python-error", errorMsg);
      }
      return;
    }

    const options = {
      mode: "text",
      pythonPath: pythonCommand,
      pythonOptions: ["-u"],
      scriptPath: scriptDir,
      args: [],
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    };

    if (isDev) {
      console.log("Starting Python backend in development mode...");
    } else {
      console.log("Starting Python backend in production mode...");
    }

    try {
      pythonProcess = new PythonShell("app.py", options);

      pythonProcess.on("message", (message) => {
        console.log("Python:", message);
        if (mainWindow) {
          mainWindow.webContents.send("python-output", message);
        }
      });

      pythonProcess.on("stderr", (error) => {
        console.error("Python stderr:", error);
        if (mainWindow) {
          mainWindow.webContents.send("python-error", error);
        }
      });

      pythonProcess.on("close", (code) => {
        console.log("Python process closed with code:", code);
        pythonProcess = null;

        if (mainWindow && code !== 0) {
          mainWindow.webContents.send("python-closed", {
            code,
            unexpected: true,
          });
        }
      });
    } catch (error) {
      console.error("Failed to start Python process:", error);
      if (mainWindow) {
        mainWindow.webContents.send("python-error", error.message);
      }
    }
  });
}

function installPythonDependencies() {
  findPythonExecutable().then((pythonCommand) => {
    if (!pythonCommand) {
      dialog.showErrorBox(
        "Python Not Found",
        "Cannot install dependencies: Python not found."
      );
      return;
    }

    const resourcePath = getResourcePath();
    const requirementsPath = path.join(resourcePath, "src", "requirements.txt");

    const { spawn } = require("child_process");
    const installProcess = spawn(
      pythonCommand,
      ["-m", "pip", "install", "-r", requirementsPath],
      {
        cwd: path.join(resourcePath, "src"),
      }
    );

    let output = "";
    let errorOutput = "";

    installProcess.stdout.on("data", (data) => {
      output += data.toString();
      console.log("pip install:", data.toString());
    });

    installProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error("pip install error:", data.toString());
    });

    installProcess.on("close", (code) => {
      if (code === 0) {
        dialog.showMessageBox(mainWindow, {
          type: "info",
          title: "Dependencies Installed",
          message: "Python dependencies installed successfully!",
          detail:
            "The required Python packages have been installed. You may need to restart the application.",
        });
      } else {
        dialog.showErrorBox(
          "Installation Failed",
          `Failed to install dependencies.\n\nOutput: ${output}\nErrors: ${errorOutput}`
        );
      }
    });
  });
}

function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send("python-stopped");
    }
  }
}

function restartPythonBackend() {
  stopPythonBackend();
  setTimeout(() => {
    startPythonBackend();
    if (mainWindow) {
      mainWindow.webContents.send("python-restarted");
    }
  }, 1000);
}

// IPC handlers
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("show-message-box", async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle("install-dependencies", async () => {
  installPythonDependencies();
});

// App event handlers
app.whenReady().then(() => {
  createWindow();
  // Delay Python start to ensure window is ready
  setTimeout(() => {
    startPythonBackend();
  }, 1000);
});
app;
app.on("window-all-closed", () => {
  stopPythonBackend();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopPythonBackend();
});

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
  });
});
