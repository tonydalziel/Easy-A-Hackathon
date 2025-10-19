'use client';

interface LoraExplorerProps {
  walletId?: string;
}

export default function LoraExplorer({ walletId }: LoraExplorerProps) {
  const url = walletId 
    ? `https://lora.algokit.io/localnet/account/${walletId}`
    : 'https://lora.algokit.io/localnet';
    
  return (
    <div className="w-full h-full bg-gray-900">
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="Lora Algorand Explorer"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
