"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChAiN = void 0;
const algorand_typescript_1 = require("@algorandfoundation/algorand-typescript");
class ChAiN extends algorand_typescript_1.Contract {
    constructor() {
        super(...arguments);
        // Global state for listing management
        this.listingOpen = false;
        this.targetWallet = "";
        this.targetAmount = 0;
        this.receivedAmount = 0;
    }
    /**
     * Opens a new listing with target wallet and amount
     */
    openListing(targetWallet, targetAmount) {
        // Only allow opening if no listing is currently open
        if (this.listingOpen) {
            throw new Error("A listing is already open");
        }
        this.listingOpen = true;
        this.targetWallet = targetWallet;
        this.targetAmount = targetAmount;
        this.receivedAmount = 0;
        return `Listing opened: ${targetAmount} microAlgos to ${targetWallet}`;
    }
    /**
     * Processes incoming payments and checks if listing should close
     */
    processPayment(sender, amount) {
        if (!this.listingOpen) {
            throw new Error("No listing is currently open");
        }
        // Check if payment is to the target wallet
        if (sender !== this.targetWallet) {
            return "Payment not to target wallet, listing remains open";
        }
        // Add to received amount
        this.receivedAmount += amount;
        // Check if target amount is reached
        if (this.receivedAmount >= this.targetAmount) {
            this.listingOpen = false;
            return `Listing closed! Target amount reached: ${this.receivedAmount}/${this.targetAmount}`;
        }
        return `Payment received: ${amount}. Progress: ${this.receivedAmount}/${this.targetAmount}`;
    }
    /**
     * Gets current listing status
     */
    getListingStatus() {
        if (!this.listingOpen) {
            return "No listing is currently open";
        }
        return `Listing open: ${this.receivedAmount}/${this.targetAmount} to ${this.targetWallet}`;
    }
    /**
     * Manually close listing (emergency function)
     */
    closeListing() {
        if (!this.listingOpen) {
            return "No listing is currently open";
        }
        this.listingOpen = false;
        return "Listing manually closed";
    }
}
exports.ChAiN = ChAiN;
// Open listing
await contract.openListing("ABC123...", 1000000); // 1 ALGO
// Check status
await contract.getListingStatus(); // "Listing open: 0/1000000 to ABC123..."
// When payment received, contract auto-closes
// Returns: "Listing closed! Target amount reached: 1000000/1000000"
