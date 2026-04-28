module.exports = {
  apps: [
    {
      name: "dashboard",
      script: "remix-serve",
      args: "build/server/index.js",
      //   instances: "max",
      //   exec_mode: "cluster",
      autorestart: true,
      restart: "on-failure",
      error_file: "/dev/null",
      out_file: "/dev/null",

      env: { PORT: 3000, NODE_ENV: "production" },
      node_args: "--env-file .env",
    },
  ],
};
