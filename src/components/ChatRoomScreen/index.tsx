import { defaultDataIdFromObject } from 'apollo-cache-inmemory'
import gql from 'graphql-tag'
import * as React from 'react'
import { useCallback, useState, useContext, useEffect } from 'react'
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

const PaginationContext = React.createContext({
  after: 0,
  limit: 20,
  /**
   * Sets new cursor
   */
  setAfter: (after: number) => {},
  /**
   * Resets `after` value to its inital state (null) so 
   */
  reset: () => {},
});

const usePagination = () => {
  const pagination = useContext(PaginationContext);

  // Resets the pagination every time a component did unmount
  useEffect(() => {
    return () => {
      pagination.reset();
    };
  }, []);

  return pagination;
};

export const ChatPaginationProvider = ({ children }) => {
  const [after, setAfter] = useState<number>(null);

  return (
    <PaginationContext.Provider
      value={{
        limit: 20,
        after,
        setAfter,
        reset: () => setAfter(null),
      }}
    >
      {children}
    </PaginationContext.Provider>
  );
};

export const useGetChatPrefetch = () => {
  const client = useApolloClient();
  const { limit, after } = usePagination();
  
  return (chatId: string) => {
    client.query<GetChatQuery, GetChatQueryVariables>({
      query: GetChatDocument,
      variables: {
        chatId,
        after,
        limit,
      },
    });
  };
};

const ChatRoom = ({ history, chatId }) => {
  const client = useApolloClient()
  const { after, limit, setAfter } = usePagination();
  const { data: { chat }, loading: loadingChat, fetchMore } = useGetChatQuery({
    variables: { chatId, after, limit }
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

  useEffect(() => {
    if (!after) {
      return;
    }

    // every time after changes its value, fetch more messages
    fetchMore({
      variables: {
        after,
        limit,
      },
      updateQuery(prev, { fetchMoreResult }) {
        const messages = [
          ...fetchMoreResult.chat.messages.messages,
          ...prev.chat.messages.messages,
        ];

        return {
          ...prev,
          chat: {
            ...prev.chat,
            messages: {
              ...fetchMoreResult.chat.messages,
              messages: messages
            },
          }
        };
      },
    })
  }, [after, limit]);

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
      <MessagesList
        messages={chat.messages.messages}
        hasMore={chat.messages.hasMore}
        loadMore={() => setAfter(chat.messages.cursor)} />
      <MessageInput onSendMessage={onSendMessage} />
    </Container>
  )
}

const ChatRoomScreen = ({ history, match }) => {
  const {
    params: { chatId },
  } = match;

  return (
    <ChatPaginationProvider>
      <ChatRoom history={history} chatId={chatId} />
    </ChatPaginationProvider>
  );
}

export default ChatRoomScreen
