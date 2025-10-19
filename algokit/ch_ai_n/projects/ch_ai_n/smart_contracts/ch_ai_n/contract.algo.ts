import { Contract, GlobalState, itxn, Account, uint64 } from '@algorandfoundation/algorand-typescript'

export class ChAiN extends Contract {
  // Global state for listing management
  private listingOpen = GlobalState<boolean>({ key: 'listingOpen' })
  private targetWallet = GlobalState<Account>({ key: 'targetWallet' })
  private targetAmount = GlobalState<uint64>({ key: 'targetAmount' })
  private receivedAmount = GlobalState<uint64>({ key: 'receivedAmount' })

  /**
   * Opens a new listing with target wallet and amount
   */
  public openListing(targetWallet: Account, targetAmount: uint64): string {
    // Check if a listing is already open
    if (this.listingOpen.hasValue && this.listingOpen.value) {
      return "Error: A listing is already open. Close it first."
    }

    // Open the listing
    this.listingOpen.value = true
    this.targetWallet.value = targetWallet
    this.targetAmount.value = targetAmount
    this.receivedAmount.value = 0

    return `Listing opened`
  }

  /**
   * Processes incoming payments and checks if listing should close
   */
  public processPayment(sender: Account, amount: uint64): string {
    // Check if listing is open
    if (!this.listingOpen.hasValue || !this.listingOpen.value) {
      return "No active listing to process payment for"
    }

    // Validate inputs
    if (amount === 0) {
      return "Error: Amount must be greater than 0"
    }

    // Send payment to target wallet using inner transaction
    itxn.payment({
      amount: amount,
      receiver: this.targetWallet.value,
      fee: 0, // fee pooling, so the sender of the app call covers the fee
    }).submit()

    // Add to received amount
    this.receivedAmount.value = this.receivedAmount.value + amount

    // Check if target amount is reached
    if (this.receivedAmount.value >= this.targetAmount.value) {
      this.listingOpen.value = false
      return `Listing closed! Target amount reached`
    }

    return `Payment received and forwarded to merchant`
  }

  /**
   * Gets current listing status
   */
  public getListingStatus(): string {
    if (!this.listingOpen.hasValue || !this.listingOpen.value) {
      return "No listing is currently open"
    }

    return `Listing open`
  }

  /**
   * Manually close listing (emergency function)
   */
  public closeListing(): string {
    if (!this.listingOpen.hasValue || !this.listingOpen.value) {
      return "No listing is currently open"
    }

    this.listingOpen.value = false
    return `Listing manually closed`
  }

  /**
   * Get listing details (for debugging/info)
   */
  public getListingDetails(): string {
    if (!this.listingOpen.hasValue || !this.listingOpen.value) {
      return "No active listing"
    }

    return `Active listing`
  }
}