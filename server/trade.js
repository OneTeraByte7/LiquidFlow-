// trade.js
import * as hl from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';
import { getPrivyWallet } from './privy.js';

async function main() {
  const walletId = process.env.WALLET_ID;
  const { wallet, signer } = await getPrivyWallet(walletId);

  console.log('Wallet address:', wallet.address);

  // Initialize Hyperliquid
  const transport = new hl.HttpTransport();
  const client = new hl.ExchangeClient({ transport, wallet: signer });
  const infoClient = new hl.InfoClient({ transport });

  // Check account exists
  const preCheck = await infoClient.preTransferCheck({
    user: wallet.address,
    source: wallet.address,
  });

  if (!preCheck.userExists) {
    console.error('❌ Hyperliquid account does not exist');
    return;
  }

  console.log('Hyperliquid account exists!');

  // Fetch BTC asset metadata
  const [meta, ctx] = await infoClient.metaAndAssetCtxs();
  const btcIndex = meta.universe.findIndex(a => a.name === 'BTC');
  const btcCtx = ctx[btcIndex];
  const universe = meta.universe[btcIndex];

  const size = new BigNumber(15).div(btcCtx.markPx).toNumber();

  // Place market order
  const orderResp = await client.order({
    orders: [
      { a: btcIndex, b: true, s: size, r: false, p: 0, t: { trigger: { isMarket: true, tpsl: 'tp', triggerPx: btcCtx.markPx * 0.99 } } }
    ],
    grouping: 'na',
  });

  console.log('Order placed:', orderResp);

  // Get account state
  const userState = await infoClient.clearinghouseState({ user: wallet.address });
  console.log('Account state:', userState);
}

main();
