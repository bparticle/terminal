import crypto from 'crypto';
import { publicKey } from '@metaplex-foundation/umi';
import { canTransfer, getAssetWithProof, transferV2 } from '@metaplex-foundation/mpl-bubblegum';
import { getUmi } from './umi';
import { getNFTDetails } from './helius.service';
import { submitSignedTransaction } from './mint.service';

function readonlySigner(walletAddress: string) {
  return {
    publicKey: publicKey(walletAddress),
    signMessage: async () => new Uint8Array(),
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
}

function getCollectionMintFromAsset(asset: any): string | null {
  const grouping = Array.isArray(asset?.grouping) ? asset.grouping : [];
  const collectionGroup = grouping.find((group: any) => group?.group_key === 'collection');
  if (collectionGroup && typeof collectionGroup.group_value === 'string') {
    return collectionGroup.group_value;
  }
  return null;
}

/** In-memory store for pending transfer tokens (token → metadata, 5-min TTL). */
const pendingTransfers = new Map<string, { assetId: string; ownerWallet: string; toWallet: string; expiresAt: number }>();

const TRANSFER_TOKEN_TTL_MS = 5 * 60 * 1000;

/** Periodically purge expired tokens so the map doesn't leak. */
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of pendingTransfers) {
    if (entry.expiresAt <= now) pendingTransfers.delete(token);
  }
}, 60_000);

export async function prepareCompressedNftTransfer(params: {
  assetId: string;
  ownerWallet: string;
  toWallet: string;
}): Promise<{ transactionBase64: string; transferToken: string; assetId: string; toWallet: string }> {
  if (params.ownerWallet === params.toWallet) {
    throw new Error('Cannot transfer an NFT to your own wallet');
  }

  const umi = getUmi();
  const ownerSigner = readonlySigner(params.ownerWallet);

  const asset = await getNFTDetails(params.assetId);
  if (!asset) {
    throw new Error('NFT not found');
  }

  const onChainOwner = asset.ownership?.owner;
  if (!onChainOwner || onChainOwner !== params.ownerWallet) {
    throw new Error('You do not own this NFT');
  }
  if (asset.burnt === true) {
    throw new Error('Cannot transfer a burnt NFT');
  }
  if (asset.compression?.compressed !== true) {
    throw new Error('Only compressed NFTs are supported');
  }

  const assetWithProof = await (getAssetWithProof as any)(umi, publicKey(params.assetId), {
    truncateCanopy: true,
  });
  if (!canTransfer(assetWithProof)) {
    throw new Error('This NFT cannot be transferred (it may be frozen/soulbound)');
  }

  const transferArgs: any = {
    ...assetWithProof,
    payer: ownerSigner,
    authority: ownerSigner,
    newLeafOwner: publicKey(params.toWallet),
  };

  const collectionMint = getCollectionMintFromAsset(asset);
  if (collectionMint) {
    transferArgs.coreCollection = publicKey(collectionMint);
  }

  const builder = transferV2(umi, transferArgs);
  const tx = await builder
    .setFeePayer(ownerSigner)
    .buildWithLatestBlockhash(umi);

  const transactionBase64 = Buffer.from(umi.transactions.serialize(tx)).toString('base64');

  const transferToken = crypto.randomBytes(32).toString('hex');
  pendingTransfers.set(transferToken, {
    assetId: params.assetId,
    ownerWallet: params.ownerWallet,
    toWallet: params.toWallet,
    expiresAt: Date.now() + TRANSFER_TOKEN_TTL_MS,
  });

  return {
    transactionBase64,
    transferToken,
    assetId: params.assetId,
    toWallet: params.toWallet,
  };
}

export async function confirmCompressedNftTransfer(params: {
  transferToken: string;
  assetId: string;
  ownerWallet: string;
  signedTransactionBase64: string;
}): Promise<{ assetId: string; signature: string; status: 'confirmed' }> {
  const pending = pendingTransfers.get(params.transferToken);
  if (!pending) {
    throw new Error('Transfer session expired or invalid — please prepare the transfer again');
  }

  if (pending.expiresAt <= Date.now()) {
    pendingTransfers.delete(params.transferToken);
    throw new Error('Transfer session expired — please prepare the transfer again');
  }

  if (pending.assetId !== params.assetId) {
    throw new Error('Asset ID does not match the prepared transfer');
  }
  if (pending.ownerWallet !== params.ownerWallet) {
    throw new Error('Wallet does not match the prepared transfer');
  }

  // Consume the token so it can't be replayed
  pendingTransfers.delete(params.transferToken);

  const signature = await submitSignedTransaction(params.signedTransactionBase64);
  return {
    assetId: params.assetId,
    signature,
    status: 'confirmed',
  };
}
