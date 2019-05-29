import { DataProxy } from 'apollo-cache'
import { defaultDataIdFromObject } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import * as fragments from '../graphql/fragments'
import * as queries from '../graphql/queries'
import {
  MessageFragment,
  ChatFragment,
  useMessageAddedSubscription,
  useChatAddedSubscription,
  useChatRemovedSubscription,
} from '../graphql/types'

type Client = ApolloClient<any> | DataProxy

export const useCacheService = () => {
  useMessageAddedSubscription({
    onSubscriptionData: ({ client, subscriptionData: { data: { messageAdded } } }) => {
      writeMessage(client, messageAdded)
    }
  })

  useChatAddedSubscription({
    onSubscriptionData: ({ client, subscriptionData: { data: { chatAdded } } }) => {
      writeChat(client, chatAdded)
    }
  })

  useChatRemovedSubscription({
    onSubscriptionData: ({ client, subscriptionData: { data: { chatRemoved } } }) => {
      eraseChat(client, chatRemoved)
    }
  })
}

export const writeMessage = (client: Client, message: MessageFragment) => {
  let fullChat
  try {
    fullChat = client.readFragment({
      id: defaultDataIdFromObject(message.chat),
      fragment: fragments.fullChat,
      fragmentName: 'FullChat',
    })
  } catch (e) {
    return
  }

  if (fullChat.messages.messages.some(m => m.id === message.id)) return

  fullChat.messages.messages.push(message)
  fullChat.lastMessage = message

  client.writeFragment({
    id: defaultDataIdFromObject(message.chat),
    fragment: fragments.fullChat,
    fragmentName: 'FullChat',
    data: fullChat,
  })

  rewriteChats:
  {
    let data
    try {
      data = client.readQuery({
        query: queries.chats,
      })
    } catch (e) {
      break rewriteChats
    }

    if (!data) break rewriteChats

    const chats = data.chats

    if (!chats) break rewriteChats

    const chatIndex = chats.findIndex(c => c.id === message.chat.id)

    if (chatIndex === -1) break rewriteChats

    const chat = chats[chatIndex]

    // The chat will appear at the top of the ChatsList component
    chats.splice(chatIndex, 1)
    chats.unshift(chat)

    client.writeQuery({
      query: queries.chats,
      data: { chats: chats },
    })
  }
}

export const writeChat = (client: Client, chat: ChatFragment) => {
  client.writeFragment({
    id: defaultDataIdFromObject(chat),
    fragment: fragments.chat,
    fragmentName: 'Chat',
    data: chat,
  })

  rewriteChats:
  {
    let data
    try {
      data = client.readQuery({
        query: queries.chats,
      })
    } catch (e) {
      break rewriteChats
    }

    if (!data) break rewriteChats

    const chats = data.chats

    if (!chats) break rewriteChats
    if (chats.some(c => c.id === chat.id)) break rewriteChats

    chats.unshift(chat)

    client.writeQuery({
      query: queries.chats,
      data: { chats },
    })
  }
}

export const eraseChat = (client: Client, chatId: string) => {
  const chatType = {
    __typename: 'Chat',
    id: chatId
  }

  client.writeFragment({
    id: defaultDataIdFromObject(chatType),
    fragment: fragments.fullChat,
    fragmentName: 'FullChat',
    data: null,
  })

  rewriteChats:
  {
    let data
    try {
      data = client.readQuery({
        query: queries.chats,
      })
    } catch (e) {
      break rewriteChats
    }

    if (!data) break rewriteChats

    const chats = data.chats

    if (!chats) break rewriteChats

    const chatIndex = chats.findIndex(c => c.id === chatId)

    if (chatIndex === -1) break rewriteChats

    // The chat will appear at the top of the ChatsList component
    chats.splice(chatIndex, 1)

    client.writeQuery({
      query: queries.chats,
      data: { chats: chats },
    })
  }
}
