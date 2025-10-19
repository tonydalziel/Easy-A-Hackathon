'use client';

export default function LoraExplorer() {
  return (
    <div className="w-full h-full bg-gray-900">
      <iframe
        src="https://lora.algokit.io/localnet"
        className="w-full h-full border-0"
        title="Lora Algorand Explorer"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
