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
        privateKey:
          "0xaf0c06a498a71d75788fcd12da52632a6448d971577c725b582d57b022a00c05",
      },
    },
    ar: {},
  },
  defaultNetwork: "localhost",
  networks: {
    localhost: { url: "localhost:8080", admin: "admin" },
  },
}
