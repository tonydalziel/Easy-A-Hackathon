import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { describe, expect, it } from 'vitest'
import { ChAiN } from './contract.algo'

describe('ChAiN contract', () => {
  const ctx = new TestExecutionContext()
  it('Opens a listing successfully', () => {
    const contract = ctx.contract.create(ChAiN)

    const result = contract.openListing('ABC123TESTWALLETADDRESS', '1000000')

    expect(result).toBe('Listing opened: 1000000 microAlgos to ABC123TESTWALLETADDRESS')
  })
})
