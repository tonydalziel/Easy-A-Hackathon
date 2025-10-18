
// Mock client for testing - replace with actual generated client
export class ChAiNFactory {
  constructor() {}
  
  async deploy(options: any) {
    return {
      appClient: {
        send: {
          openListing: async ({ args }: { args: { targetWallet: string, targetAmount: number } }) => ({
            return: `Mock: Listing opened for ${args.targetAmount} microAlgos to ${args.targetWallet}`
          }),
          processPayment: async ({ args }: { args: { sender: string, amount: number } }) => ({
            return: `Mock: Payment processed from ${args.sender} for ${args.amount} microAlgos`
          }),
          getListingStatus: async () => ({
            return: 'Mock: No listing is currently open'
          })
        }
      }
    };
  }
}
