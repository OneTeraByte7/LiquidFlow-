// privy.js
import { PrivyClient } from '@privy-io/server-auth';
import { createEthersSigner } from '@privy-io/server-auth/ethers';
import { ethers } from 'ethers';

/**
 * @param {string} walletId - Wallet ID from Privy
 */
export async function getPrivyWallet(walletId) {
  if (!walletId) throw new Error('Wallet ID is required');

  
  const privyClient = new PrivyClient(
    process.env.PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET,
    {
      walletApi: {
        authorizationPrivateKey: process.env.PRIVY_AUTH_KEY,
      },
    }
  );


  const wallet = await privyClient.walletApi.getWallet({ id: walletId });
  const address = wallet.address;


  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://base.llamarpc.com');
  const signer = createEthersSigner({
    walletId,
    address,
    provider,
    privyClient,
  });

  return { wallet, signer, privyClient, provider };
}
