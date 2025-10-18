import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ChAiNFactory } from './artifacts/ch_ai_n/ChAiNClient'

// Below is a showcase of various deployment options you can use in TypeScript Client
export async function deploy() {
  console.log('=== Deploying ChAiN ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = algorand.client.getTypedAppFactory(ChAiNFactory, {
    defaultSender: deployer.addr,
  })

  const { appClient, result } = await factory.deploy({ onUpdate: 'append', onSchemaBreak: 'append' })

  // If app was just created fund the app account
  if (['create', 'replace'].includes(result.operationPerformed)) {
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
  }

  const method = 'openListing'  
  const response = await appClient.send.openListing({
    args: { targetWallet: 'TESTWALLETADDRESS123456789012345678901234567890', targetAmount: '1000000' },
  })
  console.log(
    `Called ${method} on ${appClient.appClient.appName} (${appClient.appClient.appId}) with targetWallet = TESTWALLETADDRESS123456789012345678901234567890, targetAmount = 1000000, received: ${response.return}`,
  )
}
