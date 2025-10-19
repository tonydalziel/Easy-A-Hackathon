import { Contract, GlobalState } from '@algorandfoundation/algorand-typescript'

export class ChAiN extends Contract {
  // Fixed merchant wallet address
  private readonly MERCHANT_WALLET = 'MERCHANT_WALLET_ADDRESS_HERE'
  
  // Global state for listing management
  private listingOpen = GlobalState<boolean>({ key: 'listingOpen' })
  private targetAmount = GlobalState<string>({ key: 'targetAmount' })
  private receivedAmount = GlobalState<string>({ key: 'receivedAmount' })

  /**
   * Opens a new listing with target amount (merchant wallet is fixed)
   */
  public openListing(targetAmount: string): string {
    // Check if a listing is already open
    if (this.listingOpen.hasValue && this.listingOpen.value) {
      return "Error: A listing is already open. Close it first."
    }

    // Validate inputs
    if (!targetAmount || targetAmount === "0") {
      return "Error: Target amount must be greater than 0"
    }

    // Open the listing
    this.listingOpen.value = true
    this.targetAmount.value = targetAmount
    this.receivedAmount.value = "0"

    return `Listing opened: ${targetAmount} microAlgos to ${this.MERCHANT_WALLET}`
  }

  /**
   * Processes incoming payments and checks if listing should close
   */
  public processPayment(sender: string, amount: string): string {
    // Check if listing is open
    if (!this.listingOpen.hasValue || !this.listingOpen.value) {
      return "No active listing to process payment for"
    }

    // Validate inputs
    if (!sender) {
      return "Error: Sender cannot be empty"
    }

    if (!amount || amount === "0") {
      return "Error: Amount must be greater than 0"
    }

    // Check if payment is to the merchant wallet
    if (sender !== this.MERCHANT_WALLET) {
      return `Payment from ${sender} not to merchant wallet ${this.MERCHANT_WALLET}. Listing remains open.`
    }

    // Add to received amount (simplified for now)
    this.receivedAmount.value = amount

    // Check if target amount is reached (simplified comparison)
    if (amount === this.targetAmount.value) {
      this.listingOpen.value = false
      return `Listing closed! Target amount reached: ${amount}/${this.targetAmount.value} microAlgos`
    }

    return `Payment received: ${amount} microAlgos. Progress: ${amount}/${this.targetAmount.value}`
  }

  /**
   * Gets current listing status
   */
  public getListingStatus(): string {
    if (!this.listingOpen.hasValue || !this.listingOpen.value) {
      return "No listing is currently open"
    }

    return `Listing open: ${this.receivedAmount.value}/${this.targetAmount.value} microAlgos to ${this.MERCHANT_WALLET}`
  }

  /**
   * Manually close listing (emergency function)
   */
  public closeListing(): string {
    if (!this.listingOpen.hasValue || !this.listingOpen.value) {
      return "No listing is currently open"
    }

    this.listingOpen.value = false
    return `Listing manually closed. Final amount received: ${this.receivedAmount.value}/${this.targetAmount.value} microAlgos`
  }

  /**
   * Get listing details (for debugging/info)
   */
  public getListingDetails(): string {
    if (!this.listingOpen.hasValue || !this.listingOpen.value) {
      return "No active listing"
    }

    return `Target: ${this.targetAmount.value} microAlgos to ${this.MERCHANT_WALLET}, Received: ${this.receivedAmount.value} microAlgos`
  }
}