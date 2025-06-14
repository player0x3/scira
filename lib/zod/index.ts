import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','createdAt','updatedAt','username','role','banned','banReason','banExpires','onboardingComplete','paymentsCustomerId','locale']);

export const SessionScalarFieldEnumSchema = z.enum(['id','expiresAt','ipAddress','userAgent','userId','impersonatedBy','activeOrganizationId','token','createdAt','updatedAt']);

export const AccountScalarFieldEnumSchema = z.enum(['id','accountId','providerId','userId','accessToken','refreshToken','idToken','expiresAt','password','accessTokenExpiresAt','refreshTokenExpiresAt','scope','createdAt','updatedAt']);

export const VerificationScalarFieldEnumSchema = z.enum(['id','identifier','value','expiresAt','createdAt','updatedAt']);

export const PasskeyScalarFieldEnumSchema = z.enum(['id','name','publicKey','userId','credentialID','counter','deviceType','backedUp','transports','createdAt']);

export const InvitationScalarFieldEnumSchema = z.enum(['id','email','role','status','expiresAt','inviterId']);

export const PurchaseScalarFieldEnumSchema = z.enum(['id','userId','type','customerId','subscriptionId','productId','status','createdAt','updatedAt']);

export const AiChatScalarFieldEnumSchema = z.enum(['id','userId','title','createdAt','updatedAt','visibility']);

export const AiMessageScalarFieldEnumSchema = z.enum(['id','chatId','role','parts','attachments','createdAt']);

export const AiStreamScalarFieldEnumSchema = z.enum(['id','chatId','createdAt']);

export const UserPreferenceScalarFieldEnumSchema = z.enum(['id','userId','theme','createdAt','updatedAt']);

export const UserIntegrationScalarFieldEnumSchema = z.enum(['id','userId','type','createdAt','updatedAt','accessToken','refreshToken','expiresAt','config','isActive']);

export const EmailSendingRecordScalarFieldEnumSchema = z.enum(['id','userId','email','title','type','status','markdown','error','sentAt','createdAt','updatedAt']);

export const AiTokenUsageScalarFieldEnumSchema = z.enum(['id','userId','modelName','modelProvider','isUserKey','promptTokens','completionTokens','totalTokens','remark','createdAt']);

export const AiProviderScalarFieldEnumSchema = z.enum(['id','name','userId','providerIdentifier','apiKey','baseUrl','models','isActive','createdAt','updatedAt']);

export const SavedArticleScalarFieldEnumSchema = z.enum(['id','userId','title','originalUrl','content','aiTranslation','mindMap','isAiContent','isRagEnabled','createdAt','updatedAt','language']);

export const TagScalarFieldEnumSchema = z.enum(['id','userId','name','color','isSystem','createdAt','updatedAt']);

export const ArticleTagScalarFieldEnumSchema = z.enum(['id','articleId','tagId','assignedAt','assignmentType']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION','ONE_TIME']);

export type PurchaseTypeType = `${z.infer<typeof PurchaseTypeSchema>}`

export const VisibilitySchema = z.enum(['public','private']);

export type VisibilityType = `${z.infer<typeof VisibilitySchema>}`

export const ThemeTypeSchema = z.enum(['LIGHT','DARK','BLUE','SAGE_GRAY','CREAM_GRAY','ROSE_GRAY','NAVY_CYAN']);

export type ThemeTypeType = `${z.infer<typeof ThemeTypeSchema>}`

export const IntegrationTypeSchema = z.enum(['NOTION','READWISE','OBSIDIAN','KINDLE']);

export type IntegrationTypeType = `${z.infer<typeof IntegrationTypeSchema>}`

export const EmailSendingStatusSchema = z.enum(['PENDING','SUCCESS','FAILED']);

export type EmailSendingStatusType = `${z.infer<typeof EmailSendingStatusSchema>}`

export const EmailTypeSchema = z.enum(['ARTICLE','NEWSLETTER','SYSTEM']);

export type EmailTypeType = `${z.infer<typeof EmailTypeSchema>}`

export const TagAssignmentTypeSchema = z.enum(['MANUAL','AI']);

export type TagAssignmentTypeType = `${z.infer<typeof TagAssignmentTypeSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  username: z.string().nullable(),
  role: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.coerce.date().nullable(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullable(),
  locale: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string(),
  impersonatedBy: z.string().nullable(),
  activeOrganizationId: z.string().nullable(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  expiresAt: z.coerce.date().nullable(),
  password: z.string().nullable(),
  accessTokenExpiresAt: z.coerce.date().nullable(),
  refreshTokenExpiresAt: z.coerce.date().nullable(),
  scope: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Account = z.infer<typeof AccountSchema>

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
})

export type Verification = z.infer<typeof VerificationSchema>

/////////////////////////////////////////
// PASSKEY SCHEMA
/////////////////////////////////////////

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullable(),
  createdAt: z.coerce.date().nullable(),
})

export type Passkey = z.infer<typeof PasskeySchema>

/////////////////////////////////////////
// INVITATION SCHEMA
/////////////////////////////////////////

export const InvitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  status: z.string(),
  expiresAt: z.coerce.date(),
  inviterId: z.string(),
})

export type Invitation = z.infer<typeof InvitationSchema>

/////////////////////////////////////////
// PURCHASE SCHEMA
/////////////////////////////////////////

export const PurchaseSchema = z.object({
  type: PurchaseTypeSchema,
  id: z.string().cuid(),
  userId: z.string().nullable(),
  customerId: z.string(),
  subscriptionId: z.string().nullable(),
  productId: z.string(),
  status: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Purchase = z.infer<typeof PurchaseSchema>

/////////////////////////////////////////
// AI CHAT SCHEMA
/////////////////////////////////////////

export const AiChatSchema = z.object({
  visibility: VisibilitySchema,
  id: z.string().uuid(),
  userId: z.string(),
  title: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AiChat = z.infer<typeof AiChatSchema>

/////////////////////////////////////////
// AI MESSAGE SCHEMA
/////////////////////////////////////////

export const AiMessageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string(),
  role: z.string(),
  parts: JsonValueSchema,
  attachments: JsonValueSchema,
  createdAt: z.coerce.date(),
})

export type AiMessage = z.infer<typeof AiMessageSchema>

/////////////////////////////////////////
// AI STREAM SCHEMA
/////////////////////////////////////////

export const AiStreamSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string(),
  createdAt: z.coerce.date(),
})

export type AiStream = z.infer<typeof AiStreamSchema>

/////////////////////////////////////////
// USER PREFERENCE SCHEMA
/////////////////////////////////////////

export const UserPreferenceSchema = z.object({
  theme: ThemeTypeSchema,
  id: z.string().cuid(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type UserPreference = z.infer<typeof UserPreferenceSchema>

/////////////////////////////////////////
// USER INTEGRATION SCHEMA
/////////////////////////////////////////

export const UserIntegrationSchema = z.object({
  type: IntegrationTypeSchema,
  id: z.string().cuid(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  expiresAt: z.coerce.date().nullable(),
  config: JsonValueSchema.nullable(),
  isActive: z.boolean(),
})

export type UserIntegration = z.infer<typeof UserIntegrationSchema>

/////////////////////////////////////////
// EMAIL SENDING RECORD SCHEMA
/////////////////////////////////////////

export const EmailSendingRecordSchema = z.object({
  type: EmailTypeSchema,
  status: EmailSendingStatusSchema,
  id: z.string().cuid(),
  userId: z.string(),
  email: z.string(),
  title: z.string(),
  markdown: z.string(),
  error: z.string().nullable(),
  sentAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type EmailSendingRecord = z.infer<typeof EmailSendingRecordSchema>

/////////////////////////////////////////
// AI TOKEN USAGE SCHEMA
/////////////////////////////////////////

export const AiTokenUsageSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  modelName: z.string(),
  modelProvider: z.string(),
  isUserKey: z.boolean(),
  promptTokens: z.number().int(),
  completionTokens: z.number().int(),
  totalTokens: z.number().int(),
  remark: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export type AiTokenUsage = z.infer<typeof AiTokenUsageSchema>

/////////////////////////////////////////
// AI PROVIDER SCHEMA
/////////////////////////////////////////

export const AiProviderSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  userId: z.string(),
  providerIdentifier: z.string(),
  apiKey: z.string(),
  baseUrl: z.string().nullable(),
  models: JsonValueSchema.nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type AiProvider = z.infer<typeof AiProviderSchema>

/////////////////////////////////////////
// SAVED ARTICLE SCHEMA
/////////////////////////////////////////

export const SavedArticleSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  title: z.string(),
  originalUrl: z.string(),
  content: z.string().nullable(),
  aiTranslation: z.string().nullable(),
  mindMap: JsonValueSchema.nullable(),
  isAiContent: z.boolean(),
  isRagEnabled: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  language: z.string().nullable(),
})

export type SavedArticle = z.infer<typeof SavedArticleSchema>

/////////////////////////////////////////
// TAG SCHEMA
/////////////////////////////////////////

export const TagSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().nullable(),
  name: z.string(),
  color: z.string().nullable(),
  isSystem: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Tag = z.infer<typeof TagSchema>

/////////////////////////////////////////
// ARTICLE TAG SCHEMA
/////////////////////////////////////////

export const ArticleTagSchema = z.object({
  assignmentType: TagAssignmentTypeSchema,
  id: z.string().cuid(),
  articleId: z.string(),
  tagId: z.string(),
  assignedAt: z.coerce.date(),
})

export type ArticleTag = z.infer<typeof ArticleTagSchema>
