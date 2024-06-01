module.exports = {
  db: {
    app: "http://localhost:3000",
    name: "Jots",
    rollup: true,
    plugins: { notifications: {} },
    tick: 1000 * 60 * 5,
  },
  accounts: {
    evm: {
      admin: {
        privateKey: "",
      },
    },
    ar: {},
  },
  defaultNetwork: "localhost",
  networks: {
    localhost: { url: "localhost:8080", admin: "admin" },
  },
}
