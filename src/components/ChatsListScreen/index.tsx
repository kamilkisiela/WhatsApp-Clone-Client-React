import * as React from 'react'
import styled from 'styled-components'
import AddChatButton, { useUsersPrefetch } from './AddChatButton'
import ChatsNavbar from './ChatsNavbar'
import ChatsList from './ChatsList'

const Container = styled.div `
  height: 100vh;
`

const ChatsListScreen = ({ history }) => {
  const prefetchUsers = useUsersPrefetch();

  return (
    <Container>
      <ChatsNavbar history={history} />
      <ChatsList history={history} />
      <AddChatButton history={history} onMouseEnter={() => prefetchUsers()} />
    </Container>
  )
}

export default ChatsListScreen
