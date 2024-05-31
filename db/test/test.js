const DB = require("weavedb-offchain")
const { expect } = require("chai")
const setup = require("../scripts/lib/setup")
const EthCrypto = require("eth-crypto")
const settings = require("../scripts/lib/settings")
const { pluck } = require("ramda")
const user1 = EthCrypto.createIdentity()
const user2 = EthCrypto.createIdentity()
const user3 = EthCrypto.createIdentity()
const users = [user1, user2, user3]
const a = user => user.address.toLowerCase()
const p = user => ({ privateKey: user.privateKey })

describe("WeaveDB", function () {
  this.timeout(0)
  let db, owner, relayer, user, ownerAuth, relayerAuth, userAuth, a64
  beforeEach(async () => {
    owner = EthCrypto.createIdentity()
    relayer = EthCrypto.createIdentity()
    user = EthCrypto.createIdentity()
    ownerAuth = { privateKey: owner.privateKey }
    relayerAuth = { privateKey: relayer.privateKey }
    userAuth = { privateKey: user.privateKey }
    db = new DB({
      type: 3,
      state: {
        owner: owner.address.toLowerCase(),
        max_doc_id_length: 28,
        max_doc_size: 256,
      },
      local: true,
    })
    a64 = acc => db.toBase64([acc.address.toLowerCase()])
    await db.initialize()
    await setup({ db, conf: settings(), privateKey: owner.privateKey })
  })
  it("should execute queries", async () => {
    // add owner
    const txx = await db.query(
      "set:reg_owner",
      {},
      "users",
      a64(owner),
      p(owner),
    )
    await db.query(
      "update:give_invites",
      { invites: 4 },
      "users",
      a64(owner),
      p(owner),
    )
    expect((await db.get("users", a64(owner))).address).to.eql(a(owner))

    for (const [i, v] of users.entries()) {
      await db.query(
        "set:invite_user",
        { address: a(v) },
        "users",
        a64(v),
        p(owner),
      )
      await db.query(
        "update:profile",
        {
          handle: `handle-${i}`,
          name: `name-${i}`,
        },
        "users",
        a64(v),
        p(v),
      )
      expect((await db.get("users", a64(v))).name).to.eql(`name-${i}`)
    }
    expect(pluck("address", await db.get("users")).length).to.eql(4)
    const followID = (from, to) =>
      db.hash([
        [
          [a(from), "hex"],
          [a(to), "hex"],
        ],
      ])

    // follow
    for (const [i, v] of users.entries()) {
      if (v.address !== user1.address) {
        await db.query(
          "set:follow",
          { from: a(user1), to: a(v) },
          "follows",
          followID(user1, v),
          p(user1),
        )
      }
    }
    expect((await db.get("follows")).length).to.eql(2)
    expect((await db.get("users", a64(user1))).following).to.eql(2)
    for (const [i, v] of users.entries()) {
      if (v.address !== user1.address) {
        await db.query(
          "delete:unfollow",
          "follows",
          followID(user1, v),
          p(user1),
        )
      }
    }
    expect((await db.get("follows")).length).to.eql(0)
    for (const [i, v] of users.entries()) {
      for (const [i2, v2] of users.entries()) {
        if (v.address !== v2.address) {
          await db.query(
            "set:follow",
            { from: a(v), to: a(v2) },
            "follows",
            followID(v, v2),
            p(v),
          )
        }
      }
    }

    // posts
    const tx = await db.query(
      "add:status",
      { description: "post-1" },
      "posts",
      p(user1),
    )

    const likeID = (aid, from) => db.hash([[aid, [a(from), "hex"]]])

    // likes
    await db.query(
      "set:like",
      { aid: tx.docID, user: a(user2) },
      "likes",
      likeID(tx.docID, user2),
      p(user2),
    )
    expect((await db.get("likes"))[0].aid).to.eql(tx.docID)
    expect((await db.get("posts", tx.docID)).likes).to.eql(1)

    // post article
    const art = await db.sign(
      "query",
      "add:article",
      { title: "post-1", description: "post-1", body: db.data("body") },
      "posts",
      { ...p(user1), jobID: "article" },
    )

    const tx2 = await db.relay(
      "article",
      art,
      { body: "https://body", cover: "https://cover" },
      p(relayer),
    )
    expect((await db.get("posts", tx2.docID)).body).to.eql("https://body")

    // edit
    const art2 = await db.sign(
      "query",
      "update:edit",
      { title: "edit-6", body: db.data("body") },
      "posts",
      tx2.docID,
      { ...p(user1), jobID: "article" },
    )
    await db.relay("article", art2, { body: "https://body2" }, p(relayer))
    expect((await db.get("posts", tx2.docID)).title).to.eql("edit-6")

    await db.query("update:del_post", {}, "posts", tx2.docID, p(user1))
    expect((await db.get("posts", tx2.docID)).date).to.eql(undefined)
    const tx3 = await db.query(
      "add:repost",
      { repost: tx.docID },
      "posts",
      p(user1),
    )
    expect((await db.get("posts", tx3.docID)).repost).to.eql(tx.docID)

    const tx4 = await db.query(
      "add:quote",
      { repost: tx.docID, description: "quote-4" },
      "posts",
      p(user1),
    )
    expect((await db.get("posts", tx4.docID)).description).to.eql("quote-4")

    const tx5 = await db.query(
      "add:reply",
      { reply_to: tx.docID, description: "reply-5" },
      "posts",
      p(user1),
    )
    expect((await db.get("posts", tx5.docID)).parents).to.eql([tx.docID])
  })
})
