import 'server-only'

import { db } from './index'
import { ChatSDKError } from '../errors'
import type { User, Message, Chat } from '@prisma/client'

type VisibilityType = 'public' | 'private'

export async function getUser(email: string): Promise<User | null> {
  try {
    return await db.user.findUnique({ where: { email } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by email')
  }
}

export async function saveChat({ id, userId, title, visibility }: { id: string; userId: string; title: string; visibility: VisibilityType }) {
  try {
    return await db.chat.create({ data: { id, userId, title, visibility } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat')
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.chat.delete({ where: { id } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete chat by id')
  }
}

export async function getChatsByUserId({ id, limit, startingAfter, endingBefore }: { id: string; limit: number; startingAfter: string | null; endingBefore: string | null }) {
  try {
    const extendedLimit = limit + 1
    let where: any = { userId: id }

    if (startingAfter) {
      const startChat = await db.chat.findUnique({ where: { id: startingAfter } })
      if (!startChat) throw new ChatSDKError('not_found:database', `Chat with id ${startingAfter} not found`)
      where = { ...where, createdAt: { gt: startChat.createdAt } }
    } else if (endingBefore) {
      const endChat = await db.chat.findUnique({ where: { id: endingBefore } })
      if (!endChat) throw new ChatSDKError('not_found:database', `Chat with id ${endingBefore} not found`)
      where = { ...where, createdAt: { lt: endChat.createdAt } }
    }

    const chats = await db.chat.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: extendedLimit,
    })

    const hasMore = chats.length > limit
    return { chats: hasMore ? chats.slice(0, limit) : chats, hasMore }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chats by user id')
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await db.chat.findUnique({ where: { id } })
  } catch (error) {
    console.log('Error getting chat by id', error)
    return null
  }
}

export async function getChatWithUserById({ id }: { id: string }) {
  try {
    const result = await db.chat.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!result) return null
    const { user, ...rest } = result
    return {
      ...rest,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    }
  } catch (error) {
    console.log('Error getting chat with user by id', error)
    return null
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    await db.message.createMany({ data: messages })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages')
  }
}

export async function getMessagesByChatId({ id, limit = 50, offset = 0 }: { id: string; limit?: number; offset?: number }) {
  try {
    return await db.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get messages by chat id')
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const message = await db.message.findUnique({ where: { id } })
    return message ? [message] : []
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get message by id')
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({ chatId, timestamp }: { chatId: string; timestamp: Date }) {
  try {
    await db.message.deleteMany({ where: { chatId, createdAt: { gte: timestamp } } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete messages by chat id after timestamp')
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id })
  if (!message) return
  await deleteMessagesByChatIdAfterTimestamp({ chatId: message.chatId, timestamp: message.createdAt })
}

export async function updateChatVisiblityById({ chatId, visibility }: { chatId: string; visibility: 'private' | 'public' }) {
  try {
    return await db.chat.update({ where: { id: chatId }, data: { visibility } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update chat visibility by id')
  }
}

export async function updateChatTitleById({ chatId, title }: { chatId: string; title: string }) {
  try {
    return await db.chat.update({ where: { id: chatId }, data: { title, updatedAt: new Date() } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update chat title by id')
  }
}

export async function getMessageCountByUserId({ id, differenceInHours }: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - differenceInHours * 60 * 60 * 1000)
    return await db.message.count({
      where: {
        chat: { userId: id },
        createdAt: { gte: twentyFourHoursAgo },
        role: 'user',
      },
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get message count by user id')
  }
}

export async function createStreamId({ streamId, chatId }: { streamId: string; chatId: string }) {
  try {
    await db.stream.create({ data: { id: streamId, chatId } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create stream id')
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db.stream.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    return streamIds.map(({ id }) => id)
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get stream ids by chat id')
  }
}
