import { Contract } from '@algorandfoundation/algorand-typescript'

export class ChAiN extends Contract {
  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
