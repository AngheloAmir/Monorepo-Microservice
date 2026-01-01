const { spawn } = require("child_process");
const net       = require("net");
const PORT      = 3200;
const URL       = "http://localhost:3200";

/**
 * Wait until the port is actually accepting connections
 */
function waitForPort(port) {
  return new Promise((resolve) => {
    const tryConnect = () => {
      const socket = new net.Socket();
      socket
        .once("connect", () => {
          socket.destroy();
          resolve();
        })
        .once("error", () => {
          setTimeout(tryConnect, 300);
        })
        .connect(port, "127.0.0.1");
    };
    tryConnect();
  });
}

/**
 * Open browser cross-platform without shell
 */
function openBrowser(url) {
  const platform = process.platform;

  let cmd, args;

  if (platform === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else if (platform === "darwin") {
    cmd = "open";
    args = [url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }

  spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
}

console.log("Starting tools server…");

const server = spawn("yarn", ["run", "start"], {
  stdio: "inherit",
  cwd: process.cwd()
});

waitForPort(PORT).then(() => {
  console.log("Tools ready → opening browser");
  openBrowser(URL);
});

// Allow Ctrl+C to kill child process
process.on("SIGINT", () => {
  server.kill("SIGINT");
  process.exit();
});
