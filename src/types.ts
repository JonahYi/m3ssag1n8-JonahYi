// View Events
export type CreateEvent = {
  value: string;
};

// added a login event for logging in
export type LoginEvent = {
  value: any;
  message: string;
};

// added a message event for posting message
export type messageEvent = {
  name: string;
  message: string;
  parent: string;
};

/**
 * Doc type
 */
export type Doc = {
  Path: string;
  Doc: Uint8Array;
  Metadata: Metadata;
};

/**
 * MetaData type stored in the Doc
 */
export type Metadata = {
  createdAt: number;
  createdBy: string;
  lastModifiedAt: number;
  lastModifiedBy: string;
};

export type sendButton = {};

export type openEvent = {
  name: string;
};

// added a event for opening Channel
export type openEventChannel = {
  name: string;
};

// added a event for refreshing
export type refreshChannels = {
  name: string;
};

// abort a subscription
export type abortEvent = {
  abort: boolean;
};

export type patchEvent = {
  op: string;
  reaction: string;
  user: string;
  path: string;
};

// added a event for refreshing
export type refreshWorkspaces = {
  name: string;
};

// event for user log out
export type LogoutEvent = {
  value: string;
};

// event for subscription
export type subscribeEvent = {
  data: any;
};

// how posts are actually sorted for display
export type viewPostHierarhcy = {
  path: string;
  meta: metaData;
  doc: jsonDoc;
  indents: number;
};

// folowed the document struct from owlDB
export type ViewPost = {
  path: string;
  meta: metaData;
  doc: jsonDoc;
};

// the json values givne
export type jsonDoc = {
  msg: string;
  parent?: string;
  reactions?: reaction;
  extensions?: object;
};

// metadata for posts
export type metaData = {
  createdBy: string;
  createdAt: number;
  lastModifiedBy: string;
  lastModifiedAt: number;
};

// reactions for posts
export type reaction = {
  smile: Array<string>;
  frown: Array<string>;
  like: Array<string>;
  celebrate: Array<string>;
};

// event for displaying a channel
export type ViewChannel = {
  path: string;
  metadata: string;
  doc: string;
};

// event for deleting a channel
export type DeleteChannel = {
  id: string;
  workspace: string;
};

// event for displaying workspace
export type ViewWorkspace = {
  path: string;
  metadata: string;
  doc: string;
};

// event for deleting workspace
export type DeleteWorkspace = {
  id: string;
};

// event for replying
export type replytoPost = {
  id: string;
};

//event for creating a channel
export type createChannelEvent = {
  workspace: string;
  channel: string;
};

// added a event for refreshing
export type createWorkspaceEvent = {
  workspace: string;
};

// the id of the workspace deleted
export type workspaceDeleted = {
  id: string;
};

// the id of the channel deleted
export type channelDeleted = {
  id: string;
};
