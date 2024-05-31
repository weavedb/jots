const db = require("../scripts/lib/ops")

module.exports = {
  posts: [
    ["delete", [["allow()"]]],
    [
      "add:status",
      [
        [
          "mod()",
          {
            id: "$id",
            owner: "$signer",
            likes: 0,
            reposrts: 0,
            quotes: 0,
            comments: 0,
            reposts: 0,
            date: "$ms",
            reply: false,
            quote: false,
            reply_to: "",
            repost: "",
            type: "status",
            parents: [],
          },
        ],
        ["fields()", ["*description", "mentions", "hashes", "cover"]],
        ["allow()"],
      ],
    ],
    [
      "add:article",
      [
        ["=$is_job", ["equals", "article", "$request.auth.jobID"]],
        [
          "mod()",
          {
            id: "$id",
            owner: "$signer",
            likes: 0,
            reposrts: 0,
            quotes: 0,
            reposts: 0,
            comments: 0,
            date: "$ms",
            reply: false,
            quote: false,
            reply_to: "",
            repost: "",
            type: "article",
            parents: [],
          },
        ],
        [
          "fields()",
          [
            "*title",
            "*body",
            "cover",
            "*description",
            "mentions",
            "hashes",
            "image",
          ],
        ],
        ["allowifall()", ["$is_job"]],
      ],
    ],
    [
      "update:del_post",
      [
        ["fields()", []],
        ["=$isOwner", ["equals", "$signer", "$old.owner"]],
        ["=$post", ["get()", ["posts", "$id"]]],
        ["mod()", { date: db.del() }],
        ["allowifall()", ["o$post", "o$post.date", "$isOwner"]],
      ],
    ],
    [
      "add:repost",
      [
        ["fields()", ["*repost"]],
        ["=$post", ["get()", ["posts", "$new.repost"]]],
        ["denyifany()", ["x$post", "x$post.date"]],
        [
          "=$repost",
          [
            "get()",
            [
              "posts",
              ["quote", "==", false],
              ["owner", "==", "$signer"],
              ["repost", "==", "$new.repost"],
            ],
          ],
        ],
        ["=$no_repost", ["o", ["equals", 0], ["length"], "$repost"]],
        ["denyifany()", ["!$no_repost"]],
        [
          "mod()",
          {
            id: "$id",
            owner: "$signer",
            likes: 0,
            reposrts: 0,
            quotes: 0,
            comments: 0,
            date: "$ms",
            reply: false,
            quote: false,
            reply_to: "",
            type: "status",
            parents: [],
          },
        ],
        ["allow()"],
      ],
    ],
    [
      "add:quote",
      [
        [
          "fields()",
          ["*repost", "*description", "cover", "hashes", "mentions"],
        ],
        ["=$post", ["get()", ["posts", "$new.repost"]]],
        ["denyifany()", ["x$post", "x$post.date"]],
        [
          "mod()",
          {
            id: "$id",
            owner: "$signer",
            likes: 0,
            reposrts: 0,
            quotes: 0,
            comments: 0,
            reposts: 0,
            date: "$ms",
            reply: false,
            quote: true,
            reply_to: "",
            type: "status",
            parents: [],
          },
        ],
        ["allow()"],
      ],
    ],
    [
      "add:reply",
      [
        [
          "fields()",
          ["*reply_to", "*description", "cover", "hashes", "mentions"],
        ],
        ["=$post", ["get()", ["posts", "$new.reply_to"]]],
        ["denyifany()", ["x$post", "x$post.date"]],
        [
          "mod()",
          {
            id: "$id",
            owner: "$signer",
            likes: 0,
            reposrts: 0,
            quotes: 0,
            comments: 0,
            reposts: 0,
            date: "$ms",
            reply: true,
            quote: false,
            repost: "",
            type: "status",
            parents: ["append", "$new.reply_to", "$post.parents"],
          },
        ],
        ["allow()"],
      ],
    ],
    [
      "update:edit",
      [
        ["fields()", ["title", "description", "cover", "body"]],
        ["=$is_job", ["equals", "article", "$request.auth.jobID"]],
        ["=$post", ["get()", ["posts", "$id"]]],
        ["=$is_article", ["equals", "article", "$old.type"]],
        ["denyifany()", ["x$post", "x$post.date"]],
        ["=$isOwner", ["equals", "$signer", "$old.owner"]],
        ["allowifall()", ["$isOwner", "$is_article", "$is_job"]],
      ],
    ],
  ],
  users: [
    [
      "*",
      [
        ["=$signer64", ["toBase64()", ["$signer", "hex"]]],
        ["=$user", ["get()", ["users", "$signer64"]]],
        ["=$isOwner", ["includes", "$signer", "$contract.owners"]],
        ["=$keys", ["keys", "$request.resource.data"]],
      ],
    ],
    [
      "set:reg_owner",
      [
        ["=$is_user_owner", ["equals", "$signer64", "$id"]],
        ["fields()", []],
        [
          "mod()",
          {
            address: "$signer",
            followers: 0,
            following: 0,
            invited_by: "$signer",
          },
        ],
        ["allowifall()", ["$isOwner", "x$user", "$is_user_owner"]],
      ],
    ],
    [
      "update:give_invites",
      [
        ["fields()", ["*invites"]],
        ["=$invited_user", ["get()", ["users", "$id"]]],
        ["allowifall()", ["$isOwner", "o$invited_user"]],
      ],
    ],
    [
      "set:invite_user",
      [
        ["fields()", ["address"]],
        ["denyifany()", ["x$user"]],
        ["=$addr64", ["toBase64()", ["$new.address"]]],
        ["=$isIDAddress", ["equals", "$id", "$addr64"]],
        ["=$invited", ["defaultTo", 0, "$user.invited"]],
        ["=$invites", ["defaultTo", 0, "$user.invites"]],
        ["=$have_invites", ["gt", "$invites", "$invited"]],
        ["=$invited_user", ["get()", ["users", "$id"]]],
        [
          "mod()",
          {
            followers: 0,
            following: 0,
            invited_by: "$signer",
          },
        ],
        ["allowifall()", ["x$invited_user", "$have_invites", "$isIDAddress"]],
      ],
    ],
    [
      "update:profile",
      [
        [
          "fields()",
          [
            "name",
            "description",
            "handle",
            "hashes",
            "mentions",
            "image",
            "cover",
          ],
        ],
        ["=$setHandle", ["includes", "handle", "$keys"]],
        ["denyifall()", ["$setHandle", "o$old.handle"]],
        [
          "=$huser",
          [
            "if",
            "$setHandle",
            ["get()", ["users", ["handle", "==", "$new.handle"]]],
          ],
        ],
        [
          "=$available",
          ["if", "$setHandle", ["o", ["equals", 0], ["length"], "$huser"]],
        ],
        ["=$handleOK", ["or", "!$setHandle", "$available"]],
        ["=$is_user_signer", ["equals", "$signer64", "$id"]],
        ["allowifall()", ["$is_user_signer", "$handleOK"]],
      ],
    ],
  ],
  follows: [
    ["*", [["=$follow", ["get()", ["follows", "$id"]]]]],
    [
      "set:follow",
      [
        ["fields()", ["from", "to"]],
        [
          "=$hash",
          [
            "hash()",
            [
              [
                ["$new.from", "hex"],
                ["$new.to", "hex"],
              ],
            ],
          ],
        ],
        ["=$is_hash_id", ["equals", "$hash", "$id"]],
        ["=$is_from_signer", ["equals", "$new.from", "$signer"]],
        ["=$from64", ["toBase64()", ["$new.from"]]],
        ["=$to64", ["toBase64()", ["$new.to"]]],
        ["=$from", ["get()", ["users", "$from64"]]],
        ["=$to", ["get()", ["users", "$to64"]]],
        ["denyifany()", ["x$from", "x$to", "o$follow"]],
        ["mod()", { date: "$ms" }],
        ["allowifall()", ["$is_from_signer", "$is_hash_id"]],
      ],
    ],
    [
      "delete:unfollow",
      [
        ["fields()", []],
        [
          "=$hash",
          [
            "hash()",
            [
              [
                ["$old.from", "hex"],
                ["$old.to", "hex"],
              ],
            ],
          ],
        ],
        ["=$is_hash_id", ["equals", "$hash", "$id"]],
        ["=$is_from_signer", ["equals", "$old.from", "$signer"]],
        ["=$from64", ["toBase64()", ["$old.from"]]],
        ["=$to64", ["toBase64()", ["$old.to"]]],
        ["=$from", ["get()", ["users", "$from64"]]],
        ["=$to", ["get()", ["users", "$to64"]]],
        ["denyifany()", ["x$from", "x$to", "x$follow"]],
        ["allowifall()", ["$is_from_signer", "$is_hash_id"]],
      ],
    ],
  ],
  likes: [
    [
      "set:like",
      [
        ["fields()", ["aid", "user"]],
        ["=$hash", ["hash()", [["$new.aid", ["$new.user", "hex"]]]]],
        ["=$is_hash_id", ["equals", "$hash", "$id"]],
        ["=$like", ["get()", ["likes", "$id"]]],
        ["=$isOwner", ["equals", "$signer", "$new.user"]],
        ["denyifany()", ["o$like", "!$isOwner", "!$is_hash_id"]],
        ["mod()", { date: "$ms" }],
        ["allow()"],
      ],
    ],
  ],
}
