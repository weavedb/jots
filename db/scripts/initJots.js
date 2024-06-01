const config = require("../weavedb.config.js")
const SDK = require("weavedb-node-client")
const accounts = require("./lib/accounts")
const { isNil } = require("ramda")
let {
  _: [name],
  network,
  owner_l2,
  user,
} = require("yargs")(process.argv.slice(2)).parserConfiguration({
  "parse-numbers": false,
}).argv

if (isNil(name)) {
  console.error(`DB name not specified`)
  process.exit()
}

if (isNil(user)) {
  console.error(`user not specified`)
  process.exit()
}

if (isNil(accounts.evm[owner_l2])) {
  console.error(`EVM owner not specified or found: ${owner_l2} `)
  process.exit()
}

network ??= config.defaultNetwork
const rpc = config.networks[network]
let privateKey = null

if (isNil(rpc)) {
  console.error(`network not found: ${network}`)
  process.exit()
}

const main = async key => {
  const auth = { privateKey: accounts.evm[owner_l2].privateKey }
  const _db = new SDK({ rpc: rpc.url, contractTxId: name })
  const { dbs } = await _db.node({ op: "stats" })
  let instance = null
  for (const v of dbs) {
    if (v.id === name) {
      instance = v.data
    }
  }
  if (isNil(instance)) {
    console.error(`DB not found: ${name}`)
    process.exit()
  }
  const db = new SDK({
    rpc: rpc.url,
    contractTxId: `${instance.contractTxId ?? name}`,
  })
  const a64 = acc => db.toBase64([acc.toLowerCase()])
  const owner = accounts.evm[owner_l2]
  await db.query("set:reg_owner", {}, "users", a64(owner.address), auth)
  await db.query(
    "update:give_invites",
    { invites: 100 },
    "users",
    a64(owner.address),
    auth,
  )
  await db.query(
    "set:invite_user",
    { address: user.toLowerCase() },
    "users",
    a64(user),
    auth,
  )
  await db.query(
    "update:give_invites",
    { invites: 100 },
    "users",
    a64(user),
    auth,
  )
  process.exit()
}

main()
