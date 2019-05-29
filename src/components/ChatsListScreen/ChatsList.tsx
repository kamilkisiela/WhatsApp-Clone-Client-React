import { List, ListItem } from '@material-ui/core'
import gql from 'graphql-tag'
import moment from 'moment'
import * as React from 'react'
import { useCallback } from 'react'
import styled from 'styled-components'
import { useChatsQuery } from '../../graphql/types'
import { useGetChatPrefetch } from '../ChatRoomScreen'

const Container = styled.div `
  height: calc(100% - 56px);
  overflow-y: overlay;
`

const StyledList = styled(List) `
  padding: 0 !important;
`

const StyledListItem = styled(ListItem) `
  height: 76px;
  padding: 0 15px;
  display: flex;
`

const ChatPicture = styled.img `
  height: 50px;
  width: 50px;
  object-fit: cover;
  border-radius: 50%;
`

const ChatInfo = styled.div `
  width: calc(100% - 60px);
  height: 46px;
  padding: 15px 0;
  margin-left: 10px;
  border-bottom: 0.5px solid silver;
  position: relative;
`

const ChatName = styled.div `
  margin-top: 5px;
`

const MessageContent = styled.div `
  color: gray;
  font-size: 15px;
  margin-top: 5px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

const MessageDate = styled.div `
  position: absolute;
  color: gray;
  top: 20px;
  right: 0;
  font-size: 13px;
`

const ChatsList = ({ history }) => {
  const { data: { chats = [] } } = useChatsQuery()
  const prefetchChat = useGetChatPrefetch()

  const navToChat = useCallback((chat) => {
    history.push(`chats/${chat.id}`)
  }, [true])

  return (
    <Container>
      <StyledList>
        {chats.map((chat) => (
          <StyledListItem key={chat.id} data-testid="chat" button onClick={navToChat.bind(null, chat)} onMouseEnter={() => {
            prefetchChat(chat.id)
          }}>
            <ChatPicture data-testid="picture" src={chat.picture} />
            <ChatInfo>
              <ChatName data-testid="name">{chat.name}</ChatName>
              {chat.lastMessage && (
                <React.Fragment>
                  <MessageContent data-testid="content">{chat.lastMessage.content}</MessageContent>
                  <MessageDate data-testid="date">{moment(chat.lastMessage.createdAt).format('HH:mm')}</MessageDate>
                </React.Fragment>
              )}
            </ChatInfo>
          </StyledListItem>
        ))}
      </StyledList>
    </Container>
  )
}

export default ChatsList
