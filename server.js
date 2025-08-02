const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { DirectSecp256k1Wallet } = require("@cosmjs/proto-signing");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { coins, GasPrice } = require("@cosmjs/stargate");
const bech32 = require("bech32");

const app = express();
const PORT = 8080;

// Replace with your contract address and ZigChain RPC endpoint
const RPC_ENDPOINT = "https://public-zigchain-testnet-rpc.numia.xyz/";

app.use(bodyParser.json());
app.use(express.static("public"));

let stats = {
  visits: [],
  swaps: [],
};

// ✅ Token info
const tokenMap = {
  ZIG: "uzig",
  ORO: "zig15jqg0hmp9n06q0as7uk3x9xkwr9k3r7yh4ww2uc0hek8zlryrgmsamk4qg",
  BEE: "zig1r50m5lafnmctat4xpvwdpzqndynlxt2skhr4fhzh76u0qar2y9hqu74u5h",
  STZIG: "zig19zqxslng99gw98ku3dyqaqy0c809kwssw7nzhea9x40jwxjugqvs5xaghj",
  FOMOFEAST: "zig1unc0549k2f0d7mjjyfm94fuz2x53wrx3px0pr55va27grdgmspcqsp4692",
  PUMP: "zig1k0728vraxvf7gn3dptlnlw5etrwlfd2yagf5u9jnsj9x7wpskds9xhjya",
  CULTCOIN: "zig1j55nw46crxkm03fjdf3cqx3py5cd32jny685x9c3gftfdt2xlvjs63znce",
  NFA: "zig1dye3zfsn83jmnxqdplkfmelyszhkve9ae6jfxf5mzgqnuylr0sdq8ng9tv",
  ZMZIG: "zig15meu4rk66v0wlp59tuewng4rpfvepagpfd8uq9w59rd77ce56dnqftmxn2",
};
const pairContracts = {
  // Native ZIG to CW20
  "ZIG:BEE": "zig1r50m5lafnmctat4xpvwdpzqndynlxt2skhr4fhzh76u0qar2y9hqu74u5h",
  "ZIG:ORO": "zig15jqg0hmp9n06q0as7uk3x9xkwr9k3r7yh4ww2uc0hek8zlryrgmsamk4qg",
  "ZIG:NFA": "zig1dye3zfsn83jmnxqdplkfmelyszhkve9ae6jfxf5mzgqnuylr0sdq8ng9tv",

  // Add reverse pairs as well if supported:
  "BEE:ZIG": "zig1r50m5lafnmctat4xpvwdpzqndynlxt2skhr4fhzh76u0qar2y9hqu74u5h",
  "ORO:ZIG": "zig15jqg0hmp9n06q0as7uk3x9xkwr9k3r7yh4ww2uc0hek8zlryrgmsamk4qg",
  "NFA:ZIG": "zig1dye3zfsn83jmnxqdplkfmelyszhkve9ae6jfxf5mzgqnuylr0sdq8ng9tv",

  // Add more token-to-token pairs as needed
};

const jokes = [
  "Why did the blockchain break up with the database? Too centralized!",
  "Why don’t crypto traders play hide and seek? Because good luck hiding on-chain!",
  "Why did the smart contract file a complaint? It felt exploited!",
  "Why was the crypto investor always calm? He had strong HODL skills.",
  "My wallet is so empty, even the gas fees laugh at it!",
];

const quotes = [
  "“Decentralize or die.” — Satoshi Nakamoto",
  "“In crypto we trust.” — Anonymous",
  "“Not your keys, not your coins.” — Everyone",
  "“HODL like your future depends on it.”",
  "“The revolution will be verified.”",
];

const learnTerms = {
  defi: "🧠 DeFi (Decentralized Finance): Financial services without traditional banks. Includes swapping, lending, staking, etc.",
  staking: "🔐 Staking: Locking your tokens to support the network and earn rewards.",
  gas: "⛽ Gas: A fee paid to process transactions on the blockchain.",
  wallet: "👛 Wallet: A digital tool that stores your crypto and allows transactions.",
  blockchain: "🔗 Blockchain: A decentralized digital ledger that records transactions.",
  validator: "✅ Validator: A node that confirms blocks and transactions on a blockchain.",
  airdrop: "🎁 Airdrop: Free crypto distributed to wallets, usually for marketing or rewards.",
  liquidity: "💧 Liquidity: How easily a token can be bought or sold without impacting price.",
  smartcontract: "📄 Smart Contract: Code on the blockchain that runs automatically when triggered.",
  nft: "🖼️ NFT (Non-Fungible Token): A unique digital asset representing art, music, etc.",
  bridge: "🌉 Bridge: A tool to transfer assets between different blockchains.",
  tokenomics: "📊 Tokenomics: The economics behind a crypto token (supply, distribution, utility).",
  halving: "📉 Halving: An event where mining rewards are cut in half, common in Bitcoin.",
  rugpull: "🚨 Rug Pull: A scam where developers abandon a project and run off with investors' money.",
  mainnet: "🚀 Mainnet: The official live blockchain network.",
};


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/visit", (req, res) => {
  stats.visits.push(Date.now());
  saveStats();
  io.emit("statsUpdated", stats);
  res.json({ success: true });
});


app.post("/chat", async (req, res) => {
  const cmd = req.body.message.trim().toLowerCase();
  const msg = req.body.message.trim().toLowerCase();

  if (cmd === "learn") {
    const available = Object.keys(learnTerms)
      .map((t) => `🔹 ${t}`)
      .join("\n");
    return res.json({
      reply: `📘 Learn Mode Activated!\nWhich term would you like to learn?\n\n${available}`,
    });
  }

  if (learnTerms[cmd]) {
    return res.json({ reply: learnTerms[cmd] });
  }

  if (cmd === "quote") {
    return res.json({
      reply: `💬 ${quotes[Math.floor(Math.random() * quotes.length)]}`,
    });
  }

  if (cmd === "joke") {
    return res.json({
      reply: `😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`,
    });
  }

  if (cmd === "emoji") {
    const emojis = ["🚀", "💎", "🔥", "🧠", "🔐", "⛓️", "📈", "🐋", "🪙", "👛"];
    return res.json({
      reply: emojis[Math.floor(Math.random() * emojis.length)],
    });
  }

  if (cmd === "time") {
    return res.json({
      reply: `🕒 Current time: ${new Date().toLocaleTimeString()}`,
    });
  }

  if (cmd === "stats") {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000;
    const visits = stats.visits.filter((t) => t > cutoff).length;
    const swaps = stats.swaps.filter((t) => t > cutoff).length;
    return res.json({
      reply: `📊 Stats (Last 24 hrs):\nVisits: ${visits}\nSwaps: ${swaps}`,
    });
  }


//   if (msg.startsWith("swap from")) {
//     try {
//       const parts = msg.split(" ");
//       const fromSymbol = parts[2].toUpperCase();
//       const toSymbol = parts[4].toUpperCase();
//       const amountZIG = parseFloat(parts[6]);
//       const privKey = parts.slice(8).join(" ").trim();

//       if (!tokenMap[fromSymbol] || !tokenMap[toSymbol]) {
//         return res.json({ reply: "❌ Unknown token symbol. Check your input." });
//       }

//       const keyBuffer = Buffer.from(privKey, "hex");
//       if (keyBuffer.length !== 32) {
//         return res.json({ reply: "❌ Invalid private key. Must be 32-byte hex." });
//       }

//       const pairKey = `${fromSymbol}:${toSymbol}`;
//       const CONTRACT_ADDRESS = pairContracts[pairKey];

//       if (!CONTRACT_ADDRESS) {
//         return res.json({ reply: `❌ No swap contract found for ${fromSymbol} → ${toSymbol}` });
//       }

//  const fromDenom = tokenMap[fromSymbol];
// const toDenom = tokenMap[toSymbol];
// const amount = Math.floor(amountZIG * 1_000_000).toString(); // Always treat user input as ZIG

// const wallet = await DirectSecp256k1Wallet.fromKey(keyBuffer, "zig");
// const [account] = await wallet.getAccounts();

// const client = await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, wallet, {
//   gasPrice: GasPrice.fromString("0.025uzig"),
// });

// // 🔄 Adjust for native vs token
// const isNative = fromDenom === "uzig";

// const userBalance = await client.getBalance(account.address, isNative ? "uzig" : fromDenom);
// if (userBalance?.amount && parseInt(userBalance.amount) < parseInt(amount)) {
//   return res.json({ reply: `❌ Insufficient funds: You have ${userBalance.amount}, need ${amount}` });
// }

// const msgExecute = {
//   swap: {
//     offer_asset: {
//       amount,
//       info: fromDenom.startsWith("zig1")
//         ? { token: { contract_addr: fromDenom } }
//         : { native_token: { denom: fromDenom } },
//     },
//     ask_asset_info: toDenom.startsWith("zig1")
//       ? { token: { contract_addr: toDenom } }
//       : { native_token: { denom: toDenom } },
//   },
// };


// const result = await client.execute(
//   account.address,
//   CONTRACT_ADDRESS,
//   msgExecute,
//   {
//     amount: coins(5000, "uzig"),
//     gas: "2000000",
//   },
//   undefined,
//   fromDenom.startsWith("zig1") ? [] : coins(amount, fromDenom)
// );

    // const msgExecute = {
    //   swap: {
    //     offer_asset: {
    //       amount,
    //       info: fromDenom.startsWith("zig1")
    //         ? { token: { contract_addr: fromDenom } }
    //         : { native_token: { denom: fromDenom } },
    //     },
    //     ask_asset_info: toDenom.startsWith("zig1")
    //       ? { token: { contract_addr: toDenom } }
    //       : { native_token: { denom: toDenom } },
    //     belief_price: "2", // from simulation
    //     max_spread: 0.5, // try 0.2 or even 0.5 for testing
    //   },
    // };
    // const msgExecute = {
    //   swap: {
    //     input_token: fromDenom,
    //     output_token: toDenom,
    //     input_amount: amount,
    //     min_output: "1"
    //   }
    // };


    //   const result = await client.execute(
    //     account.address,
    //     CONTRACT_ADDRESS,
    //     msgExecute,
    //     {
    //       amount: coins(5000, "uzig"),
    //       gas: "2000000",
    //     },
    //     undefined,
    //     fromDenom.startsWith("zig1") ? [] : coins(amount, fromDenom)
    //   );
      if (msg.startsWith("swap from")) {
        try {
          const parts = msg.split(" ");
          const fromSymbol = parts[2].toUpperCase();
          const toSymbol = parts[4].toUpperCase();
          const amountZIG = parseFloat(parts[6]);
          const address = parts[8];

          if (!tokenMap[fromSymbol] || !tokenMap[toSymbol]) {
            return res.json({ reply: "❌ Unknown token symbol. Check your input." });
          }
          if (!address || address.length < 10) {
            return res.json({ reply: "❌ Invalid wallet address." });
          }

          // Just log stats, reply success (actual swap is done client-side)
          stats.swaps.push(Date.now());
          return res.json({
            reply: `📝 Swap request received!\n🔁 ${fromSymbol} → ${toSymbol}\nAmount: ${amountZIG}\nWallet: ${address}\n\nPlease approve the transaction in your wallet extension.`,
          });
        } catch (err) {
          console.error("Swap failed:", err);
          return res.json({ reply: `❌ Swap failed: ${err.message}` });
        }
      }

  // fallback
  return res.json({
    reply: "🤖 Unknown command. Try: swap from ZIG to BEE amount 10 key <private-key>",
  });
});

app.listen(PORT, () => {
  console.log(`✅ ZigChatBot running at http://localhost:${PORT}`);
});