import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from './index'
import {
  type Chat,
  type Message,
  type User,
} from './schema'
import { ChatSDKError } from '../errors'

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.user.findMany({ where: { email } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by email')
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string
  userId: string
  title: string
  visibility: 'public' | 'private'
}) {
  try {
    return await db.chat.create({
      data: {
        id,
        userId,
        title,
        visibility,
      },
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat')
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.message.deleteMany({ where: { chatId: id } })
    await db.stream.deleteMany({ where: { chatId: id } })
    return await db.chat.delete({ where: { id } })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete chat by id')
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string
  limit: number
  startingAfter: string | null
  endingBefore: string | null
}) {
  try {
    const extendedLimit = limit + 1
    const baseWhere: Prisma.ChatWhereInput = { userId: id }

    let where: Prisma.ChatWhereInput = baseWhere

    if (startingAfter) {
      const selected = await db.chat.findUnique({ where: { id: startingAfter } })
      if (!selected) throw new ChatSDKError('not_found:database', `Chat with id ${startingAfter} not found`)
      where = { AND: [baseWhere, { createdAt: { gt: selected.createdAt } }] }
    } else if (endingBefore) {
      const selected = await db.chat.findUnique({ where: { id: endingBefore } })
      if (!selected) throw new ChatSDKError('not_found:database', `Chat with id ${endingBefore} not found`)
      where = { AND: [baseWhere, { createdAt: { lt: selected.createdAt } }] }
    }

    const chats = await db.chat.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: extendedLimit,
    })

    const hasMore = chats.length > limit
    return {
      chats: hasMore ? chats.slice(0, limit) : chats,
      hasMore,
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chats by user id')
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await db.chat.findUnique({ where: { id } })
  } catch (error) {
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

    // Keep the original nested structure for compatibility
    return result
  } catch (error) {
    return null
  }
}

export async function saveMessages({ messages }: { messages: Message[] }) {
  try {
    // Transform messages to match Prisma's expected input type
    const messagesToSave = messages.map(message => ({
      id: message.id,
      chatId: message.chatId,
      role: message.role,
      parts: (message.parts ?? null) as Prisma.InputJsonValue,
      attachments: (message.attachments ?? null) as Prisma.InputJsonValue,
      createdAt: message.createdAt,
    }))
    
    return await db.message.createMany({ data: messagesToSave })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages')
  }
}

export async function getMessagesByChatId({
  id,
  limit = 50,
  offset = 0,
}: {
  id: string
  limit?: number
  offset?: number
}) {
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

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string
  timestamp: Date
}) {
  try {
    await db.message.deleteMany({
      where: { 
        chatId, 
        createdAt: { gte: timestamp } 
      },
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete messages by chat id after timestamp')
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const messages = await getMessageById({ id })
  if (messages.length > 0) {
    const message = messages[0]
    await deleteMessagesByChatIdAfterTimestamp({ 
      chatId: message.chatId, 
      timestamp: message.createdAt 
    })
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string
  visibility: 'private' | 'public'
}) {
  try {
    return await db.chat.update({ 
      where: { id: chatId }, 
      data: { visibility } 
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update chat visibility by id')
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string
  title: string
}) {
  try {
    return await db.chat.update({
      where: { id: chatId },
      data: { title, updatedAt: new Date() },
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update chat title by id')
  }
}

export async function getMessageCountByUserId({ id, differenceInHours }: { id: string; differenceInHours: number }) {
  try {
    const date = new Date(Date.now() - differenceInHours * 60 * 60 * 1000)
    const count = await db.message.count({
      where: {
        chat: { userId: id },
        createdAt: { gte: date },
        role: 'user',
      },
    })
    return count
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get message count by user id')
  }
}

export async function createStreamId({ streamId, chatId }: { streamId: string; chatId: string }) {
  try {
    await db.stream.create({ 
      data: { 
        id: streamId, 
        chatId
      } 
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create stream id')
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streams = await db.stream.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    return streams.map(stream => stream.id)
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get stream ids by chat id')
  }
}
