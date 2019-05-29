import { defaultDataIdFromObject } from 'apollo-cache-inmemory'
import gql from 'graphql-tag'
import * as React from 'react'
import { useCallback } from 'react'
import { Redirect } from 'react-router-dom'
import { useApolloClient, useQuery, useMutation } from 'react-apollo-hooks'
import styled from 'styled-components'
import ChatNavbar from './ChatNavbar'
import MessageInput from './MessageInput'
import MessagesList from './MessagesList'
import { 
  useGetChatQuery,
  useAddMessageMutation,
  GetChatQuery,
  GetChatQueryVariables,
  GetChatDocument
} from '../../graphql/types'
import * as queries from '../../graphql/queries'
import * as fragments from '../../graphql/fragments'
import { writeMessage } from '../../services/cache.service'

const Container = styled.div `
  background: url(/assets/chat-background.jpg);
  display: flex;
  flex-flow: column;
  height: 100vh;
`

const getChatQuery = gql `
  query GetChat($chatId: ID!, $limit: Int!, $after: Float) {
    chat(chatId: $chatId) {
      ...FullChat
    }
  }
  ${fragments.fullChat}
`

const addMessageMutation = gql `
  mutation AddMessage($chatId: ID!, $content: String!) {
    addMessage(chatId: $chatId, content: $content) {
      ...Message
    }
  }
  ${fragments.message}
`

export const useGetChatPrefetch = () => {
  const client = useApolloClient();
  
  return (chatId: string) => {
    client.query<GetChatQuery, GetChatQueryVariables>({
      query: GetChatDocument,
      variables: {
        chatId,
      },
    });
  };
};

const ChatRoomScreen = ({ history, match }) => {
  const { params: { chatId } } = match
  const client = useApolloClient()
  const { data: { chat }, loading: loadingChat } = useGetChatQuery({
    variables: { chatId }
  })
  const addMessage = useAddMessageMutation()

  const onSendMessage = useCallback((content) => {
    addMessage({
      variables: { chatId, content },
      optimisticResponse: {
        __typename: 'Mutation',
        addMessage: {
          __typename: 'Message',
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          isMine: true,
          chat: {
            __typename: 'Chat',
            id: chatId,
          },
          content,
        }
      },
      update: (client, { data: { addMessage } }) => {
        writeMessage(client, addMessage)
      },
    })
  }, [chat])

  if (loadingChat) return null

  // Chat was probably removed from cache by the subscription handler
  if (!chat) {
    return (
      <Redirect to="/chats" />
    )
  }

  return (
    <Container>
      <ChatNavbar chat={chat} history={history} />
      <MessagesList messages={chat.messages} />
      <MessageInput onSendMessage={onSendMessage} />
    </Container>
  )
}

export default ChatRoomScreen
