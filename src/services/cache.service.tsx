import { defaultDataIdFromObject } from "apollo-cache-inmemory";
import * as fragments from "../graphql/fragments";
import * as subscriptions from "../graphql/subscriptions";
import * as queries from "../graphql/queries";
import {
  ChatUpdated,
  MessageAdded,
  Message,
  Chats,
  FullChat,
  Users,
  UserAdded,
  UserUpdated,
  ChatAdded
} from "../graphql/types";
import { useSubscription } from "../polyfills/react-apollo-hooks";
import { createHelpers } from "../helpers/cache";

export const useSubscriptions = () => {
  useSubscription<ChatAdded.Subscription>(subscriptions.chatAdded, {
    onSubscriptionData: ({
      client: cache,
      subscriptionData: { chatAdded }
    }) => {
      const { patchQuery } = createHelpers(cache);

      cache.writeFragment({
        id: defaultDataIdFromObject(chatAdded),
        fragment: fragments.chat,
        fragmentName: "Chat",
        data: chatAdded
      });

      try {
        patchQuery<Chats.Query>(
          {
            query: queries.chats
          },
          data => {
            if (
              data.chats &&
              !data.chats.some(chat => chat.id === chatAdded.id)
            ) {
              data.chats.unshift(chatAdded);
            }
          }
        );
      } catch (e) {}
    }
  });

  useSubscription<ChatUpdated.Subscription>(subscriptions.chatUpdated, {
    onSubscriptionData: ({ client, subscriptionData: { chatUpdated } }) => {
      client.writeFragment({
        id: defaultDataIdFromObject(chatUpdated),
        fragment: fragments.chat,
        fragmentName: "Chat",
        data: chatUpdated
      });
    }
  });

  useSubscription<MessageAdded.Subscription>(subscriptions.messageAdded, {
    onSubscriptionData: ({
      client: cache,
      subscriptionData: { messageAdded }
    }) => {
      const { patchFragment, patchQuery } = createHelpers(cache);

      cache.writeFragment<Message.Fragment>({
        id: defaultDataIdFromObject(messageAdded),
        fragment: fragments.message,
        data: messageAdded
      });

      try {
        patchFragment<FullChat.Fragment>(
          {
            id: defaultDataIdFromObject(messageAdded.chat),
            fragment: fragments.fullChat,
            fragmentName: "FullChat"
          },
          data => {
            if (
              data &&
              !data.messages.some(message => message.id === messageAdded.id)
            ) {
              data.messages.push(messageAdded);
              data.lastMessage = messageAdded;
            }
          }
        );
      } catch (e) {}

      try {
        patchQuery<Chats.Query>(
          {
            query: queries.chats
          },
          data => {
            const index = data.chats.findIndex(
              c => c.id !== messageAdded.chat.id
            );
            const chat = data.chats[index];

            chat.lastMessage = messageAdded;
            data.chats.splice(index, 1);
            data.chats.unshift(chat);
          }
        );
      } catch (e) {}
    }
  });

  useSubscription<UserAdded.Subscription>(subscriptions.userAdded, {
    onSubscriptionData: ({ client, subscriptionData: { userAdded } }) => {
      const { patchQuery } = createHelpers(client);

      client.writeFragment({
        id: defaultDataIdFromObject(userAdded),
        fragment: fragments.user,
        data: userAdded
      });

      try {
        patchQuery<Users.Query>(
          {
            query: queries.users
          },
          data => {
            if (
              data.users &&
              !data.users.some(user => user.id === userAdded.id)
            ) {
              data.users.push(userAdded);
            }
          }
        );
      } catch (e) {}
    }
  });

  useSubscription<UserUpdated.Subscription>(subscriptions.userUpdated, {
    onSubscriptionData: ({ client, subscriptionData: { userUpdated } }) => {
      client.writeFragment({
        id: defaultDataIdFromObject(userUpdated),
        fragment: fragments.user,
        data: userUpdated
      });
    }
  });
};
